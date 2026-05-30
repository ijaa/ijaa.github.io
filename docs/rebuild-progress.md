# Portfolio 2025 风格重构进度

更新日期：2026-05-30

## 目标

将 `ijaa.github.io` 根站从旧静态 landing 重构为接近参考项目 `davidhckh/portfolio-2025` 与线上站 `https://david-hckh.com/` 的交互效果，同时按 IJAA 当前个人站内容调整文案和链接。

核心要求：

- 使用 `React + Tailwind CSS + Three.js` 技术栈。
- 复用参考项目模型、纹理、字体、音频和交互思路。
- 保持 hero/about/projects/contact 的滚动式 3D 体验。
- 使用 Playwright 做功能回归测试。

## 当前实现状态

已完成：

- 根站迁移为 Vite + React 19 + Tailwind CSS 4 + Three.js/R3F。
- 核心资源落地到 `public/reference/`：
  - `models/room.glb`
  - `models/avatar.glb`
  - `models/lab.glb`
  - `models/contact.glb`
  - 房间、桌面、头像、matcap、全息、contact 等贴图
  - `audio/luci.ogg`
  - `audio/about.ogg`
- `src/three/PortfolioScene.tsx` 包含：
  - hero 房间场景
  - avatar 与 hologram 双模型
  - about 蓝色全息实验室层
  - contact 模型层
  - 相机插值、头像表情帧、眨眼、全息材质、粒子和进度 UI
- `src/App.tsx` 包含 sticky intro、hero、about spacer、projects、contact 和 hash/debug 跳转。
- `src/styles/global.css` 包含全局视觉、header、hologram、project card、contact 布局。
- `src/hooks/useSoundscape.ts` 接入双循环背景音轨。
- 项目卡片点击图片区域直接跳转，不再显示浮动转场层。
- 头部只保留声音按钮，移除常驻“联系我”按钮。
- 联系区邮箱按钮修复为可点击 `mailto:kailiu2013@gmail.com`。
- 首页左侧标题为 `IJAA` + `AI探索者`。
- about 文案和能力栈已切换到 AI Agent、图片生成艺术、Prompt、Skill 和全栈开发方向。

## 已验证结果

构建：

```bash
npm run build:site
```

Playwright：

```bash
npx playwright test e2e/project-links.spec.ts
npx playwright test e2e/soundscape.spec.ts
npx playwright test e2e/contact-links.spec.ts
```

当前确认：

- 首页 hero 显示参考站同款房间/桌面/人物背影场景。
- `#about` 和 `?debug-scroll=about-mid` 可显示蓝色全息场景、人物正脸、全息底座、粒子和进度条。
- 人物面部贴图、眨眼帧、肤色材质正常。
- about 信息框左侧裁切、`#about` 顶部米色露出、Projects 顶部蓝边已修复。
- Contact 阶段可显示 3D 场景。
- 首页音符位置已对齐到 `room.glb` 内 `music` 节点上方。
- 三个项目图片点击直接跳转已覆盖。
- 声音按钮开关状态和播放/暂停调用已覆盖。
- 联系区邮箱按钮触发 `mailto:kailiu2013@gmail.com` 已覆盖。

## 最近关键改动

- `src/App.tsx`
  - 首页标题拆成 `IJAA` 和 `AI探索者`。
  - about 自述文案更新。
  - 接入 `useSoundscape`。
  - 保持 `?debug-scroll=about-mid` 与 `?debug-scroll=contact-mid`。
- `src/content/site.ts`
  - 邮箱统一为 `kailiu2013@gmail.com`。
- `src/content/projects.ts`
  - 能力栈改为 AI Prompt 工程、图片艺术生成、Agent 产品开发、Skill 定制与优化、全栈开发。
- `src/components/Header.tsx`
  - 移除常驻联系按钮。
  - 声音按钮支持开关状态。
- `src/components/ProjectCard.tsx`
  - 移除点击拦截，恢复原生链接跳转。
- `src/three/PortfolioScene.tsx`
  - 音符锚点对齐到 `music` 节点上方。
- `src/styles/global.css`
  - 放大 `AI探索者` banner 字号。
  - 抬高联系区链接层级，保证邮箱按钮可点击。
- `e2e/`
  - 新增项目跳转、声音按钮、联系邮箱测试。

## 遗留风险

- 根路径 `/` 曾在历史调参中出现首屏被 about 场景污染或米色空白，仍应作为回归项保留。
- about 后段和 projects 交界需要继续视觉回归，避免 sticky 舞台提前释放。
- contact 阶段已有 3D 场景，但构图仍可继续精调。
- 移动端已验证 home/about，projects/contact 和竖屏完整滚动流程仍建议继续补充。

## 后续建议

1. 保持 `/`、`#about`、`?debug-scroll=about-mid`、`#projects`、`#contact`、`?debug-scroll=contact-mid` 的视觉回归。
2. 继续精调 contact 构图。
3. 补完整移动端 projects/contact 视觉验证。
4. 每次改项目跳转、声音、邮箱入口时同步跑 e2e。
