"""Rebuild the AgentSpace 2.0 MVP demo on the AgentSpace 2.0 design system.

Input : backups/agentspace2.0_mvp.before-affectui.html (untouched)
Output: agentspace2.0_mvp.as2.html

Steps
1. Inline the design system (tokens.css + components.css) at the top of <style>.
2. Legacy CSS: drop embedded ZCOOL fonts and the hue/glass/sketch theme variants,
   rename legacy --as-* appearance vars to --ap-* and point them at AS2 tokens,
   then convert every colour / radius / shadow / font literal to an AS2 token.
3. Append as2-bridge.css: AS2 component styling for the demo's own class names.
4. JS: appearance settings become light / dark theme (AS2 dark tokens).
Run: python3 refactor-as2.py
"""
from pathlib import Path
import colorsys, re

HERE = Path(__file__).resolve().parent
SRC = HERE / 'backups/agentspace2.0_mvp.before-affectui.html'
OUT = HERE / 'agentspace2.0_mvp.as2.html'
# Design system: a vendored copy next to this script wins (repo builds); else the local skill.
DS = HERE / 'design-system' if (HERE / 'design-system/tokens.css').exists() else Path.home() / '.claude/skills/agentspace2-design-system/references'
BRIDGE = HERE / 'as2-bridge.css'

html = SRC.read_text()
head, rest = html.split('<style>', 1)
legacy_css, rest = rest.split('</style>', 1)
body, script = rest.split('<script>', 1)

# ---------------------------------------------------------------- CSS parsing
def parse(css):
    """Return list of (prelude, body) where body is str for rules, list for nested blocks."""
    out, i, n = [], 0, len(css)
    while i < n:
        if css[i].isspace():
            i += 1; continue
        if css.startswith('/*', i):
            j = css.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if css.startswith('<!--', i):
            j = css.find('-->', i); i = n if j < 0 else j + 3; continue
        j = css.find('{', i)
        if j < 0: break
        prelude = re.sub(r'/\*.*?\*/', '', css[i:j], flags=re.S).strip()
        depth, k, q = 1, j + 1, None
        while k < n and depth:
            c = css[k]
            if q:
                if c == '\\': k += 1
                elif c == q: q = None
            elif c in '"\'': q = c
            elif c == '{': depth += 1
            elif c == '}': depth -= 1
            k += 1
        inner = css[j + 1:k - 1]
        if prelude.startswith(('@media', '@supports', '@container', '@layer')):
            out.append((prelude, parse(inner)))
        else:
            out.append((prelude, inner))
        i = k
    return out

def emit(rules):
    parts = []
    for pre, b in rules:
        if isinstance(b, list):
            inner = emit(b)
            if inner: parts.append(f'{pre}{{{inner}}}')
        elif b.strip():
            parts.append(f'{pre}{{{b}}}')
    return '\n'.join(parts)

def split_top(s, sep):
    out, depth, cur, q = [], 0, '', None
    for c in s:
        if q:
            cur += c
            if c == q: q = None
            continue
        if c in '"\'': q = c
        elif c == '(': depth += 1
        elif c == ')': depth -= 1
        if c == sep and depth == 0:
            out.append(cur); cur = ''
        else:
            cur += c
    out.append(cur)
    return out

# ---------------------------------------------------------- colour → token
FAMILY = {  # strong, soft bg, line
    'brand': ('var(--as-brand)', 'var(--as-brand-soft)', 'var(--as-brand-line)'),
    'done':  ('var(--as-done)', 'var(--as-done-bg)', 'var(--as-done-line)'),
    'wait':  ('var(--as-wait)', 'var(--as-wait-bg)', 'var(--as-wait-line)'),
    'fail':  ('var(--as-fail)', 'var(--as-fail-bg)', 'var(--as-fail-line)'),
}
HUE_FALLBACK = 220  # legacy hsl(var(--ap-hue) …) resolved as blue

def parse_color(tok):
    t = tok.strip().lower()
    if t.startswith('#'):
        h = t[1:]
        if len(h) in (3, 4): h = ''.join(c * 2 for c in h)
        if len(h) not in (6, 8): return None
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1
        return r, g, b, a
    m = re.match(r'(rgba?|hsla?)\((.*)\)$', t, re.S)
    if not m: return None
    fn, args = m.groups()
    args = args.replace('var(--ap-hue)', str(HUE_FALLBACK)).replace('var(--ap-companion-hue)', '200')
    if 'var(' in args: return None
    nums = [x for x in re.split(r'[\s,/]+', args.strip()) if x]
    try:
        if fn.startswith('rgb'):
            r, g, b = (float(x.rstrip('%')) / (100 if x.endswith('%') else 255) for x in nums[:3])
        else:
            hh = float(nums[0].replace('deg', '')) / 360
            ss, ll = float(nums[1].rstrip('%')) / 100, float(nums[2].rstrip('%')) / 100
            r, g, b = colorsys.hls_to_rgb(hh, ll, ss)
        a = 1
        if len(nums) > 3:
            a = float(nums[3].rstrip('%')) / (100 if nums[3].endswith('%') else 1)
        return r, g, b, a
    except (ValueError, IndexError):
        return None

def family(h, s, l):
    if s < .14 or l > .985 or l < .06: return None
    deg = h * 360
    if deg < 16 or deg >= 330: return 'fail'
    if deg < 66: return 'wait'
    if deg < 170: return 'done'
    return 'brand'

def token_for(rgba, role):
    r, g, b, a = rgba
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    fam = family(h, s, l)
    if a == 0: return 'transparent'
    if fam is None:  # neutral
        if role == 'text':
            if l > .93: return '#fff' if a > .6 else 'var(--as-text-subtle)'
            ink = 1 - (1 - l) * a if l < .5 else l
            if ink < .2: return 'var(--as-text)'
            if ink < .36: return 'var(--as-text-2)'
            if ink < .62: return 'var(--as-text-muted)'
            return 'var(--as-text-subtle)'
        if role == 'border':
            if l > .5:  # white-ish line (usually on dark/rail)
                return 'var(--as-border-soft)'
            if a < .9: return 'var(--as-border-soft)' if a < .09 else 'var(--as-border-strong)'
            if l > .87: return 'var(--as-border)'
            if l > .7: return 'var(--as-border-strong)'
            return 'var(--as-text-muted)'
        if role == 'shadow':
            return f'rgba(0,0,0,{min(a, .12):.3g})'
        # background / fill
        if a < .9:
            if l > .5:
                return 'var(--as-card)' if a >= .55 else 'var(--as-hover)'
            if a < .06: return 'var(--as-muted-bg)'
            if a < .12: return 'var(--as-hover)'
            return 'var(--as-overlay)'
        if l >= .995: return 'var(--as-card)'
        if l >= .978: return 'var(--as-stage)'
        if l >= .955: return 'var(--as-bg)'
        if l >= .86: return 'var(--as-border)'
        if l < .3: return 'var(--as-text)'
        return 'var(--as-text-muted)'
    strong, soft, line = FAMILY[fam]
    # The legacy theme used faint blue-grey tints as its neutral surfaces; in AS2 those are grey.
    chroma = (max(r, g, b) - min(r, g, b)) * a
    if fam == 'brand' and role in ('bg', 'border') and chroma < (.09 if role == 'border' else .075) and l > .8:
        return token_for((l, l, l, a), role)
    # Its text / line scale was slate blue-grey (s < .5) and navy ink: neutral in AS2.
    if fam == 'brand' and role in ('text', 'border') and (s < .5 or l < .3):
        return token_for((l, l, l, a), role)
    if role == 'text':
        if fam == 'brand':
            if l < .22: return 'var(--as-text)'
            return 'var(--as-selected-ink)' if l < .42 else 'var(--as-brand)'
        return strong
    if role == 'border':
        return line if (l > .78 or a < .4) else strong
    if role == 'shadow':
        return f'rgba(0,0,0,{min(a, .1):.3g})'
    if l > .82 or a < .3: return soft
    if fam == 'brand' and l < .22: return 'var(--as-text)'
    return strong

COLOR_RE = re.compile(r'#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\((?:[^()]|\([^()]*\))*\)')

def tokenize_colors(value, role):
    def sub(m):
        c = parse_color(m.group(0))
        return token_for(c, role) if c else m.group(0)
    v = re.sub(r'rgba\(var\(--ap-panel-rgb\),[^)]*\)', 'var(--as-panel)', value)
    # Named colours were missed before (legacy `background:white` stayed white in dark themes).
    v = re.sub(r'(?<![-\w#])white(?![-\w])', '#ffffff', v)
    v = re.sub(r'(?<![-\w#])black(?![-\w])', '#000000', v)
    return COLOR_RE.sub(sub, v)

# ------------------------------------------------------ other literal maps
RADIUS = [(4.5, 'var(--as-r-xs)'), (6.5, 'var(--as-r-sm)'), (8.5, 'var(--as-r-md)'), (11.5, 'var(--as-r-row)'),
          (14.5, 'var(--as-r-card)'), (16.5, 'var(--as-r-dec)'), (20.5, 'var(--as-r-panel)'), (34, 'var(--as-r-input)')]
def snap_radius(v):
    def one(m):
        x = float(m.group(1))
        if x <= 1.5: return m.group(0)
        for lim, tok in RADIUS:
            if x <= lim: return tok
        return 'var(--as-r-pill)'
    return re.sub(r'(?<![\w.-])(\d+(?:\.\d+)?)px', one, v)

FS = [(11.6, 'var(--as-fs-micro)'), (12.5, 'var(--as-fs-meta)'), (13.5, 'var(--as-fs-ui)'), (14.5, 'var(--as-fs-body)'),
      (15.5, 'var(--as-fs-reading)'), (17.5, 'var(--as-fs-h3)'), (19, '18px'), (23.5, 'var(--as-fs-h2)'), (31, 'var(--as-fs-h1)')]
