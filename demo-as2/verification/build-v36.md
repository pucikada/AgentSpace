# 构建 V3.6 验证记录

日期：2026-11-08。参考：LeslieKuo/agentspace-mvp 的 liufei 分支 product.md，以及用户提供的本地 MVP HTML。

## 自动回归

`node --test demo-as2/build/build-v36.test.cjs`：10 项通过，覆盖环境版本、重名、本地设备/目录、公开确认、实例来源、公开依赖、空集合、串联发布、固定原子快照、复用来源重排、扩展隔离、项目成员权限。

`node --check`：构建模块与最终 HTML 内联脚本语法通过。`git diff --check` 通过。连续两次内联构建的 HTML 哈希相同。

## 浏览器验证

在隔离的 Chromium 会话访问本地 HTTP 预览，执行 `browser-check.js`：33 项通过（含本轮布局回归）。

1. 保存运行环境模板 V1。
2. 基于模板创建实例，预填独立配置与来源版本。
3. 保存公开实例和独立工作目录。
4. 原子模板固定绑定环境版本。
5. 分开保存预置提示词与输入提示词模板。
6. 空输入模板不回填描述或预置提示词。
7. 串联选择稳定的前序步骤 ID。
8. 发布完整串联配置与人工确认设置。
9. 创建任务时保存独立设计快照。
10. 合格复用步骤使用同一实例 ID 和目录。
11. 待处理任务使用既有任务看板的数据格式。
12. 环境关联任务去重，待处理不计运行中。
13. 环境编辑产生 V2，旧 V1 快照保持不变。
14. 串联已保存的原子模板快照保持固定。
15. 未结束任务阻止删除相关环境。
16. 首个本地运行时离线时明确阻止实例创建。

另行检查：刷新后恢复构建编辑内容；切换字段后保持纵向滚动位置（1800 → 1800）与焦点；新建任务在原有看板和详情可见；个人空间读取相同实例；1440×1000 浅色/深色截图检查与 900×800 无页面横向溢出检查；未观察到脚本错误。

## 范围与边界

本轮重点是构建、资产浏览及从模板创建任务。没有将产品文档中定时/事件/Thread 的全部要求声明为已实现或已验证。所有权限、设备、工作目录、模型与准出机制均为浏览器原型数据，不证明真实后端能力。

## 构建布局调整

- 左侧移除全部四个新建快捷入口；四类已构建资产以现有 AS2 `bd-card` 卡片规范呈现，支持一级范围 Tab、二级资产 Tab、分类搜索和选中态。
- 右侧首页仅保留四个新建入口；选择左侧卡片打开对应详情 / 编辑页，新建入口打开对应新建页。
- 保存结果同步到左侧卡片；模板使用操作保留在对应编辑页头部。
- 浏览器新增四项自动检查：侧栏无新建快捷入口、首页只有四入口、侧栏已有资产以卡片展示、卡片选中后打开正确资产。
- 手动验证搜索仅过滤左侧，分类 Tab 切换不丢失右侧编辑内容；窄视口没有页面横向溢出；浅色与深色沿用既有 token。

二级 Tab 更新：移除展开 / 收起和分组箭头；一级范围采用共享下划线 Tab，二级分类采用已有 `bd-seg as2-seg` 单行分段 Tab。四个二级 Tab 位于同一行，切换只显示当前分类卡片；方向键可切换分类并保持焦点。

卡片精修：标题栏新建图标位于收起按钮左侧，点击后打开右侧四入口的新建总览页。左侧资产卡片增加类型标识、版本标签、描述层级、元信息分隔和选中态；右侧新建卡片增加矢量示意图和一致的操作区。已检查浅色、深色与悬停状态，未引入额外图像或运行依赖。

选中态修正：选中资产使用现有页面的中性背景与边框，移除蓝色渐变、描边和左侧强调线。默认类型图标采用蓝 / 紫 / 青 / 金的轻量色彩，选中时保持类型色；深色主题提高图标对比度。

## 多级菜单与串联布局

菜单问题已在修改前复现：1440×1000 视口，外观 → 极简打开后，第三层左边界为 490px，父项右边界为 480px；指针移到 (485,795) 时，第三层从 block 立即变为 none。原来的 overflow:auto 还会裁剪跨间隙的伪元素命中区。修复后由指针通道与 240ms 延迟关闭管理可见性，兄弟风格切换有 150ms 容错；面板仅在打开时定位，选中颜色刷新后保留展开路径。实测相同坐标保持打开，Bento 布局与 #12A58B 配色均可点击成功，Escape 可关闭。

