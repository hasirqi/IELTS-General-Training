# 破壁 IELTS 6

面向英语基础薄弱、以中文为主要教学语言的 IELTS General Training 本地优先学习 PWA。目标是每天学习 30–45 分钟，通过主动回忆、词块、句型拆解和听说读写课程稳步达到 6 分。

## 当前内容

- 1,000 个离线单词与词块：120 个 General Training 高频词块 + 880 个基础／IELTS 单词
- 听力 4 课：覆盖 Part 1–4，浏览器语音播放，客观题确定性评分
- 阅读 6 课：覆盖 Section 1–3 的生活公告、工作材料和长文
- 写作 6 课：3 类 Task 1 书信与 3 类 Task 2 议论文
- 口语 6 课：覆盖 Part 1–3，支持浏览器语音转写与本地保存
- 主动回忆、句型实验室、错因档案和能力进度

全部课程题目均为本项目原创练习，不是历年真题。词库数据来源和许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 产品原则

- 中文负责把概念讲清楚；日文和蒙古文只在确有帮助且经过核实时出现。
- 本地优先，不需要 OpenAI API Key。学习数据保存在 IndexedDB，并以 localStorage 降级。
- “问 ChatGPT”只会复制结构化学习上下文并打开 `https://chatgpt.com/`，产品无法读取网页会话或回答。
- 错题必须重新出现；眼熟不算掌握。

## 开发

```bash
pnpm install
pnpm test
pnpm dev
pnpm build
```

GitHub Actions 会在推送到 `main` 后测试、构建并发布 GitHub Pages。
