#!/usr/bin/env python3
"""Pack the purchased 16x16 asset packs into the files the game loads.

Usage: python3 -I tools/pack_assets.py <extracted_packs_dir> <repo_root>

Produces:
  assets/tiles.png       - RunninBlood dungeon tileset (unchanged)
  assets/creatures.png   - all idle animation strips stacked vertically
  assets/creatures.json  - name -> {y, fw, fh, n} frame index
  icons/icon-*.png       - PWA icons
"""
import sys, os, glob, json, re
from PIL import Image, ImageDraw, ImageFilter

src, root = sys.argv[1], sys.argv[2]
tiles_src = glob.glob(os.path.join(src, '*RunninBlood*', 'RunninBlood*', 'Final_Tileset.png'))[0]
tiles = Image.open(tiles_src).convert('RGBA')
import shutil; shutil.copyfile(tiles_src, os.path.join(root, 'assets', 'tiles.png'))

strips = sorted(glob.glob(os.path.join(src, '*', '*', '*nimations', '*', '*.png')))
index = {}
imgs = []
y = 0
for p in strips:
    im = Image.open(p).convert('RGBA')
    name = os.path.basename(p)[:-4]
    name = re.sub(r'IdleSide$|Idle$|I$', '', name).replace(' ', '')
    n = 4
    fw, fh = im.width // n, im.height
    index[name] = {'y': y, 'fw': fw, 'fh': fh, 'n': n}
    imgs.append((y, im))
    y += fh
W = max(im.width for _, im in imgs)
sheet = Image.new('RGBA', (W, y), (0, 0, 0, 0))
for yy, im in imgs:
    sheet.paste(im, (0, yy), im)
sheet.save(os.path.join(root, 'assets', 'creatures.png'), optimize=True)
json.dump(index, open(os.path.join(root, 'assets', 'creatures.json'), 'w'), indent=0, sort_keys=True)
print('creatures:', len(index), 'sheet', sheet.size)

# ---- PWA icons: a sword over an ember glow on dark stone
def make_icon(size):
    im = Image.new('RGBA', (size, size), (12, 10, 16, 255))
    # stone brick background from tile (1,4), darkened
    brick = tiles.crop((16, 64, 32, 80))
    s = max(1, size // 128)
    bt = brick.resize((16 * s, 16 * s), Image.NEAREST)
    for by in range(0, size, 16 * s):
        for bx in range(0, size, 16 * s):
            im.paste(bt, (bx, by), bt)
    dark = Image.new('RGBA', (size, size), (10, 8, 14, 200))
    im = Image.alpha_composite(im, dark)
    # ember glow
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    for r, a in ((0.42, 60), (0.34, 90), (0.26, 130), (0.18, 180)):
        rr = int(size * r)
        d.ellipse((size // 2 - rr, int(size * 0.56) - rr, size // 2 + rr, int(size * 0.56) + rr), fill=(255, 120, 30, a))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.06))
    im = Image.alpha_composite(im, glow)
    # sword (tile 4,32)
    sword = tiles.crop((4 * 16, 32 * 16, 5 * 16, 33 * 16))
    ss = int(size * 0.72)
    sword = sword.resize((ss, ss), Image.NEAREST)
    im.paste(sword, ((size - ss) // 2, (size - ss) // 2 - size // 24), sword)
    return im.convert('RGB') if size == 180 else im

for sz in (512, 192, 180, 96):
    make_icon(sz).save(os.path.join(root, 'icons', f'icon-{sz}.png'), optimize=True)
print('icons done')
