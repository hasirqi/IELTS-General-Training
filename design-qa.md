# Design QA：测试中心入口与标题精简

- source visual truth:
  - `design-qa/source-test-center-large-heading.png`
  - `design-qa/source-test-mode-cards.png`
- implementation screenshots:
  - `design-qa/test-center-entry.png`
  - `design-qa/test-center-page.png`
- comparison: `design-qa/test-center-comparison.png`
- viewport: 1280 × 720 CSS px，device scale 1
- source pixels: 1233 × 641、1100 × 440
- implementation pixels: 1265 × 712
- state: 首次使用、无历史正式测评结果

## Full-view comparison evidence

原页面把“词汇量测试”同时放在页面顶部和正文巨型标题中。新实现把首页入口和页面顶部统一为“测试中心”，删除正文重复 H1，正文从内部测量说明直接进入推荐卡。五种模式的顺序、状态、卡片结构和既有米白／墨绿设计均保持不变。

## Focused comparison evidence

重点检查入口卡片、上下文页名和正文开头。DOM 中测试中心正文只保留两个 H2：“先做快速定位”和“选择测试模式”；没有重复 H1。未完成的“阅读能力测评”和“语境运用练习”仍为 disabled。

## Required fidelity surfaces

- Fonts and typography: 延用既有 display 与正文变量；删除巨型 H1 后层级由上下文页名、说明、推荐 H2 承担。
- Spacing and layout rhythm: 说明文字上边距改为 8px，推荐卡与模式卡间距不变，无横向溢出。
- Colors and visual tokens: 未新增颜色，继续使用米白、墨绿、浅绿和现有边框变量。
- Image quality and assets: 本次界面无新增位图资产，图标继续使用现有图标库。
- Copy and content: 首页入口与上下文页名均为“测试中心”；正式／非正式计分边界文案未改变。

## Findings

无 P0、P1 或 P2 问题。浏览器控制台无 warning 或 error。

## Comparison history

- Earlier finding: 正文巨型“测试中心”与页面顶部重复，视觉层级过重。
- Fix: 入口和顶部页名统一为“测试中心”，删除正文 H1，并修正说明文字间距。
- Post-fix evidence: `design-qa/test-center-comparison.png`；测试中心 DOM 不再包含 H1。

## Interaction and regression checks

- 首页“测试中心”入口可点击并进入正确页面。
- 三个已完成模式保持可用；两个未完成模式保持禁用。
- 211 项自动测试通过，生产构建通过。
- 浏览器控制台无错误。

final result: passed
