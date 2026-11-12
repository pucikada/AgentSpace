### AgentSpace 设计令牌（Design Tokens）

> `--agentspace-*` 是项目在 DevUI 之上扩展的自有令牌层，**只有 CSS 变量形态，没有 `$agentspace-*` SCSS 出口**。
> 它仅补 DevUI 缺失的三类能力：智能体语义色、UCD 偶数字号档、页面布局与主题背景。业务样式应优先消费本层，再用 DevUI 通用令牌兜底。

## 开发约束

这条约束适用于 demo-as2 的后续人工修改和编码代理。`designTokens.md` 是令牌名单的文档来源，`demo-as2/themes/` 是主题令牌取值的唯一实现来源。不要另建一套令牌或另一份互相矛盾的规则。

1. 样式必须使用本文档中的变量（`--devui-*` 和已写明的 `--agentspace-*` 扩展）。不要把颜色、字号、圆角、时长或其他设计值写死，也不要为新代码再引入并行变量族（例如把 `--as-*` 语义令牌加回来）。色板种子 `--as-color-*`、图像种子 `--as-image-*`、通道 `--as-channel-*` 只登记在 `demo-as2/build/design-system/palette.css`；分类色 `--as-tone-*`、`--as-project-tone-*`、`--as-file-*` 只登记在 `semantic-colors.css`。组件消费 `--devui-*` / `--agentspace-*`。间距沿用本文「间距」一节：没有间距令牌，按 4px 栅格写 px。
2. 如果没有满足需求的变量，先把变量加进 `designTokens.md`，并写进 `demo-as2/themes/` 里会用到它的主题文件，然后再在组件 CSS/JS 里引用。不要使用字面量，也不要使用未列入令牌表的临时变量。
3. 新增或修改令牌时，每个会展示该表面的主题都要适配：极简浅色（`classic`）、极简深色、幻彩（5 个强调色 × 浅色 / 映衬 / 深色）、液态玻璃、像素（浅色和深色）、Bento（浅色和深色）。每个主题用适合自己外观的值，不要把一个主题的值复制到其余主题，除非它们本来就应该相同。仍由 JS 驱动的预设（液态玻璃 `--lq-a` / `--lq-b`、像素墨色、Bento `--bn`）也要让新令牌在每种模式下解析正确。
4. 加完令牌后，主题文件仍是这些取值的唯一来源。`sync_themes.py` 把它们内联到 `index.html` 的 `<style>` 末尾。不要在 `tokens.css` 或第二个 `:root` 里再定义同一批令牌。
5. 新增主题（新的外观风格、新的模式或新的强调色家族）时，沿用现有形式：在 `demo-as2/themes/` 下增加专用 CSS 文件，选择器和结构与现有文件一致（`minimal-light.css`、`minimal-dark.css`、五个 `as2-aurora-*-theme.css`、`as2-liquid-theme.css`、`as2-pixel-theme.css`、`as2-bento-theme.css`）。新文件必须写出该主题的全套主题令牌（其他主题文件所设置的每一个 `--devui-*` / `--agentspace-*`），不能只写有差异的几项。在 `sync_themes.py` 的 `ORDER` 里登记该文件，使它内联到 `index.html` 的 `<style>` 末尾；层叠顺序保持现有约定，例如与 `:root.dark` 优先级相同时，深色表排在浅色表之后。不要把新主题的令牌值只写在 `tokens.css`、`as2-bridge.css` 或由 JS 注入的 `:root` 里。JS 仍可以驱动预设强调色，但主题自己的令牌表是必需的。

#### 字体与字号

字号对齐 UCD 偶数规范 10/12/14/16/18/20/24/28/32/48/56px：12~28px 一律复用 DevUI 令牌，**仅 DevUI 缺失的 4 档在此定义**。

| 变量（CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `--agentspace-font-family` | `'HarmonyOS Sans SC', 'HarmonyOS Sans', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` | 全站字体栈，基准同 DevUI `$font-family`，但**前置 HarmonyOS 首选**。所有自写 `font-family` 一律引用它；组件内 `--sans` 缺 HarmonyOS，不可替代 |
| `--agentspace-font-size-xs` | `10px` | 10px 极小标签档（DevUI 无）。仅限 team-tag、flow-state、tag-mini、nav-badge 等非正文标签，禁止用于正文 |
| `--agentspace-font-size-xxl` | `32px` | 32px 数据档：数据总览卡、英雄区大数字 |
| `--agentspace-font-size-display` | `48px` | 48px 展示档：落地页、空态大标题 |
| `--agentspace-font-size-hero` | `56px` | 56px 英雄档：全站最大字号，用于首页主标题，单页最多出现一次 |
| `--agentspace-nav1-active-font-weight` | `600` | 一级导航选中项字重 |
| `--agentspace-nav2-active-font-weight` | `600` | 二级导航选中项字重 |

> 选型顺序：正文 `--devui-font-size`(14) → 辅助 `--devui-font-size-sm`(12) → 标签 `--agentspace-font-size-xs`(10) → 标题 `card-title/page-title/modal-title`(16/16/18) → 超过 28px 才用 `--agentspace-font-size-xxl/display/hero`。字重与字号成对：标题用 `--devui-font-title-weight`，导航选中用本层 `*-active-font-weight`。

#### 颜色

##### 品牌与智能体颜色

| 变量（CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `--agentspace-agent-color` | `#8b5cf6` | 智能体品牌色（紫）。用于 Agent 头像底、Agent 名称、执行卡片描边、看板 Agent 标签，并为 `--octo-tag-purple-bg` 提供派生色。**禁止在组件内另写 `#8b5cf6`** |
| `--agentspace-agent-bg` | `rgba(139, 92, 246, 0.12)` | 智能体标识底色（主色 12% 透明），与 `agent-color` 成对使用：浅底承载同色文字/描边 |
| `--agentspace-run-color` | `#3b82f6` | 运行中状态色（蓝），语义为“任务正在执行”，与 DevUI `--devui-info` 区分使用；业务侧暂未落地 |

##### 背景颜色

| 变量（CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `--agentspace-global-bg` | `#f1f3f7` | 全局页面最外层底色；Minimal 主题覆盖为 `#f5f5f5` |
| `--agentspace-page-bg` | `#ffffff` | 内容主区底色。页面级容器用它，不要用 `--devui-base-bg` 替代（后者随组件层级变化） |
| `--agentspace-menu-bg` | `rgba(245, 247, 252, 0.46)` | 侧边菜单半透明底；Minimal 主题覆盖为纯白 `#ffffff` |
| `--agentspace-nav1-active-bg` | `#ffffff` | 一级导航选中项底色 |
| `--agentspace-nav1-hover-bg` | `rgba(0, 0, 0, 0.04)` | 一级导航 hover 底色。**已定义但未被消费**，接入前请确认设计是否需要 |
| `--agentspace-nav2-active-bg` | `#ffffff` | 二级导航选中项底色 |
| `--agentspace-nav2-hover-bg` | `rgba(0, 0, 0, 0.04)` | 二级导航 hover 底色。一级导航复用了同一 token，命名与用途存在错位 |

##### 背景图

| 变量（CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `--agentspace-global-bg-image` | `none` | 全局背景图/极光光晕层，**5 个 Aurora 主题之间唯一的差异点**。仅用 4 段 `radial-gradient` 角落光晕（透明度 12%~19%），禁止叠加位图 |

Aurora 系列各自的光晕主色：

| 主题 id | 光晕主色 |
| :--- | :--- |
| `as2-aurora-theme`（默认） | `#3f6bff` 蓝 |
| `as2-aurora-violet-theme` | `#7A4DFF` 紫 |
| `as2-aurora-cyan-theme` | `#06B6D4` 青 |
| `as2-aurora-teal-theme` | `#14B8A6` 青绿 |
| `as2-aurora-pink-theme` | `#EC4899` 粉 |




**变更注意事项**

1. 应尽可能复用DevUI Design Tokens ，确实无法扩展后根据实际应用场景增加变量，同时需要注意各个主题之间的兼容

---

### DevUI 设计令牌（Design Tokens）


