import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildLearningLexicon, lexiconQuality } from "../src/content/lexicon-content.mjs";
import { buildLearningLexicon as base } from "../src/content/lexicon-content-baseline.mjs";
import { verifiedCoreWordBatch01 as b1 } from "../src/content/verified-core-word-batch-01.mjs";
import { verifiedCoreWordBatch02 as b2 } from "../src/content/verified-core-word-batch-02.mjs";
import { verifiedCoreWordBatch03 as b3 } from "../src/content/verified-core-word-batch-03.mjs";
import { verifiedCoreWordBatch04 as b4 } from "../src/content/verified-core-word-batch-04.mjs";
import { verifiedCoreWordBatch05 as b5 } from "../src/content/verified-core-word-batch-05.mjs";
import { verifiedCoreWordBatch06 as b6 } from "../src/content/verified-core-word-batch-06.mjs";
import { verifiedCoreWordBatch07 as b7 } from "../src/content/verified-core-word-batch-07.mjs";
import { verifiedCoreWordBatch08 as b8 } from "../src/content/verified-core-word-batch-08.mjs";
import { verifiedCoreWordBatch09 as b9 } from "../src/content/verified-core-word-batch-09.mjs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const json = (path) => JSON.parse(read(path));
const raw = json("../src/content/lexicon.json");
const candidates = json("../src/content/core-word-batch-09-candidates.json");
const baseline = json("../src/content/lexicon-baseline-1000.json");
const course = read("../src/content/curriculum-batch-16.ts");
const foundation = read("../src/content/foundation-batch-12.ts");
const ids = (source, prefix) => [...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`, "g"))].map((match) => match[1]);
const questions = (source) => [...source.matchAll(/q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g)].map((match) => ({ prompt: match[1], options: JSON.parse(match[2]), answer: match[3], explanation: match[4] }));

test("batch 09 follows source priority 1601-1800", () => {
  assert.equal(candidates.length, 200);
  assert.deepEqual(candidates.map((item) => item.priorityIndex), Array.from({ length: 200 }, (_, index) => 1601 + index));
  assert.deepEqual(Object.keys(b9), candidates.map((item) => item.term));
  assert.ok(raw.length >= 2800);
  assert.equal(new Set(raw.map((item) => item.term.toLowerCase())).size, raw.length);
  assert.deepEqual(raw.slice(2600, 2800).map((item) => item.term), candidates.map((item) => item.term));
});

test("batch 09 word content passes all gates", () => {
  const old = [...base(baseline), ...Object.values(b1), ...Object.values(b2), ...Object.values(b3), ...Object.values(b4), ...Object.values(b5), ...Object.values(b6), ...Object.values(b7), ...Object.values(b8)];
  const oldExamples = new Set(old.map((item) => item.example).filter(Boolean));
  const oldCollocations = new Set(old.map((item) => item.collocation?.toLowerCase()).filter(Boolean));
  const examples = [];
  const collocations = [];
  for (const [term, item] of Object.entries(b9)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(item.meaning, /[\u3400-\u9fff]/, term);
    assert.match(item.example.toLowerCase(), new RegExp(`\\b${escaped}\\b`), term);
    assert.ok(item.example.split(/\s+/).length >= 5, term);
    assert.match(item.example, /[.!?]$/, term);
    assert.ok(item.collocation.toLowerCase().includes(term), term);
    assert.ok(item.category.length >= 4, term);
    assert.ok(!oldExamples.has(item.example), term);
    assert.ok(!oldCollocations.has(item.collocation.toLowerCase()), term);
    examples.push(item.example);
    collocations.push(item.collocation.toLowerCase());
  }
  assert.equal(new Set(examples).size, 200);
  assert.equal(new Set(collocations).size, 200);
  assert.deepEqual(lexiconQuality(buildLearningLexicon(raw)), { total: raw.length, verified: raw.length, coreOnly: 0 });
});

test("batch 16 adds complete IELTS lessons", () => {
  for (const prefix of ["l", "r", "w", "s"]) assert.deepEqual(ids(course, prefix), Array.from({ length: 4 }, (_, index) => `${prefix}${97 + index}`));
  const titles = [...course.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(titles.length, 16);
  assert.equal(new Set(titles).size, 16);
  for (const marker of ["Part 1", "Part 2", "Part 3", "Part 4", "Section 1", "Section 2", "Section 3", "Task 1", "Task 2"]) assert.match(course, new RegExp(marker));
});

test("batch 16 objective questions are answerable", () => {
  const items = questions(course);
  assert.equal(items.length, 32);
  assert.equal(new Set(items.map((item) => item.prompt)).size, 32);
  for (const item of items) {
    assert.match(item.prompt, /^[A-Za-z]/);
    assert.equal(item.options.length, 3);
    assert.equal(new Set(item.options).size, 3);
    assert.ok(item.options.includes(item.answer));
    assert.ok(item.explanation.length >= 4);
  }
});

test("batch 16 fixed MP3 files are valid", () => {
  for (let index = 97; index <= 100; index += 1) {
    const bytes = fs.readFileSync(new URL(`../public/audio/l${index}.mp3`, import.meta.url));
    assert.ok(bytes.length > 100000);
    assert.ok(bytes.subarray(0, 3).toString("ascii") === "ID3" || bytes[0] === 255);
  }
});

test("foundation batch 12 adds ids 129-136", () => {
  assert.deepEqual(ids(foundation, "g"), Array.from({ length: 8 }, (_, index) => `g${129 + index}`));
  assert.deepEqual(ids(foundation, "d"), Array.from({ length: 8 }, (_, index) => `d${129 + index}`));
  const prompts = [...foundation.matchAll(/prompt:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(prompts.length, 16);
  assert.equal(new Set(prompts).size, 16);
});
