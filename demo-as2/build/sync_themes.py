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


def _block(text: str, start: str) -> tuple[str, int, int]:
    i = text.find(start)
    if i < 0:
        raise SystemExit('missing block ' + start[:60])
    j = text.find('{', i)
    depth = 0
    k = j
    while k < len(text):
        c = text[k]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return text[j + 1:k], i, k + 1
        k += 1
    raise SystemExit('unclosed block')


def write_theme_files(html: str) -> None:
    light, _, _ = _block(html, ':root {')
    dark, _, _ = _block(html, ':root.dark, :root[data-theme="dark"] {')
    aurora, _, _ = _block(html, ':root[data-appearance-style="aurora"] {\n  color-scheme: light;')
    light = light.replace('--agentspace-rail-width:     64px;', '--agentspace-rail-width: 72px;')
    light = light.replace('--agentspace-nav1-active-bg: #ffffff;', '--agentspace-nav1-active-bg: var(--rail-tile);')
    light = light.replace('--agentspace-nav2-active-bg: #ffffff;', '--agentspace-nav2-active-bg: #EDEEF1;')
    if '--agentspace-header-height' not in light:
        light = light.rstrip() + '\n  --agentspace-header-height: 48px;\n'
    dark = dark.replace('--agentspace-nav1-active-bg: #19191B;', '--agentspace-nav1-active-bg: var(--rail-tile);')
    dark = dark.replace('--agentspace-nav2-active-bg: #19191B;', '--agentspace-nav2-active-bg: #2A2B30;')
    reduced_note = (
        '/* Preference overrides such as compact density and hidden rail labels stay\n'
        '   outside this file: they are not theme values. */\n'
    )
    (THEMES / 'minimal-light.css').write_text(
        '/* minimal-light.css — appearance "classic". Authoritative :root tokens.\n'
        '   Rail is 72px and the header is 48px: those used to be later :root tweaks. */\n'
        + reduced_note
        + ':root {\n' + light.strip() + '\n}\n'
    )
    (THEMES / 'minimal-dark.css').write_text(
        '/* minimal-dark.css — appearance "dark". Full set, so it does not rely on classic.\n'
        '   Aurora dark also matches :root.dark, then overrides this file. */\n'
        + ':root.dark,\n:root[data-theme="dark"] {\n' + light.strip() + '\n' + dark.strip() + '\n}\n'
    )
    accents = [
        ('as2-aurora-theme.css', '3F6BFF', '#3F6BFF', '极光蓝'),
        ('as2-aurora-violet-theme.css', '7A4DFF', '#7A4DFF', '星云紫'),
        ('as2-aurora-cyan-theme.css', '06B6D4', '#06B6D4', '冰川青'),
        ('as2-aurora-teal-theme.css', '14B8A6', '#14B8A6', '森林绿'),
        ('as2-aurora-pink-theme.css', 'EC4899', '#EC4899', '晚霞粉'),
    ]
    shared = '''
  --agentspace-nav1-active-font-weight: 600;
  --agentspace-nav2-active-font-weight: 600;
  --agentspace-side-head-height: calc(var(--agentspace-header-height) + 4px);
  --agentspace-side-head-offset: 4px;
  --agentspace-shadow-card: none !important;
  --agentspace-shadow-tile: none !important;
  --agentspace-shadow-panel: none !important;
  --agentspace-btn-shadow: none !important;
  --agentspace-aurora-ink: color-mix(in srgb, var(--agentspace-accent) 60%, #0B1020);
'''
    for filename, key, hex_color, label in accents:
        scope = f':root[data-appearance-family="aurora"][data-au-accent="{key}"]'
        base = aurora.replace('--agentspace-accent: #3F6BFF;', f'--agentspace-accent: {hex_color};')
        text = f'''/* {filename} — aurora {label} {hex_color}. Light, mixed and dark are sections.
   Values match the render. Accent-derived colors use --agentspace-accent.
   This file is complete for non-accent tokens; it does not import another theme. */
{scope}:not([data-au-mode="dark"]) {{
  color-scheme: light;
{light.strip()}
{base.strip()}
  --agentspace-accent: {hex_color};
{shared}  --agentspace-nav2-active-bg: rgba(255,255,255,.17);
  --agentspace-aurora-shell-shadow: 0 8px 24px -16px rgba(18,22,34,.2), 0 1px 5px rgba(18,22,34,.06);
}}
{scope}[data-au-mode="light"] {{
  --agentspace-accent: {hex_color};
  --agentspace-menu-bg: rgba(245,247,252,.46);
  --agentspace-page-bg: #FFFFFF;
  --rail-tile: #FFFFFF;
  --rail-ink: var(--devui-text);
  --agentspace-nav1-active-bg: #FFFFFF;
  --agentspace-nav2-active-bg: #FFFFFF;
  --agentspace-aurora-canvas-top: 13%;
  --agentspace-aurora-canvas-right: 12%;
  --agentspace-aurora-canvas-left: 19%;
  --agentspace-aurora-canvas-corner: 17%;
  --agentspace-nav1-hover-bg: rgba(0,0,0,.04);
  --agentspace-nav2-hover-bg: rgba(0,0,0,.04);
}}
{scope}[data-au-mode="mixed"] {{
  --agentspace-accent: {hex_color};
  --agentspace-aurora-mixed-gradient: radial-gradient(ellipse 420px 210px at 18% 0%, color-mix(in srgb, var(--agentspace-accent) 22%, transparent), transparent 76%), radial-gradient(ellipse 280px 160px at 100% 100%, color-mix(in srgb, var(--agentspace-accent) 10%, transparent), transparent 78%), linear-gradient(180deg, rgba(17,20,32,.97), rgba(9,12,21,.98));
  --agentspace-menu-bg: var(--agentspace-aurora-mixed-gradient);
  --agentspace-nav1-active-bg: var(--agentspace-aurora-mixed-gradient);
  --agentspace-nav2-active-bg: rgba(255,255,255,.17);
  --agentspace-aurora-canvas-top: 13%;
  --agentspace-aurora-canvas-right: 12%;
  --agentspace-aurora-canvas-left: 19%;
  --agentspace-aurora-canvas-corner: 17%;
  --agentspace-aurora-shell-shadow: 0 8px 24px -16px rgba(18,22,34,.2), 0 1px 5px rgba(18,22,34,.06);
}}
{scope}[data-au-mode="dark"] {{
  color-scheme: dark;
{dark.strip()}
  --agentspace-accent: {hex_color};
  --agentspace-aurora-gap-right: 8px;
  --agentspace-aurora-gap-bottom: 8px;
  --agentspace-page-bg: #151517;
  --agentspace-aurora-column-bg: #1A1A1D;

  --devui-brand: color-mix(in srgb, var(--agentspace-accent) 76%, #fff);
  --devui-brand-hover: color-mix(in srgb, var(--agentspace-accent) 64%, #fff);
  --devui-primary-bg: color-mix(in srgb, var(--agentspace-accent) 12%, #242427);
  --devui-primary-line: color-mix(in srgb, var(--agentspace-accent) 40%, transparent);
  --agentspace-focus-ring: var(--devui-brand);
  --devui-list-item-active-bg: var(--devui-primary-bg);
  --devui-list-item-active-text: var(--devui-brand);
  --agentspace-run-color: var(--devui-brand);
  --agentspace-run-bg: var(--devui-primary-bg);
  --agentspace-run-line: var(--devui-primary-line);
  --agentspace-neutral-bg: #101012;
  --agentspace-global-bg: #101012;
  --agentspace-stage-bg: #151517;
  --agentspace-panel-bg: #151517;
  --devui-base-bg: #232326;
  --agentspace-sunken-bg: #101012;
  --agentspace-muted-bg: #2B2B2F;
  --devui-text: #F4F4F5;
  --devui-text-weak: #D4D4D8;
  --devui-aide-text: #A1A1AA;
  --agentspace-text-subtle: #92929A;
  --devui-line: rgba(255,255,255,.12);
  --agentspace-border-soft: rgba(255,255,255,.07);
  --agentspace-border-strong: rgba(255,255,255,.24);
  --agentspace-input: #28282B;
  --devui-list-item-hover-bg: rgba(255,255,255,.06);
  --agentspace-nav1-hover-bg: rgba(255,255,255,.06);
  --agentspace-nav2-hover-bg: rgba(255,255,255,.06);
  --agentspace-menu-bg: rgba(40,40,45,.48);
  --agentspace-nav1-active-bg: var(--devui-primary-bg);
  --agentspace-nav2-active-bg: #2A2B30;
  --agentspace-nav1-active-font-weight: 600;
  --agentspace-nav2-active-font-weight: 600;
  --agentspace-side-head-height: calc(var(--agentspace-header-height) + 4px);
  --agentspace-side-head-offset: 4px;
  --agentspace-shadow-card: none !important;
  --agentspace-shadow-tile: none !important;
  --agentspace-shadow-panel: none !important;
  --agentspace-btn-shadow: none !important;
  --agentspace-aurora-shell-shadow: 0 8px 24px -16px rgba(0,0,0,.5), 0 1px 5px rgba(0,0,0,.25);
  --devui-primary: var(--devui-brand);
  --devui-card-bg: var(--devui-base-bg);
}}
'''
        (THEMES / filename).write_text(text)


