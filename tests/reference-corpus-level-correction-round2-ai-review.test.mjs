import assert from "node:assert/strict";
import test from "node:test";
import correction from "../src/content/text-reference-corpus-level-correction-round2-ai-reviewed-28.json" with { type: "json" };
import combined from "../src/content/text-reference-corpus-ai-reviewed-218.json" with { type: "json" };
import { validateAiReviewedReferenceTextRecord } from "../src/text-reference-corpus.mjs";

test("round two preserves two independent AI reviews and one blinded adjudication", () => {
  assert.equal(correction.records.length, 28);
  assert.equal(correction.summary.agreements, 27);
  assert.equal(correction.summary.adjudicated, 1);
  assert.equal(correction.summary.unresolvedCount, 0);
  assert.equal(correction.summary.agreementRate, 0.9643);
  assert.deepEqual(correction.summary.levelCounts, { L1: 19, L2: 1, L3: 0, L4: 0, L5: 2, L6: 6 });
  assert.equal(correction.scoreEligible, false);
});

test("round two labels remain AI-only and cannot enter scoring", () => {
  for (const record of correction.records) {
    assert.equal(validateAiReviewedReferenceTextRecord(record).valid, true, record.id);
    assert.equal(record.reviewStatus, "ai-label-reviewed");
    assert.equal(record.labelProvenance, "independent-ai-review-v1");
    assert.deepEqual(record.humanLabels, []);
    assert.ok(record.aiLabels.length === 2 || record.aiLabels.length === 3, record.id);
    assert.ok(record.aiLabels.every((label) => label.reviewerType === "ai"), record.id);
    assert.equal(record.scoreEligible, false);
  }
  assert.equal(correction.records.filter((record) => record.aiLabels.length === 2).length, 27);
  assert.equal(correction.records.filter((record) => record.aiLabels.length === 3).length, 1);
});

test("combined 218-text corpus is unique and reaches the six-level coverage gate", () => {
  assert.equal(combined.records.length, 218);
  assert.equal(new Set(combined.records.map((record) => record.id)).size, 218);
  assert.equal(new Set(combined.records.map((record) => record.contentHash)).size, 218);
  assert.deepEqual(combined.summary.splitCounts, { train: 152, validation: 43, holdout: 23 });
  assert.deepEqual(combined.summary.levelCounts, { L1: 29, L2: 50, L3: 40, L4: 34, L5: 20, L6: 45 });
  assert.equal(combined.summary.sixLevelCoverageGate, true);
  assert.ok(Object.values(combined.summary.levelCounts).every((count) => count >= 20));
  assert.equal(combined.summary.unresolvedCount, 0);
  assert.equal(combined.summary.humanLabelReviewed, 0);
  assert.equal(combined.scoreEligible, false);
});
