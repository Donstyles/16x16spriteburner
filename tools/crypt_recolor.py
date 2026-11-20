# The cellar's pieces in the crypt's colours (python3 tools/crypt_recolor.py): every stone, wood, clay and metal colour
# goes to the crypt stone nearest it in lightness (the crypt sheet's own unsaturated colours); only water (blue, on the
# cellar sheet), fire and gold (yellow) and blood (deep red) are kept as drawn. Writes crawler/assets/*_crypt.png.
from PIL import Image
import colorsys
from collections import Counter
crypt = Image.open('crawler/assets/crypt.png').convert('RGBA')
cp = Counter(p[:3] for p in crypt.get_flattened_data() if p[3] > 128)
def lab(c):
    r, g, b = [v / 255 for v in c]; f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    r, g, b = f(r), f(g), f(b); X = 0.4124*r + 0.3576*g + 0.1805*b; Y = 0.2126*r + 0.7152*g + 0.0722*b; Z = 0.0193*r + 0.1192*g + 0.9505*b
    F = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = F(X / 0.9505), F(Y), F(Z / 1.089); return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))
def hls(c): h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c]); return h * 360, l, s
# two families on the crypt sheet: the cool grey stone of its walls and tombs, and the warm sandstone and earth of its
# floors. Grey stone goes to the first; wood, clay and sandstone to the second; and everything that lies on the floor
# (the pools' rims, plates, sockets, bridges and planks) to the floor's own, whatever it was, so it sits in the floor
FLOOR = ['332919', '4c3e26', '665333', '7f6c4c', '99876b', 'b2a48e', '261d1a', 'c8b7a5']
stone = [(c, lab(c)) for c, n in cp.most_common() if n >= 6 and hls(c)[2] < 0.35 and '%02x%02x%02x' % c not in FLOOR[:6]]
warm = [(c, lab(c)) for c in [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in FLOOR]]
FLOORLY = [(16, 16, 32, 29), (10, 26, 14, 30), (16, 29, 23, 32), (24, 23, 32, 31), (10, 8, 14, 9), (0, 28, 9, 31)]  # (and the floor's way arrows, and the spikes' holes)  # tile rects (x0, y0, x1, y1), cellar sheet
def keep(c, water):
    h, l, s = hls(c)
    if water and l > 0.9 and 190 < h < 240: return True        # water glints
    if s < 0.3 or l > 0.9: return False
    if water and 180 <= h <= 250: return True                   # water
    if 42 <= h <= 62 and s > 0.6 and l > 0.45: return True      # fire, gold
    if (h < 10 or h > 340) and s > 0.5 and l < 0.6: return True # blood
    return False
def recolor(src, dst, water, bars=False, floorly=False):
    im = Image.open(src).convert('RGBA'); px = im.load(); cache = {}
    if bars:  # the doors sheet's edge bars, lightened as the game does at load (10_assets trimEdgeBars)
        for row, f, t in [(1, (60, 69, 76), (81, 93, 102)), (7, (76, 67, 52), (102, 90, 70))]:
            for x in range(im.width):
                if px[x, row * 16 + 3] == f + (255,): px[x, row * 16 + 3] = t + (255,)
    for y in range(im.height):
        for x in range(im.width):
            p = px[x, y]
            if p[3] == 0: continue
            k = p[:3]
            fl = floorly and any(a * 16 <= x < c * 16 and b * 16 <= y < d * 16 for a, b, c, d in FLOORLY)
            h, l, sat = hls(k); fam = warm if fl or (10 <= h <= 60 and sat > 0.25) else stone
            key = (k, fam is warm)
            if key not in cache:
                if keep(k, water): cache[key] = k
                else: L = lab(k); cache[key] = min(fam, key=lambda e: 1.6 * (e[1][0] - L[0]) ** 2 + 0.35 * ((e[1][1] - L[1]) ** 2 + (e[1][2] - L[2]) ** 2))[0]
            px[x, y] = cache[key] + (p[3],)
    im.save(dst); print(dst, im.size, len(cache), 'colours')
recolor('assets/cellar.png', 'crawler/assets/cellar_crypt.png', True, floorly=True)
recolor('crawler/assets/cellar_doors.png', 'crawler/assets/doors_crypt.png', False, True)
recolor('crawler/assets/beam_ends.png', 'crawler/assets/ends_crypt.png', False)