串联模板改为基础信息、横向阶段 / 步骤轨道、当前步骤配置三部分。阶段与步骤均按执行顺序从左到右展示；长轨道可横向滚动，选择和新增步骤保持选中项可见；下方配置占满可用宽度。新增浏览器回归检查编排区位于步骤配置上方。

## 资产总览与编辑工作区切换

默认进入构建为无左侧面板的全屏资产网格，包含资产类型 Tab、个人 / 项目 / 全部范围、搜索及右上角四类型创建下拉。选中卡片或创建类型后展开侧栏，右侧显示对应表单；返回 / 保存后恢复资产总览。左侧标题栏「＋」调用同一创建菜单。该流程替代原来的四个大新建入口首页。

验证总览隐藏空侧栏且内容区铺满高度，创建四类资产进入正确表单，编辑保留两级侧栏 Tab，保存结果回到网格；方向键每次移动一个创建选项，Enter 创建对应类型，Escape 关闭并返回触发按钮焦点。卡片切换实际运行共享位置过渡、侧栏与页面淡入动画；快速返回后没有残留动效副本或不可见卡片。减少动态效果偏好会跳过动画。

## 筛选与紧凑操作更新

构建与扩展二级 Tab 均为「全部 / 个人 / 项目」。扩展个人筛选包含兼容的旧个人安装（历史 global），项目筛选只包含所选项目的明确安装；选择项目显示项目选择器，切换扩展类型不重置项目，全部 / 个人不显示项目选择器。

新建 / 编辑页移除「返回构建」按钮，保留主导航入口。阶段右侧的整块添加步骤入口移除，改为标题栏 24px 加号按钮；单步骤阶段宽度为 240px，点击仍新增并选中新步骤。新增浏览器检查覆盖排序、返回按钮移除、紧凑添加入口及扩展筛选行为。

标题统一：移除构建标题独立的 24px 设置，所有构建页头复用 `demohead`，与扩展页同为 28px / 40px，字重 700；跟随共享字号 token 和主题变化。

创建菜单可读性：液态玻璃主题的创建弹层使用 98% 遮蔽背景和 28px 背景模糊，弹层内使用明确的深色标题和次级文字，避免底层搜索框与卡片文字干扰。创建入口图标与资产卡片共用蓝 / 紫 / 青 / 金四类配色，其他主题保留原有面板 token。

幻彩主题操作按钮去除默认 / 悬停阴影；创建、保存及弹窗按钮共用该规则，卡片和弹层阴影保留。

## 2026-11-08 · 主页滚动与工作台封面
- 主页标题、一级 Tab 和工作台筛选栏统一吸顶；背景使用不透明主题底色，避免上滑时筛选栏或卡片穿透导航。
- 工作台卡片新增当前采用版本的布局缩略图；默认工作台封面读取个人面板配置。封面内容为只读预览，不额外请求统计数据。
- 卡片保留名称、归属范围、已采用版本、待采用版本、更新时间及常用/编辑操作；移除卡片外部的聚合指标、来源数量和会话字段。
- 浏览器验证：四种主题的 Tab/筛选栏均不重叠、吸顶背景不透明；封面打开、编辑、常用、列表视图、深色封面与滚动回归通过，无页面错误。
- 验证：10 项构建逻辑测试、内联 JS 语法与 git diff --check 通过。视觉截图：home-covers.png。

## 2026-11-08 · 工作台卡片悬停操作
- 卡片悬停/键盘聚焦时展示打开工作台和更多按钮；菜单打开期间保持按钮可见，触屏直接展示。
- 更多菜单提供编辑、收藏/取消收藏、打开工作台和删除；删除前确认，默认工作台不可删除。
- 已收藏星标使用主题色实心填充，未收藏保持空心；aria-pressed 与收藏状态同步。
- 浏览器验证：默认隐藏、悬停显示、菜单四项、收藏切换及文案、编辑、打开、删除确认/取消/完成、默认工作台保护均通过；Escape 关闭菜单并归还焦点，页面无错误。
- 内联脚本语法、10 项构建测试及 diff 检查通过。截图：home-card-actions.png。