#### 字体与字号

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$font-family` | HarmonyOS Sans / Segoe UI / Arial / Microsoft YaHei / PingFang SC 等 | 全局字体族。无 `$devui-` 前缀、无 CSS 变量出口，只能在 SCSS 编译期覆盖 |
| `$devui-font-size` / `--devui-font-size` | 14px | 正文默认字号。组件未显式指定尺寸时均回落至此值 |
| `$devui-font-size-card-title` / `--devui-font-size-card-title` | 16px | 卡片、区块、配置面板的标题 |
| `$devui-font-size-page-title` / `--devui-font-size-page-title` | 16px | 页面级主标题，用于页面头部 |
| `$devui-font-size-modal-title` / `--devui-font-size-modal-title` | 18px | 弹窗标题与大号统计数字 |
| `$devui-font-size-data-overview` / `--devui-font-size-data-overview` | 24px | 数据总览、核心指标数字 |
| `$devui-font-size-price` / `--devui-font-size-price` | 20px | 价格类数字（预留） |
| `$devui-font-size-h1-title` / `--devui-font-size-h1-title` | 28px | 一级标题（预留） |
| `$devui-font-size-h2-title` / `--devui-font-size-h2-title` | 24px | 二级标题（预留） |
| `$devui-font-size-h3-title` / `--devui-font-size-h3-title` | 20px | 三级标题，当前仅 steps-guide 使用 |
| `$devui-font-size-h4-title` / `--devui-font-size-h4-title` | 18px | 四级标题（预留） |
| `$devui-font-size-h5-title` / `--devui-font-size-h5-title` | 16px | 五级标题（预留） |
| `$devui-font-size-icon` / `--devui-font-size-icon` | 16px | 图标尺寸：button、cascader、menu-list、tree、upload、tag、rate |
| `$devui-font-size-sm` / `--devui-font-size-sm` | 12px | `size="sm"` 控件文字：日历单元格、下拉选项、勾选标签、小号按钮/标签/表格 |
| `$devui-font-size-md` / `--devui-font-size-md` | 14px | 默认尺寸控件文字 |
| `$devui-font-size-lg` / `--devui-font-size-lg` | 14px | `size="lg"` 控件文字：大号勾选项、大号下拉、菜单项、大号标签、错误页 |
| `$devui-font-title-weight` / `--devui-font-title-weight` | bold | 标题字重 |
| `$devui-font-content-weight` / `--devui-font-content-weight` | normal | 正文/长文本字重 |
| `$devui-line-height-base` / `--devui-line-height-base` | 1.5 | 基础行高，用于段落、按钮文本、菜单项 |

> 字号与字重是**成对**语义：标题用 `*-title` 字号 + `font-title-weight`，正文用 `font-size` + `font-content-weight`。

#### 间距

间距无独立变量，按 4pt 栅格取值：

| 间距值 (px) | 用途与选型建议 |
| :--- | :--- |
| 4 | 组件内最小间距：标签与说明文字、纵向单选项之间 |
| 8 | 图标与文字、相邻按钮、上下布局复选框、标签与输入框的纵向间距 |
| 12 | 组件内置左右内边距；页面内容区顶部间距 |
| 16 | 常规卡片之间、卡片内分组、配置项之间 |
| 20 | 卡片内边距、上下布局表单项之间、弹窗/抽屉内容区左右边距 |
| 24 | 页签项、菜单项、弹窗/抽屉内区块之间 |
| 32 | 宽松页签选项之间、页面大区块之间 |
| 40 | 大屏页面左右边距、宽松数据区块之间 |

> 选型口诀：**同一控件内部用 4/8/12，控件之间用 16/20，区块之间用 24/32，页面级用 40。**

#### 圆角

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-border-radius` / `--devui-border-radius` | 4px | 组件默认圆角：页签、勾选框、页码、表格容器、上传文件项、甘特任务条 |
| `$devui-border-radius-feedback` / `--devui-border-radius-feedback` | 4px | 反馈类浮层：date-picker-pro、color-picker、context-menu、notification、popover、tooltip、tree、slider |
| `$devui-border-radius-card` / `--devui-border-radius-card` | 8px | 卡片、弹窗、区块容器：modal、feature-dialog、dashboard、data-grid、date-picker、help-panel |
| `$devui-border-radius-card-xl` / `--devui-border-radius-card-xl` | 16px | 官网、门户类大卡片（预留） |
| `$devui-border-radius-full` / `--devui-border-radius-full` | 100px | 宽高自适应全圆角：switch、slider、badge、radio、condition-filter、steps-guide |

> 圆角按"容器尺度"选：内容控件 4px，弹窗/卡片 8px，门户大卡片 16px，胶囊形态用 `full`。

#### 组件尺寸（组件层）

按钮与菜单的尺寸令牌。业务自定义按钮时，请复用这些值以保持与组件库一致。

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-btn-height` / `--devui-btn-height` | 32px | 默认按钮高度 |
| `$devui-btn-padding` / `--devui-btn-padding` | 0 20px | 默认按钮左右内边距 |
| `$devui-btn-min-width` / `--devui-btn-min-width` | 64px | 默认按钮最小宽度 |
| `$devui-btn-font-size` / `--devui-btn-font-size` | 14px | 默认按钮字号，取 `$devui-font-size-md` |
| `$devui-btn-sm-height` / `--devui-btn-sm-height` | 28px | 小号按钮高度 |
| `$devui-btn-sm-padding` / `--devui-btn-sm-padding` | 0 16px | 小号按钮内边距 |
| `$devui-btn-sm-min-width` / `--devui-btn-sm-min-width` | 56px | 小号按钮最小宽度 |
| `$devui-btn-sm-font-size` / `--devui-btn-sm-font-size` | 12px | 小号按钮字号，取 `$devui-font-size-sm` |
| `$devui-btn-xs-height` / `--devui-btn-xs-height` | 24px | 超小号按钮高度 |
| `$devui-btn-xs-padding` / `--devui-btn-xs-padding` | 0 4px | 超小号按钮内边距 |
| `$devui-btn-xs-min-width` / `--devui-btn-xs-min-width` | 48px | 超小号按钮最小宽度 |
| `$devui-btn-xs-font-size` / `--devui-btn-xs-font-size` | 12px | 超小号按钮字号 |
| `$devui-btn-lg-height` / `--devui-btn-lg-height` | 40px | 大号按钮高度 |
| `$devui-btn-lg-padding` / `--devui-btn-lg-padding` | 0 24px | 大号按钮内边距 |
| `$devui-btn-lg-min-width` / `--devui-btn-lg-min-width` | 72px | 大号按钮最小宽度 |
| `$devui-btn-lg-font-size` / `--devui-btn-lg-font-size` | 14px | 大号按钮字号，取 `$devui-font-size-lg` |
| `$devui-btn-border-radius` / `--devui-btn-border-radius` | 4px | 按钮圆角，默认取 `$devui-border-radius` |
| `$devui-menu-item-margin` / `--devui-menu-item-margin` | 10px | 菜单项之间的垂直间距（无 CSS 变量出口，SCSS 编译期有效） |

#### 阴影

阴影由「长度 + 颜色」两部分组合使用：`$devui-shadow-length-*` 定义偏移与模糊，`$devui-shadow` / `$devui-light-shadow` 等定义颜色。

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-shadow-length-base` / `--devui-shadow-length-base` | 0 1px 6px 0 | 静态卡片/面板：collapse、color-picker、context-menu、dashboard、data-grid、table、workbench-card |
| `$devui-shadow-length-slide-left` / `--devui-shadow-length-slide-left` | -2px 0 8px 0 | 向左滑动时出现在右侧边缘（预留） |
| `$devui-shadow-length-slide-right` / `--devui-shadow-length-slide-right` | 2px 0 8px 0 | 向右滑动时出现在左侧边缘，当前仅 layout-switch 使用 |
| `$devui-shadow-length-connected-overlay` / `--devui-shadow-length-connected-overlay` | 0 4px 12px 0 | 有连接点的浮层：下拉、子菜单、级联、分页每页条数、配置浮层 |
| `$devui-shadow-length-hover` / `--devui-shadow-length-hover` | 0 8px 24px 0 | hover 抬升反馈：card、carousel、dashboard、data-grid、gantt、workbench-card |
| `$devui-shadow-length-feedback-overlay` / `--devui-shadow-length-feedback-overlay` | 0 8px 24px 0 | 信息提示浮层：notification、global-message、logs、mate-feature、steps-guide |
| `$devui-shadow-length-fullscreen-overlay` / `--devui-shadow-length-fullscreen-overlay` | 0 16px 48px 0 | 无连接点的大浮层：modal、drawer、image-preview、batch-operation、help-panel |

