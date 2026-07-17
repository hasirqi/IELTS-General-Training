import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildVocabularyOptions, buildVocabularyTestSample, estimateVocabularySize } from "../src/vocabulary-engine.mjs";

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

test("each test question contains four unique Chinese choices and one answer", () => {
  const target = items[17];
  const options = buildVocabularyOptions(items, target, "meaning", 9, 4);
  assert.equal(options.length, 4);
  assert.equal(new Set(options).size, 4);
  assert.equal(options.filter((option) => option === target.meaning).length, 1);
});

test("vocabulary size is estimated only from actual correct answers", () => {
  const answers = Array.from({ length: 40 }, (_, index) => ({ correct: index < 30 }));
  const result = estimateVocabularySize(answers, 1600);
  assert.equal(result.value, 1200);
  assert.ok(result.low <= result.value && result.value <= result.high);
  assert.ok(result.low >= 0 && result.high <= 1600);
});

test("the assessment is a real multiple-choice test without self-rating", () => {
  assert.match(app, /请选择正确的中文意思/);
  assert.match(app, /buildVocabularyOptions\(lexicon,item,"meaning",draft\.index,4\)/);
  assert.match(app, /correct:option === item\.meaning/);
  assert.doesNotMatch(app, /你认识这个词或词块吗/);
  assert.doesNotMatch(app, /chooseRecognition|VocabularyRecognition/);
  assert.match(app, /系统只根据实际答题结果估算词汇量/);
});

test("word study gives the example sentence its own pronunciation button", () => {
  assert.match(app, /className="study-example"/);
  assert.match(app, /speakEnglish\(item\.example!\)/);
  assert.match(app, /aria-label="播放例句"/);
});

test("both vocabulary modules share the real lexicon and local state", () => {
  assert.match(app, /function VocabularyStudy/);
  assert.match(app, /function VocabularyTest/);
  assert.match(app, /buildVocabularyTestSample\(orderedItems,40/);
  assert.match(app, /errorLog:errors/);
  assert.match(storage, /vocabularyStudy:/);
  assert.match(storage, /vocabularyTestDraft:/);
  assert.match(storage, /vocabularyTests:/);
  assert.match(types, /schemaVersion: 3/);
});

test("the result explicitly avoids claiming total English vocabulary", () => {
  assert.match(app, /不冒充你的全部英语词汇量/);
  assert.match(app, /核心词汇量估计/);
  assert.match(app, /实际答题结果/);
});
