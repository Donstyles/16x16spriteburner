"""Adds recoloured hero sprites to assets/mobs.png / mobs.json (idempotent: re-running rewrites the same rows).

The creature packs have no vampire, priest or angel, so these are palette swaps of existing creatures:
  Vampire      <- MasterIllusionist  (black and crimson robe, pale skin, blood-red orbs)
  VampireLord  <- AdeptNecromancer   (crimson hood, bone staff, red eyes)
  Priest       <- ProficientBard     (white and gold vestments, gold-rimmed cross shield)
  Archpriest   <- WiseWizard         (white robe, gold staff)
  Angel        <- MagicalFairy       (white-gold wings and dress)
  Tidecaller   <- DeftSorceress      (ice-white hair, sea-blue cloak, driftwood staff)
Usage: python3 -I tools/recolor.py   (from the repository root)
"""
import json
from PIL import Image

MAPS = {
    'Vampire': ('MasterIllusionist', {
        '327962': '5a0a16', '263267': '1a0a14', 'c58faa': 'b4a9be', '1b4b4f': '2a0610', '53a96f': '8c1426', 'de9e8c': 'e8dfe8',
        '2a5480': '3a0c1c', '6fbdd5': 'ff4a5a', 'ca4464': 'ff2a3a', '925c33': '4a1a22', '003b62': '140308', '72e27f': 'd02a3c',
        'ac6ca2': 'a01830', 'd07482': 'e04050', 'a5e5da': 'ffb0b8', 'f17878': 'ff5060', 'be8f47': 'c9a227', '30787c': '4a0a18'}),
    'VampireLord': ('AdeptNecromancer', {
        '3e373d': '2a0812', '625353': '5a0c1c', 'b5a793': '9a1a2e', '897a71': '6a0e1e', '8b5b37': '3a1a1a', 'c5c57f': 'e8e0d0',
        'dad4bc': 'f0e8e0', '44563e': '5a4a5e', '53bf83': 'ff2a3a', 'beb050': 'ff5a6a'}),
    'Priest': ('ProficientBard', {
        '7c2c52': 'c8bfa8', 'b3794d': 'efe6cc', 'ca4464': 'f7f2e4', '8a4028': 'c9a227', 'c7935d': 'f6ebc4', '4e1740': '8a7f6a',
        '7b0d69': '6a5a3a', 'f17878': 'fffaf0', '682a19': '8a6a18', '586dd0': '7ad8ff', '4f291c': '5a4010'}),
    'Archpriest': ('WiseWizard', {
        '6fbdd5': 'f6f1e4', '6e95a9': 'dcd0b4', '5a748d': 'b8a888', '925c33': 'c9a227', '424961': '8a7a5a', '373448': '5a4e3a',
        'be8f47': 'ffd75a', '659257': 'ffe680', '694026': '8a6a20'}),
    'Tidecaller': ('DeftSorceress', {
        'e5c989': 'e8f6ff', '9c8850': '8cb8d8', 'c5c57f': 'c4e4f8', '1e5459': '14365e', '238585': '1f5f9e', '04aeae': '38a8f0',
        '30b3a7': '5cc8ff', '432b23': '24344e', '925c33': '5a7ea6', 'a15735': '3a6a9a', 'cb804a': '7aaad0', '625353': '34405a',
        '897a71': '56688a', 'ffc200': 'a8f0ff'}),
    'Angel': ('MagicalFairy', {
        '4ddbc2': 'fff2c8', '86f1d6': 'ffffff', '30b3a7': 'f0d890', 'a5e5da': 'fffbe8', '7c2c52': 'e8dcc0', '4e1740': 'b8a070',
        'e17676': 'ffffff', 'ca4464': 'f6efd8'}),
}


def hx(s):
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def main():
    im = Image.open('assets/mobs.png').convert('RGBA')
    meta = json.load(open('assets/mobs.json'))
    rows = []  # (name, strip image)
    for name, (base, cmap) in MAPS.items():
        y, fw, fh = meta[base]
        strip = im.crop((0, y, fw * 4, y + fh)).copy()
        px = strip.load(); m = {hx(k): hx(v) for k, v in cmap.items()}
        for yy in range(strip.height):
            for xx in range(strip.width):
                r, g, b, a = px[xx, yy]
                if a and (r, g, b) in m:
                    px[xx, yy] = m[(r, g, b)] + (a,)
        rows.append((name, strip, fw, fh))
    # place each recoloured strip: reuse its row if it was added before, otherwise append below everything
    bottom = max(v[0] + v[2] for k, v in meta.items() if k not in MAPS)
    y = bottom; out_h = bottom + sum(r[3] for r in rows); out_w = max(im.width, max(r[1].width for r in rows))
    out = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0)); out.paste(im.crop((0, 0, im.width, bottom)), (0, 0))
    for name, strip, fw, fh in rows:
        out.paste(strip, (0, y)); meta[name] = [y, fw, fh]; y += fh
    out.save('assets/mobs.png'); json.dump(meta, open('assets/mobs.json', 'w'), separators=(',', ':'))
    print('added', [r[0] for r in rows], 'sheet', out.size)


if __name__ == '__main__':
    main()
