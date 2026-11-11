"""Generate DESIGN.md tables from browser snapshots and the registered palette."""
from pathlib import Path
import json
import re
import sys

HERE = Path(__file__).resolve().parent
DEMO = HERE.parent
DS = HERE / 'design-system'
data = json.loads((DS / 'theme-snapshots.json').read_text())
themes = data['themes']
labels = ['经典浅', '经典深', 'Bento浅', 'Bento深', '幻彩浅', '幻彩映衬', '幻彩深', '玻璃', '像素深', '像素浅']


def cell(value):
    if not value:
        return '—'
    return '`' + str(value).replace('|', '\\|').replace('\n', ' ') + '`'


def table(headers, rows):
    return '\n'.join(['| ' + ' | '.join(headers) + ' |', '| ' + ' | '.join(['---'] * len(headers)) + ' |', *['| ' + ' | '.join(row) + ' |' for row in rows]])


names = sorted({name for theme in themes for name, value in theme['tokens'].items() if name.startswith('--as-') and not name.startswith(('--as-color-', '--as-channel-', '--as-image-', '--as-render-')) and value})
matrix = f'共 {len(names)} 个产品/兼容语义变量；10 个组合。每格为当前根级计算值。\n\n' + table(['变量', *labels], [[cell(name), *[cell(theme['tokens'].get(name)) for theme in themes]] for name in names])
pairs = list(themes[0]['ratios'])
contrast = table(['前景 / 背景', '要求', *labels], [[cell(pair), '4.5:1', *[f"{theme['ratios'][pair]:.2f} {'✅' if theme['ratios'][pair] >= 4.5 else '⚠'}" for theme in themes]] for pair in pairs])
palette = re.findall(r'^\s*(--[\w-]+):\s*(.*);\s*$', (DS / 'palette.css').read_text(), re.M)
registered = f'共 {len(palette)} 个登记项（颜色、通道、图像与算法参数合计）。\n\n' + table(['变量', '唯一原始值'], [[cell(name), cell(value)] for name, value in palette])
path = DEMO / 'DESIGN.md'
old = path.read_text()
new = old
for marker, content in [('product-matrix', matrix), ('contrast', contrast), ('palette', registered)]:
    pattern = rf'(<!-- GEN:{marker} -->).*?(<!-- /GEN:{marker} -->)'
    new, count = re.subn(pattern, lambda m: m[1] + '\n' + content + '\n' + m[2], new, flags=re.S)
    assert count == 1, marker
html = (DEMO / 'index.html').read_text()
script = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', html, re.S))
slots = sorted(set(re.findall(r'''setProperty\(\s*['"](--[\w-]+)['"]''', script)))
inventory = {'css': data['inventory'], 'runtimeSlots': slots, 'note': 'Runtime slots list covers literal setProperty names; dynamic glassFields bindings, user colors and component inline variables are recorded in CSS declarations and DESIGN.md §6.'}
inventory_text = json.dumps(inventory, ensure_ascii=False, indent=2) + '\n'
inventory_path = DS / 'token-inventory.json'
if '--check' in sys.argv:
    assert old == new, 'DESIGN.md is out of sync'
    assert inventory_path.read_text() == inventory_text, 'token-inventory.json is out of sync'
    print('PASS: generated design tables and token inventory are synchronized')
else:
    path.write_text(new)
    inventory_path.write_text(inventory_text)
    print(f'Updated DESIGN.md: {len(names)} product tokens × 10 states; {len(palette)} palette entries; {len(data["inventory"])} CSS scopes; {len(slots)} literal runtime slots')
