"""Check active demo CSS, inline SVG/HTML and JS color data (stdlib only)."""
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
DEMO = HERE.parent
COLOR = re.compile(r'#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(', re.I)
KEYWORD = re.compile(r'(?<![\w-])(?:white|black|transparent|red|green|blue|gray|grey|silver|navy|teal|aqua|lime|yellow|orange|purple|pink|fuchsia|maroon|olive|rebeccapurple)(?![\w-])', re.I)
PALETTE_START = '/* AS2 PALETTE START */'
PALETTE_END = '/* AS2 PALETTE END */'


def strip_comments(text):
    return re.sub(r'/\*.*?\*/', '', text, flags=re.S)


def colors(value):
    # CSS images are registered in the palette, not embedded in component declarations.
    hits = []
    for match in COLOR.finditer(value):
        at = match.start()
        if match[0].startswith('#'):
            hits.append(match[0])
            continue
        end, depth = match.end(), 1
        while end < len(value) and depth:
            if value[end] == '(':
                depth += 1
            elif value[end] == ')':
                depth -= 1
            end += 1
        expression = value[at:end]
        if 'var(' not in expression and 'asColor(' not in expression:
            hits.append(expression)
    hits += KEYWORD.findall(value)
    return hits


def check_css(css, source):
    css = strip_comments(css)
    errors = []
    for match in re.finditer(r'(?:^|[;{}])\s*([\w-]+)\s*:\s*([^;{}]*)(?=[;}])', css):
        prop, value = match.groups()
        for color in colors(value):
            errors.append(f'{source}: {prop}: literal {color}')
        if re.fullmatch(r'\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*', value):
            errors.append(f'{source}: {prop}: literal RGB channels {value}')
        if 'data:image/svg' in value:
            errors.append(f'{source}: {prop}: inline SVG must be registered in palette.css')
    return errors


def check_js(js, source):
    js = strip_comments(js)
    js = re.sub(r'^\s*//.*$', '', js, flags=re.M)
    errors = []
    # Six/eight-digit hex cannot be a demo issue number; three/four-digit hex is checked in visual strings.
    for match in re.finditer(r'#[0-9a-f]{6,8}\b', js, re.I):
        errors.append(f'{source}: literal {match[0]}')
    for match in re.finditer(r'''["'](#[0-9a-f]{3,4}|white|black|transparent)["']''', js, re.I):
        errors.append(f'{source}: literal color data {match[1]}')
    for match in re.finditer(r'''(?:fill|stroke|stop-color|flood-color)=["']([^"']*)["']''', js):
        if colors(match[1]):
            errors.append(f'{source}: literal SVG paint {match[1]}')
    for match in re.finditer(r'\b(?:rgb|hsl)a?\([^`\n;]*', js):
        # Derived channels/opacity are allowed; literal rgb()/hsl() is not.
        prefix = match[0].split(')')[0]
        if 'var(' not in prefix and 'asColor(' not in prefix:
            errors.append(f'{source}: literal color function {prefix[:80]}')
    return errors


def audit():
    html = (DEMO / 'index.html').read_text()
    palette = (HERE / 'design-system/palette.css').read_text()
    runtime = (HERE / 'design-system/color-runtime.js').read_text()
    semantic = (HERE / 'design-system/semantic-colors.css').read_text()
    errors = []
    for start, end, content in [(PALETTE_START, PALETTE_END, palette), ('/* AS2 COLOR RUNTIME START */', '/* AS2 COLOR RUNTIME END */', runtime), ('/* AS2 SEMANTIC COLORS START */', '/* AS2 SEMANTIC COLORS END */', semantic)]:
        match = re.search(re.escape(start) + r'\n(.*?)' + re.escape(end), html, re.S)
        if not match or match[1] != content:
            errors.append(f'index.html: inline {start} differs from source; run sync_build.py')
    css = re.search(r'<style[^>]*>(.*?)</style>', html, re.S)[1]
    css = re.sub(re.escape(PALETTE_START) + r'.*?' + re.escape(PALETTE_END), '', css, flags=re.S)
    errors += check_css(css, 'index.html CSS')
    for js in re.findall(r'<script[^>]*>(.*?)</script>', html, re.S):
        errors += check_js(js, 'index.html JS')
    body = re.sub(r'<(?:script|style)[^>]*>.*?</(?:script|style)>', '', html, flags=re.S)
    for value in re.findall(r'''style=["']([^"']*)["']''', body):
        errors += check_css('x{' + value + '}', 'index.html inline style')
    for value in re.findall(r'''(?:fill|stroke|stop-color)=["']([^"']*)["']''', body):
        if colors(value):
            errors.append('index.html SVG: ' + value)
    for path in sorted([*HERE.glob('*.css'), *HERE.glob('*.js'), *HERE.joinpath('design-system').glob('*.css')]):
        if path.name == 'palette.css':
            continue
        checker = check_css if path.suffix == '.css' else check_js
        errors += checker(path.read_text(), path.name)
    # Typos introduced by accidental replacement inside custom-property names.
    if re.search(r'--[\w-]*var\(', html):
        errors.append('index.html: malformed custom-property name')
    registered = set(re.findall(r'(--[\w-]+)\s*:', palette))
    # A variable reference must not just hide a typo or an unregistered literal.
    for text, source in [(html, 'index.html'), *[(p.read_text(), p.name) for p in HERE.glob('*.css')], *[(p.read_text(), p.name) for p in HERE.glob('*.js')]]:
        refs = set(re.findall(r'''(?:var\(\s*|asColor\(['"])(--as-(?:color|channel|image|render)-[\w-]+)''', text))
        for missing in sorted(refs - registered):
            errors.append(f'{source}: unregistered palette reference {missing}')
    return errors


if __name__ == '__main__':
    errors = audit()
    for error in errors[:80]:
        print(error)
    if errors:
        sys.exit(f'FAIL: {len(errors)} color violations')
    print('PASS: demo + active CSS/JS sources; literal colors only in palette.css; inline sources synchronized')
