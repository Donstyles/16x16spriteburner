#!/usr/bin/env python3
"""Add creatures from the Creature Compendium to the sprite sheet: their 4-frame idle strips are appended to
assets/mobs.png and indexed in assets/mobs.json (creatures already there are left alone).
usage: python3 -I tools/add_mobs.py <extracted Compendium/Animations folder> <repo root> Name [Name ...]
A Name is the strip's file name without spaces (e.g. GnollBrute, Pyro). A few strips ship with a solid background
baked in (Rabid Cerberus, Towering Mongrel, Warp Lord); that colour is cleared, inside the outline too."""
import glob, json, os, re, sys
from PIL import Image
src, root, names = sys.argv[1], sys.argv[2], sys.argv[3:]
mj, mp = os.path.join(root, 'assets', 'mobs.json'), os.path.join(root, 'assets', 'mobs.png')
index, sheet = json.load(open(mj)), Image.open(mp).convert('RGBA')
found = {}
for p in sorted(glob.glob(os.path.join(src, '*', '*', '*.png'))):
    n = re.sub(r'IdleSide$|Idle$|I$', '', os.path.basename(p)[:-4]).replace(' ', '')
    found.setdefault(n, p)
def keyout(im):
    px = im.load(); bg = px[0, 0]
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] == bg: px[x, y] = (0, 0, 0, 0)
    return im
add = []
for n in names:
    if n in index: continue
    if n not in found: sys.exit('not in the compendium: ' + n)
    im = Image.open(found[n]).convert('RGBA')
    if im.getpixel((0, 0))[3] == 255: im = keyout(im)
    add.append((n, im))
if not add: print('nothing to add'); sys.exit(0)
y = sheet.height; out = Image.new('RGBA', (max(sheet.width, *(im.width for _, im in add)), y + sum(im.height for _, im in add)))
out.paste(sheet, (0, 0))
for n, im in add: out.paste(im, (0, y), im); index[n] = [y, im.width // 4, im.height]; y += im.height
out.save(mp, optimize=True)
json.dump(index, open(mj, 'w'), separators=(',', ':'), sort_keys=True)
print('added', len(add), [n for n, _ in add], 'sheet', out.size)