def strip_duplicates(html: str) -> str:
    # Design-system token sheet. Theme files replace it.
    banner = '/* ===== AgentSpace 2.0 Design System · tokens.css ===== */'
    i = html.find(banner)
    if i < 0:
        raise SystemExit('tokens banner missing')
    # through the reduced-motion block that follows the dark sheet
    end_marker = '@media (prefers-reduced-motion: reduce) {\n  :root { --devui-animation-duration-fast: 0ms; --devui-animation-duration-base: 0ms; --devui-animation-duration-slow: 0ms; }\n}'
    j = html.find(end_marker, i)
    if j < 0:
        raise SystemExit('reduced-motion block missing')
    j += len(end_marker)
    html = html[:i] + '/* Theme token values are inlined from demo-as2/themes/ at the end of this style block. */\n' + html[j:]

    html = html.replace(':root { --agentspace-rail-width: 72px; }\n', '')
    html = html.replace(':root { --agentspace-header-height: 48px; }\n', '')

    _, a, b = _block(html, ':root[data-appearance-style="aurora"] {\n  color-scheme: light;')
    html = html[:a] + html[b:]

    # Root-level aurora token rules that now live in the theme files.
    removals = [
        ':root[data-appearance-family="aurora"]{--agentspace-shadow-card:none!important;--agentspace-shadow-tile:none!important;--agentspace-shadow-panel:none!important;--agentspace-btn-shadow:none!important}\n',
        ':root[data-appearance-family="aurora"]{--agentspace-aurora-shell-shadow:0 8px 24px -16px rgba(18,22,34,.2),0 1px 5px rgba(18,22,34,.06)}\n',
        ':root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-aurora-shell-shadow:0 8px 24px -16px rgba(0,0,0,.5),0 1px 5px rgba(0,0,0,.25)}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="light"]{--agentspace-menu-bg:rgba(245,247,252,.46);--agentspace-page-bg:#FFFFFF}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="light"]{--rail-ink:var(--devui-text);--rail-tile:#FFFFFF}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-menu-bg:rgba(27,27,30,.72);--agentspace-page-bg:#151517}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-menu-bg:rgba(40,40,45,.48)}\n',
        ':root[data-appearance-family="aurora"]{--agentspace-side-head-height:calc(var(--agentspace-header-height) + 4px);--agentspace-side-head-offset:4px}\n',
        ':root[data-appearance-family="aurora"]{--agentspace-nav1-active-font-weight:600}\n',
        ':root[data-appearance-style="aurora"] { --agentspace-aurora-ink: color-mix(in srgb, var(--agentspace-accent) 60%, #0B1020); }\n',
    ]
    for chunk in removals:
        if chunk not in html:
            raise SystemExit('expected rule missing:\n' + chunk[:120])
        html = html.replace(chunk, '', 1)

    # Mixed gradient + menu background, and the dark token sheet, move into the theme files.
    mixed = '''html:root[data-appearance-family="aurora"][data-au-mode="mixed"]{
  --agentspace-aurora-mixed-gradient:radial-gradient(ellipse 420px 210px at 18% 0%,color-mix(in srgb,var(--agentspace-accent) 22%,transparent),transparent 76%),radial-gradient(ellipse 280px 160px at 100% 100%,color-mix(in srgb,var(--agentspace-accent) 10%,transparent),transparent 78%),linear-gradient(180deg,rgba(17,20,32,.97),rgba(9,12,21,.98));
  --agentspace-menu-bg:var(--agentspace-aurora-mixed-gradient);
}
'''
    if mixed not in html:
        raise SystemExit('mixed token rule missing')
    html = html.replace(mixed, '', 1)

    dark_rule_start = ':root[data-appearance-family="aurora"][data-au-mode="dark"]{\n  color-scheme:dark;'
    _, a, b = _block(html, dark_rule_start)
    html = html[:a] + html[b:]

    canvas = 'html:root[data-appearance-family="aurora"]:is([data-au-mode="light"],[data-au-mode="mixed"]){--agentspace-aurora-canvas-top:13%;--agentspace-aurora-canvas-right:12%;--agentspace-aurora-canvas-left:19%;--agentspace-aurora-canvas-corner:17%}\n'
    if canvas not in html:
        raise SystemExit('canvas percentage rule missing')
    html = html.replace(canvas, '', 1)
    return html


