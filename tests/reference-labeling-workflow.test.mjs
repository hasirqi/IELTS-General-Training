import assert from "node:assert/strict";
import test from "node:test";
import corpus from "../src/content/text-reference-corpus-voa-120.json" with { type: "json" };
import manifests from "../src/content/reference-review-packets-v1.json" with { type: "json" };
import {
  buildBlindedReviewPacket,
  materializeBlindedPacket,
  reconcileIndependentAiReviews,
  reconcileIndependentReviews,
  REFERENCE_REVIEW_RUBRIC_VERSION,
  REFERENCE_REVIEW_WORKFLOW_VERSION,
  validateAiReviewSubmission,
  validateReviewSubmission,
} from "../src/reference-labeling-workflow.mjs";

const [packetA, packetB] = manifests.packets;

function submission(packet, reviewerId, levelFor = () => "L3") {
  return {
    packetId: packet.packetId,
    workflowVersion: REFERENCE_REVIEW_WORKFLOW_VERSION,
    rubricVersion: REFERENCE_REVIEW_RUBRIC_VERSION,
    reviewerId,
    completedAt: "2026-08-01T00:00:00.000Z",
    responses: packet.order.map((itemId) => ({ itemId, level: levelFor(itemId), confidence: "medium", evidenceCodes: ["sentence-load"], note: "" })),
  };
}

test("two deterministic blind packets cover the same 120 items in different orders", () => {
  assert.equal(packetA.itemCount, 120);
  assert.equal(packetB.itemCount, 120);
  assert.deepEqual(new Set(packetA.order), new Set(packetB.order));
  assert.notDeepEqual(packetA.order, packetB.order);
  assert.equal(new Set(packetA.order).size, 120);
  assert.deepEqual(buildBlindedReviewPacket(corpus.records, "A"), packetA);
});

test("materialized packet excludes source level, machine level, features and split", () => {
  const packet = materializeBlindedPacket(packetA, corpus.records);
  assert.equal(packet.items.length, 120);
  for (const item of packet.items) {
    assert.deepEqual(Object.keys(item), ["sequence", "itemId", "title", "text", "response"]);
    assert.equal("provisionalInternalLevel" in item, false);
    assert.equal("features" in item, false);
    assert.equal("split" in item, false);
    assert.equal("source" in item, false);
  }
});

test("submission gate rejects incomplete, duplicate or unjustified labels", () => {
  const valid = submission(packetA, "reviewer-a");
  assert.equal(validateReviewSubmission(packetA, valid).valid, true);
  const incomplete = { ...valid, responses: valid.responses.slice(0, 119) };
  assert.ok(validateReviewSubmission(packetA, incomplete).issues.includes("incomplete-response-count"));
  const invalidEvidence = { ...valid, responses: valid.responses.map((response, index) => index ? response : { ...response, evidenceCodes: [] }) };
  assert.ok(validateReviewSubmission(packetA, invalidEvidence).issues.some((issue) => issue.startsWith("invalid-evidence:")));
});

test("two different reviewers can agree but labels still do not become scoring eligible", () => {
  const result = reconcileIndependentReviews(corpus.records, [packetA, packetB], [submission(packetA, "reviewer-a"), submission(packetB, "reviewer-b")]);
  assert.equal(result.summary.agreements, 120);
  assert.equal(result.summary.unresolvedCount, 0);
  assert.equal(result.summary.labelReviewed, 120);
  assert.equal(result.summary.scoreEligible, 0);
  assert.ok(result.records.every((record) => record.internalLevel === "L3" && record.reviewStatus === "label-reviewed" && !record.scoreEligible));
});

test("disagreement cannot be averaged and requires a third independent adjudicator", () => {
  const disagreeId = packetA.order[0];
  const first = submission(packetA, "reviewer-a", () => "L3");
  const second = submission(packetB, "reviewer-b", (itemId) => itemId === disagreeId ? "L4" : "L3");
  const unresolved = reconcileIndependentReviews(corpus.records, [packetA, packetB], [first, second]);
  assert.equal(unresolved.summary.unresolvedCount, 1);
  assert.equal(unresolved.records.find((record) => record.id === disagreeId).internalLevel, null);
  const resolved = reconcileIndependentReviews(corpus.records, [packetA, packetB], [first, second], [{ itemId: disagreeId, reviewerId: "adjudicator-c", level: "L4", confidence: "high", evidenceCodes: ["inference-load"] }]);
  assert.equal(resolved.summary.unresolvedCount, 0);
  assert.equal(resolved.summary.adjudicated, 1);
  assert.equal(resolved.records.find((record) => record.id === disagreeId).internalLevel, "L4");
});

test("the same reviewer cannot fill both independent slots", () => {
  assert.throws(() => reconcileIndependentReviews(corpus.records, [packetA, packetB], [submission(packetA, "same-person"), submission(packetB, "same-person")]), /different reviewer IDs/);
});
function aiSubmission(packet, reviewerId, levelFor = () => "L3") {
  return { ...submission(packet, reviewerId, levelFor), reviewerType: "ai" };
}

test("AI review is recorded separately and never impersonates human labels", () => {
  const result = reconcileIndependentAiReviews(corpus.records, [packetA, packetB], [aiSubmission(packetA, "ai-a"), aiSubmission(packetB, "ai-b")]);
  assert.equal(result.summary.aiLabelReviewed, 120);
  assert.equal(result.summary.humanLabelReviewed, 0);
  assert.equal(result.summary.scoreEligible, 0);
  assert.ok(result.records.every((record) => record.reviewStatus === "ai-label-reviewed" && record.labelProvenance === "independent-ai-review-v1"));
  assert.ok(result.records.every((record) => record.aiLabels.length === 2 && record.humanLabels.length === 0));
});

test("AI submissions require explicit provenance and third-AI adjudication", () => {
  assert.ok(validateAiReviewSubmission(packetA, submission(packetA, "untyped-ai")).issues.includes("reviewer-type-must-be-ai"));
  const disagreeId = packetA.order[0];
  const first = aiSubmission(packetA, "ai-a", () => "L3");
  const second = aiSubmission(packetB, "ai-b", (itemId) => itemId === disagreeId ? "L4" : "L3");
  const unresolved = reconcileIndependentAiReviews(corpus.records, [packetA, packetB], [first, second]);
  assert.equal(unresolved.summary.unresolvedCount, 1);
  const resolved = reconcileIndependentAiReviews(corpus.records, [packetA, packetB], [first, second], [{ itemId: disagreeId, reviewerId: "ai-c", reviewerType: "ai", level: "L4", confidence: "high", evidenceCodes: ["inference-load"] }]);
  assert.equal(resolved.summary.unresolvedCount, 0);
  assert.equal(resolved.summary.adjudicated, 1);
  assert.equal(resolved.records.find((record) => record.id === disagreeId).aiLabels.at(-1).role, "adjudicator");
});
