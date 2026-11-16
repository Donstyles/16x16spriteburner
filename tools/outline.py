#!/usr/bin/env python3
"""The pickups' outline: the fish (0,0) and the flask (16,0) on the item sheet (crawler/assets/items.png) had pure black
lines; they become #1d1d1c (29, 29, 28), the creatures' outline colour. The creature sheet itself is left as it is.
It changes the sheet in place and says how many pixels it changed; running it again changes nothing."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK = (29, 29, 28)

def pickups():
    p = os.path.join(ROOT, 'crawler/assets/items.png'); im = Image.open(p).convert('RGBA'); px = im.load(); n = 0
    for sx, sy in ((0, 0), (16, 0)):  # the fish, the flask
        for y in range(sy, sy + 16):
            for x in range(sx, sx + 16):
                r, g, b, a = px[x, y]
                if a and (r, g, b) == (0, 0, 0): px[x, y] = INK + (a,); n += 1
    if n: im.save(p, optimize=True)
    return n

if __name__ == '__main__':
    print('outline #1d1d1c: pickups', pickups(), 'pixels')
