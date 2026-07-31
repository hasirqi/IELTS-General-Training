export const TEXT_REFERENCE_CORPUS_VERSION = "reference-corpus-v0-2026.08.01";
export const REFERENCE_TEXT_STATUSES = Object.freeze([
  "candidate-unreviewed",
  "source-reviewed",
  "label-reviewed",
  "feature-approved",
]);
export const REFERENCE_TEXT_SPLITS = Object.freeze(["train", "validation", "holdout"]);

function stableBucket(id) {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 10;
}

export function referenceTextSplit(id) {
  const bucket = stableBucket(String(id));
  if (bucket < 7) return "train";
  if (bucket < 9) return "validation";
  return "holdout";
}

export function validateReferenceTextRecord(record) {
  const issues = [];
  if (!record?.id) issues.push("missing-id");
  if (!record?.title) issues.push("missing-title");
  if (!record?.source?.name) issues.push("missing-source-name");
  if (!record?.source?.url && !record?.source?.localPath) issues.push("missing-source-location");
  if (!record?.source?.licence) issues.push("missing-licence");
  if (!record?.contentHash) issues.push("missing-content-hash");
  if (!REFERENCE_TEXT_STATUSES.includes(record?.reviewStatus)) issues.push("invalid-review-status");
  if (!REFERENCE_TEXT_SPLITS.includes(record?.split)) issues.push("invalid-split");
  if (!Array.isArray(record?.humanLabels) || record.humanLabels.length < 2) issues.push("insufficient-human-labels");
  if (!record?.internalLevel || !/^L[1-6]$/.test(record.internalLevel)) issues.push("invalid-internal-level");
  const featureEligible = issues.length === 0 && record.reviewStatus === "feature-approved";
  return { valid: issues.length === 0, featureEligible, scoringEligible: false, issues };
}

export function corpusGateSummary(records) {
  const results = records.map(validateReferenceTextRecord);
  const splitCounts = Object.fromEntries(REFERENCE_TEXT_SPLITS.map((split) => [split, records.filter((record) => record.split === split).length]));
  const levelCounts = Object.fromEntries(Array.from({ length: 6 }, (_, index) => `L${index + 1}`).map((level) => [level, records.filter((record) => record.internalLevel === level).length]));
  return {
    total: records.length,
    valid: results.filter((result) => result.valid).length,
    featureEligible: results.filter((result) => result.featureEligible).length,
    scoringEligible: 0,
    splitCounts,
    levelCounts,
    targetReached: records.length >= 600 && results.every((result) => result.featureEligible),
  };
}