## 2026-11-08 · 空间字段、新建任务配置与全局卡片操作
- 参考本地 agentspace2.0_mvp (5).html 的个人/项目空间资源结构，沿用当前页面的标题、Tab、卡片、表格、表单和主题样式。
- 个人空间：知识库、运行环境、环境变量、任务模板；项目空间另含代码仓。运行环境分模板/实例，任务模板分原子/串联。环境变量按参考原型保留功能占位。
- 代码仓包含名称/地址/默认分支/访问状态/关联模板；环境模板展示位置、安全区域、Runtime、代码仓、目录和引用；实例展示目录、来源、共享类型/所有者、关联统计。模板和环境直接读取当前构建资产，保留用户已有配置。
- 新建任务候选只显示当前范围内可用的已发布模板；悬停模板可查看配置，预览支持内部滚动。左侧抽屉编辑当前任务快照，可取消或应用，不覆盖原模板。
- 配置覆盖 Agent、预置/输入提示词、模型、扩展、准出规则、责任人、环境模板/实例和临时运行配置；串联任务支持阶段/步骤、逐步输入/配置、人工确认、重试及前序环境复用。无模板时支持自定义原子和串联任务。
- 创建任务固定来源版本、独立配置快照与最终提示词；新建运行目录生成临时私密实例，不进入长期实例列表；环境兼容、有效引用、扩展和本地运行时可用性须验证通过。
- 工作台悬停打开按钮使用主按钮色；更多菜单仅编辑、收藏/取消收藏、删除。
- 统一卡片操作的悬停/键盘聚焦显示规则，覆盖工作台、资源、知识库、扩展、任务、项目、产物、目录、构建资源和工作台面板等；菜单打开时保持显示，表单操作与表格操作不受影响。
- 验证：spaces-task-check.js 27 项、原有 browser-check.js 33 项、构建逻辑测试 10 项通过；主按钮四主题检查、卡片默认/悬停/键盘状态、模板预览滚动、页面错误检查、内联脚本语法和重复同步幂等检查通过。

## 2026-11-08 · 浮动操作、收藏颜色与图标 Tab
- 资源卡片操作栏改为右下角绝对定位浮层；移除原有底部分隔行与按钮占位。知识库、扩展和构建资源的对应操作组同步按浮层显示，保留有内容的元数据页脚。
- 同一视口下实测模板卡片从 293.31px 缩短至 246.31px；操作组距右侧/底部均 12px，默认隐藏，悬停/键盘聚焦时可见且不改变高度。
- 工作台更多按钮增加浅底容器；已收藏星标改为黄色实心填充。
- 侧栏常用工作台统一工作台图标，默认/质量/代码仓/现网场景按蓝/青/紫/金区分。
- 工作台、资源和产物的卡片/列表切换统一使用任务页 tk-layout-tabs 图标 Tab，保留名称提示和 aria-selected 选中状态。
- 验证：扩展后的空间/任务浏览器检查 34 项、构建逻辑测试 10 项、内联语法与 diff 检查通过；人工截图检查浮层、更多底色、黄色收藏和图标 Tab。

## 2026-11-08 · 主页背景与平铺列表
- 主页吸顶区域在未滚动时透明，与内容区保持同一表面；滚动后取实际页面容器底色遮挡内容。液态玻璃仅在吸顶时采用高遮蔽磨砂底，避免头部默认叠色。
- 工作台列表取消外层阴影、圆角、容器底色、表头填色和隔行背景，保留细分隔线平铺。
- 标题作为打开入口，整行悬停/标题键盘聚焦时变为主题色；操作列仅编辑、收藏/取消收藏、删除文字按钮，默认工作台删除仍禁用。
- 验证：五主题在可滚动视口中的初始透明/吸顶底色与 Tab 层级检查通过；标题打开、编辑、收藏切换和删除确认通过；34 项空间/任务回归、内联语法和 diff 检查通过。截图：home-flat-list.png。

## 2026-11-08 · 扩展开关常显
- 扩展卡片的开关从更多操作组中独立出来，默认固定右上角常显；更多按钮仍在右下角悬停/键盘聚焦时出现。
- 扩展中心、个人主页扩展、项目扩展统一使用同一布局；标题为开关留出间距，目录导入卡片保持原交互。
- 浏览器验证：8 个扩展卡片开关常显，更多默认隐藏，开关点击改变状态且不打开详情，更多菜单可打开/关闭；个人扩展 3 张、项目扩展 5 张均包含独立开关。内联语法和 diff 检查通过。

