# About 滚动展示问题记录

更新日期：2026-05-30

## 当前状态

about 的主要展示问题已经从“整段空白/蓝色高度不足”推进到稳定状态：

- 首页 `/` 恢复为 hero 房间场景。
- `#about` 和 `?debug-scroll=about-mid` 可以显示完整蓝色全息背景、人物、底座和进度条。
- about 左侧信息框已在桌面端视口内定位，不再被裁切。
- `#about` hash 落点已对齐到稳定蓝色舞台区间。
- Projects 顶部不再露出蓝边。
- Contact 阶段可显示 3D 联系场景。

## 当前实现相关位置

- `src/App.tsx`
- `src/styles/global.css`
- `src/three/PortfolioScene.tsx`
- `src/content/projects.ts`

## 当前 about 内容

- 自述文案已改为：
  - 多年Coding老司机、后端工程师、前鹅厂混混、注意力不集中受害者。现专注于AI Agent应用、图片生成艺术、个人独立开发。
- 能力栈已改为：
  - AI Prompt工程
  - 图片艺术生成
  - Agent产品开发
  - Skill定制与优化
  - 全栈开发

## 已验证结果

- about 蓝色全息场景、人物面部、底座、粒子和进度条已能在 `#about` 与 `about-mid` 截图中显示。
- 首页音符位置已对齐到 `room.glb` 的 `music` 节点上方。
- about 文案、能力栈、邮箱、声音按钮和项目跳转都已和最新站点内容对齐。

## Playwright 验证

当前项目使用 `@playwright/test`：

```bash
npx playwright test e2e/project-links.spec.ts
npx playwright test e2e/soundscape.spec.ts
npx playwright test e2e/contact-links.spec.ts
```

视觉回归仍可继续使用 Chromium screenshot，移动端建议 `--viewport-size=390,844`。

## 后续建议

1. 持续回归 `#about` 与 `?debug-scroll=about-mid`。
2. 继续检查 about 后段和 projects 交界。
3. 如果后续改动 sticky 或相机逻辑，优先检查 `#about` 顶部和 Projects 顶部是否还保持稳定。
