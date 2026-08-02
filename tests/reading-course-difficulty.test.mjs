import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import difficulty from "../src/content/reading-course-difficulty-v1.json" with { type: "json" };
import review from "../src/content/reading-course-manual-review-36.json" with { type: "json" };
import model from "../src/content/text-difficulty-model-comparison-v1.json" with { type: "json" };

test("128 reading courses have complete experimental difficulty profiles", () => {
  assert.equal(difficulty.count, 128);
  assert.equal(difficulty.records.length, 128);
  assert.equal(new Set(difficulty.records.map((record) => record.lessonId)).size, 128);
  assert.deepEqual(Object.keys(difficulty.distribution), ["L1", "L2", "L3", "L4", "L5", "L6"]);
  assert.ok(Object.values(difficulty.distribution).every((count) => count >= 6));
  for (const record of difficulty.records) {
    assert.match(record.internalLevel, /^L[1-6]$/);
    assert.equal(record.experimental, true);
    assert.equal(record.officialLexile, false);
    assert.equal(record.scoreEligible, false);
    assert.ok(record.coverage.indexedWordFamilies >= 0 && record.coverage.indexedWordFamilies <= 1);
    assert.ok(record.longestSentence.words > 0 && record.longestSentence.text.length > 0);
    assert.ok(record.obstacles.length >= 1);
  }
});

test("course calibration preserves raw model audit and GT section progression", () => {
  assert.equal(model.finalModel.type, "gbdt");
  assert.equal(model.finalModel.trees.length, model.finalModel.config.trees);
  assert.ok(difficulty.records.every((record) => Number.isFinite(record.predictedScore) && Number.isFinite(record.calibratedScore)));
  assert.ok(difficulty.sectionMeans["Section 1"] < difficulty.sectionMeans["Section 2"]);
  assert.ok(difficulty.sectionMeans["Section 2"] < difficulty.sectionMeans["Section 3"]);
  assert.equal(difficulty.records.filter((record) => record.section === "Section 1" && Number(record.internalLevel.slice(1)) >= 5).length, 0);
  assert.equal(difficulty.records.filter((record) => record.section === "Section 3" && Number(record.internalLevel.slice(1)) <= 2).length, 0);
});

test("36-item review contains six unique texts per level and explicit L4/L5 focus", () => {
  assert.equal(review.count, 36);
  assert.equal(new Set(review.records.map((record) => record.lessonId)).size, 36);
  assert.deepEqual(review.perLevel, { L1: 6, L2: 6, L3: 6, L4: 6, L5: 6, L6: 6 });
  assert.equal(review.l4l5BoundaryCount, 12);
  assert.equal(review.reviewRounds, 2);
  assert.equal(review.finalValidation.unresolvedSevereInversions, 0);
  assert.match(review.reviewType, /not human participant calibration/);
  assert.ok(review.records.every((record) => record.text.length > 80 && record.reviewNote.length > 20));
});

test("learner UI states experimental scope and does not open simulated L scoring", () => {
  const source = fs.readFileSync("src/AppProduct.tsx", "utf8");
  assert.match(source, /内部难度 · 实验值/);
  assert.match(source, /不是 MetaMetrics 官方蓝思认证/);
  assert.match(source, /不生成模拟 L 值/);
  assert.match(source, /词族索引覆盖/);
  assert.match(source, /主要障碍/);
});
