import assert from "node:assert/strict";
import test from "node:test";
import reviewed from "../src/content/text-reference-corpus-ai-reviewed-120.json" with { type: "json" };
import { validateAiReviewedReferenceTextRecord, validateReferenceTextRecord } from "../src/text-reference-corpus.mjs";

test("AI review seed preserves explicit provenance and resolves all 120 texts", () => {
  assert.equal(reviewed.records.length, 120);
  assert.equal(reviewed.summary.agreements, 99);
  assert.equal(reviewed.summary.adjudicated, 21);
  assert.equal(reviewed.summary.unresolvedCount, 0);
  assert.equal(reviewed.summary.agreementRate, 0.825);
  assert.equal(reviewed.labelProvenance, "independent-ai-review-v1");
  assert.match(reviewed.reviewerDisclosure, /not human labels/i);
  assert.equal(reviewed.scoreEligible, false);
});

test("AI labels remain separate from human labels and cannot unlock scoring", () => {
  for (const record of reviewed.records) {
    assert.equal(validateAiReviewedReferenceTextRecord(record).valid, true);
    assert.equal(validateReferenceTextRecord(record).valid, false);
    assert.equal(record.reviewStatus, "ai-label-reviewed");
    assert.equal(record.humanLabels.length, 0);
    assert.ok(record.aiLabels.length === 2 || record.aiLabels.length === 3);
    assert.ok(record.aiLabels.every((label) => label.reviewerType === "ai"));
    assert.equal(record.scoreEligible, false);
  }
  assert.equal(reviewed.records.filter((record) => record.aiLabels.length === 2).length, 99);
  assert.equal(reviewed.records.filter((record) => record.aiLabels.length === 3).length, 21);
});

test("seed distribution is audited and correctly blocks a six-level model", () => {
  assert.deepEqual(reviewed.summary.levelCounts, { L1: 5, L2: 34, L3: 40, L4: 32, L5: 9, L6: 0 });
  assert.equal(reviewed.summary.levelCounts.L6, 0);
  assert.equal(reviewed.summary.scoreEligible, 0);
});
