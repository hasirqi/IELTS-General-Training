import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview7K } from "../src/content/vocabulary-anchor-review-7k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-430.json", import.meta.url),
    "utf8",
  ),
);

test("7K authored batch contains 50 manually reviewed sense-matched anchors", () => {
  const authored7K = reviewed.filter((anchor) => anchor.frequencyBand === "7K");
  assert.equal(authored7K.length, 60);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 381 && id <= 430;
  });
  assert.equal(currentBatch.length, 50);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview7K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview7K[anchor.term];
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

test("7K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    mint: ["noun", "薄荷"],
    sphere: ["noun", "领域；范围"],
    marshal: ["verb", "组织；引导"],
    prompt: ["verb", "促使；引起"],
    obscure: ["verb", "使模糊；使难理解"],
    spiral: ["verb", "急剧上升；不断恶化"],
    accord: ["noun", "协议；一致"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