> 选型依据**浮层与触发元素是否相连**：相连用 `connected-overlay`，不相连用 `fullscreen-overlay`，页面内静态容器用 `base`。

#### 动效

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-animation-duration-fast` / `--devui-animation-duration-fast` | 100ms | 小范围反馈：hover、菜单展开、列表项状态切换 |
| `$devui-animation-duration-base` / `--devui-animation-duration-base` | 200ms | 常规过渡：展开/收起、勾选、下拉展开 |
| `$devui-animation-duration-slow` / `--devui-animation-duration-slow` | 300ms | 大面板/位置变化：页签切换、上传、分页过渡 |
| `$devui-animation-ease-in` / `--devui-animation-ease-in` | cubic-bezier(0.5, 0, 0.84, 0.25) | 渐入：元素出现、展开 |
| `$devui-animation-ease-out` / `--devui-animation-ease-out` | cubic-bezier(0.16, 0.75, 0.5, 1) | 渐出：元素消失、收起 |
| `$devui-animation-ease-in-out` / `--devui-animation-ease-in-out` | cubic-bezier(0.5, 0.05, 0.5, 0.95) | 对称过渡：页签切换、勾选 |
| `$devui-animation-ease-in-out-smooth` / `--devui-animation-ease-in-out-smooth` | cubic-bezier(0.645, 0.045, 0.355, 1) | 组件最常用的平滑过渡，不确定时优先用它 |
| `$devui-animation-ease-in-smooth` / `--devui-animation-ease-in-smooth` | cubic-bezier(0.645, 0.045, 0.355, 1) | 与 smooth 同值，命名不准，**待废弃** |
| `$devui-animation-linear` / `--devui-animation-linear` | cubic-bezier(0, 0, 1, 1) | 匀速：进度、加载类动画 |

> 时长与曲线成对使用：出现类 `ease-out`，消失类 `ease-in`，状态互转用 `ease-in-out-smooth`。

#### 层级

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-z-index-framework` / `--devui-z-index-framework` | 1000 | 框架层：Header、SideMenu |
| `$devui-z-index-drawer` / `--devui-z-index-drawer` | 1040 | 抽屉层：Drawer |
| `$devui-z-index-modal` / `--devui-z-index-modal` | 1050 | 模态层：Modal、图片预览 |
| `$devui-z-index-dropdown` / `--devui-z-index-dropdown` | 1052 | 下拉层：下拉、级联、日期面板 |
| `$devui-z-index-pop-up` / `--devui-z-index-pop-up` | 1060 | 提示层：气泡、Tooltip、通知 |
| `$devui-z-index-full-page-overlay` / `--devui-z-index-full-page-overlay` | 1080 | 全屏覆盖层：全屏布局、覆盖面板 |


#### 颜色


##### 背景颜色

**页面与容器底色（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-global-bg` / `--devui-global-bg` | #f5f5f5 | 页面最外层底色。需要"页面级灰底"时选它，不要再往组件容器上用 |
| `$devui-global-bg-normal` / `--devui-global-bg-normal` | #ffffff | 与页面灰底区分开的整块白色区域（如内容主区） |
| `$devui-base-bg` / `--devui-base-bg` | #ffffff | 组件默认白底。卡片、表格、表单容器的首选 |
| `$devui-card-bg` / `--devui-card-bg` | #ffffff | 卡片专用底色，默认同 `base-bg`；需要通过 `--devui-card-bg` 单独定制卡片时才用 |
| `$devui-base-bg-dark` / `--devui-base-bg-dark` | #000000 | 固定深色底，用于深色渐隐遮罩（如 data-grid 配置面板底部） |
| `$devui-block` / `--devui-block` | #ffffff | 大面积不可折叠区块：顶部导航、垂直菜单标题/菜单项、描边按钮底 |
| `$devui-area` / `--devui-area` | #f5f5f5 | 可折叠/次级区域：展开的子菜单、提示区、上传区、图片遮罩、编辑器/甘特底 |
| `$devui-glass-morphism-bg` / `--devui-glass-morphism-bg` | rgba(245, 246, 248, 0.9) | 毛玻璃底：吸顶表头、浮在内容之上的布局层 |
| `$devui-icon-bg` / `--devui-icon-bg` | #ffffff | SVG 图标内部填充（排序箭头、甘特条内图形），非图标颜色 |
| `$devui-form-control-bg` / `--devui-form-control-bg` | #ffffff | 输入类控件及其前后缀区域底色，确保输入区与页面底分离 |
| `$devui-nav-expand-bg` / `--devui-nav-expand-bg` | #fbfbfc | 菜单展开区域（预留） |

**列表与交互态（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-list-item-active-bg` / `--devui-list-item-active-bg` | #e9edfa | 单选项选中底：下拉选中项、日历选中日期、日期面板年/月/周、表格筛选、分页当前页 |
| `$devui-list-item-active-hover-bg` / `--devui-list-item-active-hover-bg` | #e9edfa | 已选中项再次 hover 的反馈底，避免选中态 hover 时跳色 |
| `$devui-list-item-hover-bg` / `--devui-list-item-hover-bg` | #f2f2f3 | 普通项 hover 底：下拉选项、日历日期、表格行、页签、文本按钮、折叠面板头、页码 |
| `$devui-list-item-selected-bg` / `--devui-list-item-selected-bg` | #e9edfa | 多选/激活行底，仅用于表格、树等多选场景 |
| `$devui-list-item-strip-bg` / `--devui-list-item-strip-bg` | #f2f5fc | 表格斑马纹，同时用作表头底与固定列遮罩底 |
| `$devui-disabled-bg` / `--devui-disabled-bg` | #f5f5f5 | 所有禁用态底色：输入框、按钮、下拉项、日期、标签 |
| `$devui-primary-disabled` / `--devui-primary-disabled` | #beccfa | 主要色禁用态。名义为文字色，实际用作主要按钮禁用底与评分只读星色 |
| `$devui-label-bg` / `--devui-label-bg` | #f0f0f0 | 标签化选项底：默认标签、多选已选标签、树选择已选项、上传文件标签 |
| `$devui-range-item-hover-bg` / `--devui-range-item-hover-bg` | #e9edfa | 日期范围选择中区间内日期/整周的 hover 与区间底 |
| `$devui-gray-form-control-bg` / `--devui-gray-form-control-bg` | #f5f5f5 | 灰色模式表单控件底，弱化输入区域（如 category-search） |
| `$devui-gray-form-control-hover-bg` / `--devui-gray-form-control-hover-bg` | #ebebeb | 灰色模式表单控件 hover 底 |
| `$devui-embed-search-bg` / `--devui-embed-search-bg` | #f2f2f3 | 组件内嵌无边框搜索框常态底（预留） |
| `$devui-embed-search-bg-hover` / `--devui-embed-search-bg-hover` | #f5f5f5 | 上述嵌套搜索框 hover 底（预留） |
| `$devui-icon-hover-bg` / `--devui-icon-hover-bg` | #f2f2f3 | 图标按钮 hover 底（预留）。图标 hover 实际用 `$devui-icon-fill-hover` 改变颜色 |
| `$devui-icon-active-bg` / `--devui-icon-active-bg` | #e9edfa | 图标按钮激活底（预留） |

