# AgentSpace 设计系统 · 多风格与多主题

> v2.2 · 2026-11-10（America/Los_Angeles）
>
> 基于 `demo-as2/index.html` 的实际实现修订 v2.1。审查时本地 demo 与 [GitHub Pages](https://vinniechenyu.github.io/AgentSpace/demo-as2/) 的字节一致；本次修订尚未发布到线上。产品事实以本目录 demo 为准，官方 DevUI 规范作为独立的组件库参考。
>
> 本版收敛了旧稿的主题计数、像素默认值、桥接方向、变量漏项、对比度门槛与维护路径。下方变量矩阵、色板清单和对比度表由脚本维护；不再混用旧版八主题生成表。

## 1. 外观模型

### 1.1 产品风格与实际验证组合

面向用户是 **4 种风格**。代码包含 6 个 style 标识；`dark` 是经典极简的深色标识，`bento` 是极简的布局变体，不能把它们另算为两种用户风格。

| 风格 | 保存的 style / family | 模式 | 配色 | 外观特征 |
| --- | --- | --- | --- | --- |
| 极简·经典 | `classic` / `dark` | 浅 / 深 | 中性主按钮；保留通用颜色轴 | 灰阶分层、墨色或反转浅色主按钮 |
| 极简·Bento | `bento` | `data-bn-mode=light/dark` | 5 个 Bento 强调色 | 分块面板、紧凑间距、中性主操作 |
| 幻彩 | `aurora` | `data-au-mode=light/mixed/dark` | 5 个幻彩强调色 | 浅色 / 深浅映衬 / 全深色；保留半包围几何 |
| 液态玻璃 | `liquid` | 基础为浅色；可按壁纸亮度派生 `data-glass-tone=dark` | 9 组双色预设 + 自定义主辅色 | 壁纸、折射、透明度、亮边与模糊共同形成材质 |
| 像素 | `pixel` | `data-px-mode=light/dark` | 每个模式各 5 组强调色 | 等宽、像素标题、直角、网格、硬投影 |

验证矩阵是 **10 个基准组合**：经典浅/深、Bento 浅/深、幻彩浅/映衬/深、液态玻璃、像素深/浅。幻彩浅与映衬不能合列：外壳与侧栏的颜色、局部覆盖存在差异。

当前首次访问/外观重置选择 **幻彩·浅色 + 蓝色**。像素的 CSS 基础块是深色，但设置初始化为 **浅色蓝图**；不能再写成“产品默认深色”。已有用户偏好继续保留。

### 1.2 独立维度与协议

| 维度 | 属性 / 输入 | 映射与边界 |
| --- | --- | --- |
| 保存风格 | `s.appearance.style` | classic / dark / bento / aurora / liquid / pixel |
| 渲染风格 | `data-appearance-style` | 幻彩全深色借用 `dark`；其 family 仍为 aurora |
| 风格家族 | `data-appearance-family` | 不能直接等同渲染 style；幻彩选择器优先按 family 识别 |
| 全局明暗 | `data-theme=light/dark`、`.dark`、`color-scheme` | 由 `themeTone()` 派生，不用手工分别修改 |
| 通用颜色 | `data-appearance-color` | purple 267°/212°、blue 211°/175°、green 162°/205°、orange 27°/46°、yellow 46°/28°、pink 343°/28° → `--ap-hue / --ap-companion-hue`；并非每种风格都消费这条轴 |
| 专属配色 | `--au`、`--bn`、`--lq-a / --lq-b`、`--px-ink / --px-ink-text / --px-on-ink` | 以风格专属配色为准，不能宣称“全部风格 × 六色”都得到六种不同外观 |
| 通用透明度 | 0–60，写入 `--ap-*alpha` | surface=`1-t/100`，card=`1-t×.0085`，rail=`1-t×.003`；实际消费范围取决于风格 |
| 玻璃材质 | `settings.glass` | 折射、顶部/底部填充与模糊、卡片填充与模糊；与通用透明度分开 |
| 壁纸 | gradient / daylight / mat / night / custom | 自定义图像、壁纸取色是用户数据；采样亮度决定文字反色 |
| 密度 | `data-density=comfortable/compact` | 控件高度、页头、行距与间距联动 |
| 动效偏好 | `data-motion=full/reduce` 与系统 reduced-motion | 以实际组件动效规则为准，不能只改五个时长变量便宣称所有动画关闭 |
| 导航标签 | `data-rail-labels=on/off` | 切换导航宽度及标签，不改变主题家族 |

调用现有入口 `appearanceSelect()`、`userColorApply()`、`settingsSet()`，由 `appearanceApply()` / `settingsApply()` / `glassApply()` 同步属性与 token。不得复制一个只设置 `dataset.theme` 的“简化切换函数”。

## 2. 两套体系的边界

demo-as2 的主题令牌使用 `--devui-*` 与项目扩展 `--agentspace-*`。取值只写在 `themes/`，由 `build/sync_themes.py` 内联到页面末尾。`tokens.css` 不再存放这批值。DevUI 官方组件库仍然使用自己的 `--devui-*` 主题文件；产品页面的 `data-theme=light/dark` 与 DevUI 的 `data-theme=as-ink/default/...` 不是同一命名空间，不能同时写到同一根元素上。

DevUI 组件主题的八套历史配置继续以 [独立 DevUI 文档](../devui-multitheme/DESIGN.md) 和其 `dist/` 为准。它们不代表产品设置里的八套外观。旧 `as-glass` 固定极光底、旧 `as-pixel` 米色纸底也不等于当前产品风格；本次没有修改独立组件库的主题产物，不能声称它们已经被删除或升级。

产品内嵌组件通过适配层读产品语义；独立 DevUI 页面继续消费自己的主题。官方主题不因为本次产品配色整改而修改。

## 3. Token 分层与禁止硬编码

```text
palette.css                         固定色值、透明色、RGB 通道、固定图像种子（--as-color-* / --as-image-* / --as-channel-*）
    ↓
themes/*.css                        主题令牌 --devui-* 与 --agentspace-*；风格种子 --au / --bn / --lq-* / --px-*
    ↓
semantic-colors.css                  分类色、文件色、项目色（--as-tone-* / --as-project-tone-* / --as-file-*）
    ↓
组件局部变量 --tc/--pt/--tint/...      只通过 var() 派生或接收用户输入
    ↓
CSS 属性、内联 style、SVG、Canvas
```

**硬规则：固定颜色字面量只允许定义在 `build/design-system/palette.css` 的登记表。** 组件、主题覆盖、JS 色板和 inline SVG 必须引用变量。该规则包括 hex、rgb/rgba、hsl/hsla、白/黑/透明命名色、渐变各 stop、阴影、描边、SVG `fill/stroke/stop-color`、`var()` 的 fallback，以及分离的 RGB 通道。`none` / `inherit` / `currentColor` 是绘制或继承指令，可直接使用。

- 新业务优先消费 `--devui-text`、`--devui-base-bg`、`--devui-warning` 以及 `designTokens.md` 里已有的 `--agentspace-*`。不能因为两个值刚好相同就混用含义。不要把 `--as-text` 一类旧语义名加回来。

### 3.1 开发约束

与仓库根目录 `designTokens.md` 的「开发约束」相同，改 demo-as2 时遵守：

1. 样式使用 `--devui-*` 和已登记的 `--agentspace-*`。不要写死颜色、字号、圆角、时长或其他设计值，也不要新增一套 `--as-*` 语义变量。颜色字面量仍只进 `palette.css`。间距按 `designTokens.md` 的 4px 栅格写 px。
2. 没有合适变量时，先写入 `designTokens.md` 和 `themes/` 里相关主题文件，再在组件里引用。
3. 新增或修改令牌时适配极简浅色、极简深色、幻彩（5 个强调色 × 浅色 / 映衬 / 深色）、液态玻璃、像素浅色和深色、Bento 浅色和深色。每个主题取适合自己的值。`--lq-a` / `--lq-b`、像素墨色、`--bn` 仍由 JS 驱动。
4. 主题文件是取值的唯一来源，经 `sync_themes.py` 内联。不要在 `tokens.css` 或第二个 `:root` 里重复定义。
5. 新增主题时在 `themes/` 增加专用 CSS，结构与现有 10 个文件一致，写出全套令牌，并登记到 `sync_themes.py` 的 `ORDER`。深色表在与 `:root.dark` 优先级相同时排在后面。不要把新主题的令牌值只放在 `tokens.css`、`as2-bridge.css` 或 JS 注入的 `:root`。
- `--as-color-*` 是原始色板种子。迁移保留了风格模板、预览缩略图、既有装饰的精确取值；固定色板并不自动随明暗反转。主题覆盖选择种子，产品语义决定其使用场景。
- 分类色、项目色、文件色有明确的 `--as-tone-* / --as-project-tone-* / --as-file-*` 层；深色文件色改用当前状态三件套。
- `color-mix()` / HSL / RGBA 可以由变量和数值参数派生，但不能夹带固定颜色字面量。`--as-color-white-rgb` 等三通道值也集中登记。
- 自定义主辅色、项目图标色、自定义壁纸、采样颜色属于运行时数据，可以写入已登记的 custom property；不要把 CSS `var(...)` 当作 `<input type=color>` 的值或存储的 hex。
- `color-runtime.js` 的 `asColor(name)` 为色板比较、原生颜色输入、Canvas 与 SVG 壁纸替换读取登记值。Canvas 不直接识别 CSS `var()`；CSS/SVG 页面绘制则优先直接使用变量。
- 固定的位图照片/头像/壁纸像素与品牌图片文件属于媒体资源，不作为界面 token 重着色。CSS 内嵌的固定箭头 SVG 数据 URI 已整体登记为 `--as-image-chevron-*`，不依靠图片内的 `var()` 继承宿主颜色。遮罩/位移贴图中的黑白与 RGB 是算法通道，也必须从登记的种子读取，不能改成随主题变化的正文色。

```css
/* 正确：组件消费设计令牌；固定色值由 palette.css 登记。 */
.notice { color: var(--devui-warning); background: var(--devui-warning-bg); border-color: var(--devui-warning-line); }
.preview { background: linear-gradient(var(--as-color-liquid-blue), var(--as-color-liquid-orange)); }
```

## 4. 风格规则

### 4.1 极简·经典

默认品牌蓝只承担链接、焦点、运行与信息强调；主操作使用 `--agentspace-btn-*` 的中性 raise 材质。主按钮文字始终读取 `--agentspace-btn-ink`；深色按钮反转，不能用固定白字。运行时可能有更晚的中性色覆盖，最终值以 `themes/minimal-*.css` 为准。§5 的生成表仍是色板迁移时的快照变量名（`--as-bg` 对应现在的 `--agentspace-neutral-bg`，`--as-card` 对应 `--devui-base-bg`，`--as-text` 对应 `--devui-text`，`--as-wait` 对应 `--devui-warning`）。分类色 `--as-tone-*` 的名字没有改。

### 4.2 极简·Bento

通过 `--bn-*` 表达画布、表面、凹面、弱底、悬停、强操作及强操作文字。浅深模式各自覆盖；布局与主题同时保留。强调色预设为活力橙、钴蓝、松石绿、星云紫、墨黑；主操作仍按当前组件的中性规则呈现，不能根据强调色预设推断所有主按钮都是彩色。

### 4.3 幻彩

light 为浅色外壳，mixed 为深色外框/侧栏配浅色内容，dark 保留幻彩家族与半包围几何并借用完整深色表面体系。必须同时检查根变量与 `.demoside` / 消息列表等局部覆盖。

5 个强调色预设是极光蓝、星云紫、冰川青、森林绿、晚霞粉，以 `auroraAccents()` 读取的色板变量为准。`--au-2 / --au-navy / --au-frame / --au-gap-*` 属风格种子与几何参数，组件通过语义或已登记的外壳适配层消费。旧用户保存的两态配置可能经过 `auroraThreeModes` 一次迁移；保留现有迁移逻辑。

幻彩是否保留光晕、是否使用平面按钮，以后置组件规则为准；旧稿“73 变量 / 139 条组件规则”是历史计数，不再当作完整性证明。

### 4.4 液态玻璃

主辅色种子派生天空、晨光、雾面及状态颜色。预设实际为 9 组：蓝橙、蓝绿、蓝紫、靛橙、林绿、水蓝、紫粉、蓝红、米棕。可自定义双色。

玻璃成立需要透明面、背景内容、模糊/折射与边缘高光共同作用。颜色使用变量，材质参数保留现有滑杆与 `LiquidGlassControls`。夜间壁纸或自定义深图可以触发玻璃文字反色，但不等于增加了一个可独立选择的“液态玻璃深色主题”。

渐变壁纸随主辅色派生；照片与 mat SVG 是另一路资源。mat 取色替换必须保留 hex 格式与大小写匹配约定。壁纸/透明度/折射改变时，对比度需要在真实画面重新测量，不能用固定 ±10% 误差估算。

### 4.5 像素

浅色蓝图与深色终端都存在。正文/代码使用 JetBrains Mono 等宽栈，标题使用 Silkscreen；离线回退系统等宽。全套圆角收至直角，硬投影、阶跃动效、网格；状态通过文字、图标、形态共同编码。

`--px-ink` 为填充强调，`--px-ink-text` 为可读的文字强调，`--px-on-ink` 为强调底上的文字，不能三者合一。浅色橙色填充与深橙文字的分离必须保留。brand 在该皮肤内可指向强调墨色；这是已登记的皮肤映射，不用于重新定义产品品牌。

## 5. 产品语义变量全量矩阵

以下是浏览器真实级联后的 **根元素**值，包含后置覆盖、var 解析与专属模式，不是按字符串拼接几个主题块推算。颜色函数可能仍以 `color-mix()` 表达；`—` 表示该变量只在特定风格或组件局部存在，不能解读为通用缺省值。

同名局部覆盖另外登记在 [token-inventory.json](build/design-system/token-inventory.json)。矩阵是 10 个默认预设的快照，不代表全部自定义颜色空间、壁纸和所有组件状态已穷举。

<!-- GEN:product-matrix -->
共 182 个产品/兼容语义变量；10 个组合。每格为当前根级计算值。

| 变量 | 经典浅 | 经典深 | Bento浅 | Bento深 | 幻彩浅 | 幻彩映衬 | 幻彩深 | 玻璃 | 像素深 | 像素浅 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `--as-bg` | `#F5F5F5` | `#0C0C0D` | `#E8E9EC` | `#0D0E10` | `#EEF2FB` | `#EEF2FB` | `#101012` | `color-mix(in srgb, #2B76F0 8%, #EEF1F5)` | `#0A0A0A` | `#E2E2E2` |
| `--as-blue` | — | — | — | — | — | — | — | `#2B76F0` | — | — |
| `--as-border` | `#E5E5E5` | `#262628` | `rgba(20,22,30,.09)` | `rgba(255,255,255,.1)` | `rgba(30,50,110,.12)` | `rgba(30,50,110,.12)` | `rgba(255, 255, 255, .12)` | `rgba(30,55,90,.09)` | `#262626` | `#A3A3A3` |
| `--as-border-soft` | `rgba(10, 10, 10, .06)` | `rgba(255, 255, 255, .07)` | `rgba(20,22,30,.06)` | `rgba(255, 255, 255, .06)` | `rgba(30,50,110,.07)` | `rgba(30,50,110,.07)` | `rgba(255, 255, 255, .07)` | `rgba(30,55,90,.06)` | `#1D1D1D` | `#C0C0C0` |
| `--as-border-strong` | `rgba(10, 10, 10, .12)` | `rgba(255, 255, 255, .14)` | `rgba(20,22,30,.18)` | `rgba(255,255,255,.2)` | `rgba(30,50,110,.22)` | `rgba(30,50,110,.22)` | `rgba(255,255,255,.24)` | `rgba(30,55,90,.15)` | `#3B3B3B` | `#6E6E6E` |
| `--as-brand` | `#0A59F7` | `#4D8DFF` | `#F2541B` | `color-mix(in srgb, #F2541B 58%, #FFFFFF)` | `#3F6BFF` | `#3F6BFF` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `color-mix(in srgb, #2B76F0 80%, #000000)` | `#F2F2F2` | `#B83E00` |
| `--as-brand-hover` | `#0846C4` | `#6FA3FF` | `color-mix(in srgb, #F2541B 86%, #000000)` | `color-mix(in srgb, #F2541B 45%, #FFFFFF)` | `color-mix(in srgb, #3F6BFF 86%, #000000)` | `color-mix(in srgb, #3F6BFF 86%, #000000)` | `color-mix(in srgb,#3F6BFF 64%,#FFFFFF)` | `color-mix(in srgb, #2B76F0 82%, #000000)` | `#FFFFFF` | `#8F2F00` |
| `--as-brand-line` | `rgba(10, 89, 247, .24)` | `rgba(77, 141, 255, .30)` | `color-mix(in srgb, #F2541B 38%, transparent)` | `rgba(255,255,255,.28)` | `rgba(30,40,80,.28)` | `rgba(30,40,80,.28)` | `color-mix(in srgb,#3F6BFF 40%,transparent)` | `color-mix(in srgb, #2B76F0 28%, transparent)` | `#4A4A4A` | `color-mix(in srgb, #FF6B1A 50%, transparent)` |
| `--as-brand-soft` | `rgba(10, 89, 247, .10)` | `rgba(77, 141, 255, .14)` | `color-mix(in srgb, #F2541B 10%, #FFFFFF)` | `rgba(255,255,255,.08)` | `#E6EAF4` | `#E6EAF4` | `color-mix(in srgb,#3F6BFF 12%,#242427)` | `color-mix(in srgb, #2B76F0 12%, transparent)` | `#222` | `color-mix(in srgb, #FF6B1A 14%, transparent)` |
| `--as-btn-bottom` | `#201E25` | `#E4E4E7` | `#17181C` | `#F2F3F5` | `#161B2C` | `#161B2C` | `#E4E4E7` | `#201E25` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-bottom-hover` | `#29272F` | `#ECECEF` | `#2B2E37` | `#FFFFFF` | `#1C2236` | `#1C2236` | `#ECECEF` | `#29272F` | `#FFFFFF` | `color-mix(in srgb, #FF6B1A 88%, #FFFFFF)` |
| `--as-btn-edge-1` | `#4B4951` | `#FFFFFF` | `#17181C` | `#F2F3F5` | `#2C344C` | `#2C344C` | `#FFFFFF` | `#4B4951` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-edge-2` | `#31303A` | `#F0F0F2` | `#17181C` | `#F2F3F5` | `#161B2C` | `#161B2C` | `#F0F0F2` | `#31303A` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-edge-3` | `#18171B` | `#D4D4D8` | `#17181C` | `#F2F3F5` | `#0E121F` | `#0E121F` | `#D4D4D8` | `#18171B` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-ink` | `#FAFAFA` | `#121213` | `#FFFFFF` | `#17181C` | `#FFFFFF` | `#FFFFFF` | `#121213` | `#FAFAFA` | `#0A0A0A` | `#111111` |
| `--as-btn-ring` | `#0D0D0D` | `rgba(0, 0, 0, .60)` | `transparent` | `transparent` | `rgba(22,27,44,.4)` | `rgba(22,27,44,.4)` | `rgba(0, 0, 0, .60)` | `#0D0D0D` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-shadow` | `0 0 0 1px #0D0D0D, 0 1px 1px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.10)` | `0 0 0 1px rgba(0, 0, 0, .60), 0 2px 4px rgba(0,0,0,.30)` | `none` | `none` | `none` | `none` | `none` | `0 0 0 1px #0D0D0D, 0 1px 1px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.10)` | `3px 3px 0 0 #000000` | `none` |
| `--as-btn-top` | `#323137` | `#F4F4F5` | `#17181C` | `#F2F3F5` | `#2C344C` | `#2C344C` | `#F4F4F5` | `#323137` | `#F2F2F2` | `#FF6B1A` |
| `--as-btn-top-hover` | `#3C3B42` | `#FFFFFF` | `#2B2E37` | `#FFFFFF` | `#38425E` | `#38425E` | `#FFFFFF` | `#3C3B42` | `#FFFFFF` | `color-mix(in srgb, #FF6B1A 88%, #FFFFFF)` |
| `--as-btn2-bg` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` | `#FFFFFF` | `#1F2126` | `#FFFFFF` | `#FFFFFF` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .04)` | `#1A1A1A` | `#F6F6F6` |
| `--as-btn2-ink` | `#0A0A0A` | `#EDEDED` | `#17181C` | `#F2F3F5` | `#12182B` | `#12182B` | `#EDEDED` | `#0A0A0A` | `#EDEDED` | `#111111` |
| `--as-card` | `#FFFFFF` | `#19191B` | `#FFFFFF` | `#17181C` | `#FFFFFF` | `#FFFFFF` | `#232326` | `rgba(255,255,255,.64)` | `#141414` | `#F6F6F6` |
| `--as-card-bg` | `#FFFFFF` | `#19191B` | `#FFFFFF` | `#17181C` | `#FFFFFF` | `#FFFFFF` | `#232326` | `rgba(255,255,255,.64)` | `#141414` | `#F6F6F6` |
| `--as-chevron` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238F8F8F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238F8F8F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238F8F8F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238F8F8F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` |
| `--as-code-add` | `rgba(24, 121, 78, .10)` | `rgba(76, 195, 138, .14)` | `rgba(24, 121, 78, .10)` | `rgba(76, 195, 138, .14)` | `rgba(24, 121, 78, .10)` | `rgba(24, 121, 78, .10)` | `rgba(76, 195, 138, .14)` | `rgba(24, 121, 78, .10)` | `rgba(76, 195, 138, .14)` | `rgba(24, 121, 78, .10)` |
| `--as-code-del` | `rgba(217, 58, 43, .08)` | `rgba(255, 110, 100, .12)` | `rgba(217, 58, 43, .08)` | `rgba(255, 110, 100, .12)` | `rgba(217, 58, 43, .08)` | `rgba(217, 58, 43, .08)` | `rgba(255, 110, 100, .12)` | `rgba(217, 58, 43, .08)` | `rgba(255, 110, 100, .12)` | `rgba(217, 58, 43, .08)` |
| `--as-code-key` | `rgba(0, 0, 0, .88)` | `rgba(255, 255, 255, .9)` | `rgba(0, 0, 0, .88)` | `rgba(255, 255, 255, .9)` | `rgba(0, 0, 0, .88)` | `rgba(0, 0, 0, .88)` | `rgba(255, 255, 255, .9)` | `rgba(0, 0, 0, .88)` | `rgba(255, 255, 255, .9)` | `rgba(0, 0, 0, .88)` |
| `--as-code-num` | `#B25B0C` | `#F2A65A` | `#B25B0C` | `#F2A65A` | `#B25B0C` | `#B25B0C` | `#F2A65A` | `#B25B0C` | `#F2A65A` | `#B25B0C` |
| `--as-code-str` | `#006A96` | `#5FC8E8` | `#006A96` | `#5FC8E8` | `#006A96` | `#006A96` | `#5FC8E8` | `#006A96` | `#5FC8E8` | `#006A96` |
| `--as-control-h` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` |
| `--as-count-bg` | — | `#3D3D43` | — | `#3D3D43` | — | — | `#3D3D43` | — | `#3D3D43` | — |
| `--as-danger` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#D93A2B` | `#FF5A36` | `#D93A12` |
| `--as-dawn` | — | — | — | — | — | — | — | `color-mix(in srgb, #F08A3C 20%, #FFFFFF)` | — | — |
| `--as-decision-w` | `512px` | `512px` | `512px` | `512px` | `512px` | `512px` | `512px` | `512px` | `512px` | `512px` |
| `--as-done` | `#18794E` | `#4CC38A` | `#18794E` | `#5FD39B` | `#18794E` | `#18794E` | `#4CC38A` | `#18794E` | `#7EE2A8` | `#0E6E40` |
| `--as-done-bg` | `rgba(24, 121, 78, .09)` | `rgba(76, 195, 138, .12)` | `rgba(24, 121, 78, .09)` | `rgba(95,211,155,.14)` | `rgba(24, 121, 78, .09)` | `rgba(24, 121, 78, .09)` | `rgba(76, 195, 138, .12)` | `rgba(24, 121, 78, .09)` | `rgba(126,226,168,.10)` | `rgba(14,110,64,.10)` |
| `--as-done-line` | `rgba(24, 121, 78, .22)` | `rgba(76, 195, 138, .28)` | `rgba(24, 121, 78, .22)` | `rgba(95,211,155,.4)` | `rgba(24, 121, 78, .22)` | `rgba(24, 121, 78, .22)` | `rgba(76, 195, 138, .28)` | `rgba(24, 121, 78, .22)` | `rgba(126,226,168,.35)` | `rgba(14,110,64,.35)` |
| `--as-dur` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` |
| `--as-dur-enter` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` |
| `--as-dur-expand` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` |
| `--as-dur-fast` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` |
| `--as-dur-state` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` | `0ms` |
| `--as-ease` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` |
| `--as-ease-drawer` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` | `cubic-bezier(.32, .72, 0, 1)` |
| `--as-ease-out` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` | `cubic-bezier(.22, 1, .36, 1)` |
| `--as-ease-pop` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` | `cubic-bezier(.16, 1, .3, 1)` |
| `--as-ease-raise` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` | `cubic-bezier(.6, .6, 0, 1)` |
| `--as-ease-spring` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` | `cubic-bezier(.34, 1.4, .64, 1)` |
| `--as-fail` | `#D93A2B` | `#FF7B72` | `#D93A2B` | `#FF7A6B` | `#D93A2B` | `#D93A2B` | `#FF7B72` | `#D93A2B` | `#FF5A36` | `#C0310F` |
| `--as-fail-bg` | `rgba(217, 58, 43, .06)` | `rgba(255, 110, 100, .08)` | `rgba(217, 58, 43, .06)` | `rgba(255,122,107,.14)` | `rgba(217, 58, 43, .06)` | `rgba(217, 58, 43, .06)` | `rgba(255, 110, 100, .08)` | `rgba(217, 58, 43, .06)` | `rgba(255,90,54,.10)` | `rgba(192,49,15,.10)` |
| `--as-fail-line` | `rgba(217, 58, 43, .18)` | `rgba(255, 110, 100, .22)` | `rgba(217, 58, 43, .18)` | `rgba(255,122,107,.4)` | `rgba(217, 58, 43, .18)` | `rgba(217, 58, 43, .18)` | `rgba(255, 110, 100, .22)` | `rgba(217, 58, 43, .18)` | `rgba(255,90,54,.45)` | `rgba(192,49,15,.4)` |
| `--as-file-md-bg` | `#E3F6EA` | `rgba(76, 195, 138, .12)` | `#E3F6EA` | `rgba(95,211,155,.14)` | `#E3F6EA` | `#E3F6EA` | `rgba(76, 195, 138, .12)` | `#E3F6EA` | `rgba(126,226,168,.10)` | `#E3F6EA` |
| `--as-file-md-ink` | `#1A8C4E` | `#4CC38A` | `#1A8C4E` | `#5FD39B` | `#1A8C4E` | `#1A8C4E` | `#4CC38A` | `#1A8C4E` | `#7EE2A8` | `#1A8C4E` |
| `--as-file-ts-bg` | `#E0ECFF` | `rgba(77, 141, 255, .14)` | `#E0ECFF` | `rgba(107,147,255,.14)` | `#E0ECFF` | `#E0ECFF` | `color-mix(in srgb,#3F6BFF 12%,#242427)` | `#E0ECFF` | `#1F1F1F` | `#E0ECFF` |
| `--as-file-ts-ink` | `#1D5FD1` | `#4D8DFF` | `#1D5FD1` | `#6B93FF` | `#1D5FD1` | `#1D5FD1` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `#1D5FD1` | `#F2F2F2` | `#1D5FD1` |
| `--as-focus-ring` | `rgba(10, 89, 247, .45)` | `rgba(77, 141, 255, .55)` | `#2B5BE8` | `#6B93FF` | `#3F6BFF` | `#3F6BFF` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `color-mix(in srgb, #2B76F0 50%, transparent)` | `#F2F2F2` | `#FF6B1A` |
| `--as-focus-soft` | `rgba(10, 89, 247, .12)` | `rgba(77, 141, 255, .16)` | `rgba(43,91,232,.2)` | `rgba(107,147,255,.28)` | `color-mix(in srgb, #3F6BFF 22%, transparent)` | `color-mix(in srgb, #3F6BFF 22%, transparent)` | `rgba(77, 141, 255, .16)` | `color-mix(in srgb, #2B76F0 14%, transparent)` | `rgba(242,242,242,.10)` | `color-mix(in srgb, #FF6B1A 18%, transparent)` |
| `--as-font` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, sans-serif` | `"JetBrains Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "PingFang SC", "Microsoft YaHei", monospace` | `"JetBrains Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "PingFang SC", "Microsoft YaHei", monospace` |
| `--as-font-mono` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | `"JetBrains Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "PingFang SC", "Microsoft YaHei", monospace` | `"JetBrains Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "PingFang SC", "Microsoft YaHei", monospace` |
| `--as-frame-gap` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` |
| `--as-fs-body` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` |
| `--as-fs-display` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` |
| `--as-fs-h1` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` |
| `--as-fs-h2` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` |
| `--as-fs-h3` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` |
| `--as-fs-meta` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` |
| `--as-fs-micro` | `11px` | `11px` | `11px` | `11px` | `11px` | `11px` | `11px` | `11px` | `11px` | `11px` |
| `--as-fs-reading` | `15px` | `15px` | `15px` | `15px` | `15px` | `15px` | `15px` | `15px` | `15px` | `15px` |
| `--as-fs-ui` | `13px` | `13px` | `13px` | `13px` | `13px` | `13px` | `13px` | `13px` | `13px` | `13px` |
| `--as-glass` | — | — | — | — | — | — | — | `blur(28px) saturate(170%)` | — | — |
| `--as-head-h` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` |
| `--as-hover` | `rgba(0, 0, 0, .05)` | `rgba(255, 255, 255, .07)` | `rgba(20,22,30,.045)` | `rgba(255, 255, 255, .06)` | `rgba(18,24,43,.035)` | `rgba(18,24,43,.035)` | `rgba(255, 255, 255, .06)` | `rgba(255,255,255,.58)` | `#1B1B1B` | `#DADADA` |
| `--as-id-agent` | `#EEEDFB` | `rgba(165, 165, 255, .16)` | `#DDE6FD` | `#222B44` | `color-mix(in srgb, #3F6BFF 13%, #FFFFFF)` | `color-mix(in srgb, #3F6BFF 13%, #FFFFFF)` | `rgba(165, 165, 255, .16)` | `#EEEDFB` | `#1E1E1E` | `#111111` |
| `--as-id-agent-ink` | `#4B4BC4` | `#B9B9FF` | `#1F3FA8` | `#B8CCFF` | `color-mix(in srgb, #3F6BFF 78%, #12182B)` | `color-mix(in srgb, #3F6BFF 78%, #12182B)` | `#B9B9FF` | `#4B4BC4` | `#EDEDED` | `#FFFFFF` |
| `--as-id-human` | `#E8EEFE` | `rgba(77, 141, 255, .18)` | `#FFE3D6` | `#3A2A22` | `#E6ECFF` | `#E6ECFF` | `rgba(77, 141, 255, .18)` | `#E8EEFE` | `#1E1E1E` | `#DCDCDC` |
| `--as-id-human-ink` | `#0846C4` | `#8AB4FF` | `#8A2E0A` | `#FFC9B0` | `#2442B8` | `#2442B8` | `#8AB4FF` | `#0846C4` | `#EDEDED` | `#111111` |
| `--as-id-system` | `#FDF3E7` | `rgba(242, 166, 90, .14)` | `#FDF3E7` | `rgba(242, 166, 90, .14)` | `#FDF3E7` | `#FDF3E7` | `rgba(242, 166, 90, .14)` | `#FDF3E7` | `rgba(242, 166, 90, .14)` | `#FDF3E7` |
| `--as-id-system-ink` | `#9A4F0A` | `#F2A65A` | `#9A4F0A` | `#F2A65A` | `#9A4F0A` | `#9A4F0A` | `#F2A65A` | `#9A4F0A` | `#F2A65A` | `#9A4F0A` |
| `--as-id-tool` | `#F2F2F3` | `rgba(255, 255, 255, .07)` | `#F2F2F3` | `rgba(255, 255, 255, .07)` | `#F2F2F3` | `#F2F2F3` | `rgba(255, 255, 255, .07)` | `#F2F2F3` | `rgba(255, 255, 255, .07)` | `#F2F2F3` |
| `--as-id-tool-ink` | `#404040` | `#C8C8CC` | `#404040` | `#C8C8CC` | `#404040` | `#404040` | `#C8C8CC` | `#404040` | `#C8C8CC` | `#404040` |
| `--as-idle` | `#626262` | `#8F8F8F` | `#626262` | `#9AA0AB` | `#626262` | `#626262` | `#8F8F8F` | `#626262` | `#8C8C8C` | `#5C5C5C` |
| `--as-idle-bg` | `rgba(0, 0, 0, .05)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .05)` | `#1F2126` | `rgba(0, 0, 0, .05)` | `rgba(0, 0, 0, .05)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .05)` | `#181818` | `#E0E0E0` |
| `--as-idle-line` | `rgba(0,0,0,.10)` | `rgba(255, 255, 255, .12)` | `rgba(0,0,0,.10)` | `rgba(255, 255, 255, .12)` | `rgba(0,0,0,.10)` | `rgba(0,0,0,.10)` | `rgba(255, 255, 255, .12)` | `rgba(0,0,0,.10)` | `#333` | `#B0B0B0` |
| `--as-input` | — | — | — | — | — | — | `#28282B` | — | — | — |
| `--as-lh-body` | `22px` | `22px` | `22px` | `22px` | `22px` | `22px` | `22px` | `22px` | `22px` | `22px` |
| `--as-lh-display` | `44px` | `44px` | `44px` | `44px` | `44px` | `44px` | `44px` | `44px` | `44px` | `44px` |
| `--as-lh-h1` | `36px` | `36px` | `36px` | `36px` | `36px` | `36px` | `36px` | `36px` | `36px` | `36px` |
| `--as-lh-h2` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` |
| `--as-lh-h3` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` |
| `--as-lh-meta` | `18px` | `18px` | `18px` | `18px` | `18px` | `18px` | `18px` | `18px` | `18px` | `18px` |
| `--as-lh-micro` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` |
| `--as-lh-reading` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` |
| `--as-lh-ui` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` |
| `--as-menu-hover` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .04)` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` | `rgba(0, 0, 0, .04)` |
| `--as-mist` | — | — | — | — | — | — | — | `color-mix(in srgb, #2B76F0 8%, #EEF1F5)` | — | — |
| `--as-muted` | `#616161` | `#A3A3A3` | `#616161` | `#9AA0AB` | `#616161` | `#616161` | `#A1A1AA` | `#616161` | `#A6A6A6` | `#555555` |
| `--as-muted-bg` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .05)` | `#F3F4F6` | `#1F2126` | `#F0F3FB` | `#F0F3FB` | `#2B2B2F` | `rgba(30,55,90,.05)` | `#181818` | `#DEDEDE` |
| `--as-nav-selected-weight` | — | — | — | — | `600` | `600` | `600` | — | — | — |
| `--as-orange` | — | — | — | — | — | — | — | `#F08A3C` | — | — |
| `--as-overlay` | `rgba(0, 0, 0, .20)` | `rgba(0, 0, 0, .55)` | `rgba(20,22,30,.4)` | `rgba(0,0,0,.6)` | `rgba(8,14,40,.4)` | `rgba(8,14,40,.4)` | `rgba(0, 0, 0, .55)` | `rgba(60,85,120,.16)` | `rgba(0,0,0,.6)` | `rgba(17,17,17,.38)` |
| `--as-panel` | `#FCFCFC` | `#121213` | `#FFFFFF` | `#17181C` | `#FFFFFF` | `#FFFFFF` | `#151517` | `rgba(255,255,255,.50)` | `#101010` | `#E8E8E8` |
| `--as-panel-stroke` | `#ECECEC` | `#222224` | `transparent` | `transparent` | `rgba(63,107,255,.12)` | `rgba(63,107,255,.12)` | `#222224` | `rgba(255,255,255,.72)` | `#262626` | `#9C9C9C` |
| `--as-pressed` | `rgba(0, 0, 0, .08)` | `rgba(255, 255, 255, .10)` | `rgba(20,22,30,.08)` | `rgba(255,255,255,.1)` | `rgba(18,24,43,.07)` | `rgba(18,24,43,.07)` | `rgba(255, 255, 255, .10)` | `rgba(255,255,255,.72)` | `#222` | `#D0D0D0` |
| `--as-project-tone-0` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` | `#3E63DD` |
| `--as-project-tone-1` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` | `#7C5CDB` |
| `--as-project-tone-2` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` | `#1F9D63` |
| `--as-project-tone-3` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` | `#D9822B` |
| `--as-project-tone-4` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` | `#D6457A` |
| `--as-project-tone-5` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` | `#0E9AA7` |
| `--as-r-card` | `14px` | `14px` | `18px` | `18px` | `18px` | `18px` | `14px` | `18px` | `0px` | `0px` |
| `--as-r-dec` | `16px` | `16px` | `18px` | `18px` | `18px` | `18px` | `16px` | `20px` | `0px` | `0px` |
| `--as-r-input` | `24px` | `24px` | `999px` | `999px` | `12px` | `12px` | `24px` | `24px` | `0px` | `0px` |
| `--as-r-md` | `8px` | `8px` | `12px` | `12px` | `12px` | `12px` | `8px` | `8px` | `0px` | `0px` |
| `--as-r-panel` | `18px` | `18px` | `20px` | `20px` | `22px` | `22px` | `18px` | `24px` | `0px` | `0px` |
| `--as-r-pill` | `999px` | `999px` | `999px` | `999px` | `999px` | `999px` | `999px` | `999px` | `0px` | `0px` |
| `--as-r-row` | `10px` | `10px` | `12px` | `12px` | `12px` | `12px` | `10px` | `10px` | `0px` | `0px` |
| `--as-r-sm` | `6px` | `6px` | `10px` | `10px` | `10px` | `10px` | `6px` | `6px` | `0px` | `0px` |
| `--as-r-xs` | `4px` | `4px` | `8px` | `8px` | `8px` | `8px` | `4px` | `4px` | `0px` | `0px` |
| `--as-rail-w` | `72px` | `72px` | `72px` | `72px` | `72px` | `72px` | `72px` | `72px` | `72px` | `72px` |
| `--as-reading-w` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` |
| `--as-resize-a` | `#0A59F7` | `#4D8DFF` | `#F2541B` | `#F2541B` | `#3F6BFF` | `#3F6BFF` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `#2B76F0` | `#F2F2F2` | `#FF6B1A` |
| `--as-resize-b` | `#5B5BD6` | `#A5A5FF` | `color-mix(in srgb, #F2541B 50%, #FFC24D)` | `color-mix(in srgb, #F2541B 50%, #FFC24D)` | `color-mix(in srgb, #3F6BFF 55%, #22D3EE)` | `color-mix(in srgb, #3F6BFF 55%, #22D3EE)` | `#A5A5FF` | `#F08A3C` | `#FF5A36` | `#D93A12` |
| `--as-review` | `#5B5BD6` | `#A5A5FF` | `#5B5BD6` | `#B9A2FF` | `#5B5BD6` | `#5B5BD6` | `#A5A5FF` | `#5B5BD6` | `#B8B8FF` | `#4A4AB5` |
| `--as-review-bg` | `rgba(91, 91, 214, .09)` | `rgba(165, 165, 255, .13)` | `rgba(91, 91, 214, .09)` | `rgba(185,162,255,.14)` | `rgba(91, 91, 214, .09)` | `rgba(91, 91, 214, .09)` | `rgba(165, 165, 255, .13)` | `rgba(91, 91, 214, .09)` | `rgba(184,184,255,.10)` | `rgba(74,74,181,.10)` |
| `--as-review-line` | `rgba(91, 91, 214, .24)` | `rgba(165, 165, 255, .28)` | `rgba(91, 91, 214, .24)` | `rgba(185,162,255,.4)` | `rgba(91, 91, 214, .24)` | `rgba(91, 91, 214, .24)` | `rgba(165, 165, 255, .28)` | `rgba(91, 91, 214, .24)` | `rgba(184,184,255,.35)` | `rgba(74,74,181,.35)` |
| `--as-ring` | `0 0 0 1px rgba(10, 10, 10, .06)` | `0 0 0 1px rgba(255, 255, 255, .07)` | `0 0 0 1px rgba(20,22,30,.06)` | `0 0 0 1px rgba(255, 255, 255, .06)` | `0 0 0 1px rgba(30,50,110,.07)` | `0 0 0 1px rgba(30,50,110,.07)` | `0 0 0 1px rgba(255, 255, 255, .07)` | `0 0 0 1px rgba(30,55,90,.06)` | `0 0 0 1px #1D1D1D` | `0 0 0 1px #C0C0C0` |
| `--as-risk-destructive` | `#D93A2B` | `#FF7B72` | `#D93A2B` | `#FF7A6B` | `#D93A2B` | `#D93A2B` | `#FF7B72` | `#D93A2B` | `#FF5A36` | `#C0310F` |
| `--as-risk-risky` | `#9A4D08` | `#F2A65A` | `#9A4D08` | `#FFB84D` | `#9A4D08` | `#9A4D08` | `#F2A65A` | `#9A4D08` | `#FFB020` | `#8A4600` |
| `--as-risk-safe` | `#626262` | `#8F8F8F` | `#626262` | `#9AA0AB` | `#626262` | `#626262` | `#8F8F8F` | `#626262` | `#8C8C8C` | `#5C5C5C` |
| `--as-run` | `#0A59F7` | `#4D8DFF` | `#2B5BE8` | `#6B93FF` | `#3F6BFF` | `#3F6BFF` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `color-mix(in srgb, #2B76F0 78%, #000000)` | `#F2F2F2` | `#B83E00` |
| `--as-run-bg` | `rgba(10, 89, 247, .08)` | `rgba(77, 141, 255, .14)` | `#E4EBFD` | `rgba(107,147,255,.14)` | `color-mix(in srgb, #3F6BFF 10%, #FFFFFF)` | `color-mix(in srgb, #3F6BFF 10%, #FFFFFF)` | `color-mix(in srgb,#3F6BFF 12%,#242427)` | `color-mix(in srgb, #2B76F0 12%, transparent)` | `#1F1F1F` | `color-mix(in srgb, #FF6B1A 14%, transparent)` |
| `--as-run-line` | `rgba(10, 89, 247, .22)` | `rgba(77, 141, 255, .30)` | `rgba(43,91,232,.35)` | `rgba(107,147,255,.4)` | `color-mix(in srgb, #3F6BFF 35%, transparent)` | `color-mix(in srgb, #3F6BFF 35%, transparent)` | `color-mix(in srgb,#3F6BFF 40%,transparent)` | `color-mix(in srgb, #2B76F0 26%, transparent)` | `#4A4A4A` | `color-mix(in srgb, #FF6B1A 50%, transparent)` |
| `--as-segment-selected` | — | `#424248` | — | `#424248` | — | — | `#424248` | — | `#424248` | — |
| `--as-selected` | `rgba(10, 89, 247, .08)` | `rgba(77, 141, 255, .14)` | `#17181C` | `#2C2F37` | `#E6EAF4` | `#E6EAF4` | `color-mix(in srgb,#3F6BFF 12%,#242427)` | `color-mix(in srgb, #2B76F0 12%, transparent)` | `#262626` | `#111111` |
| `--as-selected-bg` | `rgba(10, 89, 247, .08)` | `rgba(77, 141, 255, .14)` | `#17181C` | `#2C2F37` | `#E6EAF4` | `#E6EAF4` | `color-mix(in srgb,#3F6BFF 12%,#242427)` | `color-mix(in srgb, #2B76F0 12%, transparent)` | `#262626` | `#111111` |
| `--as-selected-ink` | `#0846C4` | `#8AB4FF` | `#FFFFFF` | `#F2F3F5` | `#12182B` | `#12182B` | `color-mix(in srgb,#3F6BFF 76%,#FFFFFF)` | `color-mix(in srgb, #2B76F0 78%, #000000)` | `#FFFFFF` | `#FFFFFF` |
| `--as-shadow-card` | `0 1px 1.5px rgba(0, 0, 0, .04), inset 0 -1px 0 rgba(0,0,0,.06)` | `0 1px 1.5px rgba(0,0,0,.30), inset 0 -1px 0 rgba(255,255,255,.04)` | `0 1px 2px rgba(20,22,30,.04), 0 14px 30px -20px rgba(20,22,30,.18)` | `0 1px 2px rgba(0,0,0,.4), 0 14px 30px -20px rgba(0,0,0,.6)` | `none` | `none` | `none` | `0 1px 1.5px rgba(0, 0, 0, .04), inset 0 -1px 0 rgba(0,0,0,.06)` | `none` | `none` |
| `--as-shadow-dialog` | `0 24px 80px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.06)` | `0 24px 80px rgba(0, 0, 0, .55), 0 0 0 1px rgba(255,255,255,.08)` | `0 30px 80px -24px rgba(20,22,30,.4), 0 0 0 1px rgba(20,22,30,.06)` | `0 30px 80px -24px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.08)` | `0 30px 80px -20px rgba(10,20,70,.4), 0 0 0 1px rgba(30,50,110,.1)` | `0 30px 80px -20px rgba(10,20,70,.4), 0 0 0 1px rgba(30,50,110,.1)` | `0 24px 80px rgba(0, 0, 0, .55), 0 0 0 1px rgba(255,255,255,.08)` | `0 28px 80px rgba(31,53,89,.22), 0 0 0 1px rgba(255,255,255,.75), inset 0 1px 0 rgba(255, 255, 255, .9)` | `0 0 0 1px #3B3B3B, 6px 6px 0 0 #000000` | `0 0 0 1px #111111, 8px 8px 0 0 rgba(17,17,17,.16)` |
| `--as-shadow-float` | `0 4px 42px rgba(0,0,0,.06), 0 2px 6px rgba(0, 0, 0, .05), 0 0 0 1px rgba(0,0,0,.06)` | `0 4px 42px rgba(0, 0, 0, .40), 0 0 0 1px rgba(255,255,255,.08)` | `0 18px 44px -14px rgba(20,22,30,.28), 0 0 0 1px rgba(20,22,30,.06)` | `0 18px 44px -14px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08)` | `0 18px 44px -12px rgba(10,20,70,.28), 0 0 0 1px rgba(30,50,110,.1)` | `0 18px 44px -12px rgba(10,20,70,.28), 0 0 0 1px rgba(30,50,110,.1)` | `0 4px 42px rgba(0, 0, 0, .40), 0 0 0 1px rgba(255,255,255,.08)` | `0 20px 56px rgba(31,53,89,.18), 0 0 0 1px rgba(255,255,255,.75), inset 0 1px 0 rgba(255, 255, 255, .9)` | `0 0 0 1px #3B3B3B, 3px 3px 0 0 #000000` | `0 0 0 1px #111111` |
| `--as-shadow-panel` | `0 1px 0 rgba(0, 0, 0, .04), 0 2px 1px -1px rgba(0, 0, 0, .05)` | `0 1px 0 rgba(0,0,0,.45), 0 2px 1px -1px rgba(0,0,0,.50)` | `0 1px 2px rgba(20,22,30,.04), 0 14px 30px -20px rgba(20,22,30,.18)` | `0 1px 2px rgba(20,22,30,.04), 0 14px 30px -20px rgba(20,22,30,.18)` | `none` | `none` | `none` | `0 12px 44px rgba(31,53,89,.10), inset 0 1px 0 rgba(255,255,255,.85)` | `none` | `none` |
| `--as-shadow-pop` | `0 4px 42px rgba(0,0,0,.06), 0 2px 6px rgba(0, 0, 0, .05), 0 0 0 1px rgba(0,0,0,.06)` | `0 4px 42px rgba(0, 0, 0, .40), 0 0 0 1px rgba(255,255,255,.08)` | `0 18px 44px -14px rgba(20,22,30,.28), 0 0 0 1px rgba(20,22,30,.06)` | `0 18px 44px -14px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08)` | `0 18px 44px -12px rgba(10,20,70,.28), 0 0 0 1px rgba(30,50,110,.1)` | `0 18px 44px -12px rgba(10,20,70,.28), 0 0 0 1px rgba(30,50,110,.1)` | `0 4px 42px rgba(0, 0, 0, .40), 0 0 0 1px rgba(255,255,255,.08)` | `0 20px 56px rgba(31,53,89,.18), 0 0 0 1px rgba(255,255,255,.75), inset 0 1px 0 rgba(255, 255, 255, .9)` | `0 0 0 1px #3B3B3B, 3px 3px 0 0 #000000` | `0 0 0 1px #111111` |
| `--as-shadow-tile` | `0 0 0 .5px rgba(0,0,0,.06), 0 1px 1px -1px rgba(0,0,0,.10), 0 1px 2px rgba(0, 0, 0, .05)` | `0 0 0 .5px rgba(255, 255, 255, .10), 0 1px 2px rgba(0, 0, 0, .40)` | `0 1px 2px rgba(20,22,30,.04)` | `0 1px 2px rgba(20,22,30,.04)` | `none` | `none` | `none` | `0 4px 16px rgba(31,53,89,.08), inset 0 1px 0 rgba(255,255,255,.92)` | `inset 0 0 0 1px #2E2E2E` | `inset 0 0 0 1px #A3A3A3` |
| `--as-side-head-h` | — | — | — | — | `calc(48px + 4px)` | `calc(48px + 4px)` | `calc(48px + 4px)` | — | — | — |
| `--as-side-head-offset` | — | — | — | — | `4px` | `4px` | `4px` | — | — | — |
| `--as-side-w` | `240px` | `240px` | `240px` | `240px` | `240px` | `240px` | `240px` | `240px` | `240px` | `240px` |
| `--as-sidebar-w` | `256px` | `256px` | `256px` | `256px` | `256px` | `256px` | `256px` | `256px` | `256px` | `256px` |
| `--as-sky` | — | — | — | — | — | — | — | `color-mix(in srgb, #2B76F0 22%, #FFFFFF)` | — | — |
| `--as-sp-0_5` | `2px` | `2px` | `2px` | `2px` | `2px` | `2px` | `2px` | `2px` | `2px` | `2px` |
| `--as-sp-1` | `4px` | `4px` | `4px` | `4px` | `4px` | `4px` | `4px` | `4px` | `4px` | `4px` |
| `--as-sp-10` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` | `40px` |
| `--as-sp-12` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` | `48px` |
| `--as-sp-16` | `64px` | `64px` | `64px` | `64px` | `64px` | `64px` | `64px` | `64px` | `64px` | `64px` |
| `--as-sp-1_5` | `6px` | `6px` | `6px` | `6px` | `6px` | `6px` | `6px` | `6px` | `6px` | `6px` |
| `--as-sp-2` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` | `8px` |
| `--as-sp-2_5` | `10px` | `10px` | `10px` | `10px` | `10px` | `10px` | `10px` | `10px` | `10px` | `10px` |
| `--as-sp-3` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` | `12px` |
| `--as-sp-3_5` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` | `14px` |
| `--as-sp-4` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` | `16px` |
| `--as-sp-5` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` | `20px` |
| `--as-sp-6` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` | `24px` |
| `--as-sp-7` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` | `28px` |
| `--as-sp-8` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` | `32px` |
| `--as-stage` | `#FAFAFA` | `#1F1F21` | `#E8E9EC` | `#0D0E10` | `#EEF2FB` | `#EEF2FB` | `#151517` | `rgba(255, 255, 255, .40)` | `#0D0D0D` | `#EDEDED` |
| `--as-success` | `#18794E` | `#4CC38A` | `#18794E` | `#5FD39B` | `#18794E` | `#18794E` | `#4CC38A` | `#18794E` | `#7EE2A8` | `#0E6E40` |
| `--as-sunken` | `#F2F2F3` | `#1C1C1E` | `#F3F4F6` | `#1F2126` | `#E9EEFA` | `#E9EEFA` | `#101012` | `rgba(255,255,255,.52)` | `#0D0D0D` | `#DEDEDE` |
| `--as-text` | `#0A0A0A` | `#EDEDED` | `#17181C` | `#F2F3F5` | `#12182B` | `#12182B` | `#F4F4F5` | `#0A0A0A` | `#F0F0F0` | `#111111` |
| `--as-text-2` | `#404040` | `#C8C8CC` | `#3B3E46` | `#CDD0D6` | `#333B55` | `#333B55` | `#D4D4D8` | `#404040` | `#D4D4D4` | `#2E2E2E` |
| `--as-text-3` | `#616161` | `#A3A3A3` | `#616161` | `#9AA0AB` | `#616161` | `#616161` | `#A1A1AA` | `#616161` | `#A6A6A6` | `#555555` |
| `--as-text-invert` | `#FAFAFA` | `#121213` | `#FFFFFF` | `#17181C` | `#FFFFFF` | `#FFFFFF` | `#121213` | `#FAFAFA` | `#0A0A0A` | `#FFFFFF` |
| `--as-text-muted` | `#616161` | `#A3A3A3` | `#616161` | `#9AA0AB` | `#616161` | `#616161` | `#A1A1AA` | `#616161` | `#A6A6A6` | `#555555` |
| `--as-text-subtle` | `rgba(0,0,0,.56)` | `rgba(255,255,255,.56)` | `rgba(0,0,0,.56)` | `#6F7580` | `rgba(0,0,0,.56)` | `rgba(0,0,0,.56)` | `#92929A` | `rgba(0,0,0,.56)` | `#959595` | `#6B6B6B` |
| `--as-thread-w` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` | `760px` |
| `--as-tone-amber` | `#C27A0A` | `#F2BA52` | `#C27A0A` | `#F2BA52` | `#C27A0A` | `#C27A0A` | `#F2BA52` | `#C27A0A` | `#F2BA52` | `#C27A0A` |
| `--as-tone-blue` | `#2F5BEA` | `#86A8FF` | `#2F5BEA` | `#86A8FF` | `#2F5BEA` | `#2F5BEA` | `#86A8FF` | `#2F5BEA` | `#86A8FF` | `#2F5BEA` |
| `--as-tone-green` | `#12874E` | `#62D79C` | `#12874E` | `#62D79C` | `#12874E` | `#12874E` | `#62D79C` | `#12874E` | `#62D79C` | `#12874E` |
| `--as-tone-orange` | `#D4571A` | `#FF9F72` | `#D4571A` | `#FF9F72` | `#D4571A` | `#D4571A` | `#FF9F72` | `#D4571A` | `#FF9F72` | `#D4571A` |
| `--as-tone-slate` | `#475467` | `#B4BECE` | `#475467` | `#B4BECE` | `#475467` | `#475467` | `#B4BECE` | `#475467` | `#B4BECE` | `#475467` |
| `--as-tone-teal` | `#0E8F83` | `#55D6CA` | `#0E8F83` | `#55D6CA` | `#0E8F83` | `#0E8F83` | `#55D6CA` | `#0E8F83` | `#55D6CA` | `#0E8F83` |
| `--as-tone-violet` | `#6A4DE8` | `#B0A2FF` | `#6A4DE8` | `#B0A2FF` | `#6A4DE8` | `#6A4DE8` | `#B0A2FF` | `#6A4DE8` | `#B0A2FF` | `#6A4DE8` |
| `--as-wait` | `#9A4D08` | `#F2A65A` | `#9A4D08` | `#FFB84D` | `#9A4D08` | `#9A4D08` | `#F2A65A` | `#9A4D08` | `#FFB020` | `#8A4600` |
| `--as-wait-bg` | `rgba(214, 125, 20, .10)` | `rgba(242, 166, 90, .13)` | `rgba(214, 125, 20, .10)` | `rgba(255,184,77,.14)` | `rgba(214, 125, 20, .10)` | `rgba(214, 125, 20, .10)` | `rgba(242, 166, 90, .13)` | `color-mix(in srgb, #F08A3C 15%, transparent)` | `rgba(255,176,32,.10)` | `rgba(138,70,0,.10)` |
| `--as-wait-line` | `rgba(214, 125, 20, .28)` | `rgba(242, 166, 90, .30)` | `rgba(214, 125, 20, .28)` | `rgba(255,184,77,.4)` | `rgba(214, 125, 20, .28)` | `rgba(214, 125, 20, .28)` | `rgba(242, 166, 90, .30)` | `color-mix(in srgb, #F08A3C 34%, transparent)` | `rgba(255,176,32,.40)` | `rgba(138,70,0,.4)` |
<!-- /GEN:product-matrix -->

## 6. 颜色与局部变量登记

全量固定色板见附录 A；完整选择器、变量声明、取值和顺序见 [token-inventory.json](build/design-system/token-inventory.json)。该清单包括产品语义、风格种子、局部覆盖及运行时写入槽。

| 分组 | 变量 | 消费规则 |
| --- | --- | --- |
| 表面 | `--as-bg / panel / card / stage / sunken / overlay / input` | canvas → 面板 → 卡片 → 内嵌台面；input 为局部/风格定义 |
| 文字 | `--as-text / text-2 / text-muted / text-subtle / text-invert` | 主/正文/辅助/弱化/反色；弱化不代表免检对比度 |
| 边界 | `--as-border / border-soft / border-strong / panel-stroke` | 分隔/装饰边/交互边/外壳边 |
| 交互 | `--as-hover / pressed / muted-bg / selected / selected-ink / focus-*` | 背景和前景配对，不能只切底色 |
| 品牌 | `--as-brand / brand-hover / brand-soft / brand-line` | 具体颜色可随风格映射，职责稳定 |
| 状态 | `--as-run / wait / review / done / fail / idle`，各配 `-bg / -line` | 执行/待输入/待验收/完成/失败/空闲；看板 waiting 不另用裸金色 |
| 风险 | `--as-risk-safe / risky / destructive` | 引用 idle / wait / fail，不复制色值 |
| 身份 | `--as-id-human / agent / tool / system` 与 `-ink` | 人圆、Agent 方、工具 tile；底与字配对 |
| 代码 | `--as-code-key / str / num / add / del` | 关键字/字符串/数字/Diff 增删；非通用状态标签 |
| 按钮 | `--as-btn-top / bottom / *-hover / edge-* / ring / ink / shadow`、`--as-btn2-bg / ink`、`--as-danger` | 渐变、边缘、阴影整组；危险按钮与失败文字分开 |
| 分类 | `--as-tone-blue / violet / amber / teal / slate / orange / green` | `--tc` 适配；深色使用明度更高的色板种子 |
| 项目 | `--as-project-tone-0…5` | `--pt` 适配；用户自定义颜色优先，不覆盖用户数据 |
| 文件 | `--as-file-ts-bg / ts-ink / md-bg / md-ink` | 后缀徽标；新增格式必须补一对变量 |
| 组件局部 | `--hp-* / --co-* / --tk-accent / --rail-* / --vb-* / --bench-icon / --ab-icon / --tc / --pt / --tint` | 从语义/色板/用户输入派生；不能在业务块内定义固定颜色 |
| 外壳适配 | `--ap-* / --au-* / --bn-* / --glass-* / --card-* / --page-header-bg` | 区分 HSL 数字、RGB 通道、alpha、长度、颜色；禁止把数值 token 当颜色 |
| 图像/算法 | `--as-image-chevron-* / --as-render-*`、位移贴图使用的登记种子 | 图像与算法用途；不替换为状态色或正文色 |

## 7. 排版、几何与布局

| 语义 | 字号 / 行高（px） |
| --- | --- |
| display | 40 / 44 |
| h1 | 28 / 36 |
| h2 | 20 / 28 |
| h3 | 16 / 24 |
| reading | 15 / 24 |
| body | 14 / 22 |
| ui | 13 / 20 |
| meta | 12 / 18 |
| micro | 11 / 16 |

字体以 `--as-font / --as-font-mono` 为准：Inter、苹方、HarmonyOS Sans SC 等回退栈；像素独立覆盖。上述字号是基准设计阶梯，主题或组件的实际覆盖查矩阵/清单。保留显式行高，不与 DevUI 的 1.5 倍行高强行视为等价。

间距包含光学半阶 `--as-sp-0_5 / 1_5 / 2_5 / 3_5`，不能只登记整数 4px 阶梯。圆角按 `xs / sm / md / row / card / dec / panel / input / pill` 分工；基准为 4/6/8/10/14/16/18/24/999px，风格覆盖优先。嵌套内圆角结合外圆角与内边距处理，不逐层机械叠大圆角。

布局尺寸只引用 `--as-rail-w / sidebar-w / head-h / control-h / reading-w / decision-w / frame-gap` 等既有变量。根元素、导航标签、密度与组件局部尺寸存在覆盖，不把“72px 导航宽”写成所有状态不变的常量。

## 8. 阴影、材质与动效

`--as-shadow-card / tile / panel / pop / dialog` 与 `--as-ring` 是整值变量；按钮使用独立 `--as-btn-shadow`。它们可能包含多重阴影，不能拆成一个颜色值替代。玻璃可使用整值 `--as-glass` 或现有分离参数；像素硬投影不混用柔影。

动效使用 `--as-dur-fast / dur / dur-state / dur-expand / dur-enter` 与对应 easing；具体值见矩阵。prefers-reduced-motion 与产品设置都要尊重，逐个检查无限脉冲、旋转、滚动和过渡，不能仅依据 token 当前是 0ms 断言全页无动效。本次未重写动效系统。

## 9. 图表、Trace 与流程

状态类 Trace/Waterfall/看板引用同一状态三件套：执行 run、等待 wait、验收 review、完成 done、失败 fail、空闲 idle。颜色必须伴随标签、图标或纹理。

通用图表主序列引用语义强调色，轴线/标签引用边界与辅助文字；面积填充从同一变量派生 alpha，不在配置对象写 hex。像素图表使用阶梯/方形节点与实色填充。外部 Canvas、ECharts、Monaco 适配器在主题变化后重新读取计算颜色并更新配置；这是一项新组件接入要求，不代表 demo 已包含这些库。

## 10. 组件状态覆盖

| 组件 | 必须检查的颜色状态 |
| --- | --- |
| 主/次/危险按钮 | 默认、hover、pressed、focus-visible、disabled；文字与按钮底成对 |
| 输入/选择/Composer | 默认、hover、焦点、错误、只读、禁用、placeholder |
| Tabs/分段/导航 | 未选、hover、选中、焦点；图标、文字、指示线各自用变量 |
| 卡片/看板/任务 | 默认、hover、选中、拖动、空态、状态图标、列强调 |
| 弹层/菜单/Tooltip/Toast | 表面、文字、遮罩、阴影、选中行；深色与玻璃可读 |
| 附件/代码/Diff | 文件类型底与字、语法色、增删背景、长行 |
| 设置预览/SVG | 固定预览色也必须变量化；不能继承当前深色而丢失“浅色主题预览”的含义 |

## 11. 多栏与响应式

先保留现有侧栏拖动/收起、消息列表、任务详情工具窗与内容区的最小宽度；窄屏通过组件级折叠/滚动处理，避免页面级水平溢出。桌面宽屏按现有内容最大宽度与留白规则，不将某个旧稿的统一宽度覆盖所有页面。

移动端的具体断点和玻璃性能降级属于后续适配规范，当前 demo 主要验证桌面；旧稿“所有主题已支持 <768px”等描述没有本轮证据，不作完成承诺。

## 12. 开发约束与自动检查

```bash
# 从 AgentSpace_pub 仓库根运行
python3 demo-as2/build/sync_build.py
python3 demo-as2/build/audit-colors.py
python3 demo-as2/build/test-color-audit.py
node --test demo-as2/build/build-v36.test.cjs
```

检查覆盖发布单文件、当前模块 CSS/JS、基础 token 与组件文件、内联 SVG/style、裸色 fallback、固定通道及 token 源同步。vendor 官方文件、原始 MVP 备份、图片二进制与历史验证截图不是当前 UI 源；不能因此把它们当作新增硬编码的藏身位置。

新增固定颜色先登记 `palette.css`，选择或补充语义，再引用。新增 JS 色板使用 `asColor()` 读取；保留已存偏好格式。禁止通过尾部加一个“覆盖规则”掩盖前面留下的裸色。

检查器有针对颜色语法的回归用例；它是静态防线，不代替浏览器级联和视觉检查。主题变量可解析也不等于颜色具有正确语义或可访问性。

## 13. 对比度校验

普通文字（包括仍可见的 placeholder）按 **4.5:1**；满足大字条件的文字可按 3:1；必要的非文本控件/状态图形按 **3:1**。不能因为“短词”或“辅助”就把文字阈值降到 3/2。依据：[W3C 文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[非文本对比度](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)。

下表用浏览器解析颜色函数，按 sRGB 相对亮度计算；有透明度先按背景逐层合成。主按钮检测渐变上下两个端点。玻璃表面此处仅按默认纯色 canvas 近似合成，真实壁纸、折射、渐变中间位置、伪元素与所有 hover/focus/disabled 状态仍需要场景级测试。使用未舍入值判断，通过与否不以显示的两位小数四舍五入决定。

<!-- GEN:contrast -->
| 前景 / 背景 | 要求 | 经典浅 | 经典深 | Bento浅 | Bento深 | 幻彩浅 | 幻彩映衬 | 幻彩深 | 玻璃 | 像素深 | 像素浅 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `--as-text/--as-card` | 4.5:1 | 19.80 ✅ | 15.00 ✅ | 17.74 ✅ | 15.98 ✅ | 17.63 ✅ | 17.63 ✅ | 14.26 ✅ | 18.32 ✅ | 16.17 ✅ | 17.47 ✅ |
| `--as-text-2/--as-card` | 4.5:1 | 10.37 ✅ | 10.52 ✅ | 10.70 ✅ | 11.48 ✅ | 11.07 ✅ | 11.07 ✅ | 10.60 ✅ | 9.60 ✅ | 12.43 ✅ | 12.57 ✅ |
| `--as-text-muted/--as-card` | 4.5:1 | 6.19 ✅ | 6.96 ✅ | 6.19 ✅ | 6.75 ✅ | 6.19 ✅ | 6.19 ✅ | 6.12 ✅ | 5.73 ✅ | 7.57 ✅ | 6.90 ✅ |
| `--as-text-subtle/--as-card` | 4.5:1 | 4.95 ✅ | 6.24 ✅ | 4.95 ✅ | 3.83 ⚠ | 4.95 ✅ | 4.95 ✅ | 5.08 ✅ | 4.86 ✅ | 6.15 ✅ | 4.93 ✅ |
| `--as-brand/--as-card` | 4.5:1 | 5.55 ✅ | 5.49 ✅ | 3.47 ⚠ | 8.44 ✅ | 4.41 ⚠ | 4.41 ⚠ | 5.24 ✅ | 5.67 ✅ | 16.46 ✅ | 5.21 ✅ |
| `--as-wait/--as-card` | 4.5:1 | 6.11 ✅ | 8.68 ✅ | 6.11 ✅ | 10.32 ✅ | 6.11 ✅ | 6.11 ✅ | 7.75 ✅ | 5.65 ✅ | 10.07 ✅ | 6.57 ✅ |
| `--as-fail/--as-card` | 4.5:1 | 4.57 ✅ | 6.96 ✅ | 4.57 ✅ | 6.97 ✅ | 4.57 ✅ | 4.57 ✅ | 6.22 ✅ | 4.23 ⚠ | 5.94 ✅ | 5.27 ✅ |
| `--as-done/--as-card` | 4.5:1 | 5.41 ✅ | 7.93 ✅ | 5.41 ✅ | 9.53 ✅ | 5.41 ✅ | 5.41 ✅ | 7.08 ✅ | 5.00 ✅ | 11.69 ✅ | 5.85 ✅ |
| `--as-btn-ink/--as-btn-top` | 4.5:1 | 12.34 ✅ | 17.03 ✅ | 17.74 ✅ | 15.98 ✅ | 12.33 ✅ | 12.33 ✅ | 17.03 ✅ | 12.34 ✅ | 17.68 ✅ | 6.63 ✅ |
| `--as-btn-ink/--as-btn-bottom` | 4.5:1 | 15.79 ✅ | 14.76 ✅ | 17.74 ✅ | 15.98 ✅ | 17.11 ✅ | 17.11 ✅ | 14.76 ✅ | 15.79 ✅ | 17.68 ✅ | 6.63 ✅ |
| `--as-selected-ink/--as-selected` | 4.5:1 | 6.97 ✅ | 6.93 ✅ | 17.74 ✅ | 12.06 ✅ | 14.64 ✅ | 14.64 ✅ | 4.57 ✅ | 5.05 ✅ | 15.13 ✅ | 18.88 ✅ |
<!-- /GEN:contrast -->

⚠ 表示现有默认色值的风险，本次颜色变量化不会自动修复这些颜色。弱化文字不能承载唯一必要信息；发布前按实际文本用途处理。自定义配色及照片壁纸不保证自动满足 WCAG，不再保留旧稿“玻璃误差 ±10%”的无依据结论。

## 14. 文件与维护流程

| 文件 | 职责 |
| --- | --- |
| `index.html` | 当前完整 demo；包含尚未回灌旧 MVP 导入器的最新外观与产品逻辑，是当前整页事实源 |
| `build/design-system/palette.css` | 唯一固定颜色/通道/内嵌箭头图像源 |
| `build/design-system/color-runtime.js` | 为原生输入、Canvas 与存储数据读取色板 |
| `build/design-system/semantic-colors.css` | 分类/文件/项目语义色与兼容桥接 |
| `build/design-system/tokens.css` / `components.css` | 基础 token 与基础组件；完整运行时还有 index 的后置覆盖 |
| `build/as2-bridge.css` | 既有组件适配源；不能单独替代 index 中所有最新风格规则 |
| `build/as2-*.css/js` | 模块源；sync_build.py 只同步有明确 START/END 标记的模块 |
| `build/sync_build.py` | 同步已模块化内容与新色板/运行时/语义层，保留整页其余最新逻辑 |
| `build/refactor-as2.py` | 默认从当前 index 同步并输出完整副本；历史 `--legacy-mvp` 是旧版导入路径，会丢失新外观，不用于发布 |
| `build/audit-colors.py` / `test-color-audit.py` | 固定颜色禁用检查与检查器回归用例 |
| `verification/theme-color-check.js` | 10 组合、4 页面、色板选择与对比度采集；结束恢复演示状态 |
| `build/design-system/theme-snapshots.json` | 最近浏览器采集的根 token/对比度快照 |
| `build/design-system/token-inventory.json` | 按 CSS 选择器登记的声明与 JS 运行时槽 |
| `build/update-design-tables.py` | 从已采集快照和色板更新本文件生成区，不操作独立 DevUI 生成器 |

**避免构建回退**：旧 MVP 备份没有最新版幻彩/Bento/设置逻辑。默认重建入口已改为保留当前 index；如手动指定历史导入模式，不得用其结果覆盖当前发布文件。独立 `devui-multitheme/build.py` 不生成本文，避免再次把产品矩阵覆盖成旧八列表。

更新颜色后：同步 → 静态检查 → 在隔离浏览器运行 theme-color-check.js → 将结果保存为 theme-snapshots.json → 运行 update-design-tables.py → 检查对比度和关键画面。对布局/模式/颜色变化重采样，不能只修改生成表里的数字。

## 15. 与 DevUI 的实际桥接

当前产品只是原型，没有安装完整 ng-devui 组件库。以下是已落地的最小 **产品 → 兼容组件** 别名，未实施的扩展映射不冒充现有变量。

| 兼容变量 | 来源 |
| --- | --- |
| `--devui-brand` | `var(--as-brand)` |
| `--devui-ext-accent` | `var(--as-brand)` |
| `--devui-border-radius-full` | `var(--as-r-pill)` |
| `--devui-list-item-active-bg` | `var(--as-selected)` |
| `--devui-list-item-active-text` | `var(--as-selected-ink)` |

原 demo 的 resize 等规则读取这些组件名，现有了明确来源。不要再新增反向别名把 `--as-brand` 又指回 `--devui-brand`，否则产生循环。

将来真正接入 DevUI 时，按职责适配 global-bg→bg、base-bg→card、text→text、aide-text→text-muted、dividing-line→border；主按钮文字取 btn-ink。字号/行高、整值阴影、九级圆角与材质不能粗暴对齐同名值。官方独立页面仍用官方值；产品嵌入组件读产品值，因此 `#0A0A0A` 与 `#191919` 不再作为两个系统必须择一的“待裁决冲突”。

## 16. 兼容别名与条件变量

为已有引用补齐 `--as-muted / text-3 → text-muted`、`--as-success → done`、`--as-selected-bg → selected`、`--as-card-bg → card`、`--as-shadow-float → shadow-pop`、`--as-side-w → sidebar-w`、`--as-thread-w → reading-w`。这些是兼容入口，新代码仍用右侧正式语义。旧无前缀别名不在本轮强制移除，避免扩大改动；其固定颜色已接入色板。

`--as-input / --as-glass / --as-count-bg / --as-segment-selected / --as-side-head-h` 等可能只在某风格或组件局部定义；使用时提供正确的语义 fallback 或确保处于定义作用域。局部变量继承不是全局默认，根快照的空值不能据此补一个随意颜色。

## 17. 本版审查结论与验证边界

v2.1 的多风格方向正确，但尚不完整：主题计数与默认态冲突、两套 data-theme 协议混用、八列/九列数据源不一致、幻彩浅/映衬合列、变量漏项、桥接待定及色板/阴影/SVG/JS 硬编码都需要补齐。本版统一到当前 demo 的十组合模型，并用实际运行时数据登记颜色。

本轮只进行文档审校、颜色变量化、必要兼容映射与构建保护，没有发布线上、修改用户的已存自定义颜色、重设计布局或宣称全量 WCAG 合格。实际检查结果见 [颜色审校记录](verification/color-audit.md)。

## 附录 A. 固定颜色与图像种子全量映射

此清单与 palette.css 一一对应。值相近但透明度、语法/格式或职责不同的种子保留，避免迁移时改变现有样式或 SVG 替换行为。后续可在有视觉证据时按语义合并，不能在本次机械四舍五入。

<!-- GEN:palette -->
共 843 个登记项（颜色、通道、图像与算法参数合计）。

| 变量 | 唯一原始值 |
| --- | --- |
| `--as-color-white-rgb` | `255,255,255` |
| `--as-color-f5f5f5` | `#F5F5F5` |
| `--as-color-fcfcfc` | `#FCFCFC` |
| `--as-color-white` | `#FFFFFF` |
| `--as-color-fafafa` | `#FAFAFA` |
| `--as-color-f2f2f3` | `#F2F2F3` |
| `--as-color-rgba-0-0-0-p20` | `rgba(0, 0, 0, .20)` |
| `--as-color-0a0a0a` | `#0A0A0A` |
| `--as-color-404040` | `#404040` |
| `--as-color-737373` | `#737373` |
| `--as-color-rgba-0-0-0-p40` | `rgba(0, 0, 0, .40)` |
| `--as-color-e5e5e5` | `#E5E5E5` |
| `--as-color-rgba-10-10-10-p06` | `rgba(10, 10, 10, .06)` |
| `--as-color-rgba-10-10-10-p12` | `rgba(10, 10, 10, .12)` |
| `--as-color-ececec` | `#ECECEC` |
| `--as-color-rgba-0-0-0-p05` | `rgba(0, 0, 0, .05)` |
| `--as-color-rgba-0-0-0-p08` | `rgba(0, 0, 0, .08)` |
| `--as-color-rgba-0-0-0-p04` | `rgba(0, 0, 0, .04)` |
| `--as-color-rgba-10-89-247-p08` | `rgba(10, 89, 247, .08)` |
| `--as-color-0846c4` | `#0846C4` |
| `--as-color-0a59f7` | `#0A59F7` |
| `--as-color-rgba-10-89-247-p10` | `rgba(10, 89, 247, .10)` |
| `--as-color-rgba-10-89-247-p24` | `rgba(10, 89, 247, .24)` |
| `--as-color-rgba-10-89-247-p45` | `rgba(10, 89, 247, .45)` |
| `--as-color-rgba-10-89-247-p12` | `rgba(10, 89, 247, .12)` |
| `--as-color-323137` | `#323137` |
| `--as-color-201e25` | `#201E25` |
| `--as-color-3c3b42` | `#3C3B42` |
| `--as-color-29272f` | `#29272F` |
| `--as-color-4b4951` | `#4B4951` |
| `--as-color-31303a` | `#31303A` |
| `--as-color-18171b` | `#18171B` |
| `--as-color-0d0d0d` | `#0D0D0D` |
| `--as-color-rgba-0-0-0-p10` | `rgba(0,0,0,.10)` |
| `--as-color-d93a2b` | `#D93A2B` |
| `--as-color-rgba-10-89-247-p22` | `rgba(10, 89, 247, .22)` |
| `--as-color-b25b0c` | `#B25B0C` |
| `--as-color-rgba-214-125-20-p10` | `rgba(214, 125, 20, .10)` |
| `--as-color-rgba-214-125-20-p28` | `rgba(214, 125, 20, .28)` |
| `--as-color-5b5bd6` | `#5B5BD6` |
| `--as-color-rgba-91-91-214-p09` | `rgba(91, 91, 214, .09)` |
| `--as-color-rgba-91-91-214-p24` | `rgba(91, 91, 214, .24)` |
| `--as-color-18794e` | `#18794E` |
| `--as-color-rgba-24-121-78-p09` | `rgba(24, 121, 78, .09)` |
| `--as-color-rgba-24-121-78-p22` | `rgba(24, 121, 78, .22)` |
| `--as-color-rgba-217-58-43-p06` | `rgba(217, 58, 43, .06)` |
| `--as-color-rgba-217-58-43-p18` | `rgba(217, 58, 43, .18)` |
| `--as-color-e8eefe` | `#E8EEFE` |
| `--as-color-eeedfb` | `#EEEDFB` |
| `--as-color-4b4bc4` | `#4B4BC4` |
| `--as-color-fdf3e7` | `#FDF3E7` |
| `--as-color-9a4f0a` | `#9A4F0A` |
| `--as-color-rgba-0-0-0-p88` | `rgba(0, 0, 0, .88)` |
| `--as-color-rgba-0-123-172-p9` | `rgba(0, 123, 172, .9)` |
| `--as-color-rgba-24-121-78-p10` | `rgba(24, 121, 78, .10)` |
| `--as-color-rgba-217-58-43-p08` | `rgba(217, 58, 43, .08)` |
| `--as-color-rgba-0-0-0-p06` | `rgba(0,0,0,.06)` |
| `--as-color-rgba-0-0-0-p14` | `rgba(0,0,0,.14)` |
| `--as-color-0c0c0d` | `#0C0C0D` |
| `--as-color-121213` | `#121213` |
| `--as-color-19191b` | `#19191B` |
| `--as-color-1f1f21` | `#1F1F21` |
| `--as-color-1c1c1e` | `#1C1C1E` |
| `--as-color-rgba-0-0-0-p55` | `rgba(0, 0, 0, .55)` |
| `--as-color-ededed` | `#EDEDED` |
| `--as-color-c8c8cc` | `#C8C8CC` |
| `--as-color-8f8f8f` | `#8F8F8F` |
| `--as-color-rgba-255-255-255-p40` | `rgba(255, 255, 255, .40)` |
| `--as-color-262628` | `#262628` |
| `--as-color-rgba-255-255-255-p07` | `rgba(255, 255, 255, .07)` |
| `--as-color-rgba-255-255-255-p14` | `rgba(255, 255, 255, .14)` |
| `--as-color-222224` | `#222224` |
| `--as-color-rgba-255-255-255-p10` | `rgba(255, 255, 255, .10)` |
| `--as-color-rgba-255-255-255-p05` | `rgba(255, 255, 255, .05)` |
| `--as-color-rgba-77-141-255-p14` | `rgba(77, 141, 255, .14)` |
| `--as-color-8ab4ff` | `#8AB4FF` |
| `--as-color-4d8dff` | `#4D8DFF` |
| `--as-color-6fa3ff` | `#6FA3FF` |
| `--as-color-rgba-77-141-255-p30` | `rgba(77, 141, 255, .30)` |
| `--as-color-rgba-77-141-255-p55` | `rgba(77, 141, 255, .55)` |
| `--as-color-rgba-77-141-255-p16` | `rgba(77, 141, 255, .16)` |
| `--as-color-f4f4f5` | `#F4F4F5` |
| `--as-color-e4e4e7` | `#E4E4E7` |
| `--as-color-ececef` | `#ECECEF` |
| `--as-color-f0f0f2` | `#F0F0F2` |
| `--as-color-d4d4d8` | `#D4D4D8` |
| `--as-color-rgba-0-0-0-p60` | `rgba(0, 0, 0, .60)` |
| `--as-color-rgba-0-0-0-p30` | `rgba(0,0,0,.30)` |
| `--as-color-rgba-255-255-255-p06` | `rgba(255, 255, 255, .06)` |
| `--as-color-f2a65a` | `#F2A65A` |
| `--as-color-rgba-242-166-90-p13` | `rgba(242, 166, 90, .13)` |
| `--as-color-rgba-242-166-90-p30` | `rgba(242, 166, 90, .30)` |
| `--as-color-a5a5ff` | `#A5A5FF` |
| `--as-color-rgba-165-165-255-p13` | `rgba(165, 165, 255, .13)` |
| `--as-color-rgba-165-165-255-p28` | `rgba(165, 165, 255, .28)` |
| `--as-color-4cc38a` | `#4CC38A` |
| `--as-color-rgba-76-195-138-p12` | `rgba(76, 195, 138, .12)` |
| `--as-color-rgba-76-195-138-p28` | `rgba(76, 195, 138, .28)` |
| `--as-color-ff7b72` | `#FF7B72` |
| `--as-color-rgba-255-110-100-p08` | `rgba(255, 110, 100, .08)` |
| `--as-color-rgba-255-110-100-p22` | `rgba(255, 110, 100, .22)` |
| `--as-color-rgba-255-255-255-p12` | `rgba(255, 255, 255, .12)` |
| `--as-color-rgba-77-141-255-p18` | `rgba(77, 141, 255, .18)` |
| `--as-color-rgba-165-165-255-p16` | `rgba(165, 165, 255, .16)` |
| `--as-color-b9b9ff` | `#B9B9FF` |
| `--as-color-rgba-242-166-90-p14` | `rgba(242, 166, 90, .14)` |
| `--as-color-rgba-255-255-255-p9` | `rgba(255, 255, 255, .9)` |
| `--as-color-5fc8e8` | `#5FC8E8` |
| `--as-color-rgba-76-195-138-p14` | `rgba(76, 195, 138, .14)` |
| `--as-color-rgba-255-110-100-p12` | `rgba(255, 110, 100, .12)` |
| `--as-color-rgba-255-255-255-p04` | `rgba(255,255,255,.04)` |
| `--as-color-rgba-0-0-0-p45` | `rgba(0,0,0,.45)` |
| `--as-color-rgba-0-0-0-p50` | `rgba(0,0,0,.50)` |
| `--as-color-rgba-255-255-255-p08` | `rgba(255,255,255,.08)` |
| `--as-color-transparent` | `transparent` |
| `--as-color-rgba-0-0-0-p12` | `rgba(0,0,0,.12)` |
| `--as-color-rgba-10-89-247-p25` | `rgba(10,89,247,.25)` |
| `--as-color-rgba-128-128-128-p22` | `rgba(128,128,128,.22)` |
| `--as-color-black` | `#000000` |
| `--as-color-rgba-0-0-0-p2` | `rgba(0,0,0,.2)` |
| `--as-image-chevron-119` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23737373' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` |
| `--as-image-chevron-120` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238F8F8F' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")` |
| `--as-color-rgba-0-0-0-p1` | `rgba(0,0,0,.1)` |
| `--as-color-rgba-0-0-0-p5` | `rgba(0,0,0,.5)` |
| `--as-color-liquid-blue` | `#2B76F0` |
| `--as-color-liquid-orange` | `#F08A3C` |
| `--as-color-eef1f5` | `#EEF1F5` |
| `--as-color-rgba-255-255-255-p50` | `rgba(255,255,255,.50)` |
| `--as-color-rgba-255-255-255-p72` | `rgba(255,255,255,.72)` |
| `--as-color-rgba-255-255-255-p64` | `rgba(255,255,255,.64)` |
| `--as-color-rgba-255-255-255-p52` | `rgba(255,255,255,.52)` |
| `--as-color-rgba-30-55-90-p09` | `rgba(30,55,90,.09)` |
| `--as-color-rgba-30-55-90-p06` | `rgba(30,55,90,.06)` |
| `--as-color-rgba-30-55-90-p15` | `rgba(30,55,90,.15)` |
| `--as-color-rgba-255-255-255-p58` | `rgba(255,255,255,.58)` |
| `--as-color-rgba-30-55-90-p05` | `rgba(30,55,90,.05)` |
| `--as-color-rgba-31-53-89-p10` | `rgba(31,53,89,.10)` |
| `--as-color-rgba-255-255-255-p85` | `rgba(255,255,255,.85)` |
| `--as-color-rgba-31-53-89-p08` | `rgba(31,53,89,.08)` |
| `--as-color-rgba-255-255-255-p92` | `rgba(255,255,255,.92)` |
| `--as-color-rgba-31-53-89-p18` | `rgba(31,53,89,.18)` |
| `--as-color-rgba-255-255-255-p75` | `rgba(255,255,255,.75)` |
| `--as-color-rgba-31-53-89-p22` | `rgba(31,53,89,.22)` |
| `--as-color-rgba-60-85-120-p16` | `rgba(60,85,120,.16)` |
| `--as-color-rgba-255-255-255-p42` | `rgba(255,255,255,.42)` |
| `--as-color-rgba-30-55-90-p07` | `rgba(30,55,90,.07)` |
| `--as-color-rgba-255-255-255-p78` | `rgba(255,255,255,.78)` |
| `--as-color-rgba-255-255-255-p7` | `rgba(255,255,255,.7)` |
| `--as-color-rgba-255-255-255-p8` | `rgba(255,255,255,.8)` |
| `--as-color-rgba-255-255-255-p28` | `rgba(255,255,255,.28)` |
| `--as-color-rgba-255-255-255-p62` | `rgba(255,255,255,.62)` |
| `--as-color-rgba-31-53-89-p05` | `rgba(31,53,89,.05)` |
| `--as-color-rgba-255-255-255-p45` | `rgba(255,255,255,.45)` |
| `--as-color-rgba-255-255-255-p32` | `rgba(255,255,255,.32)` |
| `--as-color-rgba-255-255-255-p6` | `rgba(255,255,255,.6)` |
| `--as-color-rgba-30-55-90-p12` | `rgba(30,55,90,.12)` |
| `--as-color-rgba-31-53-89-p06` | `rgba(31,53,89,.06)` |
| `--as-color-f87171` | `#F87171` |
| `--as-color-fbbf24` | `#FBBF24` |
| `--as-color-34d399` | `#34D399` |
| `--as-color-60a5fa` | `#60A5FA` |
| `--as-color-a78bfa` | `#A78BFA` |
| `--as-color-f472b6` | `#F472B6` |
| `--as-color-ff5a36` | `#FF5A36` |
| `--as-color-101010` | `#101010` |
| `--as-color-262626` | `#262626` |
| `--as-color-141414` | `#141414` |
| `--as-color-rgba-0-0-0-p6` | `rgba(0,0,0,.6)` |
| `--as-color-c2c2c2` | `#C2C2C2` |
| `--as-color-8c8c8c` | `#8C8C8C` |
| `--as-color-5e5e5e` | `#5E5E5E` |
| `--as-color-1d1d1d` | `#1D1D1D` |
| `--as-color-3b3b3b` | `#3B3B3B` |
| `--as-color-1b1b1b` | `#1B1B1B` |
| `--as-color-222222` | `#222` |
| `--as-color-181818` | `#181818` |
| `--as-color-f2f2f2` | `#F2F2F2` |
| `--as-color-1f1f1f` | `#1F1F1F` |
| `--as-color-4a4a4a` | `#4A4A4A` |
| `--as-color-rgba-242-242-242-p10` | `rgba(242,242,242,.10)` |
| `--as-color-1a1a1a` | `#1A1A1A` |
| `--as-color-ffb020` | `#FFB020` |
| `--as-color-rgba-255-176-32-p10` | `rgba(255,176,32,.10)` |
| `--as-color-rgba-255-176-32-p40` | `rgba(255,176,32,.40)` |
| `--as-color-b8b8ff` | `#B8B8FF` |
| `--as-color-rgba-184-184-255-p10` | `rgba(184,184,255,.10)` |
| `--as-color-rgba-184-184-255-p35` | `rgba(184,184,255,.35)` |
| `--as-color-7ee2a8` | `#7EE2A8` |
| `--as-color-rgba-126-226-168-p10` | `rgba(126,226,168,.10)` |
| `--as-color-rgba-126-226-168-p35` | `rgba(126,226,168,.35)` |
| `--as-color-rgba-255-90-54-p10` | `rgba(255,90,54,.10)` |
| `--as-color-rgba-255-90-54-p45` | `rgba(255,90,54,.45)` |
| `--as-color-333333` | `#333` |
| `--as-color-1e1e1e` | `#1E1E1E` |
| `--as-color-2e2e2e` | `#2E2E2E` |
| `--as-color-f0f0f0` | `#F0F0F0` |
| `--as-color-d4d4d4` | `#D4D4D4` |
| `--as-color-a6a6a6` | `#A6A6A6` |
| `--as-color-8a8a8a` | `#8A8A8A` |
| `--as-color-c8c8c8` | `#C8C8C8` |
| `--as-color-a3a3a3` | `#A3A3A3` |
| `--as-color-rgba-255-255-255-p56` | `rgba(255,255,255,.56)` |
| `--as-color-c42e1e` | `#C42E1E` |
| `--as-color-6b6b6b` | `#6B6B6B` |
| `--as-color-rgba-0-0-0-p56` | `rgba(0,0,0,.56)` |
| `--as-color-9a4d08` | `#9A4D08` |
| `--as-color-626262` | `#626262` |
| `--as-color-006a96` | `#006A96` |
| `--as-color-595959` | `#595959` |
| `--as-color-rgba-0-0-0-p62` | `rgba(0,0,0,.62)` |
| `--as-color-616161` | `#616161` |
| `--as-color-rgba-0-0-0-p16` | `rgba(0,0,0,.16)` |
| `--as-color-rgba-255-255-255-p86` | `rgba(255,255,255,.86)` |
| `--as-color-rgba-0-0-0-p24` | `rgba(0,0,0,.24)` |
| `--as-color-rgba-12-14-20-p42` | `rgba(12, 14, 20, .42)` |
| `--as-color-rgba-18-28-48-p38` | `rgba(18, 28, 48, .38)` |
| `--as-color-rgba-0-0-0-p72` | `rgba(0, 0, 0, .72)` |
| `--as-color-rgba-250-251-253-p96` | `rgba(250, 251, 253, .96)` |
| `--as-color-rgba-250-251-253-p97` | `rgba(250, 251, 253, .97)` |
| `--as-color-rgba-30-55-90-p08` | `rgba(30, 55, 90, .08)` |
| `--as-color-aurora-blue` | `#3F6BFF` |
| `--as-color-22d3ee` | `#22D3EE` |
| `--as-color-bento-orange` | `#F2541B` |
| `--as-color-ffc24d` | `#FFC24D` |
| `--as-color-rgba-255-255-255-p16` | `rgba(255,255,255,.16)` |
| `--as-color-rgba-255-255-255-p82` | `rgba(255, 255, 255, .82)` |
| `--as-color-3e63dd` | `#3E63DD` |
| `--as-color-7c5cdb` | `#7C5CDB` |
| `--as-color-1f9d63` | `#1F9D63` |
| `--as-color-d9822b` | `#D9822B` |
| `--as-color-d6457a` | `#D6457A` |
| `--as-color-0e9aa7` | `#0E9AA7` |
| `--as-color-f5a524` | `#F5A524` |
| `--as-color-e08a00` | `#E08A00` |
| `--as-color-rgba-0-0-0-p18` | `rgba(0,0,0,.18)` |
| `--as-color-a0a7b4` | `#A0A7B4` |
| `--as-color-6e9bff` | `#6E9BFF` |
| `--as-color-2f5bea` | `#2F5BEA` |
| `--as-color-9f8cff` | `#9F8CFF` |
| `--as-color-5b45e0` | `#5B45E0` |
| `--as-color-4ade9b` | `#4ADE9B` |
| `--as-color-10a37f` | `#10A37F` |
| `--as-color-ffc27a` | `#FFC27A` |
| `--as-color-ff8fb1` | `#FF8FB1` |
| `--as-color-e0457b` | `#E0457B` |
| `--as-color-5ee0e0` | `#5EE0E0` |
| `--as-color-0ea5b7` | `#0EA5B7` |
| `--as-color-rgba-47-91-234-p16` | `rgba(47, 91, 234, .16)` |
| `--as-color-rgba-91-69-224-p16` | `rgba(91, 69, 224, .16)` |
| `--as-color-rgba-16-163-127-p16` | `rgba(16, 163, 127, .16)` |
| `--as-color-rgba-240-138-60-p18` | `rgba(240, 138, 60, .18)` |
| `--as-color-rgba-224-69-123-p14` | `rgba(224, 69, 123, .14)` |
| `--as-color-rgba-14-165-183-p16` | `rgba(14, 165, 183, .16)` |
| `--as-color-rgba-47-91-234-p06` | `rgba(47, 91, 234, .06)` |
| `--as-color-rgba-140-170-255-p07` | `rgba(140, 170, 255, .07)` |
| `--as-color-rgba-255-255-255-p35` | `rgba(255,255,255,.35)` |
| `--as-color-rgba-20-40-120-p45` | `rgba(20, 40, 120, .45)` |
| `--as-color-rgba-16-24-40-p04` | `rgba(16,24,40,.04)` |
| `--as-color-0e7a55` | `#0E7A55` |
| `--as-color-rgba-16-163-127-p12` | `rgba(16, 163, 127, .12)` |
| `--as-color-5ee0a8` | `#5EE0A8` |
| `--as-color-rgba-16-24-40-p18` | `rgba(16,24,40,.18)` |
| `--as-color-rgba-16-24-40-p22` | `rgba(16,24,40,.22)` |
| `--as-color-rgba-16-24-40-p28` | `rgba(16,24,40,.28)` |
| `--as-color-26272b` | `#26272B` |
| `--as-color-rgba-16-24-40-p2` | `rgba(16,24,40,.2)` |
| `--as-color-rgba-16-24-40-p08` | `rgba(16,24,40,.08)` |
| `--as-color-rgba-40-60-140-p12` | `rgba(40, 60, 140, .12)` |
| `--as-color-f1f1f1` | `#F1F1F1` |
| `--as-color-rgba-16-24-40-p25` | `rgba(16,24,40,.25)` |
| `--as-color-rgba-16-24-40-p06` | `rgba(16,24,40,.06)` |
| `--as-color-f7f7f7` | `#F7F7F7` |
| `--as-color-e6e6e6` | `#E6E6E6` |
| `--as-color-141416` | `#141416` |
| `--as-color-2a2a2d` | `#2A2A2D` |
| `--as-color-0b1530` | `#0B1530` |
| `--as-color-0a0f1e` | `#0A0F1E` |
| `--as-color-rgba-255-255-255-p34` | `rgba(255,255,255,.34)` |
| `--as-color-rgba-255-255-255-p2` | `rgba(255,255,255,.2)` |
| `--as-color-rgba-255-255-255-p38` | `rgba(255,255,255,.38)` |
| `--as-color-2a2a2a` | `#2A2A2A` |
| `--as-color-rgba-16-24-40-p12` | `rgba(16,24,40,.12)` |
| `--as-color-b26a00` | `#B26A00` |
| `--as-color-rgba-245-165-36-p14` | `rgba(245,165,36,.14)` |
| `--as-color-475467` | `#475467` |
| `--as-color-6a4de8` | `#6A4DE8` |
| `--as-color-c27a0a` | `#C27A0A` |
| `--as-color-0e8f83` | `#0E8F83` |
| `--as-color-d4571a` | `#D4571A` |
| `--as-color-12874e` | `#12874E` |
| `--as-color-rgba-16-24-40-p3` | `rgba(16,24,40,.3)` |
| `--as-color-1c1c1f` | `#1C1C1F` |
| `--as-color-rgba-245-165-36-p12` | `rgba(245,165,36,.12)` |
| `--as-color-rgba-91-91-214-p1` | `rgba(91,91,214,.1)` |
| `--as-color-rgba-16-163-127-p1` | `rgba(16,163,127,.1)` |
| `--as-color-rgba-240-68-56-p1` | `rgba(240,68,56,.1)` |
| `--as-color-rgba-16-24-40-p32` | `rgba(16,24,40,.32)` |
| `--as-color-rgba-16-24-40-p35` | `rgba(16,24,40,.35)` |
| `--as-color-1f1f23` | `#1F1F23` |
| `--as-color-fafbfd` | `#FAFBFD` |
| `--as-color-18181b` | `#18181B` |
| `--as-color-d93a12` | `#D93A12` |
| `--as-color-e2e2e2` | `#E2E2E2` |
| `--as-color-e8e8e8` | `#E8E8E8` |
| `--as-color-9c9c9c` | `#9C9C9C` |
| `--as-color-f6f6f6` | `#F6F6F6` |
| `--as-color-dedede` | `#DEDEDE` |
| `--as-color-rgba-17-17-17-p38` | `rgba(17,17,17,.38)` |
| `--as-color-111111` | `#111111` |
| `--as-color-555555` | `#555555` |
| `--as-color-c0c0c0` | `#C0C0C0` |
| `--as-color-6e6e6e` | `#6E6E6E` |
| `--as-color-dadada` | `#DADADA` |
| `--as-color-d0d0d0` | `#D0D0D0` |
| `--as-color-b83e00` | `#B83E00` |
| `--as-color-8f2f00` | `#8F2F00` |
| `--as-color-ff6b1a` | `#FF6B1A` |
| `--as-color-8a4600` | `#8A4600` |
| `--as-color-rgba-138-70-0-p10` | `rgba(138,70,0,.10)` |
| `--as-color-rgba-138-70-0-p4` | `rgba(138,70,0,.4)` |
| `--as-color-4a4ab5` | `#4A4AB5` |
| `--as-color-rgba-74-74-181-p10` | `rgba(74,74,181,.10)` |
| `--as-color-rgba-74-74-181-p35` | `rgba(74,74,181,.35)` |
| `--as-color-0e6e40` | `#0E6E40` |
| `--as-color-rgba-14-110-64-p10` | `rgba(14,110,64,.10)` |
| `--as-color-rgba-14-110-64-p35` | `rgba(14,110,64,.35)` |
| `--as-color-c0310f` | `#C0310F` |
| `--as-color-rgba-192-49-15-p10` | `rgba(192,49,15,.10)` |
| `--as-color-rgba-192-49-15-p4` | `rgba(192,49,15,.4)` |
| `--as-color-5c5c5c` | `#5C5C5C` |
| `--as-color-e0e0e0` | `#E0E0E0` |
| `--as-color-b0b0b0` | `#B0B0B0` |
| `--as-color-dcdcdc` | `#DCDCDC` |
| `--as-color-rgba-17-17-17-p16` | `rgba(17,17,17,.16)` |
| `--as-color-rgba-17-17-17-p055` | `rgba(17,17,17,.055)` |
| `--as-color-cfcfcf` | `#CFCFCF` |
| `--as-color-777777` | `#777` |
| `--as-color-c6c6c6` | `#C6C6C6` |
| `--as-color-b5b5b5` | `#B5B5B5` |
| `--as-color-rgba-17-17-17-p07` | `rgba(17,17,17,.07)` |
| `--as-color-86a8ff` | `#86A8FF` |
| `--as-color-b0a2ff` | `#B0A2FF` |
| `--as-color-f2ba52` | `#F2BA52` |
| `--as-color-55d6ca` | `#55D6CA` |
| `--as-color-b4bece` | `#B4BECE` |
| `--as-color-ff9f72` | `#FF9F72` |
| `--as-color-62d79c` | `#62D79C` |
| `--as-color-bdbdbd` | `#BDBDBD` |
| `--as-color-f4f7fb` | `#F4F7FB` |
| `--as-color-rgba-255-255-255-p66` | `rgba(255,255,255,.66)` |
| `--as-color-rgba-255-255-255-p5` | `rgba(255,255,255,.5)` |
| `--as-color-rgba-255-255-255-p1` | `rgba(255,255,255,.1)` |
| `--as-color-3f3f46` | `#3F3F46` |
| `--as-color-6b6b73` | `#6B6B73` |
| `--as-color-8e8e96` | `#8E8E96` |
| `--as-color-1a9e5c` | `#1A9E5C` |
| `--as-color-d93a3a` | `#D93A3A` |
| `--as-color-7c3aed` | `#7C3AED` |
| `--as-color-c2410c` | `#C2410C` |
| `--as-color-e0ecff` | `#E0ECFF` |
| `--as-color-1d5fd1` | `#1D5FD1` |
| `--as-color-e3f6ea` | `#E3F6EA` |
| `--as-color-1a8c4e` | `#1A8C4E` |
| `--as-color-101113` | `#101113` |
| `--as-color-f2f3f5` | `#F2F3F5` |
| `--as-color-9aa0a8` | `#9AA0A8` |
| `--as-color-26282c` | `#26282C` |
| `--as-color-a6abb3` | `#A6ABB3` |
| `--as-color-2a2c31` | `#2A2C31` |
| `--as-color-8b9098` | `#8B9098` |
| `--as-color-5bd08c` | `#5BD08C` |
| `--as-color-edeef1` | `#EDEEF1` |
| `--as-color-2a2b30` | `#2A2B30` |
| `--as-color-rgba-31-53-89-p04` | `rgba(31,53,89,.04)` |
| `--as-color-4c7df0` | `#4C7DF0` |
| `--as-image-chevron-376` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 17 17 7M8 7h9v9'/%3E%3C/svg%3E")` |
| `--as-color-rgba-31-53-89-p1` | `rgba(31,53,89,.1)` |
| `--as-color-rgba-31-53-89-p14` | `rgba(31,53,89,.14)` |
| `--as-color-rgba-255-255-255-p55` | `rgba(255,255,255,.55)` |
| `--as-color-rgba-31-53-89-p28` | `rgba(31,53,89,.28)` |
| `--as-color-rgba-245-158-11-p14` | `rgba(245,158,11,.14)` |
| `--as-color-a15c00` | `#A15C00` |
| `--as-color-f59e0b` | `#F59E0B` |
| `--as-color-rgba-22-163-74-p12` | `rgba(22,163,74,.12)` |
| `--as-color-15803d` | `#15803D` |
| `--as-color-22c55e` | `#22C55E` |
| `--as-color-rgba-31-53-89-p2` | `rgba(31,53,89,.2)` |
| `--as-color-rgba-255-255-255-p96` | `rgba(255,255,255,.96)` |
| `--as-color-rgba-28-28-31-p96` | `rgba(28,28,31,.96)` |
| `--as-color-rgba-255-255-255-p97` | `rgba(255,255,255,.97)` |
| `--as-color-rgba-28-28-31-p97` | `rgba(28,28,31,.97)` |
| `--as-color-rgba-30-55-90-p11` | `rgba(30,55,90,.11)` |
| `--as-color-rgba-255-255-255-p09` | `rgba(255,255,255,.09)` |
| `--as-color-rgba-30-40-60-p14` | `rgba(30,40,60,.14)` |
| `--as-color-rgba-30-40-60-p22` | `rgba(30,40,60,.22)` |
| `--as-color-rgba-30-40-60-p24` | `rgba(30,40,60,.24)` |
| `--as-color-2b6cff` | `#2B6CFF` |
| `--as-color-7c5ce0` | `#7C5CE0` |
| `--as-color-6fa1ff` | `#6FA1FF` |
| `--as-color-b39bff` | `#B39BFF` |
| `--as-color-101012` | `#101012` |
| `--as-color-rgba-30-40-60-p1` | `rgba(30,40,60,.1)` |
| `--as-color-rgba-10-89-247-p14` | `rgba(10,89,247,.14)` |
| `--as-color-f43f5e` | `#f43f5e` |
| `--as-color-06b6d4` | `#06b6d4` |
| `--as-color-6366f1` | `#6366f1` |
| `--as-color-d946ef` | `#d946ef` |
| `--as-color-070b16` | `#070B16` |
| `--as-color-eef2fb` | `#EEF2FB` |
| `--as-color-rgba-63-107-255-p12` | `rgba(63,107,255,.12)` |
| `--as-color-e9eefa` | `#E9EEFA` |
| `--as-color-rgba-8-14-40-p4` | `rgba(8,14,40,.4)` |
| `--as-color-12182b` | `#12182B` |
| `--as-color-333b55` | `#333B55` |
| `--as-color-636c86` | `#636C86` |
| `--as-color-8791ab` | `#8791AB` |
| `--as-color-rgba-30-50-110-p12` | `rgba(30,50,110,.12)` |
| `--as-color-rgba-30-50-110-p07` | `rgba(30,50,110,.07)` |
| `--as-color-rgba-30-50-110-p22` | `rgba(30,50,110,.22)` |
| `--as-color-rgba-18-24-43-p035` | `rgba(18,24,43,.035)` |
| `--as-color-rgba-18-24-43-p07` | `rgba(18,24,43,.07)` |
| `--as-color-f0f3fb` | `#F0F3FB` |
| `--as-color-e6eaf4` | `#E6EAF4` |
| `--as-color-rgba-30-40-80-p28` | `rgba(30,40,80,.28)` |
| `--as-color-2c344c` | `#2C344C` |
| `--as-color-161b2c` | `#161B2C` |
| `--as-color-38425e` | `#38425E` |
| `--as-color-1c2236` | `#1C2236` |
| `--as-color-0e121f` | `#0E121F` |
| `--as-color-rgba-22-27-44-p4` | `rgba(22,27,44,.4)` |
| `--as-color-rgba-12-16-32-p6` | `rgba(12,16,32,.6)` |
| `--as-color-e6ecff` | `#E6ECFF` |
| `--as-color-2442b8` | `#2442B8` |
| `--as-color-rgba-18-24-43-p06` | `rgba(18,24,43,.06)` |
| `--as-color-rgba-30-50-110-p06` | `rgba(30,50,110,.06)` |
| `--as-color-rgba-10-20-70-p28` | `rgba(10,20,70,.28)` |
| `--as-color-rgba-30-50-110-p1` | `rgba(30,50,110,.1)` |
| `--as-color-rgba-10-20-70-p4` | `rgba(10,20,70,.4)` |
| `--as-color-0b1020` | `#0B1020` |
| `--as-color-f7f9fe` | `#F7F9FE` |
| `--as-color-rgba-18-24-43-p28` | `rgba(18,24,43,.28)` |
| `--as-color-rgba-63-107-255-p045` | `rgba(63,107,255,.045)` |
| `--as-color-rgba-30-50-110-p08` | `rgba(30,50,110,.08)` |
| `--as-color-rgba-20-30-90-p12` | `rgba(20,30,90,.12)` |
| `--as-color-1b2133` | `#1B2133` |
| `--as-color-e11d48` | `#E11D48` |
| `--as-color-rgba-255-255-255-p95` | `rgba(255,255,255,.95)` |
| `--as-color-rgba-255-255-255-p98` | `rgba(255,255,255,.98)` |
| `--as-color-f2f5ff` | `#F2F5FF` |
| `--as-color-rgba-242-245-255-p84` | `rgba(242,245,255,.84)` |
| `--as-color-rgba-242-245-255-p68` | `rgba(242,245,255,.68)` |
| `--as-color-rgba-242-245-255-p72` | `rgba(242,245,255,.72)` |
| `--as-color-rgba-242-245-255-p6` | `rgba(242,245,255,.6)` |
| `--as-color-rgba-40-70-200-p5` | `rgba(40,70,200,.5)` |
| `--as-color-d5dcef` | `#D5DCEF` |
| `--as-color-rgba-30-40-80-p16` | `rgba(30,40,80,.16)` |
| `--as-color-f1f3f9` | `#F1F3F9` |
| `--as-color-rgba-18-24-43-p18` | `rgba(18,24,43,.18)` |
| `--as-color-rgba-120-150-255-p34` | `rgba(120,150,255,.34)` |
| `--as-color-rgba-120-150-255-p18` | `rgba(120,150,255,.18)` |
| `--as-color-rgba-170-195-255-p34` | `rgba(170,195,255,.34)` |
| `--as-color-rgba-5-10-40-p7` | `rgba(5,10,40,.7)` |
| `--as-color-rgba-120-150-255-p14` | `rgba(120,150,255,.14)` |
| `--as-color-rgba-160-185-255-p22` | `rgba(160,185,255,.22)` |
| `--as-color-rgba-255-255-255-p17` | `rgba(255,255,255,.17)` |
| `--as-color-rgba-255-255-255-p22` | `rgba(255,255,255,.22)` |
| `--as-color-f7f8fc` | `#F7F8FC` |
| `--as-color-f5f6fa` | `#F5F6FA` |
| `--as-color-rgba-12-16-32-p65` | `rgba(12,16,32,.65)` |
| `--as-color-rgba-242-245-255-p55` | `rgba(242,245,255,.55)` |
| `--as-color-rgba-255-255-255-p18` | `rgba(255,255,255,.18)` |
| `--as-color-959595` | `#959595` |
| `--as-color-rgba-255-255-255-p24` | `rgba(255,255,255,.24)` |
| `--as-color-17181c` | `#17181C` |
| `--as-color-e8e9ec` | `#E8E9EC` |
| `--as-color-rgba-20-22-30-p22` | `rgba(20,22,30,.22)` |
| `--as-color-f3f4f6` | `#F3F4F6` |
| `--as-color-rgba-20-22-30-p4` | `rgba(20,22,30,.4)` |
| `--as-color-3b3e46` | `#3B3E46` |
| `--as-color-6c7078` | `#6C7078` |
| `--as-color-8a9099` | `#8A9099` |
| `--as-color-rgba-20-22-30-p09` | `rgba(20,22,30,.09)` |
| `--as-color-rgba-20-22-30-p06` | `rgba(20,22,30,.06)` |
| `--as-color-rgba-20-22-30-p18` | `rgba(20,22,30,.18)` |
| `--as-color-rgba-20-22-30-p045` | `rgba(20,22,30,.045)` |
| `--as-color-rgba-20-22-30-p08` | `rgba(20,22,30,.08)` |
| `--as-color-2b5be8` | `#2B5BE8` |
| `--as-color-rgba-43-91-232-p2` | `rgba(43,91,232,.2)` |
| `--as-color-e4ebfd` | `#E4EBFD` |
| `--as-color-rgba-43-91-232-p35` | `rgba(43,91,232,.35)` |
| `--as-color-ffe3d6` | `#FFE3D6` |
| `--as-color-8a2e0a` | `#8A2E0A` |
| `--as-color-dde6fd` | `#DDE6FD` |
| `--as-color-1f3fa8` | `#1F3FA8` |
| `--as-color-rgba-20-22-30-p04` | `rgba(20,22,30,.04)` |
| `--as-color-rgba-20-22-30-p28` | `rgba(20,22,30,.28)` |
| `--as-color-rgba-20-22-30-p26` | `rgba(20,22,30,.26)` |
| `--as-color-rgba-20-22-30-p05` | `rgba(20,22,30,.05)` |
| `--as-color-rgba-20-22-30-p3` | `rgba(20,22,30,.3)` |
| `--as-color-e3e5ea` | `#E3E5EA` |
| `--as-color-2b2e37` | `#2B2E37` |
| `--as-color-rgba-20-22-30-p12` | `rgba(20,22,30,.12)` |
| `--as-color-rgba-20-22-30-p2` | `rgba(20,22,30,.2)` |
| `--as-color-e5392b` | `#E5392B` |
| `--as-color-f5f6f8` | `#F5F6F8` |
| `--as-color-eceef2` | `#ECEEF2` |
| `--as-color-f1f2f5` | `#F1F2F5` |
| `--as-color-f7f8fa` | `#F7F8FA` |
| `--as-color-f0f1f4` | `#F0F1F4` |
| `--as-color-0d0e10` | `#0D0E10` |
| `--as-color-1f2126` | `#1F2126` |
| `--as-color-2c2f37` | `#2C2F37` |
| `--as-color-262930` | `#262930` |
| `--as-color-1c1e23` | `#1C1E23` |
| `--as-color-cdd0d6` | `#CDD0D6` |
| `--as-color-9aa0ab` | `#9AA0AB` |
| `--as-color-6f7580` | `#6F7580` |
| `--as-color-6b93ff` | `#6B93FF` |
| `--as-color-rgba-107-147-255-p14` | `rgba(107,147,255,.14)` |
| `--as-color-rgba-107-147-255-p4` | `rgba(107,147,255,.4)` |
| `--as-color-3a2a22` | `#3A2A22` |
| `--as-color-ffc9b0` | `#FFC9B0` |
| `--as-color-222b44` | `#222B44` |
| `--as-color-b8ccff` | `#B8CCFF` |
| `--as-color-ffb84d` | `#FFB84D` |
| `--as-color-rgba-255-184-77-p14` | `rgba(255,184,77,.14)` |
| `--as-color-rgba-255-184-77-p4` | `rgba(255,184,77,.4)` |
| `--as-color-b9a2ff` | `#B9A2FF` |
| `--as-color-rgba-185-162-255-p14` | `rgba(185,162,255,.14)` |
| `--as-color-rgba-185-162-255-p4` | `rgba(185,162,255,.4)` |
| `--as-color-5fd39b` | `#5FD39B` |
| `--as-color-rgba-95-211-155-p14` | `rgba(95,211,155,.14)` |
| `--as-color-rgba-95-211-155-p4` | `rgba(95,211,155,.4)` |
| `--as-color-ff7a6b` | `#FF7A6B` |
| `--as-color-rgba-255-122-107-p14` | `rgba(255,122,107,.14)` |
| `--as-color-rgba-255-122-107-p4` | `rgba(255,122,107,.4)` |
| `--as-color-rgba-107-147-255-p28` | `rgba(107,147,255,.28)` |
| `--as-color-rgba-0-0-0-p4` | `rgba(0,0,0,.4)` |
| `--as-color-rgba-0-0-0-p7` | `rgba(0,0,0,.7)` |
| `--as-color-rgba-0-0-0-p8` | `rgba(0,0,0,.8)` |
| `--as-color-1d1f24` | `#1D1F24` |
| `--as-color-8fadff` | `#8FADFF` |
| `--as-color-25272d` | `#25272D` |
| `--as-color-f1f1f2` | `#F1F1F2` |
| `--as-color-rgba-16-24-40-p07` | `rgba(16,24,40,.07)` |
| `--as-color-f7f7f8` | `#F7F7F8` |
| `--as-color-c9c9cf` | `#C9C9CF` |
| `--as-color-rgba-16-24-40-p05` | `rgba(16,24,40,.05)` |
| `--as-color-1e1e22` | `#1E1E22` |
| `--as-color-1b1b1d` | `#1B1B1D` |
| `--as-color-4a4a50` | `#4A4A50` |
| `--as-color-3a3a40` | `#3A3A40` |
| `--as-color-34343a` | `#34343A` |
| `--as-color-242428` | `#242428` |
| `--as-color-rgba-255-255-255-p3` | `rgba(255,255,255,.3)` |
| `--as-color-rgba-0-0-0-p25` | `rgba(0,0,0,.25)` |
| `--as-color-c9c9c9` | `#C9C9C9` |
| `--as-color-eaeaea` | `#EAEAEA` |
| `--as-color-rgba-0-0-0-p35` | `rgba(0,0,0,.35)` |
| `--as-color-120c24` | `#120C24` |
| `--as-color-0e0a1c` | `#0E0A1C` |
| `--as-color-d9e0f2` | `#D9E0F2` |
| `--as-color-d5d8de` | `#D5D8DE` |
| `--as-color-e6e8ed` | `#E6E8ED` |
| `--as-color-f2f3f6` | `#F2F3F6` |
| `--as-color-4a4d55` | `#4A4D55` |
| `--as-image-chevron-567` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236C7078' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` |
| `--as-image-chevron-568` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239AA0AB' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` |
| `--as-color-eef0f4` | `#eef0f4` |
| `--as-color-d93025` | `#D93025` |
| `--as-color-7c4dbd` | `#7C4DBD` |
| `--as-color-rgba-0-0-0-p03` | `rgba(0,0,0,.03)` |
| `--as-color-rgba-0-0-0-p22` | `rgba(0,0,0,.22)` |
| `--as-color-rgba-30-50-90-p06` | `rgba(30,50,90,.06)` |
| `--as-color-rgba-255-255-255-p94` | `rgba(255,255,255,.94)` |
| `--as-color-rgba-30-50-90-p24` | `rgba(30,50,90,.24)` |
| `--as-color-rgba-255-255-255-p26` | `rgba(255,255,255,.26)` |
| `--as-color-rgba-30-50-90-p25` | `rgba(30,50,90,.25)` |
| `--as-color-rgba-30-50-90-p3` | `rgba(30,50,90,.3)` |
| `--as-color-rgba-255-255-255-p4` | `rgba(255,255,255,.4)` |
| `--as-color-rgba-255-255-255-p13` | `rgba(255,255,255,.13)` |
| `--as-color-30323a` | `#30323A` |
| `--as-color-2e7d52` | `#2E7D52` |
| `--as-color-b45309` | `#B45309` |
| `--as-color-1d1d1f` | `#1d1d1f` |
| `--as-color-eef2ff` | `#eef2ff` |
| `--as-color-e8e8ea` | `#e8e8ea` |
| `--as-color-23304f` | `#23304f` |
| `--as-color-rgba-16-20-32-p56` | `rgba(16, 20, 32, .56)` |
| `--as-color-rgba-0-0-0-p28` | `rgba(0,0,0,.28)` |
| `--as-color-8a8f98` | `#8a8f98` |
| `--as-color-6b7077` | `#6b7077` |
| `--as-color-e3e5e8` | `#e3e5e8` |
| `--as-color-d5d8dd` | `#d5d8dd` |
| `--as-color-5f646b` | `#5f646b` |
| `--as-color-dfe2e6` | `#dfe2e6` |
| `--as-color-1f2024` | `#1f2024` |
| `--as-color-f2f2f4` | `#f2f2f4` |
| `--as-color-a4a8b0` | `#a4a8b0` |
| `--as-color-2b2d33` | `#2b2d33` |
| `--as-color-3a3c44` | `#3a3c44` |
| `--as-color-2c3a5c` | `#2c3a5c` |
| `--as-color-rgba-0-0-0-p38` | `rgba(0,0,0,.38)` |
| `--as-color-rgba-12-15-26-p62` | `rgba(12,15,26,.62)` |
| `--as-color-f0f1f3` | `#f0f1f3` |
| `--as-color-rgba-10-89-247-p1` | `rgba(10,89,247,.1)` |
| `--as-color-9aa0a6` | `#9AA0A6` |
| `--as-color-18a058` | `#18A058` |
| `--as-color-b4b8be` | `#B4B8BE` |
| `--as-color-202127` | `#202127` |
| `--as-color-f6f6f8` | `#f6f6f8` |
| `--as-color-rgba-242-245-255-p62` | `rgba(242,245,255,.62)` |
| `--as-color-rgba-242-245-255-p5` | `rgba(242,245,255,.5)` |
| `--as-color-a9bbff` | `#A9BBFF` |
| `--as-color-rgba-242-245-255-p7` | `rgba(242,245,255,.7)` |
| `--as-image-chevron-616` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8f98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E")` |
| `--as-color-cfd3d9` | `#cfd3d9` |
| `--as-color-1fa79a` | `#1FA79A` |
| `--as-color-b5651d` | `#B5651D` |
| `--as-color-rgba-242-245-255-p78` | `rgba(242,245,255,.78)` |
| `--as-color-f3f6ff` | `#F3F6FF` |
| `--as-color-e4eafa` | `#E4EAFA` |
| `--as-color-16213e` | `#16213E` |
| `--as-color-rgba-22-33-62-p84` | `rgba(22,33,62,.84)` |
| `--as-color-rgba-22-33-62-p66` | `rgba(22,33,62,.66)` |
| `--as-color-rgba-22-33-62-p68` | `rgba(22,33,62,.68)` |
| `--as-color-rgba-22-33-62-p52` | `rgba(22,33,62,.52)` |
| `--as-color-rgba-22-33-62-p1` | `rgba(22,33,62,.1)` |
| `--as-color-rgba-22-33-62-p06` | `rgba(22,33,62,.06)` |
| `--as-color-rgba-22-33-62-p2` | `rgba(22,33,62,.2)` |
| `--as-color-rgba-22-22-26-p06` | `rgba(22,22,26,.06)` |
| `--as-color-62626a` | `#62626A` |
| `--as-color-rgba-255-255-255-p65` | `rgba(255,255,255,.65)` |
| `--as-color-rgba-22-33-62-p12` | `rgba(22,33,62,.12)` |
| `--as-color-rgba-22-33-62-p25` | `rgba(22,33,62,.25)` |
| `--as-color-rgba-22-33-62-p4` | `rgba(22,33,62,.4)` |
| `--as-color-rgba-22-33-62-p5` | `rgba(22,33,62,.5)` |
| `--as-color-rgba-22-33-62-p09` | `rgba(22,33,62,.09)` |
| `--as-color-rgba-22-33-62-p16` | `rgba(22,33,62,.16)` |
| `--as-color-rgba-22-33-62-p22` | `rgba(22,33,62,.22)` |
| `--as-color-rgba-22-33-62-p62` | `rgba(22,33,62,.62)` |
| `--as-color-rgba-22-33-62-p7` | `rgba(22,33,62,.7)` |
| `--as-color-rgba-22-33-62-p58` | `rgba(22,33,62,.58)` |
| `--as-color-rgba-22-33-62-p55` | `rgba(22,33,62,.55)` |
| `--as-color-rgba-22-33-62-p14` | `rgba(22,33,62,.14)` |
| `--as-color-rgba-22-33-62-p78` | `rgba(22,33,62,.78)` |
| `--as-color-rgba-22-33-62-p04` | `rgba(22,33,62,.04)` |
| `--as-color-f6f8ff` | `#F6F8FF` |
| `--as-color-e6ecfb` | `#E6ECFB` |
| `--as-color-rgba-22-33-62-p6` | `rgba(22,33,62,.6)` |
| `--as-color-rgba-22-33-62-p72` | `rgba(22,33,62,.72)` |
| `--as-color-rgba-22-33-62-p07` | `rgba(22,33,62,.07)` |
| `--as-color-rgba-22-33-62-p05` | `rgba(22,33,62,.05)` |
| `--as-color-rgba-22-33-62-p08` | `rgba(22,33,62,.08)` |
| `--as-color-rgba-22-33-62-p64` | `rgba(22,33,62,.64)` |
| `--as-color-rgba-22-33-62-p74` | `rgba(22,33,62,.74)` |
| `--as-color-rgba-22-33-62-p18` | `rgba(22,33,62,.18)` |
| `--as-color-111a33` | `#111A33` |
| `--as-color-rgba-17-26-51-p9` | `rgba(17,26,51,.9)` |
| `--as-color-rgba-17-26-51-p76` | `rgba(17,26,51,.76)` |
| `--as-color-rgba-17-26-51-p78` | `rgba(17,26,51,.78)` |
| `--as-color-rgba-17-26-51-p7` | `rgba(17,26,51,.7)` |
| `--as-color-rgba-17-26-51-p82` | `rgba(17,26,51,.82)` |
| `--as-color-rgba-17-26-51-p8` | `rgba(17,26,51,.8)` |
| `--as-color-rgba-17-26-51-p6` | `rgba(17,26,51,.6)` |
| `--as-color-eaeffc` | `#EAEFFC` |
| `--as-color-f3f5fc` | `#F3F5FC` |
| `--as-color-eceff9` | `#ECEFF9` |
| `--as-color-3478f6` | `#3478f6` |
| `--as-color-8b5bd6` | `#8b5bd6` |
| `--as-color-168d84` | `#168d84` |
| `--as-color-b5791c` | `#b5791c` |
| `--as-color-1d232d` | `#1d232d` |
| `--as-color-404852` | `#404852` |
| `--as-color-626c78` | `#626c78` |
| `--as-color-rgba-28-42-64-p06` | `rgba(28,42,64,.06)` |
| `--as-color-rgba-250-252-255-p98` | `rgba(250,252,255,.98)` |
| `--as-color-rgba-22-38-68-p24` | `rgba(22,38,68,.24)` |
| `--as-color-rgba-30-45-70-p08` | `rgba(30,45,70,.08)` |
| `--as-color-e9ac13` | `#e9ac13` |
| `--as-color-5688ff` | `#5688ff` |
| `--as-color-25a998` | `#25a998` |
| `--as-color-a57bea` | `#a57bea` |
| `--as-color-dca735` | `#dca735` |
| `--as-color-d74747` | `#d74747` |
| `--as-color-rgba-30-25-15-p05` | `rgba(30,25,15,.05)` |
| `--as-color-rgba-18-24-43-p12` | `rgba(18,24,43,.12)` |
| `--as-color-rgba-18-24-43-p22` | `rgba(18,24,43,.22)` |
| `--as-color-9266d9` | `#9266d9` |
| `--as-color-rgba-146-102-217-p1` | `rgba(146,102,217,.1)` |
| `--as-color-c65496` | `#C65496` |
| `--as-color-d68622` | `#D68622` |
| `--as-color-5d71c9` | `#5D71C9` |
| `--as-color-6574d9` | `#6574d9` |
| `--as-color-9565d4` | `#9565d4` |
| `--as-color-cf8a35` | `#cf8a35` |
| `--as-color-269e98` | `#269e98` |
| `--as-color-5186d7` | `#5186d7` |
| `--as-color-1b1b1e` | `#1B1B1E` |
| `--as-color-151517` | `#151517` |
| `--as-color-1a1a1d` | `#1A1A1D` |
| `--as-color-242427` | `#242427` |
| `--as-color-232326` | `#232326` |
| `--as-color-2b2b2f` | `#2B2B2F` |
| `--as-color-a1a1aa` | `#A1A1AA` |
| `--as-color-92929a` | `#92929A` |
| `--as-color-28282b` | `#28282B` |
| `--as-color-1d1d20` | `#1D1D20` |
| `--as-color-424248` | `#424248` |
| `--as-color-3d3d43` | `#3D3D43` |
| `--as-color-29292d` | `#29292D` |
| `--as-color-rgba-245-247-252-p46` | `rgba(245,247,252,.46)` |
| `--as-color-rgba-17-20-32-p97` | `rgba(17,20,32,.97)` |
| `--as-color-rgba-9-12-21-p98` | `rgba(9,12,21,.98)` |
| `--as-color-rgba-27-27-30-p72` | `rgba(27,27,30,.72)` |
| `--as-color-f1f3f7` | `#F1F3F7` |
| `--as-color-rgba-18-22-34-p2` | `rgba(18,22,34,.2)` |
| `--as-color-rgba-18-22-34-p06` | `rgba(18,22,34,.06)` |
| `--as-color-rgba-120-132-155-p12` | `rgba(120,132,155,.12)` |
| `--as-color-rgba-40-40-45-p48` | `rgba(40,40,45,.48)` |
| `--as-color-rgba-0-0-0-p055` | `rgba(0,0,0,.055)` |
| `--as-color-18203a26` | `#18203a26` |
| `--as-color-11182733` | `#11182733` |
| `--as-color-10182b26` | `#10182b26` |
| `--as-color-fafcff` | `#fafcff` |
| `--as-color-18a06b` | `#18a06b` |
| `--as-color-e8ebf4` | `#E8EBF4` |
| `--as-color-f8faff` | `#F8FAFF` |
| `--as-color-c8cede` | `#C8CEDE` |
| `--as-color-d8defa` | `#D8DEFA` |
| `--as-color-f2daef` | `#F2DAEF` |
| `--as-color-37373d` | `#37373D` |
| `--as-color-21335d` | `#21335D` |
| `--as-color-b7c1d5` | `#B7C1D5` |
| `--as-color-dfdfe3` | `#DFDFE3` |
| `--as-color-ffffff88` | `#FFFFFF88` |
| `--as-color-ffffffbb` | `#FFFFFFBB` |
| `--as-color-b7c3d7` | `#B7C3D7` |
| `--as-color-87b4f4` | `#87B4F4` |
| `--as-color-f4e1d1` | `#F4E1D1` |
| `--as-color-dedee0` | `#DEDEE0` |
| `--as-color-c9c9cd` | `#C9C9CD` |
| `--as-color-e7e7e7` | `#E7E7E7` |
| `--as-color-999999` | `#999999` |
| `--as-color-168452` | `#168452` |
| `--as-color-8060d0` | `#8060d0` |
| `--as-color-c38315` | `#c38315` |
| `--as-color-rgba-248-250-253-p94` | `rgba(248,250,253,.94)` |
| `--as-color-rgba-24-26-30-p96` | `rgba(24,26,30,.96)` |
| `--as-color-rgba-18-24-43-p14` | `rgba(18,24,43,.14)` |
| `--as-color-f0f4ff` | `#f0f4ff` |
| `--as-color-d4dfff` | `#d4dfff` |
| `--as-color-82d0b0` | `#82d0b0` |
| `--as-color-ffb59a` | `#ffb59a` |
| `--as-color-ffd488` | `#ffd488` |
| `--as-color-e0e8f8` | `#e0e8f8` |
| `--as-color-fff0e8` | `#fff0e8` |
| `--as-color-e89a74` | `#e89a74` |
| `--as-color-d9e3f5` | `#d9e3f5` |
| `--as-color-dce9e3` | `#dce9e3` |
| `--as-color-e7f7ef` | `#e7f7ef` |
| `--as-color-40a481` | `#40a481` |
| `--as-color-dce8e3` | `#dce8e3` |
| `--as-color-6654e8` | `#6654e8` |
| `--as-color-9cb7ff` | `#9cb7ff` |
| `--as-color-bdcdf8` | `#bdcdf8` |
| `--as-color-0039ff` | `#0039FF` |
| `--as-color-2ae9cb` | `#2AE9CB` |
| `--as-color-23adff` | `#23ADFF` |
| `--as-color-a165ff` | `#A165FF` |
| `--as-color-7c83f2` | `#7C83F2` |
| `--as-color-ff7a45` | `#FF7A45` |
| `--as-color-2f8f6b` | `#2F8F6B` |
| `--as-color-8bb94a` | `#8BB94A` |
| `--as-color-2e86c7` | `#2E86C7` |
| `--as-color-67c9e8` | `#67C9E8` |
| `--as-color-6d5df5` | `#6D5DF5` |
| `--as-color-5b8ff0` | `#5B8FF0` |
| `--as-color-f2654e` | `#F2654E` |
| `--as-color-b4763c` | `#B4763C` |
| `--as-color-e0a96d` | `#E0A96D` |
| `--as-color-3ddc84` | `#3DDC84` |
| `--as-color-5ce1e6` | `#5CE1E6` |
| `--as-color-ff7ab6` | `#FF7AB6` |
| `--as-color-b02a5c` | `#B02A5C` |
| `--as-color-7a4dff` | `#7A4DFF` |
| `--as-color-14b8a6` | `#14B8A6` |
| `--as-color-ec4899` | `#EC4899` |
| `--as-color-12a58b` | `#12A58B` |
| `--as-color-e7e8eb` | `#E7E8EB` |
| `--as-color-f5c842` | `#F5C842` |
| `--as-color-e4e4e4` | `#E4E4E4` |
| `--as-color-615ced` | `#615CED` |
| `--as-color-4d6bfe` | `#4D6BFE` |
| `--as-color-c7000b` | `#C7000B` |
| `--as-color-7a5ce0` | `#7A5CE0` |
| `--as-color-9b9b9b` | `#9B9B9B` |
| `--as-color-c9d3ee` | `#C9D3EE` |
| `--as-color-f4f6ff` | `#F4F6FF` |
| `--as-color-c9d4f6` | `#C9D4F6` |
| `--as-color-3a3a3e` | `#3A3A3E` |
| `--as-color-2a3566` | `#2A3566` |
| `--as-color-dde5fa` | `#DDE5FA` |
| `--as-color-16234b` | `#16234B` |
| `--as-color-rgba-24-29-40-p94` | `rgba(24,29,40,.94)` |
| `--as-color-rgba-250-252-255-p88` | `rgba(250,252,255,.88)` |
| `--as-color-rgba-0-0-0-0` | `rgba(0, 0, 0, 0)` |
| `--as-color-8b5cf6` | `#8B5CF6` |
| `--as-color-22b3a6` | `#22B3A6` |
| `--as-color-f59a4b` | `#F59A4B` |
| `--as-color-ec6b9b` | `#EC6B9B` |
| `--as-color-35b37e` | `#35B37E` |
| `--as-color-e0568a` | `#E0568A` |
| `--as-color-rgb-128-128-128` | `rgb(128, 128, 128)` |
| `--as-color-ff0000` | `#ff0000` |
| `--as-color-0000ff` | `#0000ff` |
| `--as-color-fffed6` | `#fffed6` |
| `--as-color-a7c9e1` | `#a7c9e1` |
| `--as-color-7fa9c8` | `#7fa9c8` |
| `--as-color-91b7d4` | `#91b7d4` |
| `--as-color-rgb-255-255-255` | `rgb(255,255,255)` |
| `--as-color-rgb-139-244-255` | `rgb(139,244,255)` |
| `--as-color-rgb-25-25-25` | `rgb(25,25,25)` |
| `--as-color-rgb-0-57-255` | `rgb(0,57,255)` |
| `--as-color-rgb-0-139-196` | `rgb(0,139,196)` |
| `--as-color-rgb-0-209-146` | `rgb(0,209,146)` |
| `--as-color-rgb-42-233-203` | `rgb(42,233,203)` |
| `--as-color-rgb-35-173-255` | `rgb(35,173,255)` |
| `--as-color-rgb-161-101-255` | `rgb(161,101,255)` |
| `--as-color-rgb-0-111-255` | `rgb(0,111,255)` |
| `--as-color-rgb-0-172-241` | `rgb(0,172,241)` |
| `--as-color-2a2a2c` | `#2A2A2C` |
| `--as-render-hue` | `0` |
| `--as-render-saturation` | `0%` |
| `--as-channel-252-252-252` | `252,252,252` |
| `--as-channel-18-18-19` | `18,18,19` |
| `--as-channel-100-116-139` | `100, 116, 139` |
| `--as-channel-47-91-234` | `47, 91, 234` |
| `--as-channel-106-77-232` | `106, 77, 232` |
| `--as-channel-14-143-131` | `14, 143, 131` |
| `--as-channel-212-87-26` | `212, 87, 26` |
| `--as-channel-20-22-30` | `20,22,30` |
| `--as-channel-255-255-255` | `255,255,255` |
<!-- /GEN:palette -->
