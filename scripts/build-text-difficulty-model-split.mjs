import crypto from "node:crypto";
import fs from "node:fs";
import corpus from "../src/content/text-reference-corpus-ai-reviewed-218.json" with { type: "json" };

const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"];
const SPLITS = ["train", "validation", "holdout"];
const RATIOS = { train: 0.7, validation: 0.15, holdout: 0.15 };
const sourceKey = (record) => record.source.ebookId ? `gutenberg:${record.source.ebookId}` : record.source.url;
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

function makeTargets(records) {
  return Object.fromEntries(SPLITS.map((split) => [split, Object.fromEntries(LEVELS.map((level) => {
    const total = records.filter((record) => record.internalLevel === level).length;
    if (split === "train") return [level, Math.round(total * RATIOS.train)];
    if (split === "validation") return [level, Math.round(total * RATIOS.validation)];
    const assigned = Math.round(total * RATIOS.train) + Math.round(total * RATIOS.validation);
    return [level, total - assigned];
  }))]));
}

const recordsBySource = new Map();
for (const record of corpus.records) {
  recordsBySource.set(sourceKey(record), [...(recordsBySource.get(sourceKey(record)) ?? []), record]);
}
const groups = [...recordsBySource].map(([key, records]) => ({
  key,
  recordIds: records.map((record) => record.id),
  counts: Object.fromEntries(LEVELS.map((level) => [level, records.filter((record) => record.internalLevel === level).length])),
  size: records.length,
}));
const targets = makeTargets(corpus.records);

function emptyCounts() {
  return Object.fromEntries(SPLITS.map((split) => [split, Object.fromEntries(LEVELS.map((level) => [level, 0]))]));
}

function objective(counts) {
  let score = 0;
  for (const split of SPLITS) {
    for (const level of LEVELS) {
      const target = targets[split][level];
      const error = counts[split][level] - target;
      score += error * error / Math.max(1, target);
      if (counts[split][level] < 2) score += (2 - counts[split][level]) * 1000;
    }
  }
  return score;
}

function addGroup(counts, split, group, direction = 1) {
  for (const level of LEVELS) counts[split][level] += group.counts[level] * direction;
}

function build(seed) {
  const counts = emptyCounts();
  const assignments = new Map();
  const ordered = [...groups].sort((a, b) => {
    if (b.size !== a.size) return b.size - a.size;
    return digest(`${seed}:${a.key}`).localeCompare(digest(`${seed}:${b.key}`));
  });
  for (const group of ordered) {
    let best = null;
    for (const split of SPLITS) {
      addGroup(counts, split, group);
      const score = objective(counts);
      addGroup(counts, split, group, -1);
      if (!best || score < best.score) best = { split, score };
    }
    assignments.set(group.key, best.split);
    addGroup(counts, best.split, group);
  }
  return { counts, assignments, score: objective(counts) };
}

let best = null;
for (let seed = 0; seed < 128; seed += 1) {
  const candidate = build(seed);
  if (!best || candidate.score < best.score) best = candidate;
}
if (best.score >= 1000) throw new Error(`Unable to create six-level model split: ${best.score}`);

const recordAssignments = corpus.records.map((record) => ({
  recordId: record.id,
  sourceGroup: sourceKey(record),
  originalAuditSplit: record.split,
  modelSplit: best.assignments.get(sourceKey(record)),
  internalLevel: record.internalLevel,
}));
const modelSplitCounts = Object.fromEntries(SPLITS.map((split) => [split, {
  total: recordAssignments.filter((item) => item.modelSplit === split).length,
  levels: Object.fromEntries(LEVELS.map((level) => [level, recordAssignments.filter((item) => item.modelSplit === split && item.internalLevel === level).length])),
}]));
const sourceLeakage = groups.filter((group) => new Set(recordAssignments.filter((item) => item.sourceGroup === group.key).map((item) => item.modelSplit)).size !== 1);
if (sourceLeakage.length) throw new Error(`Source leakage: ${sourceLeakage.map((group) => group.key).join(",")}`);

const payload = {
  version: "text-difficulty-model-split-v1-2026.08.02",
  sourceCorpusVersion: corpus.version,
  status: "evaluation-only-not-score-eligible",
  method: "deterministic-source-grouped-stratified-greedy-128-restarts",
  rationale: "Original audit splits predate final labels and omit levels from validation or holdout. Model splits preserve source isolation and represent all six levels without rewriting audit provenance.",
  scoreEligible: false,
  ratios: RATIOS,
  targets,
  objective: Number(best.score.toFixed(6)),
  sourceGroupCount: groups.length,
  sourceLeakageCount: 0,
  counts: modelSplitCounts,
  recordAssignments,
};
fs.writeFileSync(new URL("../src/content/text-difficulty-model-split-v1.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ objective: payload.objective, counts: payload.counts, sourceGroups: payload.sourceGroupCount }, null, 2));
