import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview13K } from "../src/content/vocabulary-anchor-review-13k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-555.json", import.meta.url),
    "utf8",
  ),
);

test("13K authored batch contains 15 manually reviewed sense-matched anchors", () => {
  const authored13K = reviewed.filter((anchor) => anchor.frequencyBand === "13K");
  assert.equal(authored13K.length, 15);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 541 && id <= 555;
  });
  assert.equal(currentBatch.length, 15);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview13K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview13K[anchor.term];
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

test("13K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    betray: ["verb", "暴露；流露"],
    embark: ["verb", "开始；着手"],
    posh: ["adjective", "豪华的；上流的"],
    exemplary: ["adjective", "模范的；优秀的"],
    longitudinal: ["adjective", "长期跟踪的；纵向的"],
    transient: ["adjective", "短暂的；临时的"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
