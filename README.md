# 破壁 IELTS 6

面向英语基础薄弱学习者的本地优先 IELTS General Training 互动学习 PWA。每天用 30–45 分钟完成主动回忆、新词与词块、句型拆解和开口练习。

## 当前能力

- 可安装 PWA，桌面与移动端响应式布局
- IndexedDB 离线保存，localStorage 自动降级
- 主动回忆、提示分级、错因记录和自适应任务量核心算法
- 新词的形式、意义、搭配与跨语言联想
- 句子结构拆解、浏览器语音合成与语音识别
- 无 API Key 模式：复制结构化学习上下文并打开 ChatGPT 网页
- Node 单元测试与 GitHub Pages 自动部署

## 本地运行

```bash
pnpm install
pnpm dev
```

## 重要边界

网页 ChatGPT 登录会话不能作为本应用的后台 API。应用不会读取浏览器会话、聊天记录或自动获取 ChatGPT 回答；“向 ChatGPT 提问”只复制学习上下文并打开网页。

## 内容来源

- 首版示例词汇、句型和练习为本项目原创内容。
- 用户提供的参考仓库 [hasirqi/IELTS-General-Training](https://github.com/hasirqi/IELTS-General-Training) 在 2026-07-14 检查时仅含 MIT `LICENSE`，尚无可导入题库或课程文件。
- 产品结构依据 IELTS General Training 官方题型设计；本项目与 IELTS 官方机构无隶属关系。
