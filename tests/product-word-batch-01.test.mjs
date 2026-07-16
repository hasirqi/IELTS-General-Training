import assert from "node:assert/strict";
import test from "node:test";
import rawLexicon from "../src/content/lexicon-baseline-1000.json" with { type: "json" };
import {
  buildLearningLexicon,
  lexiconQuality,
  verifiedWordBatch01,
} from "../src/content/lexicon-content-batch01.mjs";

const entries = Object.entries(verifiedWordBatch01);
const banned = /placeholder|lorem|todo|待补|示例句|example sentence/i;

test("word batch 01 contains exactly 150 unique reviewed words", () => {
  assert.equal(entries.length, 150);
  assert.equal(new Set(entries.map(([term]) => term)).size, 150);
  const sourceTerms = new Set(rawLexicon.map((item) => item.term.toLowerCase()));
  for (const [term] of entries) assert.equal(sourceTerms.has(term), true, `${term} is not in the source lexicon`);
});

test("every reviewed word has a real, target-bearing context and collocation", () => {
  const examples = new Set();
  const collocations = new Set();
  for (const [term, content] of entries) {
    const target = new RegExp(`\\b${term}\\b`, "i");
    assert.match(content.example, target, `${term} is absent from its example`);
    assert.ok(content.example.split(/\s+/).length >= 5, `${term} example is too short`);
    assert.match(content.example, /[.?!]$/, `${term} example lacks sentence punctuation`);
    assert.match(content.collocation, target, `${term} is absent from its collocation`);
    assert.ok(content.meaning.length >= 1 && content.meaning.length <= 35, `${term} meaning is not focused`);
    assert.doesNotMatch(`${content.example} ${content.collocation} ${content.meaning}`, banned);
    assert.equal(examples.has(content.example.toLowerCase()), false, `${term} duplicates an example`);
    assert.equal(collocations.has(content.collocation.toLowerCase()), false, `${term} duplicates a collocation`);
    examples.add(content.example.toLowerCase());
    collocations.add(content.collocation.toLowerCase());
  }
});

test("reviewed counts only increase after batch 01 passes the content gate", () => {
  const quality = lexiconQuality(buildLearningLexicon(rawLexicon));
  assert.deepEqual(quality, { total: 1000, verified: 282, coreOnly: 718 });
});
