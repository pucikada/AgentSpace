# demo-as2 主题令牌文件

每个文件列出该主题的 `--devui-*` 与 `--agentspace-*`。颜色取值引用 `build/design-system/palette.css` 里已登记的种子，不是 `designTokens.md` 前面的文档默认值。

这些文件是主题令牌取值的唯一来源。`python3 demo-as2/build/sync_themes.py`（`sync_build.py` 末尾也会调用）把它们内联到 `index.html` 的 `<style>` 末尾，因此 GitHub Pages 和 `file://` 仍然只打开一个文件。不要在 `tokens.css` 或另一个 `:root` 里再定义同一批令牌。

切换方式不变：`data-appearance-style`、`data-appearance-family`、`data-au-mode`、`data-au-accent`、`data-theme`、`:root.dark` 和 `localStorage`。紧凑密度和隐藏导航标签留在这些文件之外，它们是偏好覆盖，不是主题值。

| 文件 | 外观 | 选择器 |
|---|---|---|
| `minimal-light.css` | `classic` | `:root`。其他外观用更具体的选择器覆盖它。 |
| `minimal-dark.css` | `dark` | `:root.dark`、`:root[data-theme="dark"]`。这是完整一套，不依赖 classic。 |
| `as2-aurora-theme.css` | 幻彩 `#3F6BFF` | `:root[data-appearance-family="aurora"][data-au-accent="3F6BFF"]`，再分 `light` / `mixed` / `dark` |
| `as2-aurora-violet-theme.css` | 幻彩 `#7A4DFF` | 同一结构，强调色种子不同 |
| `as2-aurora-cyan-theme.css` | 幻彩 `#06B6D4` | 同一结构 |
| `as2-aurora-teal-theme.css` | 幻彩 `#14B8A6` | 同一结构 |
| `as2-aurora-pink-theme.css` | 幻彩 `#EC4899` | 同一结构 |
| `as2-liquid-theme.css` | `liquid` | `:root[data-appearance-style="liquid"]`。9 组预设和自定义色仍由 JS 写 `--lq-a` / `--lq-b`。 |
| `as2-pixel-theme.css` | `pixel` | 基础块同时匹配 `:root.dark[data-appearance-style="pixel"]`，浅色再用 `[data-px-mode="light"]`。墨色仍由 JS 写 `--px-ink` / `--px-ink-text` / `--px-on-ink`。 |
| `as2-bento-theme.css` | `bento` | `:root[data-appearance-style="bento"]` 与 `[data-bn-mode="dark"]`。强调色仍由 JS 写 `--bn`。 |

内联顺序：液态玻璃、像素、Bento，然后 `minimal-light.css`，再 `minimal-dark.css`，最后五个幻彩文件。像素深色块写成 `:root.dark[data-appearance-style="pixel"]`，因此比单独的 `:root.dark` 更具体。背景、边框和布局规则留在页面里，这里只放令牌值。

幻彩文件用 `data-au-accent` 区分。设置脚本同时写入 `--agentspace-accent`、`--au` 和 `data-au-accent`。没有对应强调色属性时，五份幻彩表都不会套上，页面回落到 classic / dark。

## 开发约束

与 `designTokens.md` 开头的「开发约束」是同一条，这里复述以便改主题的人直接看到：

1. 样式使用 `designTokens.md` 里的 `--devui-*` 和已登记的 `--agentspace-*`。不要写死颜色、字号、圆角、时长或其他设计值，也不要恢复 `--as-*` 作为新的语义令牌。色板种子仍只在 `palette.css`。间距按 `designTokens.md` 的 4px 栅格写 px，不单列间距变量。
2. 没有合适的变量时，先写入 `designTokens.md` 和相关主题文件，再在组件里引用。
3. 新增或修改令牌时适配全部会展示该表面的主题：极简浅色、极简深色、幻彩（5 个强调色 × 浅色 / 映衬 / 深色）、液态玻璃、像素浅色和深色、Bento 浅色和深色。每个主题用适合自己的值。JS 驱动的 `--lq-a` / `--lq-b`、像素墨色、`--bn` 仍要让新令牌在各模式下解析正确。
4. 主题文件是这些取值的唯一来源，由 `sync_themes.py` 内联。不要在 `tokens.css` 或第二个 `:root` 里再定义它们。
5. 新增主题时按现有文件的形式增加 `demo-as2/themes/` 下的 CSS：选择器结构与上表一致，文件写出全套 `--devui-*` / `--agentspace-*`，并登记到 `sync_themes.py` 的 `ORDER`。与 `:root.dark` 优先级相同时，深色表排在后面。不要把新主题的令牌值只放在 `tokens.css`、`as2-bridge.css` 或 JS 注入的 `:root` 里。
