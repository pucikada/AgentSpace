"""Inline demo-as2/themes/*.css into index.html as the only theme-token source.

The theme files are authoritative. index.html keeps a generated copy so the
page works from GitHub Pages and from file:// with no extra requests.
"""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
THEMES = ROOT / 'themes'
INDEX = ROOT / 'index.html'
ORDER = [
    'as2-liquid-theme.css',
    'as2-pixel-theme.css',
    'as2-bento-theme.css',
    'minimal-light.css',
    'minimal-dark.css',
    'as2-aurora-theme.css',
    'as2-aurora-violet-theme.css',
    'as2-aurora-cyan-theme.css',
    'as2-aurora-teal-theme.css',
    'as2-aurora-pink-theme.css',
]
START = '/* AS2 THEME FILES START */'
END = '/* AS2 THEME FILES END */'
REDUCED = """@media (prefers-reduced-motion: reduce) {
  :root { --devui-animation-duration-fast: 0ms; --devui-animation-duration-base: 0ms; --devui-animation-duration-slow: 0ms; }
}
/* Preference overrides stay outside the theme sheets and win a specificity tie with :root.dark. */
:root[data-motion="reduce"] { --devui-animation-duration-fast: 0ms; --devui-animation-duration-base: 0ms; --devui-animation-duration-slow: 0ms; }
:root[data-density="compact"] { --devui-btn-height: 28px; --agentspace-header-height: 40px; }
:root[data-rail-labels="off"] { --agentspace-rail-width: 52px; }
"""


def theme_bundle() -> str:
    parts = [START, '/* Generated from demo-as2/themes/. Edit the theme files, then run sync_themes.py. */']
    for name in ORDER:
        parts.append(f'/* ----- themes/{name} ----- */')
        parts.append((THEMES / name).read_text().strip())
    parts.append(REDUCED.strip())
    parts.append(END)
    return '\n'.join(parts) + '\n'


def inline_themes(html: str) -> str:
    html = re.sub(r'\n?' + re.escape(START) + r'.*?' + re.escape(END) + r'\n?', '\n', html, flags=re.S)
    if '</style>' not in html:
        raise SystemExit('index.html has no style block')
    return html.replace('</style>', '\n' + theme_bundle() + '</style>', 1)


def main():
    INDEX.write_text(inline_themes(INDEX.read_text()))
    print('inlined', len(ORDER), 'theme files')


if __name__ == '__main__':
    main()
