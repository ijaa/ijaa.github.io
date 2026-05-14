# ijaa.github.io 多站点架构与接入文档

本文档用于说明当前 `ijaa.github.io` 多站点系统的组成、构建方法、部署原理，以及未来新增更多子项目时的接入方式。

当前文档基于 2026-05-13 的实际落地状态编写，覆盖以下仓库：

- `ijaa/ijaa.github.io`
- `ijaa/baby-future`
- `ijaa/image-story`
- `ijaa/gpt-image-gen`

相关设计文档：

- [ijaa.github.io Flat Design Landing 设计方案](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/docs/flat-design-landing-system.md)

## 1. 系统目标

目标不是把多个项目直接塞进一个大仓库，而是：

- 每个产品作为独立源码仓库维护
- 每个产品拥有自己的开发、测试、构建与 CI
- 最终统一发布到 `https://ijaa.github.io` 同一域名下的不同子路径
- 新增第三个、第四个项目时，保持接入方式一致

当前统一发布的路径结构是：

- `/` 根入口页
- `/baby-future`
- `/image-story`
- `/gpt-image-gen`

## 2. 当前仓库分工

### 2.1 发布仓库：`ijaa.github.io`

职责：

- 承担 GitHub Pages 的唯一发布入口
- 维护根首页 `/`
- 拉取各个产品仓库的最新代码
- 执行聚合构建
- 输出最终 `dist/` 并发布到 Pages

关键文件：

- [site/index.html](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/site/index.html)
- [scripts/build-pages.mjs](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/scripts/build-pages.mjs)
- [.github/workflows/deploy-pages.yml](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/.github/workflows/deploy-pages.yml)

### 2.2 产品仓库：`baby-future`

职责：

- 维护产品介绍页源码
- 运行 lint / test / build
- 在 `main` push 成功后，自动触发 `ijaa.github.io` 的统一发布流程

关键文件：

- [vite.config.js](/Users/liukai/Documents/workspace/other/kkstudios/baby-future/vite.config.js)
- [.github/workflows/ci.yml](/Users/liukai/Documents/workspace/other/kkstudios/baby-future/.github/workflows/ci.yml)

### 2.3 产品仓库：`image-story`

职责与 `baby-future` 相同。

关键文件：

- [vite.config.js](/Users/liukai/Documents/workspace/other/kkstudios/image-story/vite.config.js)
- [.github/workflows/ci.yml](/Users/liukai/Documents/workspace/other/kkstudios/image-story/.github/workflows/ci.yml)

### 2.4 产品仓库：`gpt-image-gen`

职责：

- 维护图片生成工具静态页面源码
- 运行最小 lint / test / build
- 在 `main` push 成功后，自动触发 `ijaa.github.io` 的统一发布流程

关键文件：

- [package.json](/Users/liukai/Documents/workspace/other/kkstudios/gpt-image-gen/package.json)
- [.github/workflows/ci.yml](/Users/liukai/Documents/workspace/other/kkstudios/gpt-image-gen/.github/workflows/ci.yml)

## 3. 架构原则

这个系统基于以下原则：

### 3.1 一个发布仓库，多个产品仓库

不要让多个产品仓库直接争抢同一个 GitHub Pages 站点。

原因：

- GitHub Pages 用户站点只有一个最终发布入口
- 子路径组织和刷新兜底应该统一控制
- 后续扩展更多产品时，聚合逻辑只需要在发布仓库里加一段

### 3.2 产品仓库只关注“构建出可部署静态资源”

每个产品仓库只负责：

- 本地开发
- 质量检查
- 构建
- 输出静态资源

它们不直接发布到 Pages。

### 3.3 发布仓库负责“拉取、构建、挂载、发布”

发布仓库的任务是：

- checkout 各产品仓库
- 对每个产品注入对应子路径
- 构建得到各自 `dist/`
- 合并到 `ijaa.github.io/dist/`
- 发布到 GitHub Pages

## 4. 目录与产物结构

最终 Pages 产物结构如下：