def patch_nav(html: str) -> str:
    swaps = [
        ('background: var(--rail-tile) !important; box-shadow: var(--rail-tile-shadow) !important; color: var(--rail-ink) !important;',
         'background: var(--agentspace-nav1-active-bg) !important; box-shadow: var(--rail-tile-shadow) !important; color: var(--rail-ink) !important;'),
        ('background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--agentspace-accent) 58%, transparent), transparent 70%), radial-gradient(100% 80% at 100% 100%, color-mix(in srgb, var(--agentspace-accent) 28%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in srgb, var(--agentspace-accent) 16%, #0B1020), #070B16) !important;',
         'background: var(--agentspace-nav1-active-bg) !important;'),
        ('{ background: #FFFFFF !important; color: var(--devui-text) !important; border: 0 !important; box-shadow: none !important; }',
         '{ background: var(--agentspace-nav1-active-bg) !important; color: var(--devui-text) !important; border: 0 !important; box-shadow: none !important; }'),
        ('button.active{background:var(--agentspace-aurora-mixed-gradient)!important}',
         'button.active{background:var(--agentspace-nav1-active-bg)!important}'),
        ('sidenav.active { background: #EDEEF1 !important; }',
         'sidenav.active { background: var(--agentspace-nav2-active-bg) !important; }'),
        ('sidenav.active { background: #2A2B30 !important; }',
         'sidenav.active { background: var(--agentspace-nav2-active-bg) !important; }'),
        ('sidenav.active { background: var(--px-ink, #FF6B1A) !important;',
         'sidenav.active { background: var(--agentspace-nav2-active-bg) !important;'),
        ('sidenav.active { background: rgba(255,255,255,.17) !important;',
         'sidenav.active { background: var(--agentspace-nav2-active-bg) !important;'),
        ('{ background: #FFFFFF !important; color: var(--devui-text) !important; font-weight: 600 !important; box-shadow: none !important; }',
         '{ background: var(--agentspace-nav2-active-bg) !important; color: var(--devui-text) !important; font-weight: 600 !important; box-shadow: none !important; }'),
        ('sidenav.active:not(#_a):not(#_b):not(#_c):not(#_d) { background: var(--bn-soft2) !important;',
         'sidenav.active:not(#_a):not(#_b):not(#_c):not(#_d) { background: var(--agentspace-nav2-active-bg) !important;'),
    ]
    for old, new in swaps:
        if old not in html:
            raise SystemExit('nav rule missing:\n' + old[:140])
        html = html.replace(old, new, 1)
    inserts = [
        (':root[data-appearance-style="liquid"] { --rail-tile: rgba(255, 255, 255, .82);',
         ':root[data-appearance-style="liquid"] { --agentspace-nav2-active-bg: var(--devui-base-bg); --rail-tile: rgba(255, 255, 255, .82);'),
        (':root[data-appearance-style="pixel"] { --rail-tile: var(--px-ink, #F2F2F2);',
         ':root[data-appearance-style="pixel"] { --agentspace-nav1-active-bg: var(--px-ink, #F2F2F2); --agentspace-nav2-active-bg: var(--px-ink, #F2F2F2); --rail-tile: var(--px-ink, #F2F2F2);'),
        (':root[data-appearance-style="bento"] { --rail-tile: #FFFFFF; --rail-ink: #17181C; }',
         ':root[data-appearance-style="bento"] { --agentspace-nav2-active-bg: var(--bn-soft2, #F1F2F5); --rail-tile: #FFFFFF; --rail-ink: #17181C; }'),
    ]
    for old, new in inserts:
        if old not in html:
            raise SystemExit('insert anchor missing:\n' + old[:140])
        html = html.replace(old, new, 1)
    return html


