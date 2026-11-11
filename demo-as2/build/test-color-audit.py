"""Regression checks for the no-literal-color contract."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audit_colors', Path(__file__).with_name('audit-colors.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class ColorContract(unittest.TestCase):
    def test_rejects_literals_in_every_css_paint_role(self):
        for value in ('color:#fff', 'background:rgba(0,0,0,.2)', 'border:1px solid white', 'background:linear-gradient(red,blue)', 'box-shadow:0 1px 3px #0008', 'fill:hsl(211 50% 30%)', 'color:var(--missing,#abc)', '--tint:12,24,36'):
            with self.subTest(value=value):
                self.assertTrue(audit.check_css('.x{' + value + '}', 'fixture'))

    def test_allows_variables_and_derived_colors(self):
        self.assertEqual(audit.check_css('.x{color:var(--as-text);background:linear-gradient(var(--as-card),var(--as-stage));border:1px solid currentColor;box-shadow:0 1px 3px rgba(var(--as-rgb),.2)}', 'fixture'), [])

    def test_rejects_js_palettes_and_inline_svg(self):
        for value in ("const palette=['#2B76F0']", "ctx.fillStyle='#fff'", 'const x=`<path fill="#123456"/>`', "const x='rgba(0,0,0,.4)'"):
            with self.subTest(value=value):
                self.assertTrue(audit.check_js(value, 'fixture'))

    def test_allows_issue_ids_and_registered_color_inputs(self):
        self.assertEqual(audit.check_js("const title='需求 #206 更新';const value=asColor('--as-color-liquid-blue');const svg=`<path fill=\"var(--as-text)\"/>`", 'fixture'), [])

    def test_published_and_source_files_pass(self):
        self.assertEqual(audit.audit(), [])


if __name__ == '__main__':
    unittest.main()
