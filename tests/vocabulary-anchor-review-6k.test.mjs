import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { vocabularyAnchorReview6K } from "../src/content/vocabulary-anchor-review-6k.mjs";

const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-380.json", import.meta.url),
    "utf8",
  ),
);

test("6K authored batch contains 50 manually reviewed sense-matched anchors", () => {
  const authored6K = reviewed.filter((anchor) => anchor.frequencyBand === "6K");
  assert.equal(authored6K.length, 60);
  const currentBatch = reviewed.filter((anchor) => {
    const id = Number(anchor.id.slice(7));
    return id >= 331 && id <= 380;
  });
  assert.equal(currentBatch.length, 50);
  assert.deepEqual(
    currentBatch.map((anchor) => anchor.term).sort(),
    Object.keys(vocabularyAnchorReview6K).sort(),
  );

  for (const anchor of currentBatch) {
    const authored = vocabularyAnchorReview6K[anchor.term];
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

test("6K review narrows polysemous words to the sense used by their context", () => {
  const expectedSenses = {
    passive: ["adjective", "被动的；间接受到的"],
    gut: ["noun", "肠道；消化道"],
    crude: ["adjective", "粗糙的；简陋的"],
    affiliate: ["noun", "附属机构；分支机构"],
    archive: ["verb", "存档；归档"],
    conjunction: ["noun", "结合；协作"],
    frontier: ["noun", "前沿；新领域"],
    wreck: ["noun", "残骸；失事船只"],
  };
  for (const [term, [partOfSpeech, focusedMeaning]] of Object.entries(expectedSenses)) {
    const anchor = reviewed.find((entry) => entry.term === term);
    assert.ok(anchor, `${term} is missing`);
    assert.equal(anchor.partOfSpeech, partOfSpeech);
    assert.equal(anchor.focusedMeaning, focusedMeaning);
  }
});
