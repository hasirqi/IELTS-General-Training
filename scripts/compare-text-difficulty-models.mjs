import fs from "node:fs";
import corpus from "../src/content/text-reference-corpus-ai-reviewed-218.json" with { type: "json" };
import splitManifest from "../src/content/text-difficulty-model-split-v1.json" with { type: "json" };

const FEATURE_NAMES = [
  "sentence.meanLength",
  "sentence.maximumLength",
  "sentence.lengthCoefficientOfVariation",
  "vocabulary.meanLogFrequencyRank",
  "vocabulary.meanZipfFrequency",
  "vocabulary.familyCoverage",
  "vocabulary.typeTokenRatio",
  "vocabulary.movingAverageTypeTokenRatio",
  "vocabulary.coverage1K2K",
  "vocabulary.coverage6KPlus",
  "wordForm.meanSyllables",
  "wordForm.longWordRate",
  "discourse.connectiveRate",
  "discourse.subordinatorRate",
  "discourse.pronounReferenceRate",
  "discourse.nominalisationRate",
  "discourse.lexicalDensity",
  "semantics.abstractnessProxy",
];
const BASELINE_FEATURES = [0, 3];
const LEVELS = [1, 2, 3, 4, 5, 6];
const assignmentById = new Map(splitManifest.recordAssignments.map((item) => [item.recordId, item.modelSplit]));

function featureVector(record) {
  const f = record.features;
  const coverage6KPlus = Object.entries(f.vocabulary.bandCoverage)
    .filter(([band]) => Number.parseInt(band, 10) >= 6)
    .reduce((sum, [, value]) => sum + value, 0);
  return [
    f.sentence.meanLength,
    f.sentence.maximumLength,
    f.sentence.lengthCoefficientOfVariation,
    f.vocabulary.meanLogFrequencyRank,
    f.vocabulary.meanZipfFrequency,
    f.vocabulary.familyCoverage,
    f.vocabulary.typeTokenRatio,
    f.vocabulary.movingAverageTypeTokenRatio,
    (f.vocabulary.bandCoverage["1K"] ?? 0) + (f.vocabulary.bandCoverage["2K"] ?? 0),
    coverage6KPlus,
    f.wordForm.meanSyllables,
    f.wordForm.longWordRate,
    f.discourse.connectiveRate,
    f.discourse.subordinatorRate,
    f.discourse.pronounReferenceRate,
    f.discourse.nominalisationRate,
    f.discourse.lexicalDensity,
    f.semantics.abstractnessProxy,
  ];
}

const rows = corpus.records.map((record) => ({
  id: record.id,
  split: assignmentById.get(record.id),
  x: featureVector(record),
  y: Number(record.internalLevel.slice(1)),
}));
if (rows.some((row) => !row.split || row.x.some((value) => !Number.isFinite(value)))) throw new Error("Invalid modeling row");

function fitScaler(matrix) {
  const means = matrix[0].map((_, column) => matrix.reduce((sum, row) => sum + row[column], 0) / matrix.length);
  const standardDeviations = means.map((mean, column) => {
    const variance = matrix.reduce((sum, row) => sum + (row[column] - mean) ** 2, 0) / matrix.length;
    return Math.sqrt(variance) || 1;
  });
  return { means, standardDeviations };
}
const scale = (matrix, scaler) => matrix.map((row) => row.map((value, index) => (value - scaler.means[index]) / scaler.standardDeviations[index]));

function solve(matrix, vector) {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < augmented.length; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < augmented.length; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    if (Math.abs(augmented[column][column]) < 1e-10) augmented[column][column] = 1e-10;
    const divisor = augmented[column][column];
    for (let item = column; item <= augmented.length; item += 1) augmented[column][item] /= divisor;
    for (let row = 0; row < augmented.length; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let item = column; item <= augmented.length; item += 1) augmented[row][item] -= factor * augmented[column][item];
    }
  }
  return augmented.map((row) => row.at(-1));
}

