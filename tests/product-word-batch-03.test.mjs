import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon-baseline-1000.json" with { type: "json" };
import {
  buildLearningLexicon,
  lexiconQuality,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
} from "../src/content/lexicon-content-batch03.mjs";

const entries = Object.entries(verifiedWordBatch03);
const banned = /placeholder|lorem|todo|待补|示例句|example sentence/i;

test("word batch 03 is the exact next 150 source items", () => {
  const expected = rawLexicon.slice(432, 582).map((item) => item.term.toLowerCase());
  const actual = entries.map(([term]) => term);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(actual).size, 150);
  const earlier = new Set([...Object.keys(verifiedWordBatch01), ...Object.keys(verifiedWordBatch02)]);
  for (const term of actual) assert.equal(earlier.has(term), false, `${term} repeats an earlier batch`);
});

test("batch 03 meanings, contexts and collocations pass the usage gate", () => {
  for (const [term, content] of entries) {
    const target = new RegExp(`\\b${term}\\b`, "i");
    assert.match(content.example, target, `${term} is absent from its example`);
    assert.ok(content.example.split(/\s+/).length >= 5, `${term} example is too short`);
    assert.match(content.example, /[.?!]$/, `${term} example lacks punctuation`);
    assert.match(content.collocation, target, `${term} is absent from its collocation`);
    assert.ok(content.meaning.length >= 1 && content.meaning.length <= 35, `${term} meaning is not focused`);
    assert.ok(content.category.length >= 2, `${term} has no useful scene category`);
    assert.equal(content.reviewedBatch, "word-batch-03");
    assert.doesNotMatch(`${content.example} ${content.collocation} ${content.meaning}`, banned);
  }
});

test("all 450 reviewed examples and collocations are unique across batches", () => {
  const reviewed = [
    ...Object.values(verifiedWordBatch01),
    ...Object.values(verifiedWordBatch02),
    ...Object.values(verifiedWordBatch03),
  ];
  const examples = reviewed.map((item) => item.example.toLowerCase());
  const collocations = reviewed.map((item) => item.collocation.toLowerCase());
  assert.equal(reviewed.length, 450);
  assert.equal(new Set(examples).size, 450);
  assert.equal(new Set(collocations).size, 450);
});

test("reviewed totals reach 582 only after batch 03 is attached", () => {
  const quality = lexiconQuality(buildLearningLexicon(rawLexicon));
  assert.deepEqual(quality, { total: 1000, verified: 582, coreOnly: 418 });
});
