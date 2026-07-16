import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/product.css", import.meta.url), "utf8");
const raw = JSON.parse(fs.readFileSync(new URL("../src/content/lexicon.json", import.meta.url), "utf8"));

test("word lab shows direct adult familiarity choices without the extra reveal click", () => {
  assert.match(app, /选择你对这个词的熟悉程度/);
  assert.match(app, /learn\(5\)\}>认识<\/button>/);
  assert.match(app, /learn\(3\)\}>不确定<\/button>/);
  assert.match(app, /learn\(1\)\}>不认识<\/button>/);
  assert.doesNotMatch(app, /想过了，评估自己|先遮住解释：你能独立说出核心意思吗？|还不清楚|能在句中使用/);
  assert.match(css, /\.word-confidence\{margin-top:26px\}/);
});

test("recognising a displayed word does not falsely claim productive-use mastery", () => {
  assert.match(app, /supportsUse:false/);
  assert.match(app, /learn\(5\)\}>认识/);
  assert.match(app, /learn\(3\)\}>不确定/);
  assert.match(app, /learn\(1\)\}>不认识/);
});

test("require includes its common rule sense with a usage boundary", () => {
  const require = buildLearningLexicon(raw).find((item) => item.term === "require");
  assert.ok(require);
  assert.match(require.meaning, /需要/);
  assert.match(require.meaning, /要求/);
  assert.match(require.meaning, /规定/);
  assert.match(require.meaningNote, /法律、规则或机构/);
  assert.match(app, /常用意思/);
  assert.match(app, /item\.meaningNote/);
});