def snap_fs(px):
    for lim, tok in FS:
        if px <= lim: return tok
    return f'{px:g}px'

POP_SEL = re.compile(r'pop|menu|toast|dropdown|tooltip|searchresult|picker|quick|suggest|scrim|drawer', re.I)
DIALOG_SEL = re.compile(r'modal|dialog', re.I)

def map_shadow(value, selector):
    if value.strip() in ('none', 'inherit', 'initial', 'unset') or value.strip().startswith('var('):
        return value
    parts, keep, lift = split_top(value, ','), [], False
    for p in parts:
        p = p.strip()
        if not p: continue
        if 'inset' in p:
            keep.append(tokenize_colors(p, 'border')); continue
        lens = re.findall(r'-?\d*\.?\d+px|(?<![\w.#])0(?![\w.])', re.sub(COLOR_RE, '', p))
        nums = [float(x.replace('px', '')) for x in lens]
        blur = nums[2] if len(nums) > 2 else 0
        spread = nums[3] if len(nums) > 3 else 0
        if blur <= .5 and abs(nums[0] if nums else 0) < .5 and abs(nums[1] if len(nums) > 1 else 0) < .5 and spread:
            keep.append(tokenize_colors(p, 'border'))  # ring / focus ring
        else:
            lift = True
    if lift:
        tok = ('var(--as-shadow-dialog)' if DIALOG_SEL.search(selector) else
               'var(--as-shadow-pop)' if POP_SEL.search(selector) else 'var(--as-shadow-tile)')
        if ':hover' in selector and tok == 'var(--as-shadow-tile)':
            tok = 'var(--as-shadow-tile)'
        keep.append(tok)
    return ', '.join(keep) if keep else 'none'

TEXT_PROPS = {'color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color', 'column-rule-color', 'accent-color'}
BORDER_PROPS = re.compile(r'^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|text-decoration|column-rule)$')

def custom_prop_role(name):
    n = name.lower()
    if re.search(r'shadow', n): return 'shadow'
    if re.search(r'line|outline|border|stroke', n): return 'border'
    if re.search(r'ink|text|muted|weak|fg|link', n): return 'text'
    return 'auto'

def process_decl(prop, value, selector):
    p = prop.strip().lower()
    v = value
    if p in ('backdrop-filter', '-webkit-backdrop-filter'):
        return None
    if p == 'font-family':
        return prop, ('var(--as-font-mono)' if re.search(r'mono|consol|menlo|courier', v, re.I) else 'var(--as-font)') + (' !important' if '!important' in v else '')
    if p == 'font':
        m = re.match(r'^(.*?\d+(?:\.\d+)?px(?:/[\d.]+(?:px)?)?)\s+["\'a-zA-Z].*?(\s*!important)?$', v.strip())
        if m:
            size = re.search(r'(\d+(?:\.\d+)?)px', m.group(1))
            pre = m.group(1)[:size.start()] + snap_fs(float(size.group(1))) + m.group(1)[size.end():]
            return prop, f'{pre} var(--as-font){m.group(2) or ""}'
        return prop, v
    if p == 'font-size':
        v = re.sub(r'^(\d+(?:\.\d+)?)px', lambda m: snap_fs(float(m.group(1))), v.strip())
        return prop, v
    if p == 'border-radius' or p.endswith('-radius'):
        return prop, snap_radius(v)
    if p in ('box-shadow', '-webkit-box-shadow'):
        return prop, map_shadow(v, selector)
    if p == 'text-shadow':
        return prop, 'none'
    if p == 'transform' and ':hover' in selector and 'translate' in v and 'scale' not in v:
        return prop, 'none'
    if p.startswith('--'):
        role = custom_prop_role(p)
        if role == 'shadow':
            return prop, map_shadow(v, selector)
        if role == 'auto':
            def auto(m):
                c = parse_color(m.group(0))
                if not c: return m.group(0)
                _, l, _ = colorsys.rgb_to_hls(*c[:3])
                return token_for(c, 'bg' if l > .7 else 'text')
            return prop, COLOR_RE.sub(auto, v)
        return prop, tokenize_colors(v, role)
    if p in TEXT_PROPS:
        return prop, tokenize_colors(v, 'text')
    if p == 'scrollbar-color':
        return prop, 'var(--as-border-strong) transparent'
    if BORDER_PROPS.match(p):
        v = tokenize_colors(v, 'border')
        # Hover is not selection: a hovered edge darkens to the strong neutral line, never brand.
        if all(':hover' in part for part in split_top(selector, ',')):
            v = v.replace('var(--as-brand-line)', 'var(--as-border-strong)').replace('var(--as-brand)', 'var(--as-border-strong)')
        return prop, v
    if p.startswith('background') or p in ('outline-color',):
        return prop, tokenize_colors(v, 'bg')
    return prop, v

def process_body(body, selector):
    out = []
    for decl in split_top(body, ';'):
        if ':' not in decl:
            if decl.strip(): out.append(decl.strip())
            continue
        prop, value = decl.split(':', 1)
        if not prop.strip(): continue
        r = process_decl(prop.strip(), value.strip(), selector)
        if r: out.append(f'{r[0]}:{r[1]}')
    return ';'.join(out)

# ------------------------------------------------- legacy appearance → AS2
AP_ROOT = """
--ap-hue:220;--ap-companion-hue:200;--ap-surface-alpha:1;--ap-card-alpha:1;--ap-rail-alpha:1;--ap-panel-rgb:252,252,252;
--ap-text:var(--as-text);--ap-muted:var(--as-text-muted);--ap-weak:var(--as-text-subtle);
--ap-accent:var(--as-brand);--ap-action:var(--as-btn-bottom);--ap-action-hover:var(--as-btn-top-hover);--ap-button-ink:var(--as-btn-ink);
--ap-link:var(--as-brand);--ap-base:var(--as-bg);--ap-dialog:var(--as-card);--ap-input:var(--as-card);
--ap-line:var(--as-border);--ap-line-strong:var(--as-border-strong);
--ap-surface:var(--as-panel);--ap-card:var(--as-card);--ap-side:var(--as-bg);--ap-rail:var(--as-bg);--ap-rail-ink:var(--as-text-muted);
--ap-selected:var(--as-selected);--ap-selected-ink:var(--as-selected-ink);--ap-hover:var(--as-hover);
--ap-tint:var(--as-muted-bg);--ap-tint-strong:var(--as-brand-soft);--ap-bubble:var(--as-sunken);
--ap-hero:var(--as-card);--ap-wallpaper:none;--ap-shadow:none;--ap-dialog-shadow:var(--as-shadow-dialog);--ap-backdrop:var(--as-overlay);
--ap-play-font:var(--as-font);--ap-sketch-ink:var(--as-text);
--ink:var(--as-text);--muted:var(--as-text-muted);--line:var(--as-border);--outline:var(--as-border-strong);
--primary:var(--as-brand);--accent:var(--as-brand);--purple:var(--as-brand);--blue:var(--as-brand);
--primary-soft:var(--as-brand-soft);--soft:var(--as-muted-bg);--plum:var(--as-stage);--plum2:var(--as-stage);
--bg:var(--as-bg);--surface:var(--as-card);--success:var(--as-done);--green:var(--as-done);--teal:var(--as-done);--tealbg:var(--as-done-bg);
--gold:var(--as-wait);--goldbg:var(--as-wait-bg);--red:var(--as-fail);--redbg:var(--as-fail-bg);--alert:var(--as-fail);--yellow:var(--as-wait);
--radius:var(--as-r-row);--shadow:none;--shadow-hover:none;
--nova-violet:var(--as-brand);--nova-sky:var(--as-brand);--nova-mint:var(--as-done);--nova-coral:var(--as-brand);
--sl-ui:var(--as-font)
"""

DROP_SEL = re.compile(r'data-appearance-(style|color)=')

def transform(rules):
    out = []
    for pre, b in rules:
        if pre.startswith('@font-face'):
            continue
        if isinstance(b, list):
            out.append((pre, transform(b))); continue
        if pre.startswith('@keyframes') or pre.startswith('@-webkit-keyframes'):
            out.append((pre, b)); continue  # keyframes parsed as plain body; leave as is
        sels = [x for x in split_top(pre, ',') if not DROP_SEL.search(x)]
        if not sels: continue
        sel = ','.join(x.strip() for x in sels)
        sel = sel.replace(':root[data-appearance-tone="dark"]', ':root[data-theme="dark"]')
        if sel == ':root' and '--ap-hue:' in b:
            out.append((sel, AP_ROOT)); continue
        out.append((sel, process_body(b, sel)))
    return out

legacy = re.sub(r'--as-', '--ap-', legacy_css)
legacy = re.sub(r'<!--.*?-->', '', legacy, flags=re.S)
legacy_rules = transform(parse(legacy))

# Legacy :root blocks still redefine --primary etc. – make sure the AS2 mapping wins by
# re-asserting it last (after the legacy layer, before the bridge).
legacy_out = emit(legacy_rules) + '\n:root{' + AP_ROOT + '}'
legacy_out += '\n:root[data-theme="dark"]{--ap-panel-rgb:18,18,19}'

tokens = (DS / 'tokens.css').read_text()
components = (DS / 'components.css').read_text()
bridge = BRIDGE.read_text()
css = '\n'.join([
    '/* ===== AgentSpace 2.0 Design System · tokens.css ===== */', tokens,
    '/* ===== AgentSpace 2.0 Design System · components.css ===== */', components,
    '/* ===== Legacy demo layout (tokenised by refactor-as2.py) ===== */', legacy_out,
    '/* ===== AS2 bridge: demo classes → AS2 components ===== */', bridge,
])

