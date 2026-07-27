import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview8K } from "../src/content/vocabulary-anchor-review-8k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-480.json", import.meta.url),
    "utf8",
  ),
);

test("8K authored batch contains 50 manually reviewed sense-matched anchors", () => {
  const authored8K = reviewed.filter((anchor) => anchor.frequencyBand === "8K");
  assert.equal(authored8K.length, 60);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 431 && id <= 480;
  });
  assert.equal(currentBatch.length, 50);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview8K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview8K[anchor.term];
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

test("8K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    reproduction: ["noun", "复制品；仿制品"],
    stubborn: ["adjective", "顽固的；难去除的"],
    bind: ["verb", "约束；使承担义务"],
    rigid: ["adjective", "死板的；不灵活的"],
    blink: ["verb", "闪烁；眨动"],
    insecure: ["adjective", "不安全的；不牢靠的"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
