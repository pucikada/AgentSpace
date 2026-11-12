"""Inline the build module without changing the rest of the single-file demo."""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent


def sync_build(html):
    for filename, marker, tag in (
        ('palette.css', 'AS2 PALETTE', 'style'),
        ('semantic-colors.css', 'AS2 SEMANTIC COLORS', 'style'),
        ('color-runtime.js', 'AS2 COLOR RUNTIME', 'script'),
    ):
        start, end = f'/* {marker} START */', f'/* {marker} END */'
        chunk = f'{start}\n{(HERE / "design-system" / filename).read_text()}{end}'
        pattern = re.escape(start) + r'.*?' + re.escape(end)
        if start in html:
            html = re.sub(pattern, lambda _: chunk, html, count=1, flags=re.S)
        else:
            html = html.replace(f'<{tag}>', f'<{tag}>\n{chunk}\n', 1)
    for stem, marker in (('as2-build', 'AS2 BUILD V36'), ('as2-user-menu', 'AS2 USER MENU'), ('as2-spaces', 'AS2 SPACES'), ('as2-task-config', 'AS2 TASK CONFIG'), ('as2-settings-content', 'AS2 SETTINGS CONTENT'), ('as2-automation-history', 'AS2 AUTOMATION HISTORY'), ('as2-navigation', 'AS2 NAVIGATION')):
        for kind in ('css', 'js'):
            start, end = f'/* {marker} {kind} START */', f'/* {marker} {kind} END */'
            html = re.sub(r'\n?' + re.escape(start) + r'.*?' + re.escape(end) + r'\n?', '', html, flags=re.S)
            source = (HERE / f'{stem}.{kind}').read_text()
            chunk = f'\n{start}\n{source}\n{end}\n'
            if kind == 'css':
                html = html.replace('</style>', chunk + '</style>', 1)
            else:
                at = html.rfind('</script>')
                html = html[:at] + chunk + html[at:]
    from sync_themes import inline_themes
    return inline_themes(html)


if __name__ == '__main__':
    target = HERE.parent / 'index.html'
    target.write_text(sync_build(target.read_text()))
    print(f'Updated {target}')