```txt
dist/
  index.html
  404.html
  baby-future/
    index.html
    404.html
    assets/
  image-story/
    index.html
    404.html
    assets/
  gpt-image-gen/
    index.html
    404.html
```

含义：

- `dist/index.html` 是根入口页
- `dist/404.html` 是根入口兜底
- `dist/baby-future/index.html` 对应 `/baby-future/`
- `dist/image-story/index.html` 对应 `/image-story/`
- `dist/gpt-image-gen/index.html` 对应 `/gpt-image-gen/`
- 每个子项目的 `404.html` 由其 `index.html` 复制而来，用于 SPA 刷新兜底

## 5. 构建原理

### 5.1 子路径 base 注入

每个产品仓库都需要支持 GitHub Pages 子路径构建。

当前做法：

- `baby-future` 构建时注入 `VITE_BASE_PATH=/baby-future/`
- `image-story` 构建时注入 `VITE_BASE_PATH=/image-story/`
- `gpt-image-gen` 为静态单页站，直接输出到 `dist/`，不依赖额外 base 注入

示例配置：

```js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH || '/',
  }
})
```

这样打包后，静态资源路径会自动落在正确子目录下。

### 5.2 SPA fallback

GitHub Pages 不原生支持前端路由深刷。

因此每个产品仓库在 `build` 完成后会执行脚本，把：

- `dist/index.html`

复制为：

- `dist/404.html`

这样用户刷新深层地址时，GitHub Pages 仍然会返回可运行的入口页面。

### 5.3 聚合构建

发布仓库通过 [scripts/build-pages.mjs](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/scripts/build-pages.mjs) 做聚合。

逻辑是：

1. 清空 `ijaa.github.io/dist`
2. 复制 `site/` 到 `dist/`
3. 构建 `baby-future`
4. 将其 `dist/` 复制到 `ijaa.github.io/dist/baby-future`
5. 构建 `image-story`
6. 将其 `dist/` 复制到 `ijaa.github.io/dist/image-story`
7. 构建 `gpt-image-gen`
8. 将其 `dist/` 复制到 `ijaa.github.io/dist/gpt-image-gen`
9. 复制根入口 `index.html` 为根 `404.html`

本地默认读取：

- `../baby-future`
- `../image-story`
- `../gpt-image-gen`

GitHub Actions 环境读取：

- `repos/baby-future`
- `repos/image-story`
- `repos/gpt-image-gen`

这是通过环境变量实现的：

- `BABY_FUTURE_DIR`
- `IMAGE_STORY_DIR`
- `GPT_IMAGE_GEN_DIR`

## 6. 部署原理

### 6.1 `ijaa.github.io` 的 Pages workflow

发布 workflow 是：

- [.github/workflows/deploy-pages.yml](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/.github/workflows/deploy-pages.yml)

触发方式：

- `workflow_dispatch`
- `push` 到 `main` 或 `master`

主要步骤：

1. checkout `ijaa.github.io`
2. checkout `baby-future`
3. checkout `image-story`
4. checkout `gpt-image-gen`
5. 安装 Node
6. 运行 `npm ci`
7. 运行 `npm run build`
8. 上传 Pages artifact
9. `deploy-pages`

### 6.2 私有仓库权限

因为 `baby-future`、`image-story` 和 `gpt-image-gen` 是私有仓库，所以 `ijaa.github.io` 的 workflow 不能只依赖默认 `GITHUB_TOKEN`。

当前使用的 secret：

- `PAGES_REPO_TOKEN`

用途：

- 让 `ijaa.github.io` 的 workflow 能 checkout 私有产品仓库

### 6.3 产品仓库触发统一发布

三个产品仓库的 CI workflow 已配置在质量检查完成后自动触发 `ijaa.github.io` 发布。

关键逻辑：

- 仅在 `push` 到 `main` 或 `master` 时触发
- `pull_request` 不触发 Pages 发布

当前使用的 secret：

- `PAGES_DEPLOY_TOKEN`

用途：