## 2026-11-08 · 工作台先归档后删除
- 工作台卡片的实心/空心收藏星标默认常显；其他悬停操作不变。
- 卡片更多菜单和列表操作列使用共享操作定义：未归档为编辑、收藏/取消收藏、归档；已归档为取消归档、删除。
- 归档保留工作台、会话、版本和收藏状态，移出全部/常用/最近列表及常用侧栏，在已归档 Tab 查看；恢复后回到正常列表。
- 删除只允许已归档项，必须经确认弹窗；取消不改变记录。默认工作台同样遵循先归档后删除，明确删除后不再自动补回，重置演示仍恢复初始数据。
- 验证：bench-archive-check.js 16 项通过，覆盖常显收藏、两种视图、归档持久化、取消归档、删除确认/取消、默认工作台删除及防止自动重建。共享空间/任务回归 34 项、内联语法和 diff 检查通过。

## 2026-11-08 · 模板菜单排版与右侧配置抽屉
- 模板下拉菜单统一 8px 内边距、12px 分组标题、13px 模板名称、40px 模板行高、11px 弱化版本标签；名称/图标/版本对齐，长名称省略，模板列表可内部滚动。
- 自定义配置入口分主副两行，避免长文案与模板项层级混杂；当前选择保留轻量背景与勾选提示。
- 配置抽屉改为右侧滑入，右侧对齐并铺满窗口高度；全屏遮罩从视口顶部开始，覆盖 Header 和背景操作。
- 验证：菜单字号/间距实测、悬停预览和真实点击打开抽屉、全屏遮罩 hit-test、右侧定位、Escape 关闭及 34 项空间/任务回归通过；JS 语法与 diff 检查通过。截图：task-menu-polished.png、task-config-right-drawer.png。

## 2026-11-08 · 全页面设置与运行时 / WeLink 字段
- 设置从弹窗改为全页面：左侧为分类导航、搜索和返回入口，右侧为居中的设置分组；保留当前 AS2 主题、控件与所有 11 个分类，支持同类操作保留滚动位置，返回保留未完成的新建任务草稿。
- 本地运行时按参考 MVP 的内容对齐：当前用户、多实例、绿区/黄区、在线/离线、默认实例、版本、排序与拖拽；管理字段为名称、设备名称、安全区域、系统、默认工作路径和示例状态，含部署命令与复制入口。
- 排序同步到任务运行时选择，首个离线设备不会自动跳过；删除被环境引用的设备受阻，空设备列表不再回填任务侧示例设备。保存保留已有运行时 ID 和配置。
- WeLink 按参考 MVP 更新为总开关和七个事件：待输入、失败、新增待人工启动、定时自动启动、事件自动启动、排队、完成；关闭总开关时禁用子开关，修改进入草稿并显式保存，支持七类消息预览和提示关闭。不会发送真实消息。
- 验证：settings-page-check.js 29 项、原有构建/扩展 33 项、空间/任务 34 项、构建逻辑 10 项通过；额外检查所有分类、五主题颜色、运行时拖拽排序、内联语法、重复同步幂等和 diff。原型中的命令仅展示/复制，未执行安装或连接设备。
- 截图：settings-runtime-fullpage.png、settings-welink-fullpage.png、settings-general-dark.png。

### 2026-11-08 Header navigation and default appearance

