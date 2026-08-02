import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import report from "../src/content/text-difficulty-model-comparison-v1.json" with { type: "json" };

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(resolved);
    return /\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name) ? [resolved] : [];
  });
}

test("model comparison uses four distinct model classes and fixed searches", () => {
  assert.deepEqual(report.classWinners.map((item) => item.name), [
    "transparent-two-feature-linear",
    "ridge",
    "elastic-net",
    "lightweight-gbdt",
  ]);
  assert.deepEqual(report.searchCounts, { baseline: 1, ridge: 5, elasticNet: 15, gbdt: 18 });
  assert.equal(report.featureNames.length, 18);
  assert.equal(report.selectedModel, "lightweight-gbdt");
});

test("selection is validation-only and the selected model improves materially", () => {
  const baseline = report.classWinners[0];
  const ridge = report.classWinners[1];
  const selected = report.classWinners.find((item) => item.name === report.selectedModel);
  assert.ok(ridge.validation.macroMae <= baseline.validation.macroMae - 0.05);
  assert.ok(selected.validation.macroMae <= ridge.validation.macroMae - 0.05);
  assert.ok(Number.isFinite(selected.overfitGapMae));
  assert.match(report.selectionRule, /validation macro MAE/);
  assert.match(report.selectionRule, /Holdout is opened once/);
});

test("holdout covers six levels without extreme errors but remains research-only", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(report.holdout.byLevel).map(([level, item]) => [level, item.count])), {
    L1: 5, L2: 7, L3: 6, L4: 5, L5: 3, L6: 7,
  });
  assert.ok(report.holdout.mae < 0.5);
  assert.ok(report.holdout.macroMae < 0.5);
  assert.ok(report.holdout.withinOneRate >= 0.85);
  assert.equal(report.holdout.extremeErrorCount, 0);
  assert.equal(report.scoreEligible, false);
  assert.equal(report.humanLabelReviewed, 0);
  assert.deepEqual(report.publicationGate, {
    sixLevelCoverage: true,
    sourceGroupedSplit: true,
    humanLabelsPresent: false,
    modelValidatedForLearnerScores: false,
    officialLexileClaimAllowed: false,
  });
});

test("research model report is not imported by learner-facing runtime", () => {
  const needle = "text-difficulty-model-comparison-v1";
  const imports = sourceFiles("src")
    .filter((file) => fs.readFileSync(file, "utf8").includes(needle));
  assert.deepEqual(imports, []);
});
