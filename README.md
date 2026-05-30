# ijaa.github.io

IJAA 的 GitHub Pages 根站与子站聚合仓库。

## 结构

- `src/`：根站 React 应用
- `site/`：Pages 入口静态站点
- `public/reference/`：3D 模型、纹理、字体、音频资源
- `scripts/build-pages.mjs`：构建并聚合子站
- `docs/`：架构、进度与问题记录
- `e2e/`：Playwright 测试

## 开发

```bash
npm run dev
```

```bash
npm run build:site
```

```bash
npm run build
```

```bash
npm run preview
```

预览地址：

```text
http://localhost:4173
```

## 内容现状

- 首页标题为 `IJAA` + `AI探索者`
- about 区域文案聚焦 AI Agent、图片生成艺术和独立开发
- 联系邮箱统一为 `kailiu2013@gmail.com`
- 项目图片点击直接跳转到对应项目地址
- 顶部声音按钮控制双循环背景音轨

## 测试

已固定 `@playwright/test@1.60.0`，只安装 Chromium。

```bash
npx playwright test e2e/project-links.spec.ts
npx playwright test e2e/soundscape.spec.ts
npx playwright test e2e/contact-links.spec.ts
```

## 部署

GitHub Actions 需要可读取子仓库的 `PAGES_REPO_TOKEN`。