- Added global back/forward controls with disabled endpoints and branch truncation. Route history preserves task/build drafts without restoring preference or asset data snapshots.
- Removed the settings sidebar return control; compacted settings search to 36px.
- Set the requested default to Aurora light with Aurora blue (#3F6BFF), applied once to existing stored sessions; subsequent user theme selections remain saved. Appearance reset uses this default too.
- Verification: 12 header/navigation browser checks, 29 settings browser checks, 10 build unit checks, inline JavaScript syntax, and 1600px/1024px header layout inspection passed.

### 2026-11-08 Personal task aggregation and navigation cleanup

- Removed Build's all-assets tab; legacy selection falls back to atomic templates. Saving selects the asset's own category.
- My Tasks now aggregates personal tasks plus owned/triggered tasks across joined projects, with scope/project and relationship filters. The sidebar groups related tasks by project; project headings filter My Tasks without changing project context.
- My Tasks uses runs/schedule/event/archive tabs; thread tasks move into the run trigger filter. Project task tabs retain their existing categories. Cards identify project origin.
- Home workbench filters are All/Favorites/Archived; old Recent selection falls back to All. Home extensions provide read-only details and a link to extension management.
- AgentCenter imports support only personal/project scopes, including validation and confirmation. Header links to the existing 1.0 prototype beside the guide.
- Verification: 32 new aggregation/home/import checks, 34 build browser checks, 34 space/task checks, 16 workbench archive checks, 10 build unit checks, inline syntax and diff checks passed. Inspected 1600px task grouping and home-extension screenshots and 1024px Header bounds.

### 2026-11-09 Flat task sidebar and hover actions

- Personal sidebar uses one flat task section with a persistent project selector. Default is personal manual tasks; users can choose all tasks, all related project tasks, or one joined project. Archived/unrelated tasks stay excluded, and task details preserve the selected scope.
- Both personal/project task centers use four primary tabs. Legacy temporary/thread tabs map to run-board trigger filters; manual and thread filters remain distinct.
- Schedule/event card switches remain visible at top right; more actions appear at bottom right on hover/focus without occupying layout space.
- Removed secondary outlined surfaces from hover action containers across extension/resource/workbench/task cards. Buttons retain their own surface and more-button backgrounds.
- Verified 40 aggregation/sidebar checks, 38 card-action/theme checks, 34 space/task regression checks, 12 header checks, 10 build unit checks, inline JavaScript syntax, and real hover screenshots. No browser errors observed.

### 2026-11-09 Scope menus and flat project settings

- Sidebar task filter is an always-visible icon beside the section heading; its anchored menu groups task scope and project choices, marks selection, and supports arrow navigation, Escape, outside-click dismissal and trigger toggling.
- Task center scope and specific project filters are separate controls. A concrete project selector appears after choosing project tasks. Existing saved selections remain valid.
- Board card category wording changes from collaboration tasks to thread tasks. Header's legacy version link includes a history icon.
- Members/settings use flat sections with working existing fields and save action. Project template import/export buttons are explicitly illustrative entries and do not change configuration.
- Project sticky headers now cover the scroll container's complete top/side padding with an opaque surface, preventing scrolled content from showing above or through the header. Initial layout also synchronizes when a page has no overflow.
- Verified 44 aggregation/menu checks, 38 card/theme checks, 28 project settings/scroll checks across five themes, 12 header checks with the default-theme fixture, menu keyboard/outside-click behavior, viewport containment at 1024px and 1600px screenshots, inline syntax and diff checks.

### 2026-11-09 Header search grouping and knowledge cleanup

- Moved back/forward controls into the search group immediately before the search box; navigation history is unchanged. Verified 768px, 1024px and 1600px Header geometry plus 12 existing navigation checks.
- Removed the visible project-template illustrative caption while retaining its description and entry buttons.
- Removed the appended project-artifact section from project knowledge libraries. Existing knowledge documents and the project's dedicated artifacts tab remain available.
- Verified 34 space/task regression checks, preserved document titles, dedicated artifact rendering, inline JavaScript syntax and diff checks.

### 2026-11-09 Automation execution-history detail

- Schedule/event execution-record menu entries open a dedicated rule detail with a main trigger/history column and basic-information rail. Existing filters are preserved when returning, editing or manually running.
- Expandable rows show execution state, origin, time, reason and per-task input, with links to associated task details. State filters, enablement, rule editing and immediate execution reuse existing actions. Header history includes the detail route.
- Linked tasks supply execution data; original demo rules carry separately marked illustrative completed/skipped/failed examples. New rules start empty. Historical timestamps and illustrative inputs persist without being rewritten by rule edits or subsequent runs.
- Next-run display uses the configured time zone for hourly/daily/weekly/monthly/one-time schedules; Cron remains explicitly described as a Cron plan. This prototype does not dispatch background jobs.
- Verified 26 execution-history checks, 44 task aggregation checks, 38 card/theme checks, 12 header checks and 10 build unit checks. Inspected expanded records at 1024px and verified no content overflow at 768/1024/1600px, inline syntax and diff checks.

### 2026-11-09 Task preview icons and complete environment summaries

- Added task/workflow icons to template choices, semantic icons to preview headings/fact labels, and an edit icon to the preview action. Preview/drawer primary buttons have no colored border or shadow, with a neutral keyboard focus outline retained.
- Environment template cards expose location/zone, image or local-runtime selection policy, cloud toolsets/tools, repository branches, working-directory policy, startup path and initialization command. Configured values use the underlying environment data. Cards use at most two columns.
- Removed the shared build button from personal/project space page headers; environment/template tab-level build links remain and include right arrows.
- Verified 34 space/task regression checks, both spaces' tab/header controls, configured image/tool/repository/path/init values, and preview icons/border styling across five themes. Checked inline syntax and diff hygiene; inspected preview and environment screenshots at 1600px.

### 2026-11-09 Compact environment template cards

- Reduced environment cards to a compact icon/name/version header, one-line description, location/zone/runtime summary, and reference/instance counts. Advanced fields remain in the existing full-detail dialog.
- Clicking the card or pressing Enter/Space opens details. Reference and instance buttons keep their own filter actions; edit remains a floating hover action without reserved space.
- Verified roughly 123px card height at 1600/1024px, no grid overflow, cloud/local full detail fields, independent reference filtering, keyboard activation, 34 space/task checks, inline syntax and diff checks.

### 2026-11-09 Wider default navigation rail

- Increased the labeled navigation rail from 60px to 72px while retaining 48px entry tiles and the existing 52px icon-only option.
- Verified rail/sidebar alignment in personal, project, extension, build overview/editor views, no horizontal overflow at 1024px, and a 1600px screenshot.

### Local preview: aurora theme and navigation refinement
- Added aurora light, full dark, and mixed (深浅映衬) themes with independent mode selection and shared accent controls; existing mixed dark preference migrates without changing its appearance.
- Full dark reuses the complete dark surface system, with aurora accents; sticky headers refresh their surface when changing themes.
- Sidebar default text uses primary ink, with 36px main rows, 32px compact rows and clearer group spacing. Workspace icon colors and task status colors remain.
- Removed card elevation across aurora modes; retained floating menu/dialog elevation.
- Verified 74 theme browser checks, 16 environment card checks, 34 space/task checks, 12 header navigation checks, 10 build domain tests, inline JavaScript syntax and 1024px settings layout without horizontal overflow.
- Pending user visual review in the built-in browser. No commit or push for this batch.

- Preview feedback: full dark uses one neutral #18181B canvas across header/sidebar/content, without colored gradients; liquid theme entry selects blue-orange gradient wallpaper, and unread number badges retain white text.

- Follow-up: aurora frame geometry is now shared across light/mixed/full dark, including personal/project boards, messages and build overview; neutral dark column surfaces no longer inherit the classic dark status stripe or opaque filter toolbar.
- Sidebar header divider is hidden only for the aurora family. Regression checks retain dividers in classic, classic dark, liquid, bento and pixel. Compared theme geometry and inspected 12 page/dialog states; 1024px viewport has no document overflow.

- Preview refinement: neutral dark depth now separates outer canvas (#141416), frame/sidebar (#19191C), content canvas (#1F1F22), and cards (#28282B), while retaining identical aurora frame geometry. Channel/thread message actions no longer inherit the generic dark card background across the whole row. Verified with channel screenshots and the 61-check browser regression.

- Latest preview feedback: restored aurora sidebar dividers and aligned them with inset content headers (all three modes, both density options); removed the rectangular outline around the messenger outer wrapper.
- Environment cards now own their spacing rather than inheriting compact generic asset styles, use a single-column layout below 1200px, and expose only View details on hover. The read-only detail offers an explicit link to edit the matching template in Build. Verified personal and project scopes.
- Full dark kanban columns use a deeper neutral base with lighter task cards, matching the provided layer reference without shadows. No push; pending visual approval.

### 2026-11-09 Final visual refinement and release
- Supersedes the intermediate palette/divider notes above: full dark uses #101012 outer canvas, #1B1B1E frame, #151517 content, and #242427 kanban cards. Aurora sidebar dividers are restored and aligned with content headers; kanban columns have no outline.
- Workbench cards pair sidebar-matched colored icons and key metadata with a tilted snapshot in a page container. Favorites stay visible at the outer top-right; open/more actions remain hover/focus-only.
- Browsing grids share the automation cards' 320px minimum responsive tracks and 12px gutters. Scheduled/event card footers use spacing instead of dashed dividers.
- Dark overflow counts use #3D3D43 with light text; selected secondary tabs use #424248. Custom configuration has no default selected fill.
- New-task shortcuts are lightweight and sit 22px below the composer. Dark composer uses #1D1D20 with a deeper tray.
- Appearance settings use graphical family/mode previews and labeled accent swatches. Environment details use grouped read-only configuration and version history; editing routes to Build.
- Verification: 74 theme checks, 16 environment checks, 34 space/task checks, 28 project settings/sticky-header checks, 16 archive checks, 38 task-action checks, 8 focused visual-refinement checks and 10 build domain tests passed. Inline script syntax and git whitespace checks passed.
- User explicitly authorized push after completion.