# ------------------------------------------------------------------ HTML/JS
head = head.replace('<meta name="color-scheme" content="light">', '<meta name="color-scheme" content="light dark">')
body = re.sub(r'<template id="font-license-notices">.*?</template>', '', body, flags=re.S)
body = body.replace('<body>', '<body class="as-root">')
# Brand logo: inlined so its gradient stops can follow the theme (--lg-s1…s9, fallbacks = the original brand colours).
_svg = (HERE / 'assets/agentspace-logo.svg').read_text()
_k = [0]
def _stop(m):
    _k[0] += 1
    return f'<stop style="stop-color:var(--lg-s{_k[0]},{m.group(1)})"'
_svg = re.sub(r'<stop stop-color="([^"]+)"', _stop, _svg)
assert _k[0] == 9, 'logo gradient stops'
body, n = re.subn(r'<span class="logo" aria-hidden="true"><svg.*?</svg></span>',
                  lambda m: '<span class="logo" aria-hidden="true">' + _svg + '</span>', body, count=1, flags=re.S)
assert n == 1, 'logo anchor missing'

js = script.replace('--as-', '--ap-')

def jsrep(old, new, count=1):
    global js
    assert old in js, 'Missing JS anchor: ' + old[:80]
    js = js.replace(old, new, count)

jsrep("""const APPEARANCE_STYLES={
  classic:{name:'经典',tone:'light',tagline:'轻盈明亮',description:'浅色玻璃面板与柔和渐变，让日常工作轻盈、有序。'},
  dark:{name:'暗黑',tone:'dark',tagline:'静谧专注',description:'石墨底色与低亮色彩，在安静的界面中保持专注。'},
  tech:{name:'科技',tone:'dark',tagline:'深空微光',description:'深空渐变、细密网格与微光边缘，呈现清晰的工作层次。'},
  sketch:{name:'手绘',tone:'light',tagline:'贴纸手帐',description:'奶油纸底、手绘线条和糖果贴纸，让灵感轻松冒个泡。'}
};""", """const APPEARANCE_STYLES={
  classic:{name:'浅色',tone:'light',tagline:'中性灰阶',description:'AgentSpace 2.0 默认：中性灰承载信息，墨色胶囊是唯一主操作，品牌蓝只表示选中、焦点与运行中。'},
  dark:{name:'深色',tone:'dark',tagline:'逐层提亮',description:'画布最暗、卡片逐层提亮；主按钮自动反转为浅色，状态色保持三重编码。'},
  liquid:{name:'流光',tone:'light',tagline:'液态玻璃 · 自定义配色',description:'个性化皮肤：双色渐变底，面板与浮层为半透明液态玻璃；配色可选预设或自定义。'},
  pixel:{name:'像素',tone:'dark',tagline:'终端 · 等宽 · 像素',description:'开发者皮肤：严格中性灰、等宽字体与像素标题，直角硬边；白色表示选中，橙红表示异常。'}
};""")
jsrep("root.dataset.appearanceTone=APPEARANCE_STYLES[style].tone;",
      "root.dataset.appearanceTone=APPEARANCE_STYLES[style].tone;root.dataset.theme=APPEARANCE_STYLES[style].tone;root.classList.toggle('dark',APPEARANCE_STYLES[style].tone==='dark');")
# Settings: theme only (colour hue and glass transparency are not part of AS2).
js = re.sub(r'\n\s*<h4 class="appearance-group-label appearance-color-label".*?</div>\n(?=\s*</div>\n\s*<div class="appearance-preview-column">)', '\n', js, count=1, flags=re.S)
js = re.sub(r'\n\s*<div class="appearance-transparency">.*?\n    </div>\n(?=  </section>)', '\n', js, count=1, flags=re.S)
jsrep('界面风格 <span>4 种风格 × 6 种颜色</span>', '界面主题 <span>AgentSpace 2.0 设计系统</span>')
jsrep("${APPEARANCE_STYLES[style].name} · ${APPEARANCE_COLORS[color].name}主题", "${APPEARANCE_STYLES[style].name}主题")
jsrep("themeName.textContent=APPEARANCE_STYLES[style].name+' · '+APPEARANCE_COLORS[color].name+'主题';", "themeName.textContent=APPEARANCE_STYLES[style].name+'主题';")
js = js.replace("appearanceReset(){s.appearance={style:'classic',color:'purple',transparency:20}", "appearanceReset(){s.appearance={style:'liquid',color:'blue',transparency:0}")
# Status vocabulary follows the AS2 task layer: waiting is "需要你", running is not green.
jsrep("wait:'待我处理'", "wait:'需要你'")
jsrep("const statusClass={pending:'gold',running:'green',wait:'gold',review:'gold',", "const statusClass={pending:'gold',running:'blue',wait:'gold',review:'purple',")
# "个人" uses a single-person glyph, matching the two-person "项目" icon.
jsrep("personal:'M12 3l9 9-9 9-9-9zM12 7l5 5-5 5-5-5z'", "personal:'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1'")
# ---- P1 visual: Chinese-only labels (English eyebrows that only repeat the title are dropped).
for old, new in [
    ('<div class="sidelabel">PERSONAL VIEW</div>', ''),
    ('<small>PERSONAL VIEW</small>', ''),
    ('<div class="sidelabel">WORKFLOW STUDIO</div>', ''),
    ('<div class="sidelabel">MESSAGES</div>', ''),
    ('<div class="sidelabel">EXTENSIONS</div>', ''),
    ('<div class="kicker">WORKFLOW STUDIO · IMPORT</div>', ''),
    ('>WORKFLOW STUDIO · 构建<', '>Workflow 编辑器<'),
    ('<div class="wb-eyebrow">WORKBENCH CONVERSATION</div>', ''),
    ('<div class="wc-kicker">WORKBENCH COMPOSITION</div>', ''),
    ('UNDERSTAND · EVALUATE · IMPROVE', '理解 · 评估 · 改进'),
    ('PERSONAL ASSISTANT · 临时任务', '临时任务'),
    ('<span class="tiny">MY WORKBENCH</span>', '<span class="tiny">工作台</span>'),
    ('MY WORKBENCH · V${v.version}', '工作台 · V${v.version}'),
    ('<div class="kicker">MY SPACES</div>', ''),
    ('<div class="evo-eyebrow">EVOLUTION CENTER</div>', ''),
    ('<div class="kicker">DISCOVER & SUBSCRIBE</div>', ''),
    ("<div class=\"kicker\">${personal?'MY TASKS · ACROSS PROJECTS':'PROJECT TASK BOARD'}</div>", ''),
    ('STAGE 0${i+1}', '阶段 0${i+1}'),
]:
    jsrep(old, new)

# ---- P1 visual: glyphs → line icons; decorative sparkles removed.
jsrep(' <span class="side-spark">✧</span>', '', 2)
jsrep('<div style="margin-top:8px;font-size:9px;color:var(--muted)">✦ 让好想法，变成好结果</div>', '')
jsrep("'来，先逛一圈 ✦'", "'来，先逛一圈'")
jsrep('<b>✦ CodeAgent 已接入</b>', '<b><span class="as-avatar as-avatar--sm" data-kind="agent">C</span>CodeAgent 已接入</b>')
jsrep("'✦ CodeAgent 已在此话题'", "'CodeAgent 已在此话题'")
jsrep("<span>✦</span><span>${ico('personal')}</span>", "<span>${ico('personal')}</span>")
jsrep('data-v="${b.id}">☆ ${esc(b.title)}</button>', 'data-v="${b.id}">${ico(\'star\')}<span>${esc(b.title)}</span></button>')
jsrep('<span class="appearance-mini-favorite">☆ 容器质量日报</span>', '<span class="appearance-mini-favorite">${ico(\'star\')}容器质量日报</span>')
jsrep("${b.favorite?'★':'☆'}</button>", "${ico('star')}</button>")
jsrep("'<i class=\"ms-star\">★</i>'", "`<i class=\"ms-star\">${ico('star')}</i>`")
jsrep("'<i>★</i>'", "`<i class=\"ms-star\">${ico('star')}</i>`")
jsrep('<div class="spark">✧</div>', '<div class="spark">${ico(\'spark\')}</div>')
jsrep("<span>✧</span><h3>", "<span>'+ico('spark')+'</span><h3>")

# ---- P1 visual: 工作台首屏 = 需要你 / 待验收 / 执行中 / 工作台 摘要（替代标语大卡）。
js, n = re.subn(r'<section class="nova-hero" aria-label="工作概览">.*?</section>', lambda m: (
    '<section class="as2-overview" aria-label="工作概览">${['
    "['waiting','需要你确认',s.tasks.filter(t=>personallyRelatedTask(t)&&['pending','wait'].includes(t.status)).length,'tasks'],"
    "['review','待验收',s.tasks.filter(t=>personallyRelatedTask(t)&&t.status==='review').length,'tasks'],"
    "['running','执行中',running,'tasks'],"
    "['idle','持续关注的工作台',active,'']"
    "].map(([st,label,n,page])=>`<button class=\"as2-stat\" data-status=\"${st}\" data-a=\"${page?'nav-personal':'bench-filter'}\" data-v=\"${page||'all'}\"><span class=\"as2-stat-ico\">${ico({waiting:'inputWait',review:'checkCircle',running:'loader',idle:'grid'}[st])}</span><span class=\"as2-stat-copy\"><small>${label}</small><strong>${n}</strong></span></button>`).join('')}</section>"), js, count=1, flags=re.S)
assert n == 1, 'hero anchor'

# ---- 进化中心：二级菜单进入侧栏，与其他空间同一框架。
jsrep("function evolutionSidebar(){return '';}", """function evolutionSidebar(){normalizeEvolution();const e=s.evolutionCenter,pending=evolutionRows('proposals',false).filter(p=>['pending','ready','blocked'].includes(p.status)).length,icons={overview:'home',observe:'search',evaluate:'check',improve:'spark',memory:'file'};return `<div class="sidehead"><h3>进化中心</h3><p>越用越了解你的工作偏好与目标</p></div><div class="sidebody">${EVO_TABS.map(([id,label])=>`<button class="sidenav ${e.tab===id?'active':''}" data-a="evolution-tab" data-v="${id}" ${e.tab===id?'aria-current="page"':''}>${ico(icons[id])}<span>${label}</span>${id==='improve'&&pending?`<small>${pending}</small>`:''}</button>`).join('')}</div><div class="sidefoot"><button data-a="evolution-return">${ico('back')} 返回工作现场</button></div>`;}""")
jsrep("""<time>${new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric'})}</time><button class="evo-text-btn" data-a="evolution-return">${ico('back')}返回工作现场</button>""",
      """<span>${personal?'个人私有 · 本人管理':e.scope==='all'?'按个人与项目范围隔离':'项目共享 · 成员协作'}</span>""")