- 让产品仓库通过 GitHub API 调用 `ijaa.github.io` 的 `Deploy Pages`

调用方式是对 `deploy-pages.yml` 发起 `workflow_dispatch`。

### 6.4 并发策略

`ijaa.github.io` 的发布 workflow 设置了：

```yml
concurrency:
  group: pages
  cancel-in-progress: true
```

效果：

- 如果两个产品仓库几乎同时触发发布
- 旧的发布 run 会被取消
- 保留最后一次最新发布

这能避免重复部署，把最终线上结果收敛到最新版本。

## 7. 当前完整链路

当前线上更新链路如下：

1. 开发者向 `baby-future` 或 `image-story` 的 `main` push 代码
2. 该产品仓库运行 `npm ci`
3. 运行 `lint`
4. 运行 `test`
5. 运行 `build`
6. 如果都通过，则调用 `ijaa.github.io` 的 `Deploy Pages`
7. `ijaa.github.io` checkout 两个产品仓库最新代码
8. 聚合构建新的 `dist/`
9. 发布到 GitHub Pages
10. 对应子路径更新

## 8. 本地开发与本地构建

### 8.1 产品仓库本地开发

以 `baby-future` 为例：

```bash
cd ~/Documents/workspace/other/kkstudios/baby-future
npm install
npm run dev
```

`image-story` 同理。

### 8.2 产品仓库本地子路径构建

```bash
cd ~/Documents/workspace/other/kkstudios/baby-future
VITE_BASE_PATH=/baby-future/ npm run build
```

```bash
cd ~/Documents/workspace/other/kkstudios/image-story
VITE_BASE_PATH=/image-story/ npm run build
```

### 8.3 发布仓库本地聚合构建

```bash
cd ~/Documents/workspace/other/kkstudios/ijaa.github.io
npm install
npm run build
```

### 8.4 本地预览最终聚合站点

```bash
cd ~/Documents/workspace/other/kkstudios/ijaa.github.io
npm run preview
```

默认预览地址：

- `http://localhost:4173/`
- `http://localhost:4173/baby-future/`
- `http://localhost:4173/image-story/`

## 9. 如何新增第三个项目

假设你要新增一个项目：

- 仓库名：`my-new-product`
- 路径：`/my-new-product`

推荐按下面步骤做。

### 9.1 创建新产品仓库

建议结构和现有产品一致：

- React + Vite
- 支持 `VITE_BASE_PATH`
- `build` 后生成 `404.html`
- 独立 `CI`

最低要求：

- 能执行 `npm ci`
- 能执行 `npm run lint`
- 能执行 `npm run test`
- 能执行 `npm run build`

### 9.2 在产品仓库里加入自动触发发布

参考当前两个仓库的：

- [.github/workflows/ci.yml](/Users/liukai/Documents/workspace/other/kkstudios/baby-future/.github/workflows/ci.yml)
- [.github/workflows/ci.yml](/Users/liukai/Documents/workspace/other/kkstudios/image-story/.github/workflows/ci.yml)

你需要：

- 在该仓库配置 `PAGES_DEPLOY_TOKEN`
- 在 CI 最后加 `workflow_dispatch` 调用 `ijaa.github.io`

### 9.3 在 `ijaa.github.io` 的聚合脚本中注册新项目

修改：

- [scripts/build-pages.mjs](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/scripts/build-pages.mjs)

新增一个产品配置对象，例如：

```js
{
  name: 'my-new-product',
  repoDir: process.env.MY_NEW_PRODUCT_DIR
    ? resolve(root, process.env.MY_NEW_PRODUCT_DIR)
    : resolve(root, '..', 'my-new-product'),
  basePath: '/my-new-product/',
}
```

### 9.4 在 Pages workflow 中 checkout 新仓库

修改：

- [.github/workflows/deploy-pages.yml](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/.github/workflows/deploy-pages.yml)

新增 checkout step：

```yml
- name: Checkout my-new-product
  uses: actions/checkout@v5
  with:
    repository: ijaa/my-new-product
    path: repos/my-new-product
    token: ${{ secrets.PAGES_REPO_TOKEN }}
```

