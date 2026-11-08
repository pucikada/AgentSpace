# AgentSpace 2.0 交互 Demo · AS2 设计系统版

单文件可交互原型：`index.html`（直接用浏览器打开，或访问 GitHub Pages：<https://vinniechenyu.github.io/AgentSpace/demo-as2/>）。

在 MVP 原型的基础上，用 AgentSpace 2.0 设计系统（AS2）重构了前端样式与组件，交互逻辑保持不变，并补充了：

- **框架**：灰阶画布 + 二级菜单与内容同处一块 18px 面板；面包屑右侧只放可见范围。
- **组件**：墨色胶囊主按钮、AS2 状态（执行中 / 需要你 / 待验收 / 已完成）、统一的输入类控件、Composer（参考 Kobra Chat Input / affectUI Chat Composer）。
- **执行可见性**：执行中的任务实时显示当前活动、步骤进度、可展开的工具调用与停止按钮（示例数据）。
- **设置**：通用 / 外观 / 通知 / Agent 与自主权 / 记忆与进化 / 扩展与权限 / 快捷键 / 数据与隐私。
- **主题**：浅色、深色，以及两款个性化皮肤——「流光」（液态玻璃，6 套预设配色 + 自定义主色 / 辅色）与「像素」（开发者风：中性灰、等宽字体、像素标题、直角硬边）。
- **侧栏**（参考 Kobra Sidebar）：选中线滑动、悬停高亮、可收起、可拖动调宽（200–360px），项目切换为锚定浮窗。
- **头像**：Agent 使用 AgentSpace 吉祥物，成员使用 3D 人物形象（见 `build/assets/avatars/CREDITS.md`）。
- **构建**：左侧按类型分组展示已构建资产卡片，支持范围、搜索与折叠；右侧默认只有四个新建入口，选择资产后显示对应详情 / 编辑页。扩展、进化保留各自页内导航。

另有按 DevUI 多主题规范调整的副本：[demo-as2-devui](../demo-as2-devui/)（构建脚本在 `build/devui/`）。

数据与执行均为本地演示，保存在浏览器 localStorage；可在「设置 → 数据与隐私」重置。

## 构建更新 · 2026-11-08

依据 [产品规范 V3.6](https://github.com/LeslieKuo/agentspace-mvp/blob/liufei/product.md) 与本地 MVP 参考页，同步构建功能，保留 AS2 主题与应用框架：

- 四类独立资产：原子任务模板、串联任务模板、运行环境模板、运行环境实例；支持个人/具体项目范围、管理列表、版本快照、依赖查看与删除保护。
- 原子模板：Agent类型、分离的预置提示词/输入提示词模板、推荐模型、Skill/Extension/MCP/CLI 分组、三类自动准出机制、责任人策略与三种环境绑定。
- 串联模板：阶段/步骤排序，混用原子模板固定版本和现场配置，必填步骤输入、逐步环境/准出/人工确认，以及按稳定步骤 ID 复用合格前序实例；未完成内容可保存草稿。
- 环境模板统一公开，不绑定本地设备。实例支持基于模板或直接创建、本地新目录或已有文件夹、公开访问确认；不提供实例启停状态。
- 个人/项目空间浏览同一份构建资产；使用已发布模板可创建待处理任务，保存完整设计快照与实际实例关联。原有定时、事件与 Thread 创建流程继续保留，本次没有重写这些入口。

本轮模拟配置与引用关系，不实际创建目录、安装镜像、连接设备或执行准出命令。

增量更新单文件（不重新生成其余页面）：

```bash
python3 demo-as2/build/sync_build.py
node --test demo-as2/build/build-v36.test.cjs
```

`as2-build.js` / `as2-build.css` 是本轮构建模块源文件；`sync_build.py` 将其内联到 `index.html`，完整重建脚本也调用同一过程。验证记录见 [verification/build-v36.md](verification/build-v36.md)。

## 重新生成

`index.html` 由 `build/` 下的脚本生成，原始 MVP 页面保持不动：

```bash
cd demo-as2/build
python3 refactor-as2.py
cp agentspace2.0_mvp.as2.html ../index.html
```

| 文件 | 作用 |
|---|---|
| `backups/agentspace2.0_mvp.before-affectui.html` | 原始 MVP 原型（输入，不修改） |
| `design-system/tokens.css` · `components.css` | AS2 设计 token 与组件样式 |
| `refactor-as2.py` | 构建脚本：内联设计系统，把遗留样式的颜色 / 圆角 / 阴影 / 字体收敛为 AS2 token，并对模板做必要修改 |
| `as2-bridge.css` | 把 demo 自有类名映射到 AS2 组件 |
| `as2-settings.js` | 设置弹窗与全局偏好、输入方式（键盘才显示焦点环） |
| `as2-run.js` | 执行过程组件：Thinking Loader、Task List、Tool Call、停止 |
| `as2-message.js` | 消息悬浮工具栏：复制消息 |
| `as2-extensions.js` | 扩展行卡片的「更多」菜单、ⓘ 说明提示组件 |
| `as2-sidebar.js` | 侧栏动效、收起与拖动调宽、项目切换浮窗 |
| `as2-avatars.js` | 把首字母头像替换为成员 / Agent 头像 |
| `assets/avatars/` | 头像资源与来源说明（构建时内嵌） |
| `assets/agentspace-logo.svg` | 品牌 logo（构建时内嵌） |
| `lucide-extract.py` · `assets/lucide-icons.json` | 图标：从 lucide-react 按语义映射提取 Lucide 图标数据（修改映射后重新运行脚本） |