**浮层与遮罩（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-connected-overlay-bg` / `--devui-connected-overlay-bg` | #ffffff | 有连接点的浮层底：级联列表、下拉列表、精灵菜单、每页条数、配置面板 |
| `$devui-fullscreen-overlay-bg` / `--devui-fullscreen-overlay-bg` | #ffffff | 无连接点的大浮层底：弹窗容器与内容区 |
| `$devui-feedback-overlay-bg` / `--devui-feedback-overlay-bg` | #333333 | 深色信息浮层底：通知卡片、气泡、tooltip、slider 提示、树节点提示 |
| `$devui-feedback-overlay-backdrop` / `--devui-feedback-overlay-backdrop` | rgba(0, 0, 0, 0.3) | 弹窗/抽屉打开时的深色遮罩 |
| `$devui-feedback-overlay-light-backdrop` / `--devui-feedback-overlay-light-backdrop` | rgba(255, 255, 255, 0.6) | 暗黑主题下加载态的浅色遮罩 |
| `$devui-highlight-overlay` / `--devui-highlight-overlay` | rgba(255, 255, 255, 0.8) | 图片/媒体上的半透明白色工具条底（carousel、image-preview） |

**状态色浅底（主题层）**

状态浅底必须与对应主色、边框色成组使用。

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-danger-bg` / `--devui-danger-bg` | #fce2e0 | 错误浅底：错误态输入/下拉、错误提示、数量控件错误按钮、通知 |
| `$devui-warning-bg` / `--devui-warning-bg` | #ffebd1 | 警告浅底：警告提示、输入框截断提示、警告通知/标签 |
| `$devui-info-bg` / `--devui-info-bg` | #e9edfa | 信息浅底：信息提示、加载中通知、信息类编辑态 |
| `$devui-success-bg` / `--devui-success-bg` | #d5f2dc | 成功浅底：成功提示、成功通知/标签 |
| `$devui-primary-bg` / `--devui-primary-bg` | #f2f5fc | 品牌浅底：primary 标签、主色弱化按钮 |
| `$devui-default-bg` / `--devui-default-bg` | #fafafa | 中性灰底，用于官网等中性区块 |
| `$devui-unavailable` / `--devui-unavailable` | #f5f5f5 | 不可用状态底：禁用选项、不可用徽标、禁用开关轨道 |

**按钮（组件层：`devui-pc/src/button/src/button.scss`）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-btn-common-bg` / `--devui-btn-common-bg` | #ebebeb | 次要按钮默认底 |
| `$devui-btn-common-bg-hover` / `--devui-btn-common-bg-hover` | #d1d1d1 | 次要按钮 hover 底 |
| `$devui-btn-common-bg-active` / `--devui-btn-common-bg-active` | #d1d1d1 | 次要按钮按下底 |
| `$devui-btn-common-bg-disabled` / `--devui-btn-common-bg-disabled` | #f5f5f5 | 次要按钮禁用底，默认取 `$devui-disabled-bg` |
| `$devui-btn-primary-bg-disabled` / `--devui-btn-primary-bg-disabled` | #beccfa | 主要按钮禁用底，默认取 `$devui-primary-disabled` |
| `$devui-btn-theme-bg` / `--devui-btn-theme-bg` | #5e7ce0 | 主题色按钮底，默认取 `$devui-primary` |
| `$devui-btn-theme-bg-hover` / `--devui-btn-theme-bg-hover` | #7693f5 | 主题色按钮 hover 底 |
| `$devui-btn-theme-bg-active` / `--devui-btn-theme-bg-active` | #344899 | 主题色按钮按下底 |
| `$devui-btn-theme-bg-disabled` / `--devui-btn-theme-bg-disabled` | #beccfa | 主题色按钮禁用底 |
| `$devui-btn-theme-common-bg-disabled` / `--devui-btn-theme-common-bg-disabled` | #f5f5f5 | 主题色次要按钮禁用底 |
| `$devui-btn-theme-danger-bg` / `--devui-btn-theme-danger-bg` | #f23030 | 主题色危险按钮底，默认取 `$devui-danger` |
| `$devui-btn-theme-danger-bg-hover` / `--devui-btn-theme-danger-bg-hover` | #cc272a | 主题色危险按钮 hover 底 |
| `$devui-btn-theme-danger-bg-active` / `--devui-btn-theme-danger-bg-active` | #78080e | 主题色危险按钮按下底 |
| `$devui-btn-theme-danger-bg-disabled` / `--devui-btn-theme-danger-bg-disabled` | #faa7a3 | 主题色危险按钮禁用底 |

**组件专用（组件层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-tab-options-bg` / `--devui-tab-options-bg` | #5e7ce0 | options 模式页签激活底；tab-nav 内重定义为 `$devui-brand`，主题层默认 #f2f2f3 |
| `$devui-tab-slider-bg` / `--devui-tab-slider-bg` | #f2f2f3 | 页签滑块底，默认取 `$devui-list-item-hover-bg` |
| `$devui-menu-bg` / `--devui-menu-bg` | #ffffff | 水平菜单底，默认取 `$devui-global-bg-normal` |
| `$devui-menu-bg-level` / `--devui-menu-bg-level` | #f5f5f5 | 菜单层级底，默认取 `$devui-global-bg` |
| `$devui-option-modal-close-bg` / `--devui-option-modal-close-bg` | rgba(0, 0, 0, 0.4) | data-grid 配置弹窗关闭按钮半透明底 |
| `$devui-feature-dialog-close-bg` / `--devui-feature-dialog-close-bg` | rgba(0, 0, 0, 0.4) | feature-dialog 关闭按钮半透明底 |

##### 状态色

> 本节为**语义主色**；配套的 `-bg` / `-line` / `-text` 分别见背景、边框、文字章节。
> `$devui-constant-*` 为**恒定色**，不随主题（含暗色）变化。

**品牌与主色（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-brand` / `--devui-brand` | #5e7ce0 | 品牌色。选中/激活/强调的唯一来源：勾选框、页签激活条、树选中、开关开启、步骤进行中 |
| `$devui-brand-hover` / `--devui-brand-hover` | #7693f5 | 品牌色 hover：拖拽手柄、滑块手柄、分割条、链接按钮 |
| `$devui-brand-active` / `--devui-brand-active` | #526ecc | 品牌色按下/激活：文本按钮、页签激活、菜单激活、级联选中 |
| `$devui-brand-active-focus` / `--devui-brand-active-focus` | #344899 | 品牌色聚焦（重度加深）：按钮/开关 focus 与边框 |
| `$devui-brand-foil` / `--devui-brand-foil` | #f2f2f3 | 品牌辅色/正衬色：步骤连接线与箭头、transfer 面板底 |
| `$devui-primary` / `--devui-primary` | #5e7ce0 | 主要按钮与强调主色，与 brand 同值 |
| `$devui-primary-hover` / `--devui-primary-hover` | #7693f5 | 主色 hover：主要按钮、菜单/单选、开关开启态 hover |
| `$devui-primary-active` / `--devui-primary-active` | #344899 | 主色按下：主要按钮、开关开启态按下 |

> `brand` 与 `primary` 当前同值，但语义不同：`brand` 用于"品牌识别/选中态"，`primary` 用于"主操作按钮"。换肤时若只改品牌色，请同时改两者以保持一致。

**第二品牌色（撞色/反衬色）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-contrast` / `--devui-contrast` | #c7000b | 第二品牌色/撞色/反衬色（预留） |
| `$devui-contrast-hover` / `--devui-contrast-hover` | #cc272a | 第二品牌色 hover，用于主题危险描边按钮 |
| `$devui-contrast-active` / `--devui-contrast-active` | #78080e | 第二品牌色按下 |
| `$devui-contrast-disabled` / `--devui-contrast-disabled` | #ffbcba | 主题危险按钮禁用态（组件层，预留） |

**语义状态色（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-danger` / `--devui-danger` | #f23030 | 错误/失败/删除：危险按钮、错误步骤、低分评分、危险标签、上传失败 |
| `$devui-warning` / `--devui-warning` | #ffb700 | 警告/需注意：中档评分、警告标签、编辑器警告、徽标、气泡、进度、时间线 |
| `$devui-success` / `--devui-success` | #029931 | 成功/完成：成功节点、完成步骤、评分、成功标签、上传成功、表单校验图标 |
| `$devui-info` / `--devui-info` | #5e7ce0 | 通知/执行中：通知卡片与时间线、全局消息、气泡、状态、节点标记 |
| `$devui-waiting` / `--devui-waiting` | #beccfa | 等待中：徽标圆点、状态指示、表格配置开关图标。**加载动画用 `$devui-primary`，不是本变量** |

**中性与特殊状态**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-initial` / `--devui-initial` | #e9edfa | 初始化/未执行：status 圆点、未执行标记、流程图节点填充 |
| `$devui-unavailable` / `--devui-unavailable` | #f5f5f5 | 不可用：禁用选项、不可用徽标、禁用开关轨道 |
| `$devui-bulletin` / `--devui-bulletin` | #444b61 | 公告类深色，用于 alert 公告模式背景 |

