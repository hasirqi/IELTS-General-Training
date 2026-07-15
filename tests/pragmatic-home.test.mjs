import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppCore.tsx", import.meta.url), "utf8");

test("home opens with four practical IELTS skill entries", () => {
  const home = app.slice(app.indexOf("function Home("), app.indexOf("function Shell"));
  assert.match(home, /选择训练/);
  assert.match(home, /primary-skill-cards/);
  assert.match(home, /Object\.entries\(skillMeta\)/);
  assert.ok(home.indexOf("primary-skill-cards") < home.indexOf("基础训练"));
});

test("home removes daily ritual language and oversized progress hero", () => {
  const home = app.slice(app.indexOf("function Home("), app.indexOf("function Shell"));
  for (const text of ["今天学什么", "今天的学习路径", "开始今天训练", "预计 38 分钟", "当前水平", "目标分数"]) assert.ok(!home.includes(text));
  assert.match(home, /quiet-motto/);
});
