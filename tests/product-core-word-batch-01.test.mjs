import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildLearningLexicon, lexiconQuality } from "../src/content/lexicon-content.mjs";
import { buildLearningLexicon as buildBaselineLexicon } from "../src/content/lexicon-content-baseline.mjs";
import { verifiedCoreWordBatch01 } from "../src/content/verified-core-word-batch-01.mjs";

const read = (relative) => fs.readFileSync(new URL(relative, import.meta.url), "utf8");
const json = (relative) => JSON.parse(read(relative));
const raw = json("../src/content/lexicon.json");
const baselineRaw = json("../src/content/lexicon-baseline-1000.json");
const candidates = json("../src/content/core-word-batch-01-candidates.json");
const plan = json("../ysgpc/extracted/expansion-plan.json");
const course = read("../src/content/curriculum-batch-08.ts");
const foundation = read("../src/content/foundation-batch-04.ts");

const ids = (source, prefix) => [...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`, "g"))].map((match) => match[1]);
const questions = (source) => [...source.matchAll(/q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g)].map((match) => ({
  prompt: match[1], options: JSON.parse(match[2]), answer: match[3], explanation: match[4],
}));

test("merge plan records exact source, overlap, hold and batch counts", () => {
  assert.deepEqual(plan.baseline, {
    existingLexicon: 1000,
    sourceAudioSlots: 3461,
    sourceUniqueCanonicalTerms: 3429,
    sourceDuplicateSlots: 32,
  });
  assert.equal(plan.merge.exactExistingOverlap, 280);
  assert.equal(plan.merge.netNewUniqueTerms, 3149);
  assert.equal(plan.merge.heldForPrintCheck, 6);
  assert.equal(plan.merge.curationHeld, 10);
  assert.equal(plan.merge.eligibleForBatches, 3133);
  assert.equal(plan.merge.remainingAfterBatch01, 2933);
  assert.equal(plan.batches.length, 16);
  assert.equal(plan.batches[0].count, 200);
  assert.equal(plan.batches.at(-1).count, 133);
  assert.equal(plan.batches.reduce((sum, batch) => sum + batch.count, 0), 3133);
  assert.ok(plan.batches.every((batch) => batch.hold === 0));
});

test("the first 200 are source-backed, unique and appended without inflating the count", () => {
  assert.equal(candidates.length, 200);
  assert.equal(new Set(candidates.map((item) => item.term)).size, 200);
  assert.ok(candidates.every((item) => item.sourceStatus === "ready" && item.learningPriority === "high"));
  assert.equal(raw.length, 1200);
  assert.equal(new Set(raw.map((item) => item.term.toLowerCase())).size, 1200);
  assert.deepEqual(raw.slice(1000).map((item) => item.term), candidates.map((item) => item.term));
  assert.deepEqual(raw.slice(1000).map((item) => item.id), Array.from({ length: 200 }, (_, index) => `word-${String(index + 1001).padStart(4, "0")}`));
});

test("all 200 reviewed entries pass meaning, context, collocation and cross-batch uniqueness gates", () => {
  assert.equal(Object.keys(verifiedCoreWordBatch01).length, 200);
  const baseline = buildBaselineLexicon(baselineRaw);
  const oldExamples = new Set(baseline.map((item) => item.example).filter(Boolean));
  const oldCollocations = new Set(baseline.map((item) => item.collocation?.toLowerCase()).filter(Boolean));
  const examples = [];
  const collocations = [];
  for (const [term, item] of Object.entries(verifiedCoreWordBatch01)) {
    assert.match(item.meaning, /[\u3400-\u9fff]/, term);
    assert.match(item.example.toLowerCase(), new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`), term);
    assert.ok(item.example.trim().split(/\s+/).length >= 5, term);
    assert.match(item.example, /[.!?]$/, term);
    assert.ok(item.collocation.toLowerCase().includes(term), term);
    assert.ok(item.category.length >= 4, term);
    assert.ok(!oldExamples.has(item.example), `old example repeated: ${term}`);
    assert.ok(!oldCollocations.has(item.collocation.toLowerCase()), `old collocation repeated: ${term}`);
    examples.push(item.example);
    collocations.push(item.collocation.toLowerCase());
  }
  assert.equal(new Set(examples).size, 200);
  assert.equal(new Set(collocations).size, 200);
  assert.deepEqual(lexiconQuality(buildLearningLexicon(raw)), { total: 1200, verified: 1200, coreOnly: 0 });
});

test("batch 08 synchronously adds four complete lessons per IELTS skill", () => {
  for (const prefix of ["l", "r", "w", "s"]) {
    assert.deepEqual(ids(course, prefix), Array.from({ length: 4 }, (_, index) => `${prefix}${index + 65}`));
  }
  const titles = [...course.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(titles.length, 16);
  assert.equal(new Set(titles).size, 16);
  for (const marker of ["Part 1", "Part 2", "Part 3", "Part 4", "Section 1", "Section 2", "Section 3", "Task 1", "Task 2"]) assert.match(course, new RegExp(marker));
  assert.doesNotMatch(course, /TODO|TBD|placeholder|待完善|示例内容/i);
});

test("all new objective questions are English, unique and deterministically answerable", () => {
  const items = questions(course);
  assert.equal(items.length, 32);
  assert.equal(new Set(items.map((item) => item.prompt)).size, 32);
  for (const item of items) {
    assert.match(item.prompt, /^[A-Za-z]/);
    assert.doesNotMatch(item.prompt, /[\u3400-\u9fff]/);
    assert.equal(item.options.length, 3);
    assert.equal(new Set(item.options).size, 3);
    assert.ok(item.options.includes(item.answer), item.prompt);
    assert.ok(item.explanation.length >= 4, item.prompt);
  }
});

test("new listening courses have four valid fixed British-neural MP3 files", () => {
  for (let index = 65; index <= 68; index += 1) {
    const bytes = fs.readFileSync(new URL(`../public/audio/l${index}.mp3`, import.meta.url));
    assert.ok(bytes.length > 100_000, `l${index}.mp3 is unexpectedly small`);
    assert.ok(bytes.subarray(0, 3).toString("ascii") === "ID3" || bytes[0] === 0xff, `l${index}.mp3 is invalid`);
  }
});

test("sentence and speaking foundations add exact ids 65 through 72 without placeholders", () => {
  assert.deepEqual(ids(foundation, "g"), Array.from({ length: 8 }, (_, index) => `g${index + 65}`));
  assert.deepEqual(ids(foundation, "d"), Array.from({ length: 8 }, (_, index) => `d${index + 65}`));
  const prompts = [...foundation.matchAll(/prompt:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(prompts.length, 16);
  assert.equal(new Set(prompts).size, 16);
  assert.doesNotMatch(foundation, /TODO|TBD|placeholder|待完善|示例内容/i);
});
