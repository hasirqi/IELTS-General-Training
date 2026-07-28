import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview18K } from "../src/content/vocabulary-anchor-review-18k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-590.json", import.meta.url),
    "utf8",
  ),
);

test("18K authored batch contains 5 manually reviewed sense-matched anchors", () => {
  const authored18K = reviewed.filter((anchor) => anchor.frequencyBand === "18K");
  assert.equal(authored18K.length, 5);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 586 && id <= 590;
  });
  assert.equal(currentBatch.length, 5);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview18K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview18K[anchor.term];
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

test("18K review narrows high-band words to the sense used by their context", () => {
  const expectedSenses = {
    drizzle: ["noun", "毛毛雨"],
    asymmetric: ["adjective", "不对称的"],
    blunder: ["noun", "严重错误；犯大错"],
    brunt: ["noun", "主要冲击；首当其冲"],
    backfire: ["verb", "产生反效果"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