function fitRidge(matrix, labels, lambda) {
  const design = matrix.map((row) => [1, ...row]);
  const size = design[0].length;
  const gram = Array.from({ length: size }, () => Array(size).fill(0));
  const rhs = Array(size).fill(0);
  for (let row = 0; row < design.length; row += 1) {
    for (let i = 0; i < size; i += 1) {
      rhs[i] += design[row][i] * labels[row];
      for (let j = 0; j < size; j += 1) gram[i][j] += design[row][i] * design[row][j];
    }
  }
  for (let index = 1; index < size; index += 1) gram[index][index] += lambda;
  const weights = solve(gram, rhs);
  return { predict: (input) => input.map((row) => weights[0] + row.reduce((sum, value, index) => sum + value * weights[index + 1], 0)), weights };
}

const softThreshold = (value, threshold) => Math.sign(value) * Math.max(0, Math.abs(value) - threshold);
function fitElasticNet(matrix, labels, lambda, l1Ratio) {
  const intercept = labels.reduce((sum, value) => sum + value, 0) / labels.length;
  const centered = labels.map((value) => value - intercept);
  const weights = Array(matrix[0].length).fill(0);
  const predictions = Array(labels.length).fill(0);
  for (let iteration = 0; iteration < 1500; iteration += 1) {
    let maximumChange = 0;
    for (let column = 0; column < weights.length; column += 1) {
      let rho = 0;
      let square = 0;
      for (let row = 0; row < matrix.length; row += 1) {
        const partial = centered[row] - predictions[row] + matrix[row][column] * weights[column];
        rho += matrix[row][column] * partial;
        square += matrix[row][column] ** 2;
      }
      rho /= matrix.length;
      square /= matrix.length;
      const next = softThreshold(rho, lambda * l1Ratio) / (square + lambda * (1 - l1Ratio));
      const change = next - weights[column];
      if (change) {
        for (let row = 0; row < matrix.length; row += 1) predictions[row] += matrix[row][column] * change;
      }
      maximumChange = Math.max(maximumChange, Math.abs(change));
      weights[column] = next;
    }
    if (maximumChange < 1e-7) break;
  }
  return { predict: (input) => input.map((row) => intercept + row.reduce((sum, value, index) => sum + value * weights[index], 0)), weights, intercept };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fitTree(matrix, targets, indices, depth, maximumDepth, minimumLeaf, importance) {
  const leafValue = mean(indices.map((index) => targets[index]));
  if (depth >= maximumDepth || indices.length < minimumLeaf * 2) return { leaf: leafValue };
  const parentError = indices.reduce((sum, index) => sum + (targets[index] - leafValue) ** 2, 0);
  let best = null;
  for (let feature = 0; feature < matrix[0].length; feature += 1) {
    const sorted = [...indices].sort((a, b) => matrix[a][feature] - matrix[b][feature]);
    for (let position = minimumLeaf; position <= sorted.length - minimumLeaf; position += 1) {
      if (matrix[sorted[position - 1]][feature] === matrix[sorted[position]][feature]) continue;
      const left = sorted.slice(0, position);
      const right = sorted.slice(position);
      const leftMean = mean(left.map((index) => targets[index]));
      const rightMean = mean(right.map((index) => targets[index]));
      const error = left.reduce((sum, index) => sum + (targets[index] - leftMean) ** 2, 0)
        + right.reduce((sum, index) => sum + (targets[index] - rightMean) ** 2, 0);
      const gain = parentError - error;
      if (!best || gain > best.gain) {
        best = { feature, threshold: (matrix[sorted[position - 1]][feature] + matrix[sorted[position]][feature]) / 2, left, right, gain };
      }
    }
  }
  if (!best || best.gain <= 1e-9) return { leaf: leafValue };
  importance[best.feature] += best.gain;
  return {
    feature: best.feature,
    threshold: best.threshold,
    left: fitTree(matrix, targets, best.left, depth + 1, maximumDepth, minimumLeaf, importance),
    right: fitTree(matrix, targets, best.right, depth + 1, maximumDepth, minimumLeaf, importance),
  };
}

function predictTree(tree, row) {
  if ("leaf" in tree) return tree.leaf;
  return predictTree(row[tree.feature] <= tree.threshold ? tree.left : tree.right, row);
}

function fitGbdt(matrix, labels, config) {
  const base = mean(labels);
  const predictions = Array(labels.length).fill(base);
  const trees = [];
  const importance = Array(matrix[0].length).fill(0);
  for (let iteration = 0; iteration < config.trees; iteration += 1) {
    const residuals = labels.map((value, index) => value - predictions[index]);
    const tree = fitTree(matrix, residuals, matrix.map((_, index) => index), 0, config.maximumDepth, config.minimumLeaf, importance);
    trees.push(tree);
    for (let row = 0; row < matrix.length; row += 1) predictions[row] += config.learningRate * predictTree(tree, matrix[row]);
  }
  return {
    predict: (input) => input.map((row) => base + trees.reduce((sum, tree) => sum + config.learningRate * predictTree(tree, row), 0)),
    importance,
  };
}

function metrics(actual, predicted) {
  const errors = actual.map((value, index) => predicted[index] - value);
  const byLevel = Object.fromEntries(LEVELS.map((level) => {
    const indices = actual.map((value, index) => value === level ? index : -1).filter((index) => index >= 0);
    return [`L${level}`, {
      count: indices.length,
      mae: Number(mean(indices.map((index) => Math.abs(errors[index]))).toFixed(4)),
    }];
  }));
  const rounded = predicted.map((value) => Math.max(1, Math.min(6, Math.round(value))));
  const confusion = Object.fromEntries(LEVELS.map((level) => [`L${level}`, Object.fromEntries(LEVELS.map((predictedLevel) => [`L${predictedLevel}`, actual.filter((value, index) => value === level && rounded[index] === predictedLevel).length]))]));
  return {
    mae: Number(mean(errors.map(Math.abs)).toFixed(4)),
    rmse: Number(Math.sqrt(mean(errors.map((value) => value ** 2))).toFixed(4)),
    macroMae: Number(mean(Object.values(byLevel).map((item) => item.mae)).toFixed(4)),
    withinOneRate: Number((errors.filter((value) => Math.abs(value) <= 1).length / errors.length).toFixed(4)),
    extremeErrorCount: errors.filter((value) => Math.abs(value) >= 2).length,
    maximumAbsoluteError: Number(Math.max(...errors.map(Math.abs)).toFixed(4)),
    byLevel,
    confusion,
  };
}

const subsets = Object.fromEntries(["train", "validation", "holdout"].map((name) => [name, rows.filter((row) => row.split === name)]));
function matrices(records, featureIndices = FEATURE_NAMES.map((_, index) => index)) {
  return {
    x: records.map((row) => featureIndices.map((index) => row.x[index])),
    y: records.map((row) => row.y),
  };
}

function evaluateLinear(featureIndices, lambda) {
  const train = matrices(subsets.train, featureIndices);
  const validation = matrices(subsets.validation, featureIndices);
  const scaler = fitScaler(train.x);
  const model = fitRidge(scale(train.x, scaler), train.y, lambda);
  return {
    train: metrics(train.y, model.predict(scale(train.x, scaler))),
    validation: metrics(validation.y, model.predict(scale(validation.x, scaler))),
    fit: { type: "ridge", featureIndices, lambda },
  };
}

function evaluateElastic(lambda, l1Ratio) {
  const train = matrices(subsets.train);
  const validation = matrices(subsets.validation);
  const scaler = fitScaler(train.x);
  const model = fitElasticNet(scale(train.x, scaler), train.y, lambda, l1Ratio);
  return {
    train: metrics(train.y, model.predict(scale(train.x, scaler))),
    validation: metrics(validation.y, model.predict(scale(validation.x, scaler))),
    fit: { type: "elasticNet", featureIndices: FEATURE_NAMES.map((_, index) => index), lambda, l1Ratio },
  };
}

function evaluateGbdt(config) {
  const train = matrices(subsets.train);
  const validation = matrices(subsets.validation);
  const model = fitGbdt(train.x, train.y, config);
  return {
    train: metrics(train.y, model.predict(train.x)),
    validation: metrics(validation.y, model.predict(validation.x)),
    fit: { type: "gbdt", config },
    featureImportance: Object.fromEntries(FEATURE_NAMES.map((name, index) => [name, model.importance[index]]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => [name, Number(value.toFixed(4))])),
  };
}

const baseline = { name: "transparent-two-feature-linear", complexity: 0, ...evaluateLinear(BASELINE_FEATURES, 1e-8) };
const ridgeCandidates = [0.01, 0.1, 1, 10, 100].map((lambda) => evaluateLinear(FEATURE_NAMES.map((_, index) => index), lambda));
const elasticCandidates = [0.003, 0.01, 0.03, 0.1, 0.3].flatMap((lambda) => [0.25, 0.5, 0.75].map((l1Ratio) => evaluateElastic(lambda, l1Ratio)));
const gbdtCandidates = [30, 60, 100].flatMap((trees) => [0.03, 0.06, 0.1].flatMap((learningRate) => [1, 2].map((maximumDepth) => evaluateGbdt({ trees, learningRate, maximumDepth, minimumLeaf: 6 }))));
const chooseBest = (items) => [...items].sort((a, b) => a.validation.macroMae - b.validation.macroMae || a.validation.mae - b.validation.mae)[0];
const classWinners = [
  baseline,
  { name: "ridge", complexity: 1, ...chooseBest(ridgeCandidates) },
  { name: "elastic-net", complexity: 2, ...chooseBest(elasticCandidates) },
  { name: "lightweight-gbdt", complexity: 3, ...chooseBest(gbdtCandidates) },
];

let selected = classWinners[0];
for (const candidate of classWinners.slice(1)) {
  if (candidate.validation.macroMae <= selected.validation.macroMae - 0.05) selected = candidate;
}

function refitAndHoldout(selection) {
  const development = [...subsets.train, ...subsets.validation];
  const featureIndices = selection.fit.featureIndices ?? FEATURE_NAMES.map((_, index) => index);
  const dev = matrices(development, featureIndices);
  const holdout = matrices(subsets.holdout, featureIndices);
  if (selection.fit.type === "gbdt") {
    const model = fitGbdt(dev.x, dev.y, selection.fit.config);
    return metrics(holdout.y, model.predict(holdout.x));
  }
  const scaler = fitScaler(dev.x);
  const scaledDev = scale(dev.x, scaler);
  const scaledHoldout = scale(holdout.x, scaler);
  if (selection.fit.type === "elasticNet") {
    const model = fitElasticNet(scaledDev, dev.y, selection.fit.lambda, selection.fit.l1Ratio);
    return metrics(holdout.y, model.predict(scaledHoldout));
  }
  const model = fitRidge(scaledDev, dev.y, selection.fit.lambda);
  return metrics(holdout.y, model.predict(scaledHoldout));
}

const summarizedWinners = classWinners.map((item) => ({
  name: item.name,
  fit: item.fit,
  train: item.train,
  validation: item.validation,
  overfitGapMae: Number((item.validation.mae - item.train.mae).toFixed(4)),
  ...(item.featureImportance ? { featureImportance: item.featureImportance } : {}),
}));
const payload = {
  version: "text-difficulty-model-comparison-v1-2026.08.02",
  sourceCorpusVersion: corpus.version,
  splitVersion: splitManifest.version,
  status: "research-only-ai-labels-not-score-eligible",
  scoreEligible: false,
  humanLabelReviewed: corpus.summary.humanLabelReviewed,
  featureSchemaVersion: corpus.records[0].features.schemaVersion,
  target: "independent AI-reviewed ordinal levels L1-L6",
  selectionRule: "Choose on validation macro MAE; move to a more complex class only for at least 0.05 macro-MAE improvement. Holdout is opened once after selection.",
  featureNames: FEATURE_NAMES,
  searchCounts: { baseline: 1, ridge: ridgeCandidates.length, elasticNet: elasticCandidates.length, gbdt: gbdtCandidates.length },
  classWinners: summarizedWinners,
  selectedModel: selected.name,
  holdout: refitAndHoldout(selected),
  publicationGate: {
    sixLevelCoverage: true,
    sourceGroupedSplit: true,
    humanLabelsPresent: corpus.summary.humanLabelReviewed > 0,
    modelValidatedForLearnerScores: false,
    officialLexileClaimAllowed: false,
  },
};
fs.writeFileSync(new URL("../src/content/text-difficulty-model-comparison-v1.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ selectedModel: payload.selectedModel, classWinners: payload.classWinners.map((item) => ({ name: item.name, trainMae: item.train.mae, validationMae: item.validation.mae, validationMacroMae: item.validation.macroMae, overfitGapMae: item.overfitGapMae })), holdout: payload.holdout, publicationGate: payload.publicationGate }, null, 2));