# ---- 面包屑右侧只放可见范围；操作进页面标题区。
jsrep("crumb('任务看板',btn(ico('plus')+'新建任务','board-create-menu','','sm'))", "crumb('任务看板')")
jsrep("crumb(s.page==='project'?'项目主页':'# '+s.channel,`<span>10月28日</span>${btn(ico('plus')+'新建任务',s.page==='project'?'board-create-menu':'new-team-task','','sm')}`)",
      "crumb(s.page==='project'?'项目主页':'# '+s.channel)")
jsrep("${btn('打开项目讨论','channel','development')}</div>", '<div class="row">' + "${btn('打开项目讨论','channel','development')}${btn(ico('plus')+'新建任务','board-create-menu','','primary')}</div></div>")
jsrep("""${s.workbenchReturnKey?btn(ico('back')+'返回工作台构建','wb2-return-extensions','','sm'):''}<span class="ac-source-pill"><i class="dot"></i> 来源：AgentCenter</span></div>""",
      """<span>按安装范围可见</span></div>""")
jsrep('<div class="kicker">TOOLS & SKILLS</div>', "${s.workbenchReturnKey?btn(ico('back')+'返回工作台构建','wb2-return-extensions','','link sm'):''}")
jsrep('<span>作为独立草稿继续编辑</span>', '<span>草稿仅自己可见</span>')

# ---- Avatars: Agent mascots + people photos, embedded as data URIs (see assets/avatars/CREDITS.md).
def newtask_hero_js():
    import base64
    data = base64.b64encode((HERE / 'assets/newtask-hero.webp').read_bytes()).decode()
    return "\n// 新建任务页输入框上方的插画（透明底 webp）。\nfunction newTaskHero(){return 'data:image/webp;base64," + data + "';}\n"

def avatar_js():
    import base64, json
    av = HERE / 'assets/avatars'
    data = {}
    for name in ['CodeAgent', 'TestAgent', 'DocAgent', 'IdeaAgent']:
        data[name] = 'data:image/png;base64,' + base64.b64encode((av / 'agents' / f'{name}.png').read_bytes()).decode()
    for name in ['zhang', 'li', 'wang', 'chen', 'zhou', 'me']:
        data[name] = 'data:image/png;base64,' + base64.b64encode((av / 'people' / f'{name}.png').read_bytes()).decode()
    return '\nwindow.AS2_AVATARS=' + json.dumps(data) + ';\n' + (HERE / 'as2-avatars.js').read_text()

# ---- Settings: global preferences (as2-settings.js) replace the appearance-only dialog.
# 「跟随系统」 was removed: a saved 'system' choice becomes the theme the OS is showing right now.
jsrep("if(!Object.hasOwn(APPEARANCE_STYLES,s.appearance.style))s.appearance.style='classic';",
      "if(s.appearance.style==='system')s.appearance.style=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'classic';if(!Object.hasOwn(APPEARANCE_STYLES,s.appearance.style))s.appearance.style='liquid';")
js = js.replace('APPEARANCE_STYLES[style].tone', 'themeTone(style)')
jsrep("function appearanceApply(){", "function appearanceApply(){settingsApply();")
jsrep("function action(a,v){", "function action(a,v){if(channelTabsAction(a,v)||wfEditorAction(a,v)||mentionAction(a,v)||newTaskAction(a,v)||taskPageAction(a,v)||settingsAction(a,v)||runAction(a,v)||sidebarAction(a,v)||messageAction(a,v)||composerAction(a,v)||boardAction(a,v)||extensionAction(a,v))return;")
jsrep("case 'appearance-settings':openAppearanceSettings();break;", "case 'appearance-settings':openSettings();break;")
js = js.rstrip()
assert js.endswith('</script></body></html>')
js = js[:-len('</script></body></html>')] + (HERE / 'as2-settings.js').read_text() + (HERE / 'as2-run.js').read_text() + (HERE / 'as2-sidebar.js').read_text() + (HERE / 'as2-message.js').read_text() + (HERE / 'as2-extensions.js').read_text() + (HERE / 'as2-board.js').read_text() + (HERE / 'as2-taskpage.js').read_text() + (HERE / 'as2-newtask.js').read_text() + (HERE / 'as2-mention.js').read_text() + (HERE / 'as2-wfeditor.js').read_text() + (HERE / 'as2-channel.js').read_text() + (HERE / 'as2-crumb.js').read_text() + newtask_hero_js() + avatar_js() + '\n</script></body></html>'

# Dialog focus: never land on the close button (it would show a focus ring on open).
jsrep('<section class="modal" role="dialog"', '<section class="modal" role="dialog" tabindex="-1"')
jsrep("host.querySelector('input:not([type=checkbox]),textarea,button')?.focus();},30);",
      "(host.querySelector('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea')||host.querySelector('.modal'))?.focus({preventScroll:true});},30);")

# ---- Run view: execution progress in task detail, Thread execution and task cards (as2-run.js).
jsrep("t.run=(t.run||0)+1;", "t.run=(t.run||0)+1;t.runStartedAt=Date.now();t.runFinishedAt=null;")
jsrep("if(!t)return;t.status='review';closeModal();", "if(!t)return;t.runFinishedAt=Date.now();t.status='review';closeModal();")
jsrep("case 'cancel-task':t.status='cancelled';", "case 'cancel-task':t.runStopIndex=t.status==='running'?runIndex(t):(t.runStopIndex??1);t.status='cancelled';")
jsrep("$('#modalHost .modalbody')?.insertAdjacentHTML('beforeend',taskKnowledgeSummary(t));}",
      "$('#modalHost .aggregate-task-detail')?.insertAdjacentHTML('afterend',runView(t,'full'));$('#modalHost .modalbody')?.insertAdjacentHTML('beforeend',taskKnowledgeSummary(t));}")
jsrep("<p>${fixed?'正在按 Spec 推进开发与测试。':'正在云端定位并修复，进度会回到当前 Thread。'}<br>演示可继续推进到结果。</p>", "${runView(t,'compact')}")
jsrep('${renderTaskInline(t)}<div class="rule"></div><h4 style="margin-bottom:18px">执行记录与产物</h4>', '${renderTaskInline(t)}${runView(t,\'full\')}<div class="rule"></div><h4 style="margin-bottom:18px">执行记录与产物</h4>')
jsrep("<p>Agent：CodeAgent · 环境：personal-analysis / 云端<br>目标 V${t.rev} · 验收：分析结论关联 MR 与 CI 证据</p>", "<p>Agent：CodeAgent · 环境：personal-analysis / 云端<br>目标 V${t.rev} · 验收：分析结论关联 MR 与 CI 证据</p>${runView(t,'compact')}")

# ---- Sidebar (Kobra): project switch becomes the sidebar header; switching opens an anchored popover.
jsrep("""if(s.view==='team')return `<div class="sidehead"><h3>Project</h3><p>云软件团队 · 团队协作视图</p></div><div class="sidebody"><div class="sidelabel">当前项目</div><button class="projectswitch" data-a="switch-project"><span class="projecticon">${esc(s.project[0])}</span><div class="grow"><b>${esc(s.project)}</b><small>需求与研发交付</small></div>${ico('down')}</button>""",
      """if(s.view==='team')return `<div class="sidehead sidehead--switch"><button class="projectswitch" data-a="switch-project" aria-haspopup="dialog" aria-expanded="false" aria-label="切换项目（当前 ${esc(s.project)}）"><span class="projecticon">${esc(s.project[0])}</span><div class="grow"><b>${esc(s.project)}</b><small>云软件团队 · 需求与研发交付</small></div><svg class="icon as2-updown" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg></button></div><div class="sidebody">""")
jsrep("case 'switch-project':modal('切换项目',", "case 'switch-project':if(openProjectSwitcher())break;modal('切换项目',")

# ---- Icons: Lucide (assets/lucide-icons.json, from lucide-extract.py). ico(name) renders the Lucide icon
# mapped to that name; legacy ICONS paths stay only as a fallback for names without a mapping.
import json, html as _html
LU = json.loads((HERE / 'assets/lucide-icons.json').read_text())
def lucide_inner(lucide):
    return ''.join('<%s %s/>' % (tag, ' '.join(f'{k}="{_html.escape(v)}"' for k, v in attrs.items())) for tag, attrs in LU['icons'][lucide])
LUCIDE_SVG = {name: lucide_inner(lucide) for name, lucide in LU['map'].items()}
# Rail 个人 uses a closed silhouette (Lucide's are open arcs), so the selected state can fill solid.
# 扩展 (grid) as four separate rounded blocks, one lifted out, so it reads the same outlined and filled.
LUCIDE_SVG['grid'] = '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><rect x="14" y="2" width="7" height="7" rx="1.5" transform="rotate(12 17.5 5.5)"/>'
LUCIDE_SVG['personal'] = '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0z"/>'
ICON_OPEN = '<svg class="icon lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
jsrep('const ico=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]||ICONS.grid}"/></svg>`;',
      '/* Lucide icons · ' + LU['source'] + ' */\nconst LUCIDE_SVG=' + json.dumps(LUCIDE_SVG, ensure_ascii=False) + ';\n'
      'const ico=n=>`' + ICON_OPEN + '${LUCIDE_SVG[n]||(ICONS[n]?`<path d="${ICONS[n]}"/>`:LUCIDE_SVG.grid)}</svg>`;')