**恒定色（不随主题变化）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-constant-blue` / `--devui-constant-blue` | #5e7ce0 | 恒定品牌蓝（预留） |
| `$devui-constant-blue-hover` / `--devui-constant-blue-hover` | #7693f5 | 恒定品牌蓝 hover（预留） |
| `$devui-constant-blue-active` / `--devui-constant-blue-active` | #526ecc | 恒定品牌蓝按下（预留） |
| `$devui-constant-blue-disabled` / `--devui-constant-blue-disabled` | #beccfa | 恒定品牌蓝禁用（预留） |
| `$devui-constant-blue-rippling` / `--devui-constant-blue-rippling` | rgba(94, 124, 224, 0.08) | 恒定品牌蓝水波纹/外发光（预留） |

> 恒定色用于"无论主题如何都必须保持品牌蓝"的场景（如品牌 logo 区、第三方嵌入卡片）。当前仓库未引用，接入前请确认使用方是否已升级。

##### 文字与图标颜色

> 暗色主题通过同名 CSS 变量覆盖（如 `--devui-text: #a3a3a3`），业务无需改组件样式。
> 命名：`-text` 文字；`icon-fill*` 线性/填充图标；`shape-icon-fill*` 面型图标；`*-text-*` 组件文字派生。

**文字（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-text` / `--devui-text` | #191919 | 正文/主要文字。正文、表格单元格、菜单项、表单内容的默认值 |
| `$devui-text-weak` / `--devui-text-weak` | #333333 | 弱化正文：折叠面板内容、表头、面板说明 |
| `$devui-aide-text` / `--devui-aide-text` | #595959 | 辅助文字：面包屑、徽标文字、评论时间、分组标题、配置项说明 |
| `$devui-aide-text-hover` / `--devui-aide-text-hover` | #000000 | 可点击辅助文字的 hover 加深（如吸顶头部） |
| `$devui-aide-text-stress` / `--devui-aide-text-stress` | #333333 | 辅助文字中的强调：副标题、说明重点 |
| `$devui-placeholder` / `--devui-placeholder` | #808080 | 占位/无效内容：输入与下拉占位、日历非本月日期、部分滚动条 hover |
| `$devui-light-text` / `--devui-light-text` | #ffffff | 深色背景上的固定文字/图标：主要按钮文字、提示图标与关闭按钮、通知内容、勾选标记 |
| `$devui-dark-text` / `--devui-dark-text` | #000000 | 浅色背景上的固定文字色（如 workbench-card 标题） |
| `$devui-disabled-text` / `--devui-disabled-text` | #c2c2c2 | 禁用态文字：禁用按钮、禁用下拉项、禁用输入内容 |
| `$devui-list-item-active-text` / `--devui-list-item-active-text` | #000000 | 列表/选项选中文字，与选中底配套 |
| `$devui-list-item-hover-text` / `--devui-list-item-hover-text` | #000000 | 列表/选项 hover 文字与图标 |
| `$devui-feedback-overlay-text` / `--devui-feedback-overlay-text` | #f0f0f0 | 深色信息浮层上的文字（通知、气泡、节点提示） |
| `$devui-danger-text` / `--devui-danger-text` | #a3171c | 危险/删除操作文字（批量删除项） |
| `$devui-warning-text` / `--devui-warning-text` | #d96900 | 警告文字（内容截断提示） |
| `$devui-success-text` / `--devui-success-text` | #01802b | 成功语义文字（预留） |

**链接（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-link` / `--devui-link` | #526ecc | 链接文字/图标：链接组件、跳转文字、激活的级联项 |
| `$devui-link-active` / `--devui-link-active` | #526ecc | 链接 hover/激活的文字、下划线、图标 |
| `$devui-link-light` / `--devui-link-light` | #96adfa | 深色背景下的链接文字（通知内链接） |
| `$devui-link-light-active` / `--devui-link-light-active` | #beccfa | 深色背景下链接 hover/已访问 |

**线性/填充图标（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-icon-text` / `--devui-icon-text` | #808080 | 线性图标主色：页码切换、日历切换、表单标签提示、搜索/选择、图片预览工具栏 |
| `$devui-icon-fill` / `--devui-icon-fill` | #595959 | 图标默认填充/颜色：文本按钮图标、轮播指示点、树/菜单/上传图标 |
| `$devui-icon-fill-weak` / `--devui-icon-fill-weak` | #808080 | 弱化图标填充（取消状态圆点） |
| `$devui-icon-fill-hover` / `--devui-icon-fill-hover` | #191919 | 图标 hover 加深：排序/筛选、轮播指示点、提示图标 |
| `$devui-icon-fill-active` / `--devui-icon-fill-active` | #5e7ce0 | 图标激活/选中：排序筛选激活、树展开/选中、当前轮播指示点、图标按钮激活 |
| `$devui-icon-fill-active-hover` / `--devui-icon-fill-active-hover` | #000000 | 激活图标 hover：步进按钮、翻页按钮、树选择展开图标 |
| `$devui-icon-fill-active-disabled` / `--devui-icon-fill-active-disabled` | #beccfa | 图标激活但禁用（禁用勾选框/开关） |

**面型图标（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-shape-icon-fill` / `--devui-shape-icon-fill` | #c2c2c2 | 面型图标默认：评分星标、日历图标、排序/筛选、下拉箭头、单选框 |
| `$devui-shape-icon-fill-hover` / `--devui-shape-icon-fill-hover` | #808080 | 面型图标 hover：清空/展开、时间选择图标 |
| `$devui-shape-icon-fill-active` / `--devui-shape-icon-fill-active` | #808080 | 面型图标激活：日期面板展开、排序/筛选激活 |
| `$devui-shape-icon-fill-disabled` / `--devui-shape-icon-fill-disabled` | #dfdfdf | 面型图标禁用（steps-guide 引导中的禁用图标）；源码为带引号字符串 `'#dfdfdf'` |

**按钮文字（组件层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-btn-common-text-disabled` / `--devui-btn-common-text-disabled` | #c2c2c2 | 次要按钮禁用文字，默认取 `$devui-disabled-text` |
| `$devui-btn-common-color-hover` / `--devui-btn-common-color-hover` | #191919 | 次要按钮 hover 文字，默认取 `$devui-text` |
| `$devui-btn-common-color-active` / `--devui-btn-common-color-active` | #191919 | 次要按钮按下文字，默认取 `$devui-text` |
| `$devui-btn-primary-text-disabled` / `--devui-btn-primary-text-disabled` | #ffffff | 主要按钮禁用文字，默认取 `$devui-light-text` |
| `$devui-btn-theme-text` / `--devui-btn-theme-text` | #ffffff | 主题色按钮文字 |
| `$devui-btn-theme-text-disabled` / `--devui-btn-theme-text-disabled` | #c2c2c2 | 主题色按钮禁用文字（预留） |
| `$devui-btn-theme-common-text` / `--devui-btn-theme-common-text` | #191919 | 主题色描边按钮文字，默认取 `$devui-text` |
| `$devui-btn-theme-common-text-hover` / `--devui-btn-theme-common-text-hover` | #526ecc | 主题色描边按钮 hover 文字 |
| `$devui-btn-theme-common-text-active` / `--devui-btn-theme-common-text-active` | #526ecc | 主题色描边按钮按下文字 |
| `$devui-btn-theme-common-text-disabled` / `--devui-btn-theme-common-text-disabled` | #c2c2c2 | 主题色描边按钮禁用文字 |
| `$devui-btn-theme-danger-text` / `--devui-btn-theme-danger-text` | #ffffff | 主题色危险按钮文字 |
| `$devui-btn-theme-danger-text-hover` / `--devui-btn-theme-danger-text-hover` | #ffffff | 主题色危险按钮 hover 文字 |
| `$devui-btn-theme-danger-text-active` / `--devui-btn-theme-danger-text-active` | #ffffff | 主题色危险按钮按下文字 |
| `$devui-btn-theme-danger-text-disabled` / `--devui-btn-theme-danger-text-disabled` | #ffffff | 主题色危险按钮禁用文字 |

**菜单（组件层：`devui-pc/src/menu/src/menu.scss`）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-menu-item` / `--devui-menu-item` | 无默认值（由主题注入） | 菜单项文字/图标色 |
| `$devui-menu-item-sub` / `--devui-menu-item-sub` | 无默认值（由主题注入） | 子菜单项文字/图标色 |
| `$devui-menu-item-select` / `--devui-menu-item-select` | 无默认值（回落 `--devui-menu-item-hover`） | 菜单选中项文字色 |
| `$devui-menu-item-disabled` / `--devui-menu-item-disabled` | #c2c2c2 | 菜单禁用项文字，默认取 `$devui-disabled-text` |
| `$devui-menu-item-selectBar` / `--devui-menu-item-selectBar` | #5e7ce0 | 菜单选中指示条，默认取 `$devui-primary-hover` |
| `$devui-menu-active-parent` / `--devui-menu-active-parent` | #5e7ce0 | 当前菜单项的父级高亮，默认取 `$devui-icon-fill-active` |

