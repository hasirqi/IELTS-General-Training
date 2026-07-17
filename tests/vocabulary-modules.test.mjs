import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildVocabularyOptions, buildVocabularyTestSample, estimateVocabularyProfile } from "../src/vocabulary-engine.mjs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
const storage = fs.readFileSync(new URL("../src/product-storage.ts", import.meta.url), "utf8");
const types = fs.readFileSync(new URL("../src/product-types.ts", import.meta.url), "utf8");
const items = Array.from({ length: 160 }, (_, index) => ({ id: `w${index}`, term: `word${index}`, meaning: `意思${index}`, collocation: `use word${index}` }));

test("vocabulary test draws 40 unique items across all four strata", () => {
  const ids = buildVocabularyTestSample(items, 40, 0);
  assert.equal(ids.length, 40);
  assert.equal(new Set(ids).size, 40);
  const indexes = ids.map((id) => Number(id.slice(1)));
  for (let quarter = 0; quarter < 4; quarter += 1) assert.equal(indexes.filter((index) => index >= quarter * 40 && index < (quarter + 1) * 40).length, 10);
  assert.notDeepEqual(ids, buildVocabularyTestSample(items, 40, 1));
});

test("meaning and collocation questions always contain one valid answer", () => {
  const target = items[17];
  for (const field of ["meaning", "collocation"]) {
    const options = buildVocabularyOptions(items, target, field, 9);
    assert.equal(options.length, 3);
    assert.equal(new Set(options).size, 3);
    assert.equal(options.filter((option) => option === target[field]).length, 1);
  }
});

test("vocabulary estimates are conservative, ordered and bounded", () => {
  const answers = Array.from({ length: 40 }, (_, index) => ({ recognition: index < 32 ? "know" : index < 36 ? "unsure" : "unknown", meaningCorrect: index < 28, useCorrect: index < 18 }));
  const result = estimateVocabularyProfile(answers, 1600);
  assert.ok(result.recognition.value > result.meaning.value);
  assert.ok(result.meaning.value > result.use.value);
  for (const estimate of Object.values(result)) {
    assert.ok(estimate.low <= estimate.value && estimate.value <= estimate.high);
    assert.ok(estimate.low >= 0 && estimate.high <= 1600);
  }
});

test("both vocabulary modules share the real lexicon and local learning state", () => {
  assert.match(app, /function VocabularyStudy/);
  assert.match(app, /function VocabularyTest/);
  assert.match(app, /自主学习 · 当前已审核词库 \{lexicon\.length\.toLocaleString\(\)\} 条/);
  assert.match(app, /buildVocabularyTestSample\(orderedItems,40/);
  assert.match(app, /vocabularyTestDraft:null/);
  assert.match(app, /errorLog:errors/);
  assert.match(storage, /vocabularyStudy:/);
  assert.match(storage, /vocabularyTestDraft:/);
  assert.match(storage, /vocabularyTests:/);
  assert.match(types, /schemaVersion: 3/);
});

test("the result explicitly avoids claiming total English vocabulary", () => {
  assert.match(app, /不冒充你的全部英语词汇量/);
  assert.match(app, /识别词汇量/);
  assert.match(app, /理解词汇量/);
  assert.match(app, /可用词汇量/);
});
