# demo-as2 theme token files

Each file lists the full set of `--devui-*` and `--agentspace-*` variables for that theme. Values are the ones demo-as2 already renders. They are not the defaults written in `designTokens.md`.

These files are the only source of theme token values. `python3 demo-as2/build/sync_themes.py` (also invoked at the end of `sync_build.py`) inlines them at the end of the `<style>` block in `index.html`, so the page stays one file on GitHub Pages and on `file://`. Do not also define the same tokens in `tokens.css` or in a second `:root` rule.

Switching is unchanged: `data-appearance-style`, `data-appearance-family`, `data-au-mode`, `data-au-accent`, `data-theme`, `:root.dark`, and `localStorage`. Compact density and hidden rail labels stay outside these files; they are preference overrides, not theme values.

| File | Appearance | Selectors |
|---|---|---|
| `minimal-light.css` | `classic` | `:root` (the default). Other appearances override it with a more specific selector. |
| `minimal-dark.css` | `dark` | `:root.dark`, `:root[data-theme="dark"]` |
| `as2-aurora-theme.css` | aurora `#3F6BFF` | `:root[data-appearance-style="aurora"]`, plus `html:root[data-appearance-family="aurora"][data-au-mode="light\|mixed\|dark"]` |
| `as2-aurora-violet-theme.css` | aurora `#7A4DFF` | same selectors; the accent hex in this file is `#7A4DFF` |
| `as2-aurora-cyan-theme.css` | aurora `#06B6D4` | same selectors; accent hex `#06B6D4` |
| `as2-aurora-teal-theme.css` | aurora `#14B8A6` | same selectors; accent hex `#14B8A6` |
| `as2-aurora-pink-theme.css` | aurora `#EC4899` | same selectors; accent hex `#EC4899`. This file is last, so its shared declarations win. |

Liquid, pixel and bento are not separate theme files. Their existing selectors still override these tokens, so those skins keep their current render.

The five aurora files list the full palette. They share selectors on purpose: a `data-au-accent` selector on that palette is specific enough to override later refinements such as muted text `#616161`. The files differ only by the accent hex. Settings still write `--agentspace-accent` and `--au` on the root element, which is the value the page reads when the accent changes. `data-au-accent` is set at the same time and does not select a theme file.
