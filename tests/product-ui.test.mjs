import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/product.css", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("the product entry uses the complete learning implementation", () => {
  assert.match(entry,/AppProduct/);
  assert.match(app,/\{curriculum\.length\} 节原创 General Training 训练/);
  assert.match(app,/sentenceChallenges\.length/);
  assert.match(app,/speakingDrills\.length/);
});

test("listening has explicit learning and one-play mock modes", () => {
  assert.match(app,/学习模式/);
  assert.match(app,/模考模式/);
  assert.match(app,/只能播放一次，不能拖动/);
  assert.match(app,/disabled=\{audioStarted\}/);
  assert.doesNotMatch(app,/完成全部题目后才能查看听力原文/);
  assert.match(app,/<details open=\{submitted \|\| undefined\}><summary>听力原文<\/summary>/);
  assert.match(app,/!submitted/);
});

test("progress is calculated from real learning data", () => {
  assert.match(app,/overallProgress\(/);
  assert.match(app,/style=\{\{width:`\$\{progress\}%`\}\}/);
  assert.doesNotMatch(app,/active-2/);
});

test("icon pronunciation controls and form controls are labelled and focusable", () => {
  assert.ok((app.match(/aria-label=\{`播放 \$\{[^}]+\} 的英语发音`\}/g)??[]).length>=3);
  assert.match(app,/aria-label="按词条类型筛选"/);
  assert.match(app,/aria-label="按内容审核状态筛选"/);
  assert.match(css,/textarea:focus-visible,select:focus-visible,summary:focus-visible,audio:focus-visible/);
});

test("manual ChatGPT handoff can bring feedback back without an API key", () => {
  assert.match(app,/复制作文并打开 ChatGPT/);
  assert.match(app,/把 ChatGPT 的反馈粘贴回来保存/);
  assert.match(app,/ielts-feedback-/);
});

test("cross-platform test runner and favicon are fixed", () => {
  assert.equal(pkg.scripts.test,"node scripts/run-tests.mjs");
  assert.match(html,/rel="icon"/);
  assert.match(html,/apple-touch-icon/);
});
