# The cellar's pieces in the magma's colours (python3 tools/magma_recolor.py), as tools/crypt_recolor.py makes the crypt's:
# every stone colour goes to the magma sheet's rock nearest it in lightness, wood and clay to the sheet's own wood, and
# everything that lies in the floor (the pools' rims, plates, sockets, bridges' ends, the way arrows, the spikes' holes) to
# the magma's floor, so it sits in it. Water (blue) is kept as drawn: the game lays it over in lava as it lays the crypt's
# in blood (36_works LIQUIDS); fire and gold are kept too. Writes crawler/assets/*_magma.png.
from PIL import Image
import colorsys
def lab(c):
    r, g, b = [v / 255 for v in c]; f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    r, g, b = f(r), f(g), f(b); X = 0.4124*r + 0.3576*g + 0.1805*b; Y = 0.2126*r + 0.7152*g + 0.0722*b; Z = 0.0193*r + 0.1192*g + 0.9505*b
    F = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = F(X / 0.9505), F(Y), F(Z / 1.089); return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))
def hls(c): h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c]); return h * 360, l, s
ROCK = [(140, 119, 98), (114, 97, 80), (91, 77, 63), (71, 60, 49), (56, 47, 38), (40, 34, 28), (30, 25, 21), (25, 19, 14)]
FLOOR = [(130, 108, 88), (114, 93, 74), (102, 81, 61), (86, 71, 55), (81, 64, 48), (68, 54, 40), (55, 44, 32), (40, 32, 24)]
WOOD = [(191, 131, 95), (153, 105, 76), (127, 95, 75), (114, 82, 63), (102, 69, 50), (89, 61, 44), (81, 56, 40), (63, 43, 31), (51, 34, 25), (30, 25, 21)]
fam = {k: [(c, lab(c)) for c in v] for k, v in (('rock', ROCK), ('floor', FLOOR), ('wood', WOOD))}
FLOORLY = [(16, 16, 32, 29), (10, 26, 14, 30), (16, 29, 23, 32), (24, 23, 32, 32), (10, 8, 14, 9), (0, 28, 9, 31)]  # tile rects (x0, y0, x1, y1) of the cellar sheet, as the crypt's
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
            h, l, sat = hls(k); f = 'floor' if fl else 'wood' if (10 <= h <= 60 and sat > 0.25) else 'rock'
            key = (k, f)
            if key not in cache:
                if keep(k, water) and (not fl or hls(k)[0] >= 180): cache[key] = k
                else: L = lab(k); cache[key] = min(fam[f], key=lambda e: 1.6 * (e[1][0] - L[0]) ** 2 + 0.35 * ((e[1][1] - L[1]) ** 2 + (e[1][2] - L[2]) ** 2))[0]
            px[x, y] = cache[key] + (p[3],)
    im.save(dst); print(dst, im.size, len(cache), 'colours')
recolor('assets/cellar.png', 'crawler/assets/cellar_magma.png', True, floorly=True)
recolor('crawler/assets/cellar_doors.png', 'crawler/assets/doors_magma.png', False, True)
recolor('crawler/assets/beam_ends.png', 'crawler/assets/ends_magma.png', False)
