# ijaa.github.io

`ijaa.github.io` 是统一的 GitHub Pages 发布仓库。

详细架构与扩展说明见：

- [docs/github-pages-multi-site-architecture.md](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/docs/github-pages-multi-site-architecture.md)

## Recommended Architecture

- `ijaa.github.io` 负责根入口和最终发布
- `baby-future` 与 `image-story` 作为独立源码仓库存在
- 本仓库在构建时聚合两个子项目产物到同一 `dist/` 下

## Scripts

- `npm run build` 聚合本地两个产品仓库并生成 Pages 输出
- `npm run preview` 在本地预览 `dist/`

## Required Secret

GitHub Actions 需要一个能读取私有仓库的 token：

- `PAGES_REPO_TOKEN`

建议使用对 `ijaa/baby-future` 和 `ijaa/image-story` 具备只读权限的 fine-grained PAT。
