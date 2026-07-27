import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview4K } from "../src/content/vocabulary-anchor-review-4k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-294.json", import.meta.url),
    "utf8",
  ),
);

test("4K authored batch contains 36 manually reviewed sense-matched anchors", () => {
  const authored4K = reviewed.filter((anchor) => anchor.frequencyBand === "4K");
  assert.equal(authored4K.length, 60);
  const currentBatch = authored4K.filter((anchor) => Number(anchor.id.slice(7)) >= 259);
  assert.equal(currentBatch.length, 36);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview4K).sort(),
  );

  const definitionOwners = new Map(
    reviewed.map((anchor) => [anchor.englishDefinition, anchor.partOfSpeech]),
  );
  for (const authored of Object.values(vocabularyAnchorReview4K)) {
    definitionOwners.set(authored.englishDefinition, authored.partOfSpeech);
    assert.equal(authored.definitionDistractors.length, 3);
    for (const distractor of authored.definitionDistractors) {
      definitionOwners.set(distractor, authored.partOfSpeech);
    }
  }

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview4K[anchor.term];
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
    assert.match(anchor.contextSentence.toLowerCase(), new RegExp(`\\b${anchor.term.toLowerCase()}\\b`));
    for (const option of anchor.definitionOptions) {
      assert.equal(definitionOwners.get(option), anchor.partOfSpeech, `${anchor.term}: ${option}`);
    }
  }
});

test("4K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    prominent: ["adjective", "醒目的；突出的"],
    manual: ["noun", "使用手册"],
    polish: ["verb", "润色；完善"],
    slip: ["noun", "小单据；纸条"],
    graphic: ["adjective", "内容逼真而令人不适的"],
    veteran: ["adjective", "经验丰富的；资深的"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});