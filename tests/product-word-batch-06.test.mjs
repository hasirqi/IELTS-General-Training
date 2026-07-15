import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import { buildLearningLexicon, lexiconQuality, verifiedWordBatch01, verifiedWordBatch02, verifiedWordBatch03, verifiedWordBatch04, verifiedWordBatch05, verifiedWordBatch06 } from "../src/content/lexicon-content.mjs";

const entries = Object.entries(verifiedWordBatch06);
const banned = /placeholder|lorem|todo|待完善|示例内容|example sentence/i;

test("word batch 06 is the exact final 118 source items", () => {
  assert.deepEqual(entries.map(([term]) => term), rawLexicon.slice(882).map((item) => item.term.toLowerCase()));
  assert.equal(entries.length, 118);
});

test("batch 06 meanings, contexts and collocations pass the usage gate", () => {
  for (const [term, content] of entries) {
    const target = new RegExp(`\\b${term}\\b`, "i");
    assert.match(content.example, target, `${term} is absent from its example`);
    assert.ok(content.example.split(/\s+/).length >= 5, `${term} example is too short`);
    assert.match(content.example, /[.?!]$/, `${term} example lacks punctuation`);
    assert.match(content.collocation, target, `${term} is absent from its collocation`);
    assert.ok(content.meaning.length >= 1 && content.meaning.length <= 35, `${term} meaning is not focused`);
    assert.ok(content.category.length >= 2, `${term} has no scene category`);
    assert.equal(content.reviewedBatch, "word-batch-06");
    assert.doesNotMatch(`${content.example} ${content.collocation} ${content.meaning}`, banned);
  }
});

test("all 868 explicit reviewed contexts stay unique across six batches", () => {
  const reviewed = [verifiedWordBatch01, verifiedWordBatch02, verifiedWordBatch03, verifiedWordBatch04, verifiedWordBatch05, verifiedWordBatch06].flatMap(Object.values);
  assert.equal(reviewed.length, 868);
  assert.equal(new Set(reviewed.map((item) => item.example.toLowerCase())).size, 868);
  assert.equal(new Set(reviewed.map((item) => item.collocation.toLowerCase())).size, 868);
});

test("the final learning lexicon is 1,000 of 1,000 verified", () => {
  const lexicon = buildLearningLexicon(rawLexicon);
  assert.deepEqual(lexiconQuality(lexicon), { total: 1000, verified: 1000, coreOnly: 0 });
  for (const item of lexicon) assert.ok(item.cue && item.example && item.collocation, item.term);
});
