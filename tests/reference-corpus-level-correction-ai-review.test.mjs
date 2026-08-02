import assert from "node:assert/strict";
import test from "node:test";
import correction from "../src/content/text-reference-corpus-level-correction-ai-reviewed-70.json" with { type: "json" };
import combined from "../src/content/text-reference-corpus-ai-reviewed-190.json" with { type: "json" };
import { validateAiReviewedReferenceTextRecord } from "../src/text-reference-corpus.mjs";

test("70 correction texts preserve independent AI provenance and complete adjudication", () => {
  assert.equal(correction.records.length, 70);
  assert.equal(correction.summary.agreements, 60);
  assert.equal(correction.summary.adjudicated, 10);
  assert.equal(correction.summary.unresolvedCount, 0);
  assert.equal(correction.summary.agreementRate, 0.8571);
  assert.deepEqual(correction.summary.levelCounts, { L1: 5, L2: 15, L3: 0, L4: 2, L5: 9, L6: 39 });
  assert.equal(correction.scoreEligible, false);
});

test("AI labels remain separate from human labels in every correction record", () => {
  for (const record of correction.records) {
    assert.equal(validateAiReviewedReferenceTextRecord(record).valid, true, record.id);
    assert.equal(record.reviewStatus, "ai-label-reviewed");
    assert.equal(record.labelProvenance, "independent-ai-review-v1");
    assert.deepEqual(record.humanLabels, []);
    assert.ok(record.aiLabels.length === 2 || record.aiLabels.length === 3, record.id);
    assert.ok(record.aiLabels.every((label) => label.reviewerType === "ai"), record.id);
    assert.equal(record.scoreEligible, false);
  }
  assert.equal(correction.records.filter((record) => record.aiLabels.length === 2).length, 60);
  assert.equal(correction.records.filter((record) => record.aiLabels.length === 3).length, 10);
});

test("combined 190-text corpus is unique and still fails the six-level coverage gate", () => {
  assert.equal(combined.records.length, 190);
  assert.equal(new Set(combined.records.map((record) => record.id)).size, 190);
  assert.equal(new Set(combined.records.map((record) => record.contentHash)).size, 190);
  assert.deepEqual(combined.summary.splitCounts, { train: 133, validation: 38, holdout: 19 });
  assert.deepEqual(combined.summary.levelCounts, { L1: 10, L2: 49, L3: 40, L4: 34, L5: 18, L6: 39 });
  assert.ok(combined.summary.levelCounts.L1 < 20);
  assert.ok(combined.summary.levelCounts.L5 < 20);
  assert.equal(combined.summary.unresolvedCount, 0);
  assert.equal(combined.summary.humanLabelReviewed, 0);
  assert.equal(combined.scoreEligible, false);
});
