import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const index = JSON.parse(fs.readFileSync(new URL("../src/content/word-family-index-20k.json", import.meta.url), "utf8"));
const meta = JSON.parse(fs.readFileSync(new URL("../src/content/word-family-index.meta.json", import.meta.url), "utf8"));
const mapping = JSON.parse(fs.readFileSync(new URL("../src/content/teaching-lexicon-family-map.json", import.meta.url), "utf8"));
const lexicon = JSON.parse(fs.readFileSync(new URL("../src/content/lexicon.json", import.meta.url), "utf8"));

test("measurement index contains exactly 20,000 versioned unique families", () => {
  assert.equal(index.length, 20_000);
  assert.equal(new Set(index.map((row) => row.familyId)).size, 20_000);
  assert.equal(new Set(index.map((row) => row.headword)).size, 20_000);
  assert.deepEqual(index.map((row) => row.frequencyRank), Array.from({ length: 20_000 }, (_, index) => index + 1));
  assert.ok(index.every((row) => row.version === meta.version));
});

test("every seeded family is traceable but prohibited from scoring", () => {
  assert.ok(index.every((row) => row.source && row.licence));
  assert.ok(index.every((row) => row.reviewStatus === "frequency-seeded"));
  assert.ok(meta.nonScoringStatuses.includes("frequency-seeded"));
  assert.ok(!meta.scoringEligibleStatuses.includes("frequency-seeded"));
});

test("word-family schema preserves special handling and audit fields", () => {
  const required = [
    "familyId", "headword", "members", "frequencyRank", "frequencyBand",
    "partsOfSpeech", "syllables", "ageOfAcquisition", "concreteness",
    "derivationType", "properNoun", "numberLike", "teachingLexiconIds",
    "source", "licence", "reviewStatus", "version",
  ];
  assert.ok(index.every((row) => required.every((field) => Object.hasOwn(row, field))));
  assert.match(meta.familyPolicy.multiwordChunks, /component/i);
  assert.match(meta.familyPolicy.properNouns, /excluded/i);
  assert.match(meta.familyPolicy.numbers, /excluded/i);
});

test("all 4,133 teaching items have an explicit mapping outcome", () => {
  assert.equal(lexicon.length, 4_133);
  assert.equal(mapping.length, lexicon.length);
  assert.equal(new Set(mapping.map((row) => row.lexiconId)).size, lexicon.length);
  assert.deepEqual(new Set(mapping.map((row) => row.outcome)), new Set(["direct", "member", "components", "unmatched"]));
  assert.equal(
    meta.counts.direct + meta.counts.member + meta.counts.components + meta.counts.unmatched,
    meta.counts.teachingItems,
  );
});
