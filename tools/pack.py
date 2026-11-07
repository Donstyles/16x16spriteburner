#!/usr/bin/env python3
"""Pack the art for Cellar of Ruin.
usage: python3 -I tools/pack.py <cellar_zip_dir> <old_packs_dir> <repo_root>
cellar_zip_dir: extracted 'Farm Game Dungeon Cellar Tileset' zip (tiles only); old_packs_dir: the earlier creature packs."""
import sys, os, glob, json, re
from PIL import Image, ImageDraw
cellar, packs, root = sys.argv[1], sys.argv[2], sys.argv[3]
base = glob.glob(os.path.join(cellar, '*Cellar*'))[0]
out = lambda *p: os.path.join(root, *p)
# 1. the cellar tileset, as shipped
tiles = Image.open(os.path.join(base, 'Tilesets', 'FG_Cellar.png')).convert('RGBA')
tiles.save(out('assets', 'cellar.png'), optimize=True)
# 3. creatures from the earlier packs: 4-frame idle strips, stacked
strips = sorted(glob.glob(os.path.join(packs, '*', '*', '*nimations', '*', '*.png')))
index, y, imgs = {}, 0, []
for p in strips:
    im = Image.open(p).convert('RGBA')
    name = re.sub(r'IdleSide$|Idle$|I$', '', os.path.basename(p)[:-4]).replace(' ', '')
    fw, fh = im.width // 4, im.height
    index[name] = [y, fw, fh]; imgs.append((y, im)); y += fh
mobs = Image.new('RGBA', (max(i.width for _, i in imgs), y))
for yy, im in imgs: mobs.paste(im, (0, yy), im)
mobs.save(out('assets', 'mobs.png'), optimize=True)
json.dump(index, open(out('assets', 'mobs.json'), 'w'), separators=(',', ':'), sort_keys=True)
# 3b. app icon: the battlemage in a lightning-lit cellar
def icon(size):
    im = Image.new('RGBA', (size, size), (14, 12, 20, 255)); d = ImageDraw.Draw(im)
    for i in range(18, 0, -1):
        a = int(10 + i * 9); r = size * (0.08 + i * 0.026)
        d.ellipse((size / 2 - r, size * 0.56 - r, size / 2 + r, size * 0.56 + r), fill=(min(255, 40 + i * 4), min(255, 18 + i * 6), min(255, 60 + i * 9), 255) if i > 9 else (min(255, 120 + i * 12), min(255, 140 + i * 10), 255, 255))
    bolt = [(0.58, 0.02), (0.44, 0.34), (0.55, 0.36), (0.40, 0.66), (0.62, 0.30), (0.50, 0.28), (0.66, 0.02)]
    d.polygon([(x * size, y * size) for x, y in bolt], fill=(255, 250, 210, 255))
    yy, fw, fh = index['SkilledBattlemage']
    k = mobs.crop((0, yy, fw, yy + fh)).resize((int(size * 0.5), int(size * 0.5)), Image.NEAREST)
    im.paste(k, (int(size * 0.25), int(size * 0.42)), k)
    return im
for sz in (512, 192, 180, 96):
    icon(sz).save(out('icons', f'icon-{sz}.png'), optimize=True)
print('packed: cellar', tiles.size, 'mobs', len(index), mobs.size)
