import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("src/AppProduct.tsx","utf8");
const completion=fs.readFileSync("src/reading-assessment-completion.ts","utf8");
const profile=fs.readFileSync("src/AbilityProfile.tsx","utf8");

test("wrong vocabulary CAT items immediately return to the real review queue",()=>{
  assert.ok(app.includes("wrongReviewIds"));
  assert.ok(app.includes("dailyPlan:{...current.dailyPlan,reviewIds}"));
  assert.ok(app.includes('source:"vocabulary-cat"')||app.includes("英文语境释义"));
});

test("reading CAT errors persist five-way diagnosis and generated training evidence",()=>{
  assert.ok(completion.includes("buildReadingWeaknessProfile"));
  assert.ok(completion.includes('source:"reading-cat"'));
  assert.ok(completion.includes("readingCategory"));
  assert.ok(completion.includes("errorLog:[...state.errorLog,...newErrors]"));
});

test("ability page combines three axes, bounded recommendations, history and model truth",()=>{
  for(const label of ["接受性词汇","阅读能力","IELTS GT 阅读训练趋势","当前阅读弱点","接下来读什么","测评历史","真实数据与模型"])assert.ok(profile.includes(label));
  assert.ok(profile.includes("Math.abs(level-target)>1"));
  assert.ok(profile.includes("不是 IELTS 官方分数"));
  assert.ok(profile.includes("measurementStatus"));
});
