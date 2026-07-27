import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview3K } from "../src/content/vocabulary-anchor-review-3k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-258.json", import.meta.url),
    "utf8",
  ),
);

test("3K authored batch contains 36 manually reviewed sense-matched anchors", () => {
  const authored3K = reviewed.filter((anchor) => anchor.frequencyBand === "3K");
  assert.equal(authored3K.length, 60);
  const currentBatch = authored3K.filter((anchor) => Number(anchor.id.slice(7)) >= 223);
  assert.equal(currentBatch.length, 36);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview3K).sort(),
  );

  const definitionOwners = new Map(
    reviewed.map((anchor) => [anchor.englishDefinition, anchor.partOfSpeech]),
  );
  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview3K[anchor.term];
    assert.equal(anchor.reviewStatus, "item-authored");
    assert.equal(anchor.partOfSpeech, authored.partOfSpeech);
    assert.equal(anchor.focusedMeaning, authored.focusedMeaning);
    assert.equal(anchor.englishDefinition, authored.englishDefinition);
    assert.equal(anchor.correctDefinition, anchor.englishDefinition);
    assert.equal(anchor.correctChinese, anchor.focusedMeaning);
    assert.equal(anchor.definitionOptions.length, 4);
    assert.equal(anchor.chineseOptions.length, 4);
    assert.equal(new Set(anchor.definitionOptions).size, 4);
    assert.equal(new Set(anchor.chineseOptions).size, 4);
    assert.ok(anchor.definitionOptions.includes(anchor.correctDefinition));
    assert.ok(anchor.chineseOptions.includes(anchor.correctChinese));
    for (const option of anchor.definitionOptions) {
      if (option !== anchor.correctDefinition) {
        assert.equal(definitionOwners.get(option), anchor.partOfSpeech);
      }
    }
  }
});

test("3K review narrows ambiguous words to the sense used by their context", () => {
  const expectedSenses = {
    outstanding: ["adjective", "尚未支付的；未解决的"],
    graduate: ["verb", "毕业"],
    avenue: ["noun", "途径；渠道"],
    crack: ["noun", "裂缝；裂纹"],
    associate: ["verb", "把……联系起来"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