并在 `Build aggregated site` 步骤里新增环境变量：

```yml
env:
  MY_NEW_PRODUCT_DIR: repos/my-new-product
```

如果该仓库也有 `package-lock.json`，建议把它加入 `cache-dependency-path`。

### 9.5 在根首页增加入口

修改：

- [site/index.html](/Users/liukai/Documents/workspace/other/kkstudios/ijaa.github.io/site/index.html)

新增一个卡片入口，链接到：

- `/my-new-product/`

### 9.6 本地验证

在 `ijaa.github.io` 执行：

```bash
npm run build
npm run preview
```

确认：

- 根首页能看到新入口
- `/my-new-product/` 可访问
- 静态资源路径正确
- 深刷 fallback 正常

### 9.7 推送并观察 Actions

需要确认三件事：

1. 新产品仓库 CI 通过
2. `ijaa.github.io` 被自动触发
3. `Deploy Pages` 成功

## 10. 新增项目时的检查清单

新增任意新项目时，至少检查以下项目：

### 产品仓库侧

- 是否支持 `VITE_BASE_PATH`
- 是否支持子路径资源引用
- 是否生成 `404.html`
- 是否有 `lint`
- 是否有 `test`
- 是否有 `build`
- 是否在 `main` push 后自动触发 `ijaa.github.io`

### 发布仓库侧

- 是否 checkout 了新仓库
- 是否在聚合脚本注册了新项目
- 是否在根首页添加入口
- 是否设置了必要环境变量
- 是否在本地跑通过 `npm run build`

### GitHub 配置侧

- 新产品仓库是否为私有或公开
- 若为私有，`PAGES_REPO_TOKEN` 是否足够读取
- 新产品仓库是否配置了 `PAGES_DEPLOY_TOKEN`
- `ijaa.github.io` 的 Pages 发布源是否仍然是 `GitHub Actions`

## 11. 常见问题

### 11.1 为什么不让每个产品仓库各自直接发 Pages

因为目标不是多个独立站点，而是：

- 同一个域名
- 同一个主入口
- 同一套子路径结构

多个产品各自直接发 Pages，会让站点入口、路径和发布归属变得混乱。

### 11.2 为什么要保留独立产品仓库

因为这样：

- 产品之间解耦
- 各自技术演进互不影响
- CI 更清晰
- 后续迁移或归档更容易

### 11.3 为什么产品仓库不直接产出最终线上结果

因为最终线上结果是“多项目聚合”的结果，不是某个单独产品仓库能独立决定的。

### 11.4 同时 push 两个产品会怎样

会出现两个发布触发，但由于 `ijaa.github.io` 设置了并发取消，前一个会被取消，只保留最后一个最新部署。

### 11.5 当前还有什么技术债

目前有一个非阻塞提醒：

- GitHub 官方 Pages 相关 action 存在 Node 20 弃用警告

这不影响当前发布成功，但后续可以留意官方新版 action 或统一加上 Node 24 兼容配置。

## 12. 推荐后续优化

如果后续项目数量继续增加，建议考虑以下优化：

- 只有当产品源码实际变化时才触发统一发布
- 给 `site/index.html` 抽成模板化生成，而不是纯手写 HTML
- 给聚合脚本增加统一配置文件，例如 `subsites.config.json`
- 给每个项目增加统一 metadata，例如标题、描述、路径、repo、卡片配色
- 在 `ijaa.github.io` 增加 smoke test，确保每个子路径都有入口页

## 13. 当前结论

截至 2026-05-13，当前系统已经具备以下能力：

- 多个独立产品仓库
- 统一 GitHub Pages 发布入口
- 子路径静态资源正确构建
- SPA fallback 支持
- 产品仓库 `push -> CI -> 自动触发统一发布`
- 聚合站点自动更新

这意味着后续再新增项目时，不需要重做架构，只需要沿着本文档补齐接入步骤即可。
