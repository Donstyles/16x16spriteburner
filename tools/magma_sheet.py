# The game's magma sheet (python3 tools/magma_sheet.py): ElvGames' FG_Magma_Dungeon as drawn, with four rows added under
# it (rows 32 to 35) that hold the walls the game builds its rooms from, composed from the sheet's own rectangular block
# of rock (tiles 10-12, 6-10: a rim three pixels wide round a dark top, a face two tiles tall). The game's rooms are frames
# seen from inside (30_arena wallPiece), the sheet's block is a mass seen from outside; so a room's west wall is the
# block's east side, its north wall the block's south rim and face, and its inside corners are joined here from the two.
# Laid out as the crypt's frame is (a rim in a tile's first eight rows over a face, 10_assets tallCrypt), so the magma's
# walls stand, stop feet and hide what is behind them exactly as the crypt's do.
#   cols 0-2, rows 32-35: the room frame (corner, top, corner / side, face, side / side, -, side / corner, bottom, corner)
#   col 3, rows 32-35: a mass's north-east corner, -, its south-east corner over the face, the face's end
#   cols 4-6, rows 32-35: a free block's atlas (10_assets cryptBlockAtlas: floor strip + north rim / dark / south rim + face / face)
# The dark of a wall's top is black, as the rock between the rooms and the dark beyond what has been seen.
from PIL import Image
T = 16
src = Image.open('assets/unused/farming-game-world/tilesets/FG_Magma_Dungeon.png').convert('RGBA')
out = Image.new('RGBA', (512, 512 + 4 * T), (0, 0, 0, 0)); out.paste(src, (0, 0))
DARK = (25, 19, 14, 255); BLACK = (0, 0, 0, 255)
def tile(tx, ty):
    t = src.crop((tx * T, ty * T, tx * T + T, ty * T + T)); p = t.load()
    for y in range(T):
        for x in range(T):
            if p[x, y] == DARK: p[x, y] = BLACK
    return t
def blank(): return Image.new('RGBA', (T, T), BLACK)
def rows(dst, s, sy, n, dy, x0=0, x1=T): dst.paste(s.crop((x0, sy, x1, sy + n)), (x0, dy))
def put(tx, ty, t): out.paste(t, (tx * T, ty * T))
N, F9, F10 = tile(11, 8), tile(11, 9), tile(11, 10)       # the block's south rim (rows 10-12 its ragged shade, 13-15 the rim), its face
E, W, S = tile(12, 7), tile(10, 7), tile(11, 6)            # the block's east side (rim at the right), west side, north rim (rows 0-2, shade row 3)
NE, SE = tile(12, 6), tile(12, 8)
def top(base=None, x0=0, x1=T):                            # a north wall's top: shade, rim, the face's first rows
    t = base or blank(); rows(t, N, 10, 6, 2, x0, x1); rows(t, F9, 8, 8, 8, x0, x1); return t
Y0 = 32
# the frame
put(1, Y0, top()); put(1, Y0 + 1, F10); put(1, Y0 + 3, S)
put(0, Y0 + 1, E); put(0, Y0 + 2, E); put(2, Y0 + 1, W); put(2, Y0 + 2, W)
def corner_top(side, mirror):                              # a room's north corner: the side wall's rim runs up beside the face to the top's rim, and no higher
    t = blank()
    if not mirror: rows(t, side, 5, 11, 5, 10, 16); rows(t, N, 10, 3, 2, 13, 16)
    else: rows(t, side, 5, 11, 5, 0, 6); rows(t, N, 10, 3, 2, 0, 3)
    return t
put(0, Y0, corner_top(E, False)); put(2, Y0, corner_top(W, True))
def corner_bot(side, mirror):                              # a room's south corner: the side wall's rim ends on the south wall's
    t = blank()
    if not mirror: rows(t, side, 0, 3, 0, 10, 16); rows(t, S, 3, 1, 3, 13, 16)
    else: rows(t, side, 0, 3, 0, 0, 6); rows(t, S, 3, 1, 3, 0, 3)
    return t
put(0, Y0 + 3, corner_bot(E, False)); put(2, Y0 + 3, corner_bot(W, True))
# a mass's corners
put(3, Y0, NE)
se = blank(); rows(se, SE, 10, 6, 2); rows(se, E, 0, 2, 0); rows(se, F9, 8, 8, 8); put(3, Y0 + 2, se)
put(3, Y0 + 3, F10)
# a free block's atlas
for i in range(3):
    a = Image.new('RGBA', (T, T), (0, 0, 0, 0)); rows(a, tile(10 + i, 6), 0, 8, 8); put(4 + i, Y0, a)
    put(4 + i, Y0 + 1, tile(10 + i, 7))
    b = blank(); s8 = tile(10 + i, 8); rows(b, s8, 8, 8, 0); rows(b, F9, 8, 8, 8); put(4 + i, Y0 + 2, b)
    put(4 + i, Y0 + 3, F10)
# every other dark top on the sheet's blocks stays as drawn (they are not built with)
out.save('crawler/assets/magma.png'); print('crawler/assets/magma.png', out.size)
