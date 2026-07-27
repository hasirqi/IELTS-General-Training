import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview10K } from "../src/content/vocabulary-anchor-review-10k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-510.json", import.meta.url),
    "utf8",
  ),
);

test("10K authored batch contains 15 manually reviewed sense-matched anchors", () => {
  const authored10K = reviewed.filter((anchor) => anchor.frequencyBand === "10K");
  assert.equal(authored10K.length, 15);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 496 && id <= 510;
  });
  assert.equal(currentBatch.length, 15);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview10K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview10K[anchor.term];
    assert.equal(anchor.reviewStatus, "item-authored");
    assert.equal(anchor.partOfSpeech, authored.partOfSpeech);
    assert.equal(anchor.focusedMeaning, authored.focusedMeaning);
    assert.equal(anchor.englishDefinition, authored.englishDefinition);
    assert.deepEqual(
      new Set(anchor.definitionOptions),
      new Set([authored.englishDefinition, ...authored.definitionDistractors]),
    );
    assert.equal(authored.definitionDistractors.length, 3);
    assert.equal(new Set(authored.definitionDistractors).size, 3);
    assert.equal(anchor.definitionOptions.length, 4);
    assert.equal(anchor.chineseOptions.length, 4);
    assert.equal(new Set(anchor.chineseOptions).size, 4);
    assert.ok(anchor.definitionOptions.includes(anchor.correctDefinition));
    assert.ok(anchor.chineseOptions.includes(anchor.correctChinese));
    assert.match(anchor.contextSentence.toLowerCase(), new RegExp(`\\b${anchor.term.toLowerCase()}\\b`));
    assert.ok(anchor.review.checks.includes("same-pos-distractors"));
    assert.ok(anchor.review.checks.includes("sense-context-match"));
  }
});

test("10K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    affinity: ["noun", "亲和力；天然适配"],
    adolescent: ["noun", "青少年"],
    discourage: ["verb", "阻止；使打消念头"],
    purge: ["verb", "清除；删除"],
    symptom: ["noun", "症状"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
