import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildVocabularyPilotResult,
  compareVocabularyCatPaths,
  estimateVocabularyAbility,
  responseProbability,
  selectNextVocabularyAnchor,
  shouldStopVocabularyCat,
  summarizeVocabularyCatPathMatrix,
} from "../src/vocabulary-cat-engine.mjs";

const anchors = JSON.parse(
  fs.readFileSync(new URL("../src/content/vocabulary-anchor-bank-600.json", import.meta.url), "utf8"),
);

function answer(anchor, correct, responseMs = 2_400) {
  return {
    anchorId: anchor.id,
    familyId: anchor.familyId,
    lexiconId: anchor.lexiconId,
    selectedOption: correct ? anchor.correctDefinition : anchor.definitionOptions.find((option) => option !== anchor.correctDefinition),
    correct,
    difficulty: anchor.difficulty,
    discrimination: anchor.discrimination,
    guessing: anchor.guessing,
    frequencyBand: anchor.frequencyBand,
    responseMs,
    phase: "cat",
    anchorBankVersion: anchor.version,
    wordFamilyIndexVersion: anchor.source.wordFamilyIndexVersion,
  };
}

function deterministicUnit(text) {
  let hash = 2_166_136_261;
  for (const character of text) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 4_294_967_296;
}

function simulatePath(trueTheta, priorTheta, attempt, recentAnchorIds = []) {
  const answers = [];
  for (let index = 0; index < 30; index += 1) {
    const estimate = estimateVocabularyAbility(answers, priorTheta);
    const anchor = selectNextVocabularyAnchor(anchors, answers, estimate.theta, attempt, { recentAnchorIds });
    assert.ok(anchor, `missing anchor for theta ${trueTheta}`);
    const probability = responseProbability(trueTheta, anchor.difficulty, anchor.discrimination, anchor.guessing);
    const stableKnowledge = probability >= 0.58 || (probability >= 0.46 && deterministicUnit(`${trueTheta}:${anchor.id}`) > 0.82);
    answers.push(answer(anchor, stableKnowledge));
    const updated = estimateVocabularyAbility(answers, priorTheta);
    if (shouldStopVocabularyCat(answers, updated, answers.length * 18_000)) break;
  }
  return buildVocabularyPilotResult(
    answers,
    [],
    "2026-08-01T00:00:00.000Z",
    "2026-08-01T00:12:00.000Z",
    { theta: priorTheta, realRecognized: 0, realTotal: 0, claimedPseudowords: 0, pseudoTotal: 0, reliable: true },
    { recentAnchorIds },
  );
}

test("a high estimate cannot stop early before an upper-bank probe", () => {
  const lower = ["1K", "2K", "3K", "4K", "5K"].flatMap((band) =>
    anchors.filter((anchor) => anchor.frequencyBand === band).slice(0, 4),
  ).map((anchor) => answer(anchor, true));
  assert.equal(lower.length, 20);
  assert.equal(shouldStopVocabularyCat(lower, { theta: 1.5, standardError: 0.2 }, 6 * 60_000), false);
  const upper = anchors.find((anchor) => anchor.frequencyBand === "9K");
  assert.equal(shouldStopVocabularyCat([...lower, answer(upper, true)], { theta: 1.5, standardError: 0.2 }, 6 * 60_000), true);
  assert.equal(shouldStopVocabularyCat([...lower, ...lower.slice(0, 10)], { theta: 1.5, standardError: 0.2 }, 6 * 60_000), true);
});

test("recent overlap and narrow coverage lower confidence using learner-facing reasons", () => {
  const sample = ["1K", "2K", "3K", "4K"].flatMap((band) =>
    anchors.filter((anchor) => anchor.frequencyBand === band).slice(0, 5),
  ).map((anchor, index) => answer(anchor, index % 3 !== 0));
  const recentAnchorIds = sample.slice(0, 2).map((item) => item.anchorId);
  const result = buildVocabularyPilotResult(sample, [], "2026-08-01T00:00:00.000Z", undefined, undefined, { recentAnchorIds });
  assert.equal(result.guardrails.retestSafe, false);
  assert.equal(result.guardrails.coverageSufficient, false);
  assert.equal(result.guardrails.validationPassed, false);
  assert.deepEqual(result.guardrails.recentOverlapIds, recentAnchorIds);
  assert.equal(result.confidence.label, "需要谨慎");
  assert.ok(result.confidence.reasons.includes("近期题目出现重复"));
  assert.ok(result.confidence.reasons.includes("覆盖频段不足"));
});

test("route-first, direct and recent-retest simulations meet the M3 path gate", () => {
  const comparisons = [];
  const abilities = [-2.2, -1.4, -0.6, 0.2, 0.9, 1.6];
  for (const [index, ability] of abilities.entries()) {
    for (let run = 0; run < 3; run += 1) {
      const seed = index * 7 + run;
      const routeFirst = simulatePath(ability, Math.max(-2.8, Math.min(1.1, ability)), seed);
      const direct = simulatePath(ability, 0, seed + 41);
      comparisons.push(compareVocabularyCatPaths(routeFirst, direct));

      const recent = routeFirst.sampledAnchorIds.slice(0, 12);
      const retest = simulatePath(ability, routeFirst.routeSummary.theta, seed + 83, recent);
      assert.equal(retest.guardrails.retestSafe, true);
      assert.equal(retest.sampledAnchorIds.some((id) => recent.includes(id)), false);
      comparisons.push(compareVocabularyCatPaths(routeFirst, retest));
    }
  }
  const matrix = summarizeVocabularyCatPathMatrix(comparisons);
  assert.equal(matrix.total, 36);
  assert.ok(matrix.consistentRate >= 0.8, JSON.stringify({matrix,comparisons}));
  assert.equal(matrix.passed, true);
});

test("numeric estimates are rounded, bounded and hidden when confidence is weak", () => {
  const sample = ["1K", "2K", "3K", "4K", "5K", "6K"].flatMap((band) =>
    anchors.filter((anchor) => anchor.frequencyBand === band).slice(0, 4),
  ).map((anchor, index) => answer(anchor, index < 17));
  const result = buildVocabularyPilotResult(sample, [], "2026-08-01T00:00:00.000Z");
  assert.ok(result.vocabulary.value >= 500 && result.vocabulary.value <= 20_000);
  assert.ok(result.vocabulary.low <= result.vocabulary.value);
  assert.ok(result.vocabulary.high >= result.vocabulary.value);
  assert.equal(result.vocabulary.value % 500, 0);
  assert.equal(result.vocabulary.low % 500, 0);
  assert.equal(result.vocabulary.high % 500, 0);

  const source = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
  assert.match(source, /showNumeric = Boolean\(result\.vocabulary && result\.guardrails\?\.validationPassed/);
  assert.match(source, /result\.confidence\.label !== "\\u9700\\u8981\\u8c28\\u614e"/);
});
test("technical guardrails stay internal while plain confidence reasons remain visible", () => {
  const source = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
  assert.match(source, /result\.confidence\.reasons\.join/);
  assert.doesNotMatch(source, /result\.guardrails\.(?:upperProbeRequired|overexposedBands|recentOverlapIds)/);
});
