# 私有子项目接入 ijaa.github.io 流程

更新日期：2026-06-15

## 目标

把一个独立项目提交到 `ijaa/<project-name>` 私有仓库，并聚合部署到个人主页：

```text
https://ijaa.github.io/<project-name>/
```

本流程参考了 `gpt-image-gen` 和 `poem-gallery`。其中 `poem-gallery` 的实际接入包含：

- 新建私有仓库 `ijaa/poem-gallery`
- 将静态画廊作为独立项目维护
- 在 `ijaa.github.io` 首页增加项目卡片
- 让 `poem-gallery` 单独 push 后自动触发 `ijaa.github.io` 重新部署

## 仓库约定

本地目录推荐放在 `kkstudios` 下，与 `ijaa.github.io` 同级：

```text
~/Documents/workspace/other/kkstudios/
  ijaa.github.io/
  gpt-image-gen/
  poem-gallery/
  <new-project>/
```

项目名使用 kebab-case，并且本地目录、GitHub 仓库、Pages 子路径保持一致：

```text
<new-project>
ijaa/<new-project>
https://ijaa.github.io/<new-project>/
```

## 前置检查

确认 GitHub CLI 已登录，并且 token 有 `repo` 权限：

```bash
gh auth status
```

确认主页仓库有读取私有子仓库的 secret：

```bash
gh secret list --repo ijaa/ijaa.github.io
```

必须存在：

```text
PAGES_REPO_TOKEN
```

这个 token 用于 `ijaa.github.io` 的 Actions checkout 私有子仓库。

## 第一步：整理独立项目

如果是纯静态站，目录至少包含：

```text
index.html
styles.css
app.js
package.json
package-lock.json
scripts/build-static.mjs
tests/smoke.test.mjs
.github/workflows/ci.yml
.gitignore
README.md
```

静态资源按项目需要保留，例如：

```text
webp/
audio/
images/
assets/
```

`.gitignore` 至少忽略构建产物：

```text
dist/
```

`package.json` 可参考：

```json
{
  "name": "<new-project>",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "node scripts/build-static.mjs",
    "lint": "node --check scripts/build-static.mjs",
    "test": "node --test tests/smoke.test.mjs",
    "preview": "python3 -m http.server 4173 -d dist"
  }
}
```

纯静态项目的 `scripts/build-static.mjs` 应做这些事：

1. 删除并重建 `dist/`
2. 复制 `index.html`、CSS、JS、数据文件
3. 复制静态资源目录
4. 生成 `dist/404.html`
5. 可选复制 `favicon.svg`

如果是 Vite/React 子项目，保持项目自己的 `npm run build`，并确保子路径部署时资源路径正确。已有子项目通常通过 `VITE_BASE_PATH=/<project-name>/` 传入。

## 第二步：添加子项目 CI

子项目 workflow 参考 `gpt-image-gen` 和 `poem-gallery`：

```yaml
name: CI

on:
  push:
    branches:
      - main
      - master
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

      - name: Trigger ijaa Pages deploy
        if: github.event_name == 'push' && (github.ref_name == 'main' || github.ref_name == 'master')
        env:
          GH_TOKEN: ${{ secrets.PAGES_DEPLOY_TOKEN }}
        run: |
          curl --fail-with-body -L \
            -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer ${GH_TOKEN}" \
            https://api.github.com/repos/ijaa/ijaa.github.io/actions/workflows/deploy-pages.yml/dispatches \
            -d '{"ref":"master"}'
```

注意：`gpt-image-gen` 和 `poem-gallery` 当前 workflow 与此基本一致。新项目建议保留 `--fail-with-body`，这样 secret 缺失或 token 无权限时 CI 会直接失败，避免误以为已经触发部署。

## 第三步：本地验证子项目

```bash
cd ~/Documents/workspace/other/kkstudios/<new-project>
npm install
npm run lint
npm test
npm run build
```

确认核心构建产物存在：

```bash
test -f dist/index.html
test -f dist/404.html
```

如果有关键资源，也一起检查：

```bash
test -f dist/webp/001.webp
test -f dist/audio/example.mp4
```

## 第四步：创建私有 GitHub 仓库

初始化本地仓库：

```bash
git init -b main
git add .
git commit -m "Add <new-project> static site"
```

