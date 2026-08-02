import fs from "node:fs";
import path from "node:path";
import corpus from "../src/content/text-reference-corpus-level-correction-round2-candidates.json" with { type: "json" };
import manifests from "../src/content/reference-review-correction-round2-packets-v1.json" with { type: "json" };
import prior from "../src/content/text-reference-corpus-ai-reviewed-190.json" with { type: "json" };
import {
  REFERENCE_EVIDENCE_CODES,
  REFERENCE_LEVEL_RUBRIC,
  reconcileIndependentAiReviews,
  validateAiReviewSubmission,
} from "../src/reference-labeling-workflow.mjs";
import { validateAiReviewedReferenceTextRecord } from "../src/text-reference-corpus.mjs";

function readJson(file) {
  const content = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(content);
}

const auditDir = path.resolve("audit", "level-correction-round2-review");
const submissionA = readJson(path.join(auditDir, "reviewer-a-submission.json"));
const submissionB = readJson(path.join(auditDir, "reviewer-b-submission.json"));
const submissions = [submissionA, submissionB];
for (let index = 0; index < submissions.length; index += 1) {
  const checked = validateAiReviewSubmission(manifests.packets[index], submissions[index]);
  if (!checked.valid) throw new Error(`Invalid reviewer ${index ? "B" : "A"}: ${checked.issues.join(",")}`);
}

const provisional = reconcileIndependentAiReviews(corpus.records, manifests.packets, submissions);
if (process.argv.includes("--prepare-adjudication")) {
  const byId = new Map(corpus.records.map((record) => [record.id, record]));
  const packet = {
    workflowVersion: manifests.packets[0].workflowVersion,
    rubricVersion: manifests.packets[0].rubricVersion,
    packetId: "level-correction-round2-28-adjudicator-c-v1",
    reviewerRole: "independent-ai-adjudicator",
    blindFields: ["provisionalInternalLevel", "features", "split", "source", "reviewerAAnswer", "reviewerBAnswer"],
    rubric: REFERENCE_LEVEL_RUBRIC,
    evidenceCodes: REFERENCE_EVIDENCE_CODES,
    itemCount: provisional.summary.unresolvedCount,
    items: provisional.summary.unresolved.map((itemId, index) => {
      const record = byId.get(itemId);
      return { sequence: index + 1, itemId, title: record.title, text: record.text, response: { level: null, confidence: null, evidenceCodes: [], note: "" } };
    }),
  };
  fs.writeFileSync(path.join(auditDir, "adjudicator-c.json"), `${JSON.stringify(packet, null, 2)}\n`);
  console.log(JSON.stringify({ agreements: provisional.summary.agreements, disagreements: provisional.summary.unresolvedCount }, null, 2));
  process.exit(0);
}

const adjudicationSubmission = readJson(path.join(auditDir, "adjudicator-c-submission.json"));
if (adjudicationSubmission.packetId !== "level-correction-round2-28-adjudicator-c-v1") throw new Error("Adjudication packet mismatch");
if (adjudicationSubmission.reviewerId !== "ai-correction-round2-adjudicator-c" || adjudicationSubmission.reviewerType !== "ai") throw new Error("Invalid adjudicator identity");
const adjudications = adjudicationSubmission.responses.map((response) => ({
  ...response,
  reviewerId: adjudicationSubmission.reviewerId,
  reviewerType: "ai",
  completedAt: adjudicationSubmission.completedAt,
}));
const result = reconcileIndependentAiReviews(corpus.records, manifests.packets, submissions, adjudications);
if (result.summary.unresolvedCount) throw new Error(`Unresolved correction items: ${result.summary.unresolved.join(",")}`);
const invalid = result.records.filter((record) => !validateAiReviewedReferenceTextRecord(record).valid);
if (invalid.length) throw new Error(`Invalid reviewed correction records: ${invalid.map((record) => record.id).join(",")}`);

const levelCounts = (records) => Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
  const level = `L${index + 1}`;
  return [level, records.filter((record) => record.internalLevel === level).length];
}));
const payload = {
  version: "reference-corpus-level-correction-round2-ai-reviewed-v1-2026.08.02",
  sourceCorpusVersion: corpus.version,
  status: "independent-ai-reviewed-awaiting-model-validation",
  labelProvenance: "independent-ai-review-v1",
  reviewerDisclosure: "Two isolated AI reviewers plus a third independent AI adjudicator; not human labels and not official certification.",
  scoreEligible: false,
  summary: { ...result.summary, levelCounts: levelCounts(result.records) },
  records: result.records,
};
fs.writeFileSync(path.resolve("src", "content", "text-reference-corpus-level-correction-round2-ai-reviewed-28.json"), `${JSON.stringify(payload, null, 2)}\n`);

const combinedRecords = [...prior.records, ...result.records];
if (new Set(combinedRecords.map((record) => record.id)).size !== 218 || new Set(combinedRecords.map((record) => record.contentHash)).size !== 218) throw new Error("Combined corpus uniqueness gate failed");
const combinedLevelCounts = levelCounts(combinedRecords);
const sixLevelCoverageGate = Object.values(combinedLevelCounts).every((count) => count >= 20);
const combined = {
  version: "reference-corpus-ai-reviewed-218-v1-2026.08.02",
  sourceVersions: [prior.version, payload.version],
  status: sixLevelCoverageGate ? "independent-ai-reviewed-six-level-coverage-reached-awaiting-model-validation" : "independent-ai-reviewed-awaiting-six-level-coverage-gate",
  labelProvenance: "independent-ai-review-v1",
  reviewerDisclosure: payload.reviewerDisclosure,
  scoreEligible: false,
  summary: {
    total: 218,
    agreements: prior.summary.agreements + result.summary.agreements,
    adjudicated: prior.summary.adjudicated + result.summary.adjudicated,
    unresolvedCount: 0,
    humanLabelReviewed: 0,
    scoreEligible: 0,
    splitCounts: Object.fromEntries(["train", "validation", "holdout"].map((split) => [split, combinedRecords.filter((record) => record.split === split).length])),
    levelCounts: combinedLevelCounts,
    sixLevelCoverageGate,
  },
  records: combinedRecords,
};
fs.writeFileSync(path.resolve("src", "content", "text-reference-corpus-ai-reviewed-218.json"), `${JSON.stringify(combined, null, 2)}\n`);
console.log(JSON.stringify({ correction: payload.summary, combined: combined.summary }, null, 2));