# Meaningful icons per concept (the legacy set reused one glyph for several ideas).
for typ, name in [('Agent', 'agent'), ('MCP 工具', 'mcp'), ('CLI 工具', 'terminal'), ('条件', 'condition'), ('人工确认', 'approve')]:
    js = re.sub(r"(type:'%s',[^{}]*?icon:)'\w+'" % re.escape(typ), r"\1'%s'" % name, js)
jsrep("const icons={'输入':'file','触发':'clock','Agent':'team','Skill':'spark','MCP 工具':'link','CLI 工具':'code','条件':'workflow','人工确认':'shield','输出':'bench'};",
      "const icons={'输入':'file','触发':'clock','Agent':'agent','Skill':'spark','MCP 工具':'mcp','CLI 工具':'terminal','条件':'condition','人工确认':'approve','输出':'bench'};")
js = js.replace("icon:'link'", "icon:'mcp'")  # every asset/node using 'link' is an MCP connection
jsrep("[['输入','file'],['Agent','team'],['Skill','spark'],['MCP 工具','link'],['CLI 工具','code'],['条件','workflow'],['人工确认','shield'],['输出','bench']]",
      "[['输入','file'],['Agent','agent'],['Skill','spark'],['MCP 工具','mcp'],['CLI 工具','terminal'],['条件','condition'],['人工确认','approve'],['输出','bench']]")
# Workflow nodes saved in localStorage keep their old icon names: resolve the icon from the node type at render time.
js = js.replace("ico(n.icon)", "ico(NODE_ICON[n.type]||n.icon)")
jsrep("const ico=n=>", "const NODE_ICON={'输入':'file','触发':'clock','Agent':'agent','Skill':'spark','MCP 工具':'mcp','CLI 工具':'terminal','条件':'condition','人工确认':'approve','输出':'bench'};\nconst ico=n=>")
jsrep("icons={overview:'home',observe:'search',evaluate:'check',improve:'spark',memory:'file'}",
      "icons={overview:'home',observe:'observe',evaluate:'evaluate',improve:'improve',memory:'memory'}")
jsrep('<button data-a="demo-help" title="演示说明">${ico(\'info\')}帮助</button>', '')  # 帮助 entry removed from the rail
jsrep('<svg class="icon as2-updown" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>',
      '${ico(\'updown\').replace(\'class="icon lucide"\',\'class="icon lucide as2-updown"\')}')