创建私有远端并推送：

```bash
gh repo create ijaa/<new-project> \
  --private \
  --source=. \
  --remote=origin \
  --push \
  --description "<short description>"
```

确认远端是私有仓库：

```bash
gh repo view ijaa/<new-project> --json visibility,defaultBranchRef,url
```

应看到：

```json
{"visibility":"PRIVATE"}
```

## 第五步：配置自动触发部署 secret

子项目 push 后要触发主页部署，子项目仓库必须有：

```text
PAGES_DEPLOY_TOKEN
```

参考 `gpt-image-gen`：

```bash
gh secret list --repo ijaa/gpt-image-gen
```

给新项目设置同名 secret。可使用当前 `gh` 登录 token，或使用专门的 PAT：

```bash
gh auth token | gh secret set PAGES_DEPLOY_TOKEN --repo ijaa/<new-project>
```

确认：

```bash
gh secret list --repo ijaa/<new-project>
```

应看到：

```text
PAGES_DEPLOY_TOKEN
```

注意：不同版本的 GitHub CLI 参数不完全一样。本机可用写法是从 stdin 传入，不要使用不存在的 `--body-file` 参数。

## 第六步：接入 ijaa.github.io 聚合构建

修改：

```text
ijaa.github.io/scripts/build-pages.mjs
```

在 `productRepos` 里增加：

```js
{
  name: '<new-project>',
  repoDir: process.env.NEW_PROJECT_DIR
    ? resolve(root, process.env.NEW_PROJECT_DIR)
    : resolve(root, '..', '<new-project>'),
  basePath: '/<new-project>/',
},
```

环境变量命名建议用项目名转大写加下划线：

```text
POEM_GALLERY_DIR
GPT_IMAGE_GEN_DIR
NEW_PROJECT_DIR
```

`npm run build` 会对每个子项目执行：

```bash
npm install
npm run build
```

然后把子项目 `dist/` 复制到：

```text
ijaa.github.io/dist/<new-project>/
```

## 第七步：接入 Pages Workflow

修改：

```text
ijaa.github.io/.github/workflows/deploy-pages.yml
```

增加 checkout：

```yaml
- name: Checkout <new-project>
  uses: actions/checkout@v5
  with:
    repository: ijaa/<new-project>
    path: repos/<new-project>
    token: ${{ secrets.PAGES_REPO_TOKEN }}
```

把锁文件加入 cache：

```yaml
cache-dependency-path: |
  repos/baby-future/package-lock.json
  repos/image-story/package-lock.json
  repos/gpt-image-gen/package-lock.json
  repos/poem-gallery/package-lock.json
  repos/<new-project>/package-lock.json
```

在 `Build aggregated site` 的 env 里传入路径：

```yaml
env:
  NEW_PROJECT_DIR: repos/<new-project>
```

私有子仓库 checkout 失败时，优先检查：

1. `ijaa.github.io` 是否配置 `PAGES_REPO_TOKEN`
2. token 是否有读取该私有仓库的权限
3. workflow 里的 `repository` 和 `path` 是否写错

## 第八步：添加首页项目卡片

修改：

```text
ijaa.github.io/src/content/projects.ts
```

新增项目：

```ts
{
  id: '<new-project>',
  index: '05',
  title: '<Project Title>',
  description: '<项目描述>',
  href: 'https://ijaa.github.io/<new-project>/',
  image: '/assets/<new-project>/<cover>.png',
  accent: '#7f9f8d',
},
```

项目卡片图放在：

```text
ijaa.github.io/public/assets/<new-project>/<cover>.png
```

推荐卡片图比例：

```text
3:2，例如 1536x1024 或 1200x800
```

可以用项目真实截图、现有素材合成图，或使用图片生成工具生成。生成后只需要检查文件存在和尺寸：

```bash
test -f public/assets/<new-project>/<cover>.png
sips -g pixelWidth -g pixelHeight public/assets/<new-project>/<cover>.png
```

## 第九步：更新项目链接测试

修改：

```text
ijaa.github.io/e2e/project-links.spec.ts
```

在 `projects` 数组加入：

```ts
{
  title: '<Project Title>',
  href: 'https://ijaa.github.io/<new-project>/',
},
```

运行：

