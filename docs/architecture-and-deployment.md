# 架构及部署说明

更新日期：2026-05-30

## 项目定位

本仓库是 IJAA GitHub Pages 根站与子站聚合仓库。根站是 `React + Tailwind CSS + Three.js` 3D 作品集页面，子站来自相邻产品仓库，最终统一输出到 `dist/` 并部署到 GitHub Pages。

## 技术栈

- Vite 7
- React 19
- TypeScript
- Tailwind CSS 4
- Three.js
- React Three Fiber
- Drei
- GSAP
- Lenis
- vite-plugin-glsl
- Playwright test 1.60.0

## 目录结构

- `src/App.tsx`：页面主结构、滚动状态、hash/debug 跳转、about/contact 编排。
- `src/three/PortfolioScene.tsx`：R3F 3D 场景，包含 room、avatar、lab、contact、相机和 shader 逻辑。
- `src/styles/global.css`：全局样式、布局、header、hologram、projects、contact 样式。
- `src/components/`：Header、Preloader、Cursor、ProjectCard、SocialLinks 等组件。
- `src/content/`：站点、项目和能力栈内容配置。
- `src/hooks/useSoundscape.ts`：双循环背景音轨控制。
- `public/reference/`：参考模型、纹理、字体、音频。
- `e2e/`：Playwright 功能回归测试。
- `scripts/build-pages.mjs`：GitHub Pages 聚合构建脚本。
- `site/`：根入口静态站点资源。
- `dist/`：构建输出目录，不应手动编辑。

## 页面架构

根站运行结构：

- `src/main.tsx` 挂载 React 应用。
- `PortfolioCanvas` 是 sticky intro 舞台内的 WebGL canvas。
- hero、about、projects、contact 使用同一个滚动流串联。
- about 使用长 spacer 提供滚动距离，实际视觉内容通过 sticky 舞台 overlay 展示。
- projects 保持普通页面流，并在进入 projects 时释放 sticky 舞台。
- contact 保持普通页面流，但进入 contact 时会重新保持 sticky 舞台可见，用同一个 canvas 展示 contact 3D 场景。
- about overlay 在 contact 阶段隐藏，避免 hologram 信息框覆盖联系页。
- hash/debug 跳转会在滚动前显式切换 `stickyVisible`。

当前内容：

- 首页标题为 `IJAA` + `AI探索者`。
- about 文案聚焦 AI Agent、图片生成艺术、独立开发。
- 能力栈为 AI Prompt 工程、图片艺术生成、Agent 产品开发、Skill 定制与优化、全栈开发。
- 联系邮箱统一为 `kailiu2013@gmail.com`。
- 顶部只保留声音按钮，不再显示常驻“联系我”按钮。
- 项目卡片图片区域直接跳转到项目地址，不再展示浮动转场层。

## 3D 场景

- `CameraRig`：根据 `sceneState` 在 hero/about/contact 相机位之间插值。
- `RoomModel`：hero 房间、桌面、椅子、音符。
- `AvatarModel`：人物模型、avatar/hologram 双模型、动画权重、面部 spritesheet。
- `LabModel`：about 全息实验室底座、粒子、电流、进度数字。
- `ContactModel`：contact 场景模型。
- `DarkPlane`：about 蓝色背景遮罩。

首页音符锚点对齐到 `room.glb` 内的 `music` 节点上方。

## 音频

`useSoundscape` 使用两个 `HTMLAudioElement`：

- `/reference/audio/luci.ogg`
- `/reference/audio/about.ogg`

浏览器若阻止自动播放，会在首次点击或键盘事件后尝试恢复播放。声音按钮通过 `aria-pressed` 表示开关状态。

## 构建命令

```bash
npm install
npm run build:site
npm run build
npm run preview
```

`npm run build` 会：

1. 删除并重建 `dist/`。
2. 使用 Vite 构建根站到 `.site-dist/`。
3. 将 `.site-dist/` 复制到 `dist/`。
4. 构建并复制相邻产品仓库：
   - `../baby-future`
   - `../image-story`
   - `../gpt-image-gen`
5. 将 `dist/index.html` 复制为 `dist/404.html`。

子仓库路径可用环境变量覆盖：

```bash
BABY_FUTURE_DIR=../custom-baby-future npm run build
IMAGE_STORY_DIR=../custom-image-story npm run build
GPT_IMAGE_GEN_DIR=../custom-gpt-image-gen npm run build
```

## 验证方式

基础验证：

```bash
npm run build:site
```

Playwright 功能回归：

```bash
npx playwright test e2e/project-links.spec.ts
npx playwright test e2e/soundscape.spec.ts
npx playwright test e2e/contact-links.spec.ts
```

覆盖点：

- 三个项目图片点击直接跳转。
- 声音按钮可开关并触发播放/暂停。
- 联系区邮箱按钮可点击并触发 `mailto:kailiu2013@gmail.com`。

视觉验证仍可通过 Chromium screenshot 进行，移动端建议使用 `--viewport-size=390,844`，避免触发未安装的 WebKit 缓存。

## 部署

部署目标是 GitHub Pages。

GitHub Actions 注意事项：

- 私有子产品仓库需要读取权限。
- 需要配置 `PAGES_REPO_TOKEN` 或等价 token。
- 不要提交本地路径覆盖或任何密钥。

## 维护注意事项

- 3D 资源路径保持在 `public/reference/`，运行时路径以 `/reference/...` 访问。
- 音频资源保持在 `public/reference/audio/`，构建时不会自动下载。
- 修改滚动过渡时同时验证 `/`、`#about`、`?debug-scroll=about-mid`、`#projects`、`?debug-scroll=contact-mid`。
- 修改 about、项目、邮箱或社交入口时，同步检查 `src/content/`、`src/App.tsx`、`site/index.html` 和相关 e2e。
- 修改部署脚本时确认 `dist/404.html` 仍由 `dist/index.html` 生成。
