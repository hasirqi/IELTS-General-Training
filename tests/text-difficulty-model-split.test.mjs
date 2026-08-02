import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import corpus from "../src/content/text-reference-corpus-ai-reviewed-218.json" with { type: "json" };
import split from "../src/content/text-difficulty-model-split-v1.json" with { type: "json" };

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(resolved);
    return /\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name) ? [resolved] : [];
  });
}

test("model split assigns all 218 reviewed texts exactly once", () => {
  assert.equal(split.recordAssignments.length, 218);
  assert.equal(new Set(split.recordAssignments.map((item) => item.recordId)).size, 218);
  assert.deepEqual(
    [...split.recordAssignments.map((item) => item.recordId)].sort(),
    [...corpus.records.map((record) => record.id)].sort(),
  );
  assert.equal(split.scoreEligible, false);
});

test("model split represents every level while matching fixed targets", () => {
  assert.deepEqual(split.counts, {
    train: { total: 152, levels: { L1: 20, L2: 35, L3: 28, L4: 24, L5: 14, L6: 31 } },
    validation: { total: 33, levels: { L1: 4, L2: 8, L3: 6, L4: 5, L5: 3, L6: 7 } },
    holdout: { total: 33, levels: { L1: 5, L2: 7, L3: 6, L4: 5, L5: 3, L6: 7 } },
  });
  for (const modelSplit of Object.values(split.counts)) {
    assert.ok(Object.values(modelSplit.levels).every((count) => count >= 3));
  }
  assert.equal(split.objective, 0);
});

test("source groups never cross model splits and audit provenance is preserved", () => {
  const sourceSplits = new Map();
  const recordsById = new Map(corpus.records.map((record) => [record.id, record]));
  for (const item of split.recordAssignments) {
    sourceSplits.set(item.sourceGroup, new Set([...(sourceSplits.get(item.sourceGroup) ?? []), item.modelSplit]));
    assert.equal(item.originalAuditSplit, recordsById.get(item.recordId).split, item.recordId);
  }
  assert.ok([...sourceSplits.values()].every((values) => values.size === 1));
  assert.equal(split.sourceLeakageCount, 0);
  assert.equal(sourceSplits.size, 188);
});

test("evaluation split is not imported by learner-facing runtime", () => {
  const needle = "text-difficulty-model-split-v1";
  const imports = sourceFiles("src")
    .filter((file) => fs.readFileSync(file, "utf8").includes(needle));
  assert.deepEqual(imports, []);
});