# Static app-bar icons in the page body.
for d, name in [('M4 6h16M4 12h16M4 18h16', 'menu'), ('M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'search'),
                ('M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z', 'tour'), ('M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5', 'expand')]:
    old = f'<svg class="icon" viewBox="0 0 24 24"><path d="{d}"/></svg>'
    assert old in body, 'Missing body icon: ' + name
    body = body.replace(old, ICON_OPEN + LUCIDE_SVG[name] + '</svg>')

# Sidebar footers that only hold a "返回…" button are dropped; the rail already switches spaces.
js, n = re.subn(r"<div class=\"sidefoot\"><button data-a=\"(?:return-view|evolution-return)\">\$\{ico\('back'\)\}[^<]*</button></div>", '', js)
assert n == 3, f'expected 3 back footers, got {n}'

jsrep('<button role="tab" id="evo-tab-${id}"', '<button role="tab" class="${e.tab===id?\'active\':\'\'}" id="evo-tab-${id}"')
# ---- 构建 / 扩展 / 进化 are full pages: no sidebar panel; their navigation lives in the page.
jsrep('<aside class="demoside">${renderSide()}</aside>',
      '<aside class="demoside">${FULL_PAGE_VIEWS.includes(s.view)?\'\':renderSide()}</aside>')
jsrep("function renderSide(){", "const FULL_PAGE_VIEWS=['studio','extensions','evolution'];\nfunction renderSide(){")
# 扩展: installed / catalog become page tabs (scope and source are already explained on the page).
jsrep("${tag('唯一导入来源','green')}</div>${s.extensionPage==='catalog'?renderAgentCenterCatalog():renderInstalledExtensions()}",
      "${tag('唯一导入来源','green')}</div><nav class=\"dtabs ext-page-tabs\" aria-label=\"扩展\"><button class=\"${s.extensionPage!=='catalog'?'active':''}\" data-a=\"extensions\" data-v=\"installed\">已安装扩展<span class=\"as-num\">${s.installations.length}</span></button><button class=\"${s.extensionPage==='catalog'?'active':''}\" data-a=\"extensions\" data-v=\"catalog\">从 AgentCenter 导入</button></nav>${s.extensionPage==='catalog'?renderAgentCenterCatalog():renderInstalledExtensions()}")
# 扩展 has no breadcrumb bar: the page title and tabs already say where you are.
jsrep("function renderExtensions(){return `<div class=\"democrumb\"><b>扩展</b>${ico('chevron')}<span>${s.extensionPage==='catalog'?'从 AgentCenter 导入':'已安装扩展'}</span><span class=\"spacer\"></span><span>按安装范围可见</span></div>",
      "function renderExtensions(){return `")
# 扩展 page title is the space name; the slogan moves into the description.
jsrep("<h1>${s.extensionPage==='catalog'?'从 AgentCenter，为工作装上好工具':'让 Agent，用上顺手的工具'}</h1><p>安装 MCP、CLI 与 Skill，选择全局或项目生效。构建 Workflow 时直接引用已安装的能力。</p>",
      "<h1>扩展</h1><p>让 Agent，用上顺手的工具。安装 MCP、CLI 与 Skill，选择全局或项目生效，构建 Workflow 时直接引用已安装的能力。</p>")
# 扩展 cards become compact rows (Kobra / connector-list style): icon · name + type · one-line description · meta,
# with a switch and a ··· menu (installed) or a + button (catalog). The row itself opens details / import.
jsrep("""<div class="extension-grid">${rows.map(i=>{const a=asset(i.assetId);return `<article class="extension-card"><div class="row between"><span class="ext-icon ${a.type.toLowerCase()}">${ico(a.icon)}</span><div class="row">${extensionTypeTag(a.type)}${tag(i.enabled?'已启用':'已停用',i.enabled?'green':'gray')}</div></div><h3>${esc(a.name)}</h3><p>${a.desc}</p><div class="ext-meta"><span>${ico('shield')} AgentCenter</span><span>v${i.version}</span></div><div class="ext-scope"><span>${ico(i.scope==='global'?'personal':'team')}${i.scope==='global'?'全局生效':esc(i.project)+' 项目'}</span><span class="tiny muted">${i.installedAt}</span></div><div class="ext-card-foot">${btn('详情与配置','ext-detail',i.id,'sm')}<span class="spacer"></span><button class="ext-text-action" data-a="ext-toggle" data-v="${i.id}">${i.enabled?'停用':'启用'}</button><button class="ext-text-action" data-a="ext-remove" data-v="${i.id}">移除</button></div></article>`;}).join('')}</div>""",
      """<div class="extension-grid ext-list">${rows.map(i=>{const a=asset(i.assetId);return `<article class="extension-card ext-item ${i.enabled?'':'is-off'}" data-a="ext-detail" data-v="${i.id}" tabindex="0" aria-label="${esc(a.name)} · 详情与配置"><span class="ext-icon ${a.type.toLowerCase()}">${ico(a.icon)}</span><div class="ext-item-main"><div class="ext-item-title"><b>${esc(a.name)}</b>${extensionTypeTag(a.type)}${i.enabled?'':tag('已停用','gray')}</div><p title="${esc(a.desc)}">${a.desc}</p><div class="ext-item-meta"><span>${ico(i.scope==='global'?'personal':'team')}${i.scope==='global'?'全局生效':esc(i.project)+' 项目'}</span><span class="as-num">v${i.version}</span><span>${ico('shield')}AgentCenter</span></div></div><div class="ext-item-actions"><button class="as2-switch" role="switch" aria-checked="${i.enabled}" aria-label="${i.enabled?'停用':'启用'} ${esc(a.name)}" title="${i.enabled?'已启用 · 点击停用':'已停用 · 点击启用'}" data-a="ext-toggle" data-v="${i.id}"><i></i></button><button class="iconbtn ext-more" data-a="ext-menu" data-v="${i.id}" aria-label="更多操作" title="更多操作" aria-haspopup="menu" aria-expanded="false">${ico('more')}</button></div></article>`;}).join('')}</div>""")
jsrep("""<div class="extension-grid">${rows.map(a=>`<article class="extension-card catalog-card"><div class="row between"><span class="ext-icon ${a.type.toLowerCase()}">${ico(a.icon)}</span>${extensionTypeTag(a.type)}</div><h3>${esc(a.name)}</h3><small class="muted">${a.publisher}</small><p>${a.desc}</p><div class="ext-meta"><span>${ico('shield')} AgentCenter</span><span>v${a.versions[0]}</span></div><div class="ext-card-foot">${btn('选择并导入','ext-select',a.id,'primary sm')}<span class="spacer"></span><small class="muted">可选全局 / 项目</small></div></article>`).join('')}</div>""",
      """<div class="extension-grid ext-list">${rows.map(a=>`<article class="extension-card catalog-card ext-item" data-a="ext-select" data-v="${a.id}" tabindex="0" aria-label="${esc(a.name)} · 选择并导入"><span class="ext-icon ${a.type.toLowerCase()}">${ico(a.icon)}</span><div class="ext-item-main"><div class="ext-item-title"><b>${esc(a.name)}</b>${extensionTypeTag(a.type)}</div><p title="${esc(a.desc)}">${a.desc}</p><div class="ext-item-meta"><span>${esc(a.publisher)}</span><span class="as-num">v${a.versions[0]}</span><span>可选全局 / 项目</span></div></div><div class="ext-item-actions"><button class="iconbtn ext-add" data-a="ext-select" data-v="${a.id}" aria-label="导入 ${esc(a.name)}" title="选择并导入">${ico('plus')}</button></div></article>`).join('')}</div>""")
# 扩展 explanations collapse into ⓘ hints instead of a banner and a note block.
jsrep("""<h1>扩展</h1>""", """<h1>扩展${as2Hint('扩展统一从 <b>AgentCenter</b>（内部 AI 能力平台）导入，这是唯一导入来源；保留资产来源、版本和安装范围。','关于扩展来源')}</h1>""")
jsrep("""<div class="ext-source-banner"><span class="ac-mark large">A</span><div class="grow"><b>AgentCenter · 内部 AI 能力平台</b><p>扩展统一从 AgentCenter 导入，保留资产来源、版本和安装范围。</p></div>${tag('唯一导入来源','green')}</div>""", "")
jsrep("""<div class="tiny muted ext-count">${s.installations.filter(extensionMatches).length} 项安装 · 同一资产可分别安装到全局和不同项目</div>""",
      """<div class="ext-count-row"><span class="tiny muted ext-count">${s.installations.filter(extensionMatches).length} 项安装</span>${as2Hint('同一资产可分别安装到全局和不同项目。<br>已启用的项目版本优先于全局版本；项目未安装或停用时，使用可用的全局版本。<br>安装范围决定可用位置，实际调用仍按授权执行。','关于安装范围')}</div>""")
jsrep("""<div class="note ext-scope-note">${ico('info')} 已启用的项目版本优先于全局版本；项目未安装或停用时，使用可用的全局版本。安装范围决定可用位置，实际调用仍按授权执行。</div>""", "")
js = js.replace("+' 项安装 · 同一资产可分别安装到全局和不同项目'", "+' 项安装'")
jsrep("""<div class="tiny muted ext-count">AgentCenter 资产样例 · 用于交互演示，真实资产、版本与权限以平台为准</div>""",
      """<div class="ext-count-row"><span class="tiny muted ext-count">${filteredCatalog().length} 个 AgentCenter 资产</span>${as2Hint('当前为资产样例，用于交互演示；真实资产、版本与权限以 AgentCenter 平台为准。','关于资产数据')}</div>""")
# 进化中心 has no breadcrumb bar either; its visibility moves into a hint next to the title (the scope select stays).
jsrep("""return `<div class="democrumb"><b>进化中心</b>${ico('chevron')}<span>${esc(scopeLabel)}</span><span class="spacer"></span><span>${personal?'个人私有 · 本人管理':e.scope==='all'?'按个人与项目范围隔离':'项目共享 · 成员协作'}</span></div><div class="demopage evolution-page"><header class="evo-page-head"><div><h1>进化中心</h1>""",
      """return `<div class="demopage evolution-page"><header class="evo-page-head"><div><h1>进化中心${as2Hint(`当前范围：<b>${esc(scopeLabel)}</b> · ${personal?'个人私有，仅本人管理':e.scope==='all'?'按个人与项目范围隔离':'项目共享，成员协作'}。改进生效前都需要确认。`,'关于可见范围')}</h1>""")
# 新建工作台 composer: files and extensions live in the + menu; only 选择项目 stays below the box; no mode line.
jsrep("""<div class="wc-compose-mode">使用 <span>${ico('bench')}AgentSpace</span> 创建工作台</div>""", "")
jsrep("""<button class="${e.popover==='files'?'active':''}" data-a="wb2-files">${ico('file')}文件${e.files.length?`<span>${e.files.length}</span>`:''}</button><button class="${e.popover==='extensions'?'active':''}" data-a="wb2-picker" data-v="extensions">${ico('grid')}扩展${e.extensionIds.length?`<span>${e.extensionIds.length}</span>`:''}</button>""", "")
jsrep("""<div class="wc-quick-menu"><button data-a="wb2-picker" data-v="project">${ico('team')}选择项目</button><button data-a="wb2-upload">${ico('file')}添加文件</button><button data-a="wb2-picker" data-v="extensions">${ico('grid')}引用扩展</button></div>""",
      """<div class="wc-quick-menu"><button data-a="wb2-upload">${ico('file')}添加文件${e.files.length?`<span class="wc-quick-count">${e.files.length}</span>`:''}</button><button data-a="wb2-picker" data-v="extensions">${ico('grid')}引用扩展${e.extensionIds.length?`<span class="wc-quick-count">${e.extensionIds.length}</span>`:''}</button></div>""")
# 消息: the new-message button uses the "new" (+) icon.
jsrep('<button class="ms-compose-new" data-a="ms-new" title="新建消息" aria-label="新建消息">${ico(\'edit\')}</button>',
      '<button class="ms-compose-new" data-a="ms-new" title="新建消息" aria-label="新建消息">${ico(\'plus\')}</button>')
# 构建: recent flows and import move into the editor header.
jsrep("function renderEditor(){", """function recentWorkflowSelect(){const records=[...s.workflowDrafts].reverse().slice(0,4),labels=new Set(records.map(r=>r.label));const opts=records.map(r=>[`workflow-open-draft|${r.id}`,r.label,s.currentWorkflowId===r.id]).concat(['质量日报生成','SpecX · 需求到交付'].filter(l=>!labels.has(l)).map(l=>[`studio|${l}`,l,!s.currentWorkflowId&&s.wfLabel===l]));return `<label class="build-context">最近流程<select aria-label="打开最近的流程" onchange="const [a,v]=this.value.split('|');action(a,v)">${opts.some(o=>o[2])?'':`<option selected disabled>${esc(s.wfLabel)}</option>`}${opts.map(([v,l,on])=>`<option value="${esc(v)}" ${on?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;}
function renderEditor(){""")
jsrep('<div class="row wf-header-actions"><label class="build-context">使用范围',
      '<div class="row wf-header-actions">${recentWorkflowSelect()}${btn(ico(\'file\')+\'导入已有 Workflow\',\'workflow-import\',\'\',\'sm\')}<label class="build-context">使用范围')

# ---- Messages: actions appear in a hover toolbar at the message's top-right instead of under every message.
COPY_BTN = '<button data-a="message-copy" title="复制" aria-label="复制">${ico(\'copy\')}</button>'
jsrep('{actions:`<div class="co-message-actions"><button data-a="co-message-thread" data-v="${m.sourceIndex}">${ico(\'chat\')} 回复到 Thread</button></div>`}',
      '{actions:`<div class="ms-message-actions co-hover-actions" role="toolbar" aria-label="消息操作"><button data-a="co-message-thread" data-v="${m.sourceIndex}" title="回复到 Thread" aria-label="回复到 Thread">${ico(\'chat\')}</button>' + COPY_BTN + '</div>`}')
js, n = re.subn(r'<button data-a="ms-message-menu"', COPY_BTN + '<button data-a="ms-message-menu"', js)
assert n == 2, f'expected 2 message menus, got {n}'

# ---- Global search becomes a compact command palette: no dialog header, one-line rows, keyboard hints.
jsrep("""function openGlobalSearch(){modal('找到你的工作',`<input id="globalQuery" class="globalsearchinput" placeholder="搜索工作台、任务或项目…" aria-label="搜索工作台任务项目"><div id="globalResults" style="margin-top:16px">${searchResults('')}</div>`);setTimeout(()=>$('#globalQuery')?.focus(),50);}""",
      """function openGlobalSearch(){modal('找到你的工作',`<div class="palette-search">${ico('search')}<input id="globalQuery" class="globalsearchinput" placeholder="搜索工作台、任务或项目…" aria-label="搜索工作台、任务或项目" autocomplete="off"></div><div class="palette-meta"><span>全部结果</span><span class="palette-keys"><kbd>↑</kbd><kbd>↓</kbd>选择<kbd>Enter</kbd>打开<b id="paletteCount"></b></span></div><div id="globalResults" class="palette-results" role="listbox">${searchResults('')}</div>`);$('#modalHost .modal')?.classList.add('as2-palette');paletteSync();setTimeout(()=>$('#globalQuery')?.focus(),50);}""")
js, n = re.subn(r"function searchResults\(query\)\{.*?\}\n", lambda m: r"""function searchResults(query){const q=query.trim().toLowerCase();const benches=s.benches.filter(b=>!b.archived&&(b.title+b.range).toLowerCase().includes(q));const tasks=s.tasks.filter(t=>(t.title+t.id+t.scope).toLowerCase().includes(q)).slice(0,6);const projects=projectNames.filter(n=>n.toLowerCase().includes(q));const row=(a,v,icon,title,meta,end='')=>`<button class="searchresult palette-row" role="option" data-a="${a}" data-v="${esc(v)}">${ico(icon)}<span class="palette-title">${esc(title)}</span><span class="palette-sub">${esc(meta)}</span><span class="palette-end">${end}</span></button>`;const group=(label,rows)=>rows.length?`<div class="palette-label">${label}</div>${rows.join('')}`:'';const html=group('工作台',benches.map(b=>row('open-bench',b.id,'bench',b.title,b.range)))+group('任务',tasks.map(t=>row('open-task',t.id,'task',t.title,t.id+' · '+t.scope,taskChip(t))))+group('项目',projects.map(n=>row('search-project',n,'team',n,'项目')));return html||'<p class="palette-empty">没有匹配的工作台、任务或项目</p>';}
""", js, count=1, flags=re.S)
assert n == 1, 'searchResults anchor'
jsrep("document.addEventListener('input',e=>{if(e.target.id==='globalQuery')$('#globalResults').innerHTML=searchResults(e.target.value);});",
      "document.addEventListener('input',e=>{if(e.target.id==='globalQuery'){$('#globalResults').innerHTML=searchResults(e.target.value);paletteSync();}});")

# Team sidebar footer: the cloud-environment status line is removed.
jsrep('<div style="margin-top:10px">${ico(\'cloud\')} 云端执行环境 <span style="color:var(--success)">● 就绪</span></div>', '')

# ---- Message actions (Kobra Message): 👍 · 👎 · 复制 | 生成任务. Dislike is local demo state (s.coDislikes).
jsrep("""<div class="co-message-actions"><button class="co-reaction${liked?' active':''}" data-a="co-react" data-v="${esc(rk)}" aria-label="赞同这条消息" aria-pressed="${liked}">${ico('thumb')} ${count||''}</button>${root?`<button data-a="co-generate-task" data-v="${esc(info.key)}">${threadTask(info.kind,info.key)?'查看任务':'生成任务'}</button>`:''}</div>""",
      """<div class="co-message-actions"><button class="co-reaction${liked?' active':''}" data-a="co-react" data-v="${esc(rk)}" aria-label="赞同这条消息" title="赞同" aria-pressed="${liked}">${ico('thumb')}${count?`<span class="as-num">${count}</span>`:''}</button><button class="co-reaction co-dislike${(s.coDislikes||{})[rk]?' active':''}" data-a="co-dislike" data-v="${esc(rk)}" aria-label="不认同这条消息" title="不认同" aria-pressed="${!!(s.coDislikes||{})[rk]}">${ico('thumbDown')}</button><button class="co-reaction" data-a="message-copy" aria-label="复制消息" title="复制">${ico('copy')}</button>${root?`<i class="co-actions-sep" aria-hidden="true"></i><button class="co-action-text" data-a="co-generate-task" data-v="${esc(info.key)}">${threadTask(info.kind,info.key)?'查看任务':'生成任务'}</button>`:''}</div>""")

# Rail 项目 uses a project-folder icon (people stay for members / team contexts).
jsrep('data-v="team" title="项目视图">${ico(\'team\')}', 'data-v="team" title="项目视图">${ico(\'project\')}')

# 运行看板 uses the card fields of the task-board spec (as2-board.js).
js, n = re.subn(r"function renderKanban\(ts\)\{", "function renderKanban(ts){return renderKanbanBoard(ts);", js, count=1)
assert n == 1, 'renderKanban anchor'

# 任务详情 opens as a full page (as2-taskpage.js) instead of a dialog.
jsrep("function openTask(id){", "function openTask(id){if(taskPageOpen(id))return;")
jsrep('<div class="demoarea">${s.view===\'studio\'?', '<div class="demoarea">${newTaskDraft()?renderNewTaskPage():taskPageTask()?renderTaskPage():s.view===\'studio\'?')
jsrep("document.body.dataset.page=s.page;", "document.body.dataset.page=s.page;document.body.toggleAttribute('data-taskdetail',!!taskPageTask());document.body.toggleAttribute('data-newtask',!!newTaskDraft());")

# 任务看板: board / list switch as an icon segmented control.
jsrep("${btn(f.layout==='list'?'切换看板':'切换列表','board-layout','','sm')}",
      "<div class=\"tk-layout-tabs\" role=\"tablist\" aria-label=\"视图\"><button role=\"tab\" aria-selected=\"${f.layout!=='list'}\" data-a=\"board-layout-set\" data-v=\"board\" aria-label=\"看板视图\" title=\"看板\">${ico('kanban')}</button><button role=\"tab\" aria-selected=\"${f.layout==='list'}\" data-a=\"board-layout-set\" data-v=\"list\" aria-label=\"列表视图\" title=\"列表\">${ico('list')}</button></div>")

# 定时 / 事件 / 协作任务 cards use the compact automation-card layout (as2-board.js).
js, n = re.subn(r"function renderAutomationList\(kind\)\{", "function renderAutomationList(kind){return renderAutomationCards(kind);", js, count=1)
assert n == 1, 'renderAutomationList anchor'
jsrep('${tasks.length?`<div class="collaboration-task-grid">${tasks.map(t=>{', '${tasks.length?`<div class="collaboration-task-grid ac-grid">${tasks.map(t=>{return collaborationCard(t);')

# ---- 个人知识库：原「我的空间」改名；详情页去掉外层卡片，头部 / 页签 / 资料列表与其他页面同一版式。
jsrep("sideButton('file','我的空间','spaces',s.page==='spaces')", "sideButton('book','个人知识库','spaces',s.page==='spaces')")
jsrep("crumb('我的空间')", "crumb('个人知识库')")
jsrep("<h1>给知识一个可以持续积累的地方</h1><p>收录资料、记录思考，在空间内提问；把需要的知识带进个人任务。</p></div>${btn(ico('plus')+'新建空间','space-create','','primary')}",
      "<h1>个人知识库</h1><p>收录资料、记录思考，在知识库内提问；把需要的知识带进个人任务。</p></div>${btn(ico('plus')+'新建知识库','space-create','','primary')}")
jsrep("<span class=\"space-symbol\">${ico('file')}</span>", "<span class=\"space-symbol\">${ico('book')}</span>")
jsrep("btn('打开空间 '+ico('arrow'),'space-open',sp.id,'sm')", "btn('打开 '+ico('arrow'),'space-open',sp.id,'sm')")
jsrep("工作台呈现工作结果；空间保存可反复使用的知识与上下文。个人空间中的内容按你的选择进入任务。", "工作台呈现工作结果；知识库保存可反复使用的知识与上下文，内容按你的选择进入任务。")
jsrep("btn(ico('back')+'全部空间','space-list','','link sm')}<div class=\"kicker\" style=\"margin-top:9px\">${project?'PROJECT SPACE':'PERSONAL SPACE'}</div>",
      "btn(ico('back')+'个人知识库','space-list','','link sm')}<div class=\"kicker\">${project?'PROJECT SPACE':'PERSONAL KNOWLEDGE'}</div>")
jsrep("${btn('空间内提问','space-tab','chat')}", "${btn(project?'空间内提问':'在知识库中提问','space-tab','chat')}")
jsrep("[['materials','资料'],['chat','空间问答'],['usage','使用记录'],['settings','空间设置']]", "[['materials','资料'],['chat',project?'空间问答':'知识库问答'],['usage','使用记录'],['settings',project?'空间设置':'知识库设置']]")
jsrep("资料可作为任务输入；产物经选择后也可沉淀到空间。", "资料可作为任务输入；产物经选择后也可沉淀到${project?'空间':'知识库'}。")
jsrep("<p>${esc(sp.description)} · ${project?'项目成员共享':'仅自己可见'}", "<p>${esc(String(sp.description||'').replace(/[。.]$/,''))} · ${project?'项目成员共享':'仅自己可见'}")
jsrep("每个空间有独立资料、指引与问答，创建任务时可选择具体知识范围。", "每个知识库有独立资料、指引与问答，创建任务时可选择具体知识范围。")

# ---- 工作台卡片 hover 工具栏：管理（更多）· 继续修改 · 打开工作台（主操作在最右）。
jsrep("""<div class="benchfoot">${btn('打开工作台 '+ico('arrow'),'open-bench',b.id,'sm openbench')}<div class="wbh-workbench-foot">${btn('继续修改','wbh-continue',b.id,'link sm')}<button class="tiny muted" data-a="bench-manage" data-v="${b.id}">管理 ···</button></div></div>""",
      """<div class="benchfoot">${btn(ico('edit')+'继续修改','wbh-continue',b.id,'sm bf-edit')}${btn('打开工作台'+ico('arrow'),'open-bench',b.id,'primary sm openbench')}</div>""")

# ---- 我的任务：去掉「跨项目汇总，同步每一次进展」说明卡。
jsrep("${personal?`<div class=\"aggregate-scope-note\">${ico('team')}<div><b>跨项目汇总，同步每一次进展</b><span>与项目看板共用任务、规则与产物；点击项目名称可回到对应项目。</span></div><span class=\"aggregate-scope-count\">${joinedProjects().length} 个已参与项目</span></div>`:''}", "")

# ---- 新建工作台：项目选择放进输入框下方的托盘（文件夹图标 + 下拉箭头），去掉自动匹配提示。
jsrep("""data-v="project">${ico('team')}${e.project==='global'?'选择项目':esc(e.project)}</button><span class="wc-auto-hint">按目标匹配已安装扩展</span></div>""",
      """data-v="project">${ico('project')}${e.project==='global'?'选择项目':esc(e.project)}${ico('down')}</button></div>""")

# ---- 项目 · 频道 / 线程聚合页：新建用文字按钮；卡片统一为「图标块 + 标题 · 两行说明 · 虚线 · 统计」，整卡可点，hover 出现进入箭头。
jsrep("btn(ico('plus')+'新建频道','project-channel-new','','primary sm')", "btn(ico('plus')+'新建频道','project-channel-new','','link sm')")
jsrep("btn(ico('plus')+'新建线程','new-thread','','primary sm')", "btn(ico('plus')+'新建线程','new-thread','','link sm')")
jsrep("""return `<article class="project-channel-card"><span class="project-channel-icon ${c.tone||'blue'}">#</span><div class="grow"><button data-a="channel" data-v="${esc(c.id)}"><h3># ${esc(c.name)}</h3></button><p>${esc(c.description)}</p><div class="project-channel-stats"><span>${th.length} 个线程</span><span>${tasks.length} 项协作任务</span></div></div>${btn('进入频道 '+ico('arrow'),'channel',c.id,'sm')}</article>`;""",
      """return `<article class="project-channel-card pc-card" data-a="channel" data-v="${esc(c.id)}"><div class="pc-top"><span class="pc-tile">#</span><button class="pc-title" data-a="channel" data-v="${esc(c.id)}"><b>${esc(c.name)}</b><small>${th.length?'最新：'+esc(th[th.length-1].title):'暂无线程'}</small></button><span class="pc-go" aria-hidden="true">${ico('arrow')}</span></div><p class="pc-desc">${esc(c.description)}</p><div class="pc-foot"><span>${ico('chat')}<b>${th.length}</b> 个线程</span><span>${ico('task')}<b>${tasks.length}</b> 项协作任务</span></div></article>`;""")
jsrep("""`<article class="project-thread-row"><span class="thread-directory-icon">${ico('chat')}</span><div class="grow"><button class="project-thread-title" data-a="project-thread-open" data-v="${esc(th.key)}">${esc(th.title)}</button><p>${esc(th.text)}</p><div class="project-thread-meta"><span># ${esc(th.channel)}</span><span>${esc(th.createdBy)} 发起</span>${th.tasks.length?`<span>${th.tasks.length} 项协作任务</span>${th.tasks.map(taskChip).join('')}`:tag('讨论中','gray')}</div></div>${btn('打开线程','project-thread-open',th.key,'sm')}</article>`""",
      """`<article class="project-thread-row pc-card pt-card" data-a="project-thread-open" data-v="${esc(th.key)}"><div class="pt-top"><span class="pt-chan"># ${esc(th.channel)}</span><span class="spacer"></span>${th.tasks.length?th.tasks.map(taskChip).join(''):tag('讨论中','gray')}</div><button class="pt-title" data-a="project-thread-open" data-v="${esc(th.key)}">${esc(th.title)}</button><p class="pc-desc">${esc(th.text)}</p><div class="pc-foot"><span class="pt-who"><span class="pt-ava">${esc(String(th.createdBy||'?')[0])}</span>${esc(th.createdBy)} 发起</span>${th.tasks.length?`<span>${ico('task')}<b>${th.tasks.length}</b> 项协作任务</span>`:''}<span class="pc-open">打开线程${ico('arrow')}</span></div></article>`""")
jsrep('<div class="card project-thread-list" id="projectThreadResults">', '<div class="project-thread-list pt-grid" id="projectThreadResults">')

# ---- 频道头部：副标题改为频道用途（人数已由右侧「成员」按钮表达）。
jsrep("<p>${esc(s.project)} · ${coMemberRoster().filter(p=>p.type==='person').length} 位人员 · ${projectAgentList().length} 个 Agent</p>",
      "<p>${esc(s.project)} · ${esc(projectChannels().find(c=>c.id===s.channel)?.description||'项目协作讨论')}</p>")

# ---- 「项目空间」统一改名「项目知识库」（与个人知识库对应）；项目详情页的提问 / 问答 / 设置文案随之统一。
for old, new in [("project?'空间内提问':'在知识库中提问'", "'在知识库中提问'"), ("project?'空间问答':'知识库问答'", "'知识库问答'"),
                 ("project?'空间设置':'知识库设置'", "'知识库设置'"), ("${project?'空间':'知识库'}", "知识库"), ("'PROJECT SPACE'", "'PROJECT KNOWLEDGE'")]:
    jsrep(old, new)
js = js.replace('项目空间', '项目知识库')

# ---- 项目侧栏：「频道」分组标题去掉 # 前缀。
jsrep('<div class="sidelabel row hub-channel-heading">＃ 频道 ', '<div class="sidelabel row hub-channel-heading">频道 ')

# ---- 项目主页头部：去掉「打开项目讨论」（侧栏已有频道入口）。
assert "${btn('打开项目讨论','channel','development')}" in js
js = js.replace("${btn('打开项目讨论','channel','development')}", "")

# ---- 任务看板筛选：去掉每个筛选框上方的文字标签（选项与占位文案已说明含义；aria-label 保留）。
_i = js.index('function boardFilters(){'); _j = js.index('\nfunction ', _i + 10)
_seg, _n = re.subn(r'<label([^>]*)>[^<$`]+(<select|<input)', r'<label\1>\2', js[_i:_j])
assert _n >= 4, 'boardFilters labels'
js = js[:_i] + _seg + js[_j:]

# ---- 频道消息流：去掉顶部「项目讨论」分隔线。
jsrep("""return '<div class="co-divider">项目讨论</div>'+hubChannelMessages(project,channel)""", "return hubChannelMessages(project,channel)")

# ---- 新建临时任务：改为全局沉浸式页面（as2-newtask.js）。
jsrep("function newManualProjectTask(){", "function newManualProjectTask(){if(newTaskOpen())return;")

# ---- 个人助理：空会话时与「新建任务」同一版式（标题 → 带插画的输入框 → 示例卡片）。
jsrep('<div class="composer"><textarea id="assistantInput"', '<div class="composer"><img class="nt-hero as-hero" src="${newTaskHero()}" alt="" aria-hidden="true"><textarea id="assistantInput"')

# ---- 外观设置：主题按风格归类（极简 / 液态玻璃 / 像素），每种风格再选颜色；像素风格的强调色可换。

# ---- 频道 @Agent：不再自动开 Thread，改为 Agent 在频道里直接回复任务卡（as2-mention.js）；消息中的 @ 高亮。
jsrep("if(/@(?:CodeAgent|QA Agent|OfficeACE)/i.test(text)){const key='topic-'+Date.now()+'-'+s.channelMessageSeq;s.customThreads=s.customThreads||{};s.customThreads[key]={project,channel,title:text.slice(0,36),text,mode:'temp',createdBy:'我',time:m.time};m.threadKey=key;}",
      "const _agent=channelMentionAgent(text);if(_agent)m.mention=_agent;")
jsrep("s.channelMessages.push(m);const ch=projectChannels(project).find(c=>c.id===channel);", "s.channelMessages.push(m);if(m.mention)channelAgentReply(m);const ch=projectChannels(project).find(c=>c.id===channel);")
jsrep("replyTo:m.replyTo,sourceIndex:index,threadKey:m.threadKey,", "replyTo:m.replyTo,sourceIndex:index,threadKey:m.threadKey,agentCard:m.agentCard,name:m.name,")
jsrep("if(m.threadKey)return coRootMessage({...coThreadInfo(m.threadKey,m.threadKind,project),replyTo:m.replyTo});", "if(m.threadKey)return coRootMessage({...coThreadInfo(m.threadKey,m.threadKind,project),replyTo:m.replyTo});if(m.agentCard)return channelAgentCard(m);")
jsrep('<div class="co-message-text">${esc(info.text)}</div>', '<div class="co-message-text">${coMentionHtml(info.text)}</div>')
jsrep('placeholder="发送到频道，或 @CodeAgent 发起新话题…"', 'placeholder="发送到频道，输入 @ 把事情交给 Agent…"')

# ---- 频道消息排序：本次会话里新发的消息（带 sentAt）始终排在示例消息之后，不受当前钟点影响。
jsrep("hour12:false}),day:'今天'};", "hour12:false}),day:'今天',sentAt:Date.now()};")
jsrep("agentCard:m.agentCard,name:m.name,", "agentCard:m.agentCard,name:m.name,sentAt:m.sentAt,")
jsrep("const clock=m=>{const x=/^(\\d{1,2}):(\\d{2})$/.exec(m.time||'');return x?Number(x[1])*60+Number(x[2]):2000;};",
      "const clock=m=>{if(m.sentAt)return 3000+(m.sentAt-1.7e12)/1e9;const x=/^(\\d{1,2}):(\\d{2})$/.exec(m.time||'');return x?Number(x[1])*60+Number(x[2]):2000;};")

# ---- Workflow 编辑器：节点库 / 画布改由 as2-wfeditor.js 渲染（横向流程 + 真实拖动 + 面板调宽）。
js, n1 = re.subn(r'<aside class="nodepalette">.*?</aside>', lambda m: '<aside class="nodepalette">${wfPaletteHtml()}</aside>', js, count=1, flags=re.S)
js, n2 = re.subn(r'<div class="wfcanvas" id="wfCanvas">.*?</div></div></div><aside class="nodeconfig">', lambda m: '<div class="wfcanvas" id="wfCanvas">${wfCanvasHtml()}</div><aside class="nodeconfig">', js, count=1, flags=re.S)
assert n1 == 1 and n2 == 1, ('workflow editor anchors', n1, n2)

# ---- Workflow 编辑器：单行精简页头（返回 · 流程切换 · 状态 | 范围 · 保存 · 调试 · 发布 · 更多），去掉底栏。
js, h1 = re.subn(r'<div class="wfedithead">.*?</div></div>\$\{workflowOriginBanner\(\)\}', lambda m: '${wfHeaderHtml()}${workflowOriginBanner()}', js, count=1, flags=re.S)
js, h2 = re.subn(r'<div class="wfeditfoot">.*?</div></div>', lambda m: '</div>', js, count=1, flags=re.S)
assert h1 == 1 and h2 == 1, ('wf header/footer anchors', h1, h2)

# ---- 频道「关联任务」「产物」：按真实业务汇总（as2-channel.js）。
js, c1 = re.subn(r"if\(s\.channelTab==='tasks'\)content=all\.length\?taskTable\(all\):'<div class=\"empty\">本频道暂无关联任务。在 Thread 中 @Agent 或启动 Workflow 即可创建。</div>';\s*else if\(s\.channelTab==='artifacts'\)content=.*?'<div class=\"empty\">执行后的产物会回到这里。</div>'\);",
    lambda m: "if(s.channelTab==='tasks')content=channelTasksView();  else if(s.channelTab==='artifacts')content=channelArtifactsView();", js, count=1, flags=re.S)
assert c1 == 1, 'channel tabs content anchor'
jsrep("${v==='threads'?`<span class=\"co-tab-count\">${threads.length}</span>`:''}", "${channelTabCount(v,threads)}")

# ---- 频道产物详情：沉浸式（隐藏频道头与消息输入，预览占满右侧，底部 AI 输入框）。
jsrep('class="channelwrap colink-channel${', 'class="channelwrap colink-channel${channelImmersive()}${')

# Inline micro font sizes (8–10px) are below the AS2 type scale.
js = re.sub(r'font-size:(8|9|10)px', 'font-size:11px', js)

out = head + '<style>\n' + css + '\n</style>' + body + '<script>' + js
from sync_build import sync_build
OUT.write_text(sync_build(out))
print(f'wrote {OUT.name}: {len(out)/1024:.0f} KB (source {len(html)/1024:.0f} KB)')
