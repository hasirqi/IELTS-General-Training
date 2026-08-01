import fs from "node:fs";
import path from "node:path";
import corpus from "../src/content/text-reference-corpus-voa-120.json" with { type: "json" };
import manifests from "../src/content/reference-review-packets-v1.json" with { type: "json" };
import { reconcileIndependentAiReviews } from "../src/reference-labeling-workflow.mjs";
import { validateAiReviewedReferenceTextRecord } from "../src/text-reference-corpus.mjs";

const outputIndex = process.argv.indexOf("--output");
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : path.resolve("src", "content", "text-reference-corpus-ai-reviewed-120.json");
const submissionA = JSON.parse(fs.readFileSync(path.resolve("audit", "reference-reviewer-a-submission.json"), "utf8"));
const submissionB = JSON.parse(fs.readFileSync(path.resolve("audit", "reference-reviewer-b-submission.json"), "utf8"));
const adjudications = JSON.parse(fs.readFileSync(path.resolve("audit", "reference-review-ai-adjudication.json"), "utf8"));
const result = reconcileIndependentAiReviews(corpus.records, manifests.packets, [submissionA, submissionB], adjudications);
if (result.summary.unresolvedCount) throw new Error(`Unresolved AI review items: ${result.summary.unresolved.join(", ")}`);
const invalid = result.records.filter((record) => !validateAiReviewedReferenceTextRecord(record).valid);
if (invalid.length) throw new Error(`Invalid AI-reviewed records: ${invalid.map((record) => record.id).join(", ")}`);
const levelCounts = Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
  const level = `L${index + 1}`;
  return [level, result.records.filter((record) => record.internalLevel === level).length];
}));
const payload = {
  version: "reference-corpus-ai-reviewed-v1-2026.08.01",
  sourceCorpusVersion: corpus.version,
  status: "independent-ai-reviewed-awaiting-model-validation",
  labelProvenance: "independent-ai-review-v1",
  reviewerDisclosure: "Two isolated AI reviewers plus a third independent AI adjudicator; not human labels and not official certification.",
  scoreEligible: false,
  summary: { ...result.summary, levelCounts },
  records: result.records,
};
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, ...payload.summary }, null, 2));
