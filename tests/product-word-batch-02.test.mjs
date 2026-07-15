import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import {
  buildLearningLexicon,
  lexiconQuality,
  verifiedWordBatch01,
  verifiedWordBatch02,
} from "../src/content/lexicon-content-batch02.mjs";

const entries = Object.entries(verifiedWordBatch02);
const banned = /placeholder|lorem|todo|待补|示例句|example sentence/i;

test("word batch 02 contains 150 new source-backed words", () => {
  assert.equal(entries.length, 150);
  assert.equal(new Set(entries.map(([term]) => term)).size, 150);
  const firstBatch = new Set(Object.keys(verifiedWordBatch01));
  const sourceTerms = new Set(rawLexicon.map((item) => item.term.toLowerCase()));
  for (const [term] of entries) {
    assert.equal(firstBatch.has(term), false, `${term} repeats batch 01`);
    assert.equal(sourceTerms.has(term), true, `${term} is not in the source lexicon`);
  }
});

test("batch 02 contexts contain their target words and pass the usage gate", () => {
  const examples = new Set();
  const collocations = new Set(Object.values(verifiedWordBatch01).map((item) => item.collocation.toLowerCase()));
  for (const [term, content] of entries) {
    const target = new RegExp(`\\b${term}\\b`, "i");
    assert.match(content.example, target, `${term} is absent from its example`);
    assert.ok(content.example.split(/\s+/).length >= 5, `${term} example is too short`);
    assert.match(content.example, /[.?!]$/, `${term} example lacks punctuation`);
    assert.match(content.collocation, target, `${term} is absent from its collocation`);
    assert.ok(content.meaning.length >= 1 && content.meaning.length <= 35, `${term} meaning is not focused`);
    assert.doesNotMatch(`${content.example} ${content.collocation} ${content.meaning}`, banned);
    assert.equal(examples.has(content.example.toLowerCase()), false, `${term} duplicates an example`);
    assert.equal(collocations.has(content.collocation.toLowerCase()), false, `${term} repeats a reviewed collocation`);
    examples.add(content.example.toLowerCase());
    collocations.add(content.collocation.toLowerCase());
  }
});

test("reviewed totals reach 432 only after batch 02 is attached", () => {
  const quality = lexiconQuality(buildLearningLexicon(rawLexicon));
  assert.deepEqual(quality, { total: 1000, verified: 432, coreOnly: 568 });
});