##### 边框颜色

**通用边框（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-line` / `--devui-line` | #dbdbdb | 组件普通边框（非分割线）：描边按钮、勾选框、颜色面板、列宽拖拽手柄、标签关闭按钮 |
| `$devui-dividing-line` / `--devui-dividing-line` | #f0f0f0 | 内容分割线：表格/日历单元格、页签分隔、级联列、descriptions 分隔 |
| `$devui-disabled-line` / `--devui-disabled-line` | #e6e6e6 | 禁用态边框：按钮、勾选框、单选、滑块、下拉、页签 |

**表单控件（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-form-control-line` / `--devui-form-control-line` | #dbdbdb | 表单控件常态边框：输入框、自动补全、文本域、下拉、上传拖拽区、分割面板 |
| `$devui-form-control-line-hover` / `--devui-form-control-line-hover` | #808080 | 表单控件 hover（非错误、非禁用）边框 |
| `$devui-form-control-line-active` / `--devui-form-control-line-active` | #5e7ce0 | 控件聚焦边框；也用于按钮 hover/active/primary 边框、上传拖拽激活 |
| `$devui-form-control-line-active-hover` / `--devui-form-control-line-active-hover` | #344899 | 控件聚焦且 hover 的加深边框 |
| `$devui-form-control-interactive-outline` / `--devui-form-control-interactive-outline` | rgba(94, 124, 224, 0.08) | 聚焦外发光（box-shadow）：输入框 hover/focus 光晕、tree-select 聚焦涟漪 |

**语义与浮层边界（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-connected-overlay-line` / `--devui-connected-overlay-line` | #526ecc | 下拉展开时与触发控件连接的边框（tree-select 打开态） |
| `$devui-danger-line` / `--devui-danger-line` | #f23030 | 错误边框与错误图标填充：错误输入/下拉/日期、错误提示图标 |
| `$devui-warning-line` / `--devui-warning-line` | #ff8800 | 警告边框与警告图标填充：截断提示边框、警告提示/通知图标、input 警告态 |
| `$devui-success-line` / `--devui-success-line` | #00b336 | 成功边框与成功图标填充：成功提示图标、上传成功、alert 成功态图标 |
| `$devui-info-line` / `--devui-info-line` | #5e7ce0 | 通知边框与信息图标填充：信息提示图标、alert 信息态图标 |
| `$devui-primary-line` / `--devui-primary-line` | #5e7ce0 | 主要色边框（预留） |
| `$devui-default-line` / `--devui-default-line` | #5e7ce0 | 默认色边框（预留；取值与 primary-line 相同，语义存疑） |

**按钮边框（组件层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-btn-common-border-color` / `--devui-btn-common-border-color` | transparent | 次要（描边）按钮默认边框 |
| `$devui-btn-common-border-color-hover` / `--devui-btn-common-border-color-hover` | transparent | 次要按钮 hover 边框 |
| `$devui-btn-common-border-color-active` / `--devui-btn-common-border-color-active` | transparent | 次要按钮按下边框 |
| `$devui-btn-common-border-disabled` / `--devui-btn-common-border-disabled` | #e6e6e6 | 次要按钮禁用边框，默认取 `$devui-disabled-line` |
| `$devui-btn-theme-border-disabled` / `--devui-btn-theme-border-disabled` | transparent | 主题色按钮禁用边框 |
| `$devui-btn-theme-common-border` / `--devui-btn-theme-common-border` | transparent | 主题色描边按钮边框 |
| `$devui-btn-theme-common-border-hover` / `--devui-btn-theme-common-border-hover` | transparent | 主题色描边按钮 hover 边框 |
| `$devui-btn-theme-common-border-active` / `--devui-btn-theme-common-border-active` | transparent | 主题色描边按钮按下边框 |
| `$devui-btn-theme-common-border-disabled` / `--devui-btn-theme-common-border-disabled` | #e6e6e6 | 主题色描边按钮禁用边框 |
| `$devui-btn-theme-danger-border` / `--devui-btn-theme-danger-border` | transparent | 主题色危险按钮边框 |
| `$devui-btn-theme-danger-border-hover` / `--devui-btn-theme-danger-border-hover` | transparent | 主题色危险按钮 hover 边框 |
| `$devui-btn-theme-danger-border-active` / `--devui-btn-theme-danger-border-active` | transparent | 主题色危险按钮按下边框 |
| `$devui-btn-theme-danger-border-disabled` / `--devui-btn-theme-danger-border-disabled` | transparent | 主题色危险按钮禁用边框 |
| `$devui-common-border-color` / `--devui-common-border-color` | #c9c9c9 | steps-guide 私有边框色（预留） |

##### 阴影颜色

**阴影色（主题层）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-shadow` / `--devui-shadow` | rgba(0, 0, 0, 0.16) | 主阴影色，与 `shadow-length-*` 组合：折叠面板、颜色面板、日期面板、抽屉、弹窗、菜单、分页、通知 |
| `$devui-light-shadow` / `--devui-light-shadow` | rgba(0, 0, 0, 0.08) | 弱阴影：卡片、悬浮控件、表格固定列 inset 内阴影 |
| `$devui-connected-overlay-shadow` / `--devui-connected-overlay-shadow` | rgba(0, 0, 0, 0.16) | 有连接点浮层阴影：右键菜单、吸顶图标按钮 |
| `$devui-hover-shadow` / `--devui-hover-shadow` | rgba(0, 0, 0, 0.16) | hover 抬升：配置项、仪表盘卡片、图表卡片 |
| `$devui-feedback-overlay-shadow` / `--devui-feedback-overlay-shadow` | rgba(0, 0, 0, 0.16) | 信息提示浮层阴影（预留；组件当前多直接用 `$devui-shadow` 组合，未引用本变量） |
| `$devui-float-block-shadow` / `--devui-float-block-shadow` | rgba(94, 124, 224, 0.3) | 特殊蓝色浮层阴影（甘特任务提示浮块） |
| `$devui-table-column-shadow-color` / `--devui-table-column-shadow-color` | rgba(37, 43, 58, 0.08) | 表格固定列阴影色（左右渐隐） |

**表格固定列 inset 偏移（组件层：data-grid、table）**

| 变量（SCSS / CSS） | 默认值 | 用途与选型建议 |
| :--- | :--- | :--- |
| `$devui-table-inset-shadow-left` / `--devui-table-inset-shadow-left` | 8px 0 8px -4px | 固定左侧列 inset 偏移，配合 `table-column-shadow-color` |
| `$devui-table-inset-shadow-right` / `--devui-table-inset-shadow-right` | -8px 0 8px -4px | 固定右侧列 inset 偏移 |

**变更注意事项**

1. 覆盖语义色时，必须同步其 `-hover` / `-active` / `-disabled` 派生色，否则交互态会与主色脱节。
2. 暗色主题通过同名 CSS 变量覆盖，业务不要写 `[data-theme='dark']` 特判。
3. 组件内局部覆盖（如 data-grid 的表头底、table 的 hover 底）会绕过主题变量，定制时需评估影响面。
### demo-as2 扩展变量

以下变量是 demo-as2 在迁到本文件的令牌名时新增的 `--agentspace-*` 扩展。组件在没有语义对应的 DevUI / 上文 18 个 AgentSpace 令牌时使用它们。取值来自迁之前的界面，不是本文件前面的默认值。

经典浅色（`classic`）和深色（`dark`）列的是 `:root` / `:root.dark` 上的值。幻彩列取 `as2-aurora-theme.css`（`#3F6BFF`）里该变量的最后一次赋值，深色段在文件后部，所以只在深色段写过的变量会显示深色值。五个幻彩强调色共用同一套扩展，差别在 `--agentspace-accent` 与由它推导的 `--agentspace-global-bg-image`。`--agentspace-nav1-active-bg` 和 `--agentspace-nav2-active-bg` 已接到主导航与二级导航的选中底。经典浅色是 `#ffffff` / `#EDEEF1`，经典深色跟随 `--rail-tile` / `#2A2B30`。幻彩浅色两者都是 `#ffffff`，深浅映衬的一级导航是混合渐变、二级是 `rgba(255,255,255,.17)`，深色一级跟随品牌浅底、二级是 `#2A2B30`。液态玻璃、像素和 Bento 在各自的外观规则里覆盖这两个变量。