def mirror_sources(html: str) -> None:
    """Keep the synced build sources aligned with the token rules removed from index.html."""
    menu = HERE / 'as2-user-menu.css'
    nav = HERE / 'as2-navigation.css'
    menu_text = menu.read_text()
    nav_text = nav.read_text()
    for chunk in [
        ':root[data-appearance-family="aurora"]{--agentspace-shadow-card:none!important;--agentspace-shadow-tile:none!important;--agentspace-shadow-panel:none!important;--agentspace-btn-shadow:none!important}\n',
        ':root[data-appearance-family="aurora"]{--agentspace-aurora-shell-shadow:0 8px 24px -16px rgba(18,22,34,.2),0 1px 5px rgba(18,22,34,.06)}\n',
        ':root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-aurora-shell-shadow:0 8px 24px -16px rgba(0,0,0,.5),0 1px 5px rgba(0,0,0,.25)}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="light"]{--agentspace-menu-bg:rgba(245,247,252,.46);--agentspace-page-bg:#FFFFFF}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="light"]{--rail-ink:var(--devui-text);--rail-tile:#FFFFFF}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-menu-bg:rgba(27,27,30,.72);--agentspace-page-bg:#151517}\n',
        'html:root[data-appearance-family="aurora"][data-au-mode="dark"]{--agentspace-menu-bg:rgba(40,40,45,.48)}\n',
        'html:root[data-appearance-family="aurora"]:is([data-au-mode="light"],[data-au-mode="mixed"]){--agentspace-aurora-canvas-top:13%;--agentspace-aurora-canvas-right:12%;--agentspace-aurora-canvas-left:19%;--agentspace-aurora-canvas-corner:17%}\n',
    ]:
        if chunk not in menu_text:
            raise SystemExit('menu source missing ' + chunk[:80])
        menu_text = menu_text.replace(chunk, '', 1)
    _, a, b = _block(menu_text, ':root[data-appearance-family="aurora"][data-au-mode="dark"]{\n  color-scheme:dark;')
    menu_text = menu_text[:a] + menu_text[b:]
    mixed = '''html:root[data-appearance-family="aurora"][data-au-mode="mixed"]{
  --agentspace-aurora-mixed-gradient:radial-gradient(ellipse 420px 210px at 18% 0%,color-mix(in srgb,var(--agentspace-accent) 22%,transparent),transparent 76%),radial-gradient(ellipse 280px 160px at 100% 100%,color-mix(in srgb,var(--agentspace-accent) 10%,transparent),transparent 78%),linear-gradient(180deg,rgba(17,20,32,.97),rgba(9,12,21,.98));
  --agentspace-menu-bg:var(--agentspace-aurora-mixed-gradient);
}
'''
    if mixed not in menu_text:
        raise SystemExit('menu mixed block missing')
    menu_text = menu_text.replace(mixed, '', 1)
    menu.write_text(menu_text)

    for chunk in [
        ':root[data-appearance-family="aurora"]{--agentspace-side-head-height:calc(var(--agentspace-header-height) + 4px);--agentspace-side-head-offset:4px}\n',
        ':root[data-appearance-family="aurora"]{--agentspace-nav1-active-font-weight:600}\n',
    ]:
        if chunk not in nav_text:
            raise SystemExit('nav source missing ' + chunk[:80])
        nav_text = nav_text.replace(chunk, '', 1)
    nav.write_text(nav_text)

    (HERE / 'design-system' / 'tokens.css').write_text(
        '/* AgentSpace 2.0 theme values live in demo-as2/themes/.\n'
        '   sync_themes.py inlines those files into index.html. This file stays\n'
        '   so refactor-as2.py still has a token sheet path; it no longer defines values. */\n'
    )


def main():
    html = INDEX.read_text()
    write_theme_files(html)
    html = strip_duplicates(html)
    html = patch_nav(html)
    html = inline_themes(html)
    INDEX.write_text(html)
    mirror_sources(html)
    # Re-sync the user-menu and navigation sections from the edited sources,
    # then put the theme bundle back at the end.
    from sync_build import sync_build
    html = sync_build(INDEX.read_text())
    html = inline_themes(html)
    INDEX.write_text(html)
    print('inlined', len(ORDER), 'theme files')


if __name__ == '__main__':
    main()
