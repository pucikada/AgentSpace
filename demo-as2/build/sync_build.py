"""Inline the build module without changing the rest of the single-file demo."""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent


def sync_build(html):
    for kind in ('css', 'js'):
        start, end = f'/* AS2 BUILD V36 {kind} START */', f'/* AS2 BUILD V36 {kind} END */'
        html = re.sub(r'\n?' + re.escape(start) + r'.*?' + re.escape(end) + r'\n?', '', html, flags=re.S)
        source = (HERE / f'as2-build.{kind}').read_text()
        chunk = f'\n{start}\n{source}\n{end}\n'
        if kind == 'css':
            html = html.replace('</style>', chunk + '</style>', 1)
        else:
            at = html.rfind('</script>')
            html = html[:at] + chunk + html[at:]
    return html


if __name__ == '__main__':
    target = HERE.parent / 'index.html'
    target.write_text(sync_build(target.read_text()))
    print(f'Updated {target}')