| 变量 | 含义 | 经典浅色 | 经典深色 | 幻彩浅色 |
| :--- | :--- | :--- | :--- | :--- |
| `--agentspace-accent` | 幻彩强调色。五个主题文件各写自己的色值，设置脚本再用内联样式覆盖 | — | — | #3F6BFF |
| `--agentspace-aurora-accent-2` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-aurora-canvas-corner` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 17% |
| `--agentspace-aurora-canvas-left` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 19% |
| `--agentspace-aurora-canvas-right` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 12% |
| `--agentspace-aurora-canvas-top` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 13% |
| `--agentspace-aurora-column-bg` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | #1A1A1D |
| `--agentspace-aurora-gap-bottom` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 8px |
| `--agentspace-aurora-gap-right` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | 8px |
| `--agentspace-aurora-ink` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-aurora-mixed-gradient` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-aurora-shell-shadow` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-blue` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-border-soft` | 卡片细边，原 --as-border-soft | rgba(10, 10, 10, .06) | rgba(255, 255, 255, .07) | rgba(255,255,255,.07) |
| `--agentspace-border-strong` | 输入与可交互边界，原 --as-border-strong | rgba(10, 10, 10, .12) | rgba(255, 255, 255, .14) | rgba(255,255,255,.24) |
| `--agentspace-btn-bottom` | 主按钮渐变下色 | #201E25 | #E4E4E7 | #E4E4E7 |
| `--agentspace-btn-bottom-hover` | 主按钮悬停下色 | #29272F | #ECECEF | #ECECEF |
| `--agentspace-btn-edge-1` | 主按钮边缘色 1 | #4B4951 | #FFFFFF | #FFFFFF |
| `--agentspace-btn-edge-2` | 主按钮边缘色 2 | #31303A | #F0F0F2 | #F0F0F2 |
| `--agentspace-btn-edge-3` | 主按钮边缘色 3 | #18171B | #D4D4D8 | #D4D4D8 |
| `--agentspace-btn-ink` | 主按钮文字 | #FAFAFA | #121213 | #121213 |
| `--agentspace-btn-ring` | 主按钮外环 | #0D0D0D | rgba(0, 0, 0, .60) | rgba(0, 0, 0, .60) |
| `--agentspace-btn-shadow` | 主按钮阴影 | 0 0 0 1px var(--agentspace-btn-ring), 0 1px 1px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.10) | 0 0 0 1px var(--agentspace-btn-ring), 0 2px 4px rgba(0,0,0,.30) | 0 0 0 1px var(--agentspace-btn-ring), 0 2px 4px rgba(0,0,0,.30) |
| `--agentspace-btn-top` | 主按钮渐变上色 | #323137 | #F4F4F5 | #F4F4F5 |
| `--agentspace-btn-top-hover` | 主按钮悬停上色 | #3C3B42 | #FFFFFF | #FFFFFF |
| `--agentspace-card-bg` | 卡片底的历史别名 | — | — | — |
| `--agentspace-chevron` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-code-add` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | rgba(24, 121, 78, .10) | rgba(76, 195, 138, .14) | rgba(76, 195, 138, .14) |
| `--agentspace-code-del` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | rgba(217, 58, 43, .08) | rgba(255, 110, 100, .12) | rgba(255, 110, 100, .12) |
| `--agentspace-code-key` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | rgba(0, 0, 0, .88) | rgba(255, 255, 255, .9) | rgba(255, 255, 255, .9) |
| `--agentspace-code-str` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | rgba(0, 123, 172, .9) | #5FC8E8 | #5FC8E8 |
| `--agentspace-count-bg` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-dawn` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-decision-width` | 决策卡最大宽度 | 512px | 512px | 512px |
| `--agentspace-ease-drawer` | 抽屉 / 导航滑动曲线 | — | — | — |
| `--agentspace-ease-raise` | 按钮按压曲线 | cubic-bezier(.6, .6, 0, 1) | cubic-bezier(.6, .6, 0, 1) | cubic-bezier(.6, .6, 0, 1) |
| `--agentspace-focus-ring` | 焦点环颜色，原 --as-focus-ring | rgba(10, 89, 247, .45) | rgba(77, 141, 255, .55) | var(--devui-brand) |
| `--agentspace-font-family-mono` | 等宽字体栈 | ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace | ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace | ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace |
| `--agentspace-glass` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-header-height` | 页头高度 | — | — | — |
| `--agentspace-id-human-bg` | 人员身份底 | #E8EEFE | rgba(77, 141, 255, .18) | rgba(77, 141, 255, .18) |
| `--agentspace-id-human-color` | 人员身份文字 | #0846C4 | #8AB4FF | #8AB4FF |
| `--agentspace-id-system-bg` | 系统身份底 | #FDF3E7 | rgba(242, 166, 90, .14) | rgba(242, 166, 90, .14) |
| `--agentspace-id-system-color` | 系统身份文字 | #9A4F0A | #F2A65A | #F2A65A |
| `--agentspace-id-tool-color` | 工具身份文字 | #404040 | #C8C8CC | #C8C8CC |
| `--agentspace-input` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-line-height-body` | 正文行高 | 22px | 22px | 22px |
| `--agentspace-line-height-display` | 展示标题行高 | 44px | 44px | 44px |
| `--agentspace-line-height-h1` | 页面标题行高 | 36px | 36px | 36px |
| `--agentspace-line-height-h2` | 区块标题行高 | 28px | 28px | 28px |
| `--agentspace-line-height-h3` | 卡片标题行高 | 24px | 24px | 24px |
| `--agentspace-line-height-meta` | 元信息行高 | 18px | 18px | 18px |
| `--agentspace-line-height-micro` | 徽标行高 | 16px | 16px | 16px |
| `--agentspace-line-height-reading` | 长文行高 | 24px | 24px | 24px |
| `--agentspace-line-height-ui` | 控件行高 | 20px | 20px | 20px |
| `--agentspace-mist` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-muted` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-muted-bg` | 弱填充底，原 --as-muted-bg | rgba(0, 0, 0, .04) | rgba(255, 255, 255, .05) | #2B2B2F |
| `--agentspace-neutral-bg` | 原 --as-bg。内层中性表面。幻彩浅色画布改走 global-bg，此值仍是内层表面 | #F5F5F5 | #0C0C0D | #101012 |
| `--agentspace-orange` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-panel-bg` | 主内容面板底，原 --as-panel | #FCFCFC | #121213 | #151517 |
| `--agentspace-panel-stroke` | 面板描边，原 --as-panel-stroke | #ECECEC | #222224 | #222224 |
| `--agentspace-pressed-bg` | 按下态底，原 --as-pressed | rgba(0, 0, 0, .08) | rgba(255, 255, 255, .10) | rgba(255, 255, 255, .10) |
| `--agentspace-radius-card` | 14px 通用卡片圆角 | 14px | 14px | 14px |
| `--agentspace-radius-input` | Composer 外层圆角 | 24px | 24px | 24px |
| `--agentspace-radius-panel` | 大面板圆角。当前 18px，不是文档里 card-xl 的 16px | 18px | 18px | 18px |
| `--agentspace-radius-row` | 10px 行圆角 | 10px | 10px | 10px |
| `--agentspace-radius-sm` | 6px 小圆角（标签） | 6px | 6px | 6px |
| `--agentspace-rail-width` | 主导航宽度。基础令牌 64px，页面随后在 :root 定为 72px | 64px | 64px | 64px |
| `--agentspace-reading-width` | 长文最大行宽 | 760px | 760px | 760px |
| `--agentspace-resize-a` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | var(--agentspace-accent, #3F6BFF) |
| `--agentspace-resize-b` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | color-mix(in srgb, var(--agentspace-accent, #3F6BFF) 55%, #22D3EE) |
| `--agentspace-run-bg` | 运行中浅底，与 run-color 成对 | rgba(10, 89, 247, .08) | rgba(77, 141, 255, .14) | var(--devui-primary-bg) |
| `--agentspace-run-line` | 运行中描边 | rgba(10, 89, 247, .22) | rgba(77, 141, 255, .30) | var(--devui-primary-line) |
| `--agentspace-segment-selected` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-selected-bg` | 选中底的另一处别名 | — | — | — |
| `--agentspace-shadow-card` | 卡片阴影 | 0 1px 1.5px rgba(0,0,0,.04), inset 0 -1px 0 rgba(0,0,0,.06) | 0 1px 1.5px rgba(0,0,0,.30), inset 0 -1px 0 rgba(255,255,255,.04) | 0 1px 1.5px rgba(0,0,0,.30), inset 0 -1px 0 rgba(255,255,255,.04) |
| `--agentspace-shadow-dialog` | 对话框阴影 | 0 24px 80px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.06) | 0 24px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08) | 0 24px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08) |
| `--agentspace-shadow-float` | 浮动层阴影 | — | — | — |
| `--agentspace-shadow-panel` | 面板阴影 | 0 1px 0 rgba(0,0,0,.04), 0 2px 1px -1px rgba(0,0,0,.05) | 0 1px 0 rgba(0,0,0,.45), 0 2px 1px -1px rgba(0,0,0,.50) | 0 1px 0 rgba(0,0,0,.45), 0 2px 1px -1px rgba(0,0,0,.50) |
| `--agentspace-shadow-pop` | 浮层阴影 | 0 4px 42px rgba(0,0,0,.06), 0 2px 6px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.06) | 0 4px 42px rgba(0,0,0,.40), 0 0 0 1px rgba(255,255,255,.08) | 0 4px 42px rgba(0,0,0,.40), 0 0 0 1px rgba(255,255,255,.08) |
| `--agentspace-shadow-tile` | 小瓷砖阴影 | 0 0 0 .5px rgba(0,0,0,.06), 0 1px 1px -1px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.05) | 0 0 0 .5px rgba(255,255,255,.10), 0 1px 2px rgba(0,0,0,.40) | 0 0 0 .5px rgba(255,255,255,.10), 0 1px 2px rgba(0,0,0,.40) |
| `--agentspace-side-head-height` | 幻彩侧栏头高度 | — | — | — |
| `--agentspace-side-head-offset` | 幻彩侧栏头上偏移 | — | — | — |
| `--agentspace-side-width` | 侧栏运行时宽度（脚本写入） | — | — | — |
| `--agentspace-sidebar-width` | 侧栏设计宽度 | 256px | 256px | 256px |
| `--agentspace-sky` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-stage-bg` | 卡片内舞台 / 代码区底，原 --as-stage | #FAFAFA | #1F1F21 | #151517 |
| `--agentspace-status-fail` | 失败文字色。深色下与 --devui-danger 分开 | #D93A2B | #FF7B72 | #FF7B72 |
| `--agentspace-status-idle` | 空闲文字色 | #737373 | #8F8F8F | #8F8F8F |
| `--agentspace-status-idle-bg` | 空闲浅底 | rgba(0, 0, 0, .05) | rgba(255, 255, 255, .06) | rgba(255, 255, 255, .06) |
| `--agentspace-status-review` | 待验收文字色 | #5B5BD6 | #A5A5FF | #A5A5FF |
| `--agentspace-status-review-bg` | 待验收浅底 | rgba(91, 91, 214, .09) | rgba(165, 165, 255, .13) | rgba(165, 165, 255, .13) |
| `--agentspace-status-review-line` | 待验收描边 | rgba(91, 91, 214, .24) | rgba(165, 165, 255, .28) | rgba(165, 165, 255, .28) |
| `--agentspace-success` | 由原 --as-* / --au-* 迁入，语义与迁前同名变量一致 | — | — | — |
| `--agentspace-sunken-bg` | 输入与 Composer 凹陷底，原 --as-sunken | #F2F2F3 | #1C1C1E | #101012 |
| `--agentspace-text-subtle` | 时间戳、占位、禁用文字，原 --as-text-subtle | rgba(0, 0, 0, .40) | rgba(255, 255, 255, .40) | #92929A |
| `--agentspace-text-tertiary` | 第三级文字，原 --as-text-3 | — | — | — |
| `--agentspace-thread-width` | 线程栏运行时宽度（脚本写入） | — | — | — |

rebase 到上游当前 main 之后，为保住上游最新界面又增加了这些扩展：`--agentspace-menu-hover`（菜单悬停）、`--agentspace-bubble-me`（用户气泡主题着色）、`--agentspace-more-bg` / `--agentspace-more-ink` / `--agentspace-more-hover` / `--agentspace-more-shadow`（卡片「更多」按钮的对比）。主题文件里的颜色取值引用 `palette.css` 的种子，不再在主题文件里写颜色字面量。`--agentspace-muted`、`--agentspace-text-tertiary`、`--agentspace-success`、`--agentspace-selected-bg`、`--agentspace-card-bg`、`--agentspace-shadow-float`、`--agentspace-side-width`、`--agentspace-thread-width` 的默认别名写在 `minimal-light.css`，供各主题继承。

共 99 个扩展变量是上一轮合并后的计数。已删除或并入的 A 类：`--agentspace-code-num` 并入 `--devui-warning`；`--agentspace-ease-out` 并入 `--devui-animation-ease-out`；`--agentspace-control-height` 并入 `--devui-btn-height`（紧凑仍是 28px）；`--agentspace-frame-gap` 写成 8px；`--agentspace-selected-bg` 与 `--agentspace-shadow-float` 用掉已有回退。无引用而删除的是 `--agentspace-ring`、`--agentspace-status-idle-line`、`--agentspace-risk-destructive`、`--agentspace-risk-risky`、`--agentspace-risk-safe`、`--agentspace-id-tool-bg`、`--agentspace-duration`、`--agentspace-ease-spring`、`--agentspace-aurora-navy`、`--agentspace-aurora-column-line`。动效 B 类两处：列表进入 400ms 改为 `--devui-animation-duration-slow`（300ms），弹出曲线改为 `--devui-animation-ease-out`。其余 B 类和全部 C 类保持原值。幻彩下与目标不一致、因而保留的 A 类包括 `--agentspace-status-idle`、`--agentspace-run-bg`、`--agentspace-id-human-color`、`--agentspace-id-tool-color`；像素和 Bento 会改写 `--agentspace-btn-ink`，因此也不并入。仍被页面读取、不能删的还有 `--agentspace-input`、`--agentspace-count-bg`、`--agentspace-segment-selected`、`--agentspace-text-tertiary`、`--agentspace-card-bg`、`--agentspace-muted`、`--agentspace-side-head-height`、`--agentspace-side-head-offset`、`--agentspace-aurora-ink`、`--agentspace-aurora-accent-2`、`--agentspace-aurora-shell-shadow`、`--agentspace-aurora-column-bg` 以及脚本写入的 `--agentspace-side-width`、`--agentspace-thread-width`。字号与行高沿用上一轮。
