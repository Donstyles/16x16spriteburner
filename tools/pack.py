#!/usr/bin/env python3
"""Pack the purchased asset packs for the game. Usage: python3 -I tools/pack.py <extracted_dir> <repo_root>"""
import sys, os, glob, json, re, shutil
from PIL import Image, ImageDraw, ImageFilter
src, root = sys.argv[1], sys.argv[2]
tiles_src = glob.glob(os.path.join(src, '*RunninBlood*', 'RunninBlood*', 'Final_Tileset.png'))[0]
shutil.copyfile(tiles_src, os.path.join(root, 'assets', 'tiles.png'))
tiles = Image.open(tiles_src).convert('RGBA')
strips = sorted(glob.glob(os.path.join(src, '*', '*', '*nimations', '*', '*.png')))
index, y, imgs = {}, 0, []
for p in strips:
    im = Image.open(p).convert('RGBA')
    name = re.sub(r'IdleSide$|Idle$|I$', '', os.path.basename(p)[:-4]).replace(' ', '')
    fw, fh = im.width // 4, im.height
    index[name] = [y, fw, fh]
    imgs.append((y, im)); y += fh
sheet = Image.new('RGBA', (max(i.width for _, i in imgs), y))
for yy, im in imgs: sheet.paste(im, (0, yy), im)
sheet.save(os.path.join(root, 'assets', 'creatures.png'), optimize=True)
json.dump(index, open(os.path.join(root, 'assets', 'creatures.json'), 'w'), separators=(',', ':'), sort_keys=True)
# icon: a party of four on parchment-dark background with a gold ring
def icon(size):
    im = Image.new('RGBA', (size, size), (26, 20, 16, 255))
    d = ImageDraw.Draw(im)
    d.ellipse((size * 0.06, size * 0.06, size * 0.94, size * 0.94), outline=(214, 170, 72, 255), width=max(2, size // 40))
    d.ellipse((size * 0.11, size * 0.11, size * 0.89, size * 0.89), fill=(60, 44, 32, 255))
    names = ['SkilledBattlemage', 'SilentRanger', 'ExpertDruid', 'FlameMagus']
    s = int(size * 0.34)
    pos = [(0.33, 0.30), (0.67, 0.30), (0.33, 0.66), (0.67, 0.66)]
    for n, (px, py) in zip(names, pos):
        yy, fw, fh = index[n]
        fr = sheet.crop((0, yy, fw, yy + fh)).resize((s, s), Image.NEAREST)
        im.paste(fr, (int(size * px - s / 2), int(size * py - s / 2)), fr)
    return im
for sz in (512, 192, 180, 96):
    icon(sz).save(os.path.join(root, 'icons', f'icon-{sz}.png'), optimize=True)
print('packed', len(index), 'creatures; sheet', sheet.size)
