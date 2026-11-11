# demo-as2 theme token files

Each file lists the full set of `--devui-*` and `--agentspace-*` variables for that theme. Values are the ones demo-as2 already renders. They are not the defaults written in `designTokens.md`.

The generated `demo-as2/index.html` inlines these files and does not need them beside it at runtime. Switching is unchanged: `data-appearance-style`, `data-appearance-family`, `data-au-mode`, `data-theme`, `:root.dark`, and `localStorage`.

| File | Appearance | Selectors |
|---|---|---|
| `minimal-light.css` | `classic` | `:root`, `:root[data-appearance-style="classic"]` |
| `minimal-dark.css` | `dark` | `:root.dark`, `:root[data-theme="dark"]`, `:root[data-appearance-style="dark"]` |
| `as2-aurora-theme.css` | aurora accent `#3F6BFF` | `:root[data-appearance-family="aurora"][data-au-accent="3F6BFF"]` and `[data-au-mode=light\|mixed\|dark]` |
| `as2-aurora-violet-theme.css` | aurora accent `#7A4DFF` | same, `data-au-accent="7A4DFF"` |
| `as2-aurora-cyan-theme.css` | aurora accent `#06B6D4` | same, `data-au-accent="06B6D4"` |
| `as2-aurora-teal-theme.css` | aurora accent `#14B8A6` | same, `data-au-accent="14B8A6"` |
| `as2-aurora-pink-theme.css` | aurora accent `#EC4899` | same, `data-au-accent="EC4899"` |

Liquid, pixel and bento are not separate theme files. Their existing selectors still override these tokens, so those skins keep their current render.

`data-au-accent` is written next to the existing `--au` / `--agentspace-accent` assignment when settings apply. It does not replace `data-au-mode` or `data-appearance-family`.