```bash
npx playwright test e2e/project-links.spec.ts
```

如果需要启动预览或 dev server，先检查端口是否已有旧实例：

```bash
lsof -ti tcp:5173
lsof -ti tcp:4173
```

有旧实例时先停掉，再启动新服务。

## 第十步：主页本地聚合验证

```bash
cd ~/Documents/workspace/other/kkstudios/ijaa.github.io
npm run build
```

确认输出存在：

```bash
test -f dist/<new-project>/index.html
test -f dist/assets/<new-project>/<cover>.png
```

如果子站有关键资源：

```bash
test -f dist/<new-project>/webp/001.webp
test -f dist/<new-project>/audio/example.mp4
```

## 第十一步：提交并推送主页

```bash
git add scripts/build-pages.mjs .github/workflows/deploy-pages.yml src/content/projects.ts e2e/project-links.spec.ts public/assets/<new-project>/
git commit -m "Add <new-project> subsite"
git push origin master
```

`ijaa.github.io` 的 `master` push 会直接触发 Pages 部署。

检查部署：

```bash
gh run list --repo ijaa/ijaa.github.io --limit 5
gh run view <run-id> --repo ijaa/ijaa.github.io --json status,conclusion,url,jobs
```

线上检查：

```bash
curl -L -I https://ijaa.github.io/<new-project>/
curl -L -I https://ijaa.github.io/assets/<new-project>/<cover>.png
```

应返回 `200`。

## 第十二步：验证单独 push 自动部署

对子项目做一次真实改动或空提交：

```bash
cd ~/Documents/workspace/other/kkstudios/<new-project>
git commit --allow-empty -m "Test pages deploy trigger"
git push origin main
```

检查子项目 CI：

```bash
gh run list --repo ijaa/<new-project> --limit 3
```

检查主页部署是否被触发：

```bash
gh run list --repo ijaa/ijaa.github.io --limit 3
```

完整链路应该是：

```text
push ijaa/<new-project>
  -> 子项目 CI 成功
  -> curl 调用 ijaa.github.io deploy-pages.yml workflow_dispatch
  -> ijaa.github.io checkout 私有子仓库
  -> npm run build 聚合子站
  -> deploy-pages 成功
```

## 常见问题

### 子项目 CI 成功，但主页没有部署

优先检查子项目是否有：

```text
PAGES_DEPLOY_TOKEN
```

再检查 workflow 触发步骤是否失败。如果 `curl` 没有 `--fail-with-body`，接口返回 401/403 时 CI 可能仍显示成功。

### 主页 workflow checkout 私有仓库失败

检查 `ijaa.github.io` 的：

```text
PAGES_REPO_TOKEN
```

这个 token 必须能读取新私有仓库。

### 聚合构建找不到本地子项目

确认目录在默认 sibling path：

```text
../<new-project>
```

或使用环境变量覆盖：

```bash
NEW_PROJECT_DIR=../custom-path npm run build
```

### 子路径部署后资源 404

纯静态站优先使用相对路径：

```html
<link rel="stylesheet" href="./styles.css">
<script src="./app.js"></script>
```

Vite 项目需要确认 base path，例如：

```bash
VITE_BASE_PATH=/<new-project>/ npm run build
```

### GitHub 单文件太大

GitHub 普通仓库单文件限制约 100MB。提交大图、视频、音频前先检查：

```bash
find . -type f -size +95M -print
```

### 本地预览后端口残留

启动前检查：

```bash
lsof -ti tcp:5173
lsof -ti tcp:4173
```

停止临时服务后再次确认端口为空。

## poem-gallery 实际落地记录

子项目仓库：

```text
ijaa/poem-gallery
PRIVATE
main
```

关键提交：

```text
bff67d3 Add poem gallery static site
8fd91a9 Update poem gallery controls
```

主页接入提交：

```text
55a9fc9 Add poem gallery subsite
```

线上地址：

```text
https://ijaa.github.io/poem-gallery/
```

自动部署验证：

- `poem-gallery` push 后 CI 成功
- `PAGES_DEPLOY_TOKEN` 触发 `ijaa.github.io` 的 `Deploy Pages`
- `ijaa.github.io` 成功 checkout 私有 `poem-gallery`
- Pages build/deploy 成功
