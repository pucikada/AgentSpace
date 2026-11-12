# AgentSpace 编码约束

这些规则适用于每一个改 demo-as2 的编码代理和人，不只是 Cursor。令牌名单以仓库根目录 `designTokens.md` 为准，主题令牌取值只来自 `demo-as2/themes/`。不要另建一套令牌，也不要写一份与本文互相矛盾的规则。本文不收录令牌表。

## 开发约束

1. 样式必须使用 `designTokens.md` 中的变量（`--devui-*` 和已写明的 `--agentspace-*` 扩展）。不要把颜色、字号、圆角、时长或其他设计值写死，也不要为新代码再引入并行变量族（例如把 `--as-*` 语义令牌加回来）。色板种子 `--as-color-*`、图像种子 `--as-image-*`、通道 `--as-channel-*` 只登记在 `demo-as2/build/design-system/palette.css`；分类色 `--as-tone-*`、`--as-project-tone-*`、`--as-file-*` 只登记在 `demo-as2/build/design-system/semantic-colors.css`。组件消费 `--devui-*` / `--agentspace-*`。间距沿用 `designTokens.md`「间距」一节：没有间距令牌，按 4px 栅格写 px。
2. 如果没有满足需求的变量，先把变量加进 `designTokens.md`，并写进 `demo-as2/themes/` 里会用到它的主题文件，然后再在组件 CSS/JS 里引用。不要使用字面量，也不要使用未列入令牌表的临时变量。
3. 新增或修改令牌时，每个会展示该表面的主题都要适配：极简浅色（`classic`）、极简深色、幻彩（5 个强调色 × 浅色 / 映衬 / 深色）、液态玻璃、像素（浅色和深色）、Bento（浅色和深色）。每个主题用适合自己外观的值，不要把一个主题的值复制到其余主题，除非它们本来就应该相同。仍由 JS 驱动的预设（液态玻璃 `--lq-a` / `--lq-b`、像素墨色、Bento `--bn`）也要让新令牌在每种模式下解析正确。
4. 加完令牌后，主题文件仍是这些取值的唯一来源。`python3 demo-as2/build/sync_themes.py`（`sync_build.py` 末尾也会调用）把它们内联到 `demo-as2/index.html` 的 `<style>` 末尾。不要在 `tokens.css` 或第二个 `:root` 里再定义同一批令牌。
5. 新增主题（新的外观风格、新的模式或新的强调色家族）时，沿用现有形式：在 `demo-as2/themes/` 下增加专用 CSS 文件，选择器和结构与现有十个文件一致（`minimal-light.css`、`minimal-dark.css`、五个 `as2-aurora-*-theme.css`、`as2-liquid-theme.css`、`as2-pixel-theme.css`、`as2-bento-theme.css`）。新文件必须写出该主题的全套主题令牌（其他主题文件所设置的每一个 `--devui-*` / `--agentspace-*`），不能只写有差异的几项。在 `demo-as2/build/sync_themes.py` 的 `ORDER` 里登记该文件，使它内联到 `index.html` 的 `<style>` 末尾；层叠顺序保持现有约定，与 `:root.dark` 优先级相同时，深色表排在浅色表之后。不要把新主题的令牌值只写在 `tokens.css`、`as2-bridge.css` 或由 JS 注入的 `:root` 里。JS 仍可以驱动预设强调色，但主题自己的令牌表是必需的。
