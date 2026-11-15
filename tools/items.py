# Builds crawler/assets/items.png, the successor's pickups and treasure chests, from the kept ElvGames packs.
#   row 0: fish (Rogue Adventure icons, row 57 col 12), flask (row 45 col 1)
#   rows 1-4: treasure chests, closed then open (Farming Game World FG_Treasure_1..4: gold, red, blue, black)
# usage: python3 -I tools/items.py
import os
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ra = Image.open(os.path.join(root, 'assets/unused/rogue-adventure-world/item-icons/RA_Item_Icons01.png')).convert('RGBA')
icon = lambda r, c: ra.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16))
out = Image.new('RGBA', (32, 80), (0, 0, 0, 0))
out.paste(icon(57, 12), (0, 0)); out.paste(icon(45, 1), (16, 0))
for i in range(4): out.paste(Image.open(os.path.join(root, f'assets/unused/farming-game-world/objects/FG_Treasure_{i + 1}.png')).convert('RGBA'), (0, 16 + i * 16))
out.save(os.path.join(root, 'crawler/assets/items.png')); print('items.png', out.size)
# crawler/assets/ores.png: ore rocks, one per row (FG_Minerals_1..7), 10 frames of 32 px: plain, silver, silver, gold,
# the white hit flash, then five frames of crumbling away
ores = Image.new('RGBA', (320, 7 * 32), (0, 0, 0, 0))
for i in range(7): ores.paste(Image.open(os.path.join(root, f'assets/unused/farming-game-world/objects/FG_Minerals_{i + 1}.png')).convert('RGBA'), (0, i * 32))
ores.save(os.path.join(root, 'crawler/assets/ores.png')); print('ores.png', ores.size)
