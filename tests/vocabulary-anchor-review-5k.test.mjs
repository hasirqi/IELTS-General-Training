import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview5K } from "../src/content/vocabulary-anchor-review-5k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-330.json", import.meta.url),
    "utf8",
  ),
);

test("5K authored batch contains 36 manually reviewed sense-matched anchors", () => {
  const authored5K = reviewed.filter((anchor) => anchor.frequencyBand === "5K");
  assert.equal(authored5K.length, 60);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 295 && id <= 330;
  });
  assert.equal(currentBatch.length, 36);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview5K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview5K[anchor.term];
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

test("5K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    spray: ["verb", "喷洒；喷射"],
    jam: ["noun", "堵塞；拥堵"],
    counsel: ["noun", "法律意见；法律顾问"],
    retreat: ["verb", "撤退；退回"],
    dairy: ["adjective", "乳制品的；奶制的"],
    exceptional: ["adjective", "特殊的；例外的"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
