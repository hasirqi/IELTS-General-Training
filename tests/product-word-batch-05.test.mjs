import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon-baseline-1000.json" with { type: "json" };
import { buildLearningLexicon, lexiconQuality, verifiedWordBatch01, verifiedWordBatch02, verifiedWordBatch03, verifiedWordBatch04, verifiedWordBatch05 } from "../src/content/lexicon-content-batch05.mjs";

const entries = Object.entries(verifiedWordBatch05);
const banned = /placeholder|lorem|todo|待完善|示例内容|example sentence/i;

test("word batch 05 is the exact next 150 source items", () => {
  assert.deepEqual(entries.map(([term]) => term), rawLexicon.slice(732, 882).map((item) => item.term.toLowerCase()));
  assert.equal(new Set(entries.map(([term]) => term)).size, 150);
  const earlier = new Set([...Object.keys(verifiedWordBatch01), ...Object.keys(verifiedWordBatch02), ...Object.keys(verifiedWordBatch03), ...Object.keys(verifiedWordBatch04)]);
  for (const [term] of entries) assert.equal(earlier.has(term), false, `${term} repeats an earlier batch`);
});

test("batch 05 meanings, contexts and collocations pass the usage gate", () => {
  for (const [term, content] of entries) {
    const target = new RegExp(`\\b${term}\\b`, "i");
    assert.match(content.example, target, `${term} is absent from its example`);
    assert.ok(content.example.split(/\s+/).length >= 5, `${term} example is too short`);
    assert.match(content.example, /[.?!]$/, `${term} example lacks punctuation`);
    assert.match(content.collocation, target, `${term} is absent from its collocation`);
    assert.ok(content.meaning.length >= 1 && content.meaning.length <= 35, `${term} meaning is not focused`);
    assert.ok(content.category.length >= 2, `${term} has no scene category`);
    assert.equal(content.reviewedBatch, "word-batch-05");
    assert.doesNotMatch(`${content.example} ${content.collocation} ${content.meaning}`, banned);
  }
});

test("reviewed totals reach 882 only after batch 05 is attached", () => {
  assert.deepEqual(lexiconQuality(buildLearningLexicon(rawLexicon)), { total: 1000, verified: 882, coreOnly: 118 });
});
