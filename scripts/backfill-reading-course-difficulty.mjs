import fs from "node:fs";
import { createServer } from "vite";
import features from "../src/content/reading-course-features-v0.json" with { type: "json" };
import modelComparison from "../src/content/text-difficulty-model-comparison-v1.json" with { type: "json" };
import families from "../src/content/word-family-index-20k.json" with { type: "json" };
import { buildWordFamilyLookup, splitAssessmentSentences, tokenizeAssessmentText } from "../src/text-difficulty-engine.mjs";

const FEATURE_NAMES = modelComparison.featureNames;
const model = modelComparison.finalModel;
if (!model || model.type !== "gbdt") throw new Error("A fitted GBDT artifact is required");

function vector(f) {
  const coverage6KPlus = Object.entries(f.vocabulary.bandCoverage)
    .filter(([band]) => Number.parseInt(band, 10) >= 6)
    .reduce((sum, [, value]) => sum + value, 0);
  return [f.sentence.meanLength, f.sentence.maximumLength, f.sentence.lengthCoefficientOfVariation,
    f.vocabulary.meanLogFrequencyRank, f.vocabulary.meanZipfFrequency, f.vocabulary.familyCoverage,
    f.vocabulary.typeTokenRatio, f.vocabulary.movingAverageTypeTokenRatio,
    (f.vocabulary.bandCoverage["1K"] ?? 0) + (f.vocabulary.bandCoverage["2K"] ?? 0), coverage6KPlus,
    f.wordForm.meanSyllables, f.wordForm.longWordRate, f.discourse.connectiveRate,
    f.discourse.subordinatorRate, f.discourse.pronounReferenceRate, f.discourse.nominalisationRate,
    f.discourse.lexicalDensity, f.semantics.abstractnessProxy];
}

function predictTree(tree, row) {
  if (Object.hasOwn(tree, "leaf")) return tree.leaf;
  return predictTree(row[tree.feature] <= tree.threshold ? tree.left : tree.right, row);
}
function predict(row) {
  return model.base + model.trees.reduce((sum, tree) => sum + model.config.learningRate * predictTree(tree, row), 0);
}
const round = (value, digits = 3) => Number(value.toFixed(digits));
const familyLookup = buildWordFamilyLookup(families);
const COURSE_LEVEL_THRESHOLDS = [2.4, 2.75, 3.3, 3.8, 4.45];
const SECTION_PRIOR = { "Section 1": -0.25, "Section 2": 0, "Section 3": 0.3 };
function vocabularyCoverageAdjustment(coverage1K2K) {
  if (coverage1K2K < 0.65) return 1.25;
  if (coverage1K2K < 0.72) return 0.75;
  if (coverage1K2K < 0.78) return 0.35;
  if (coverage1K2K > 0.9) return -0.15;
  return 0;
}
function calibratedCourseLevel(score) {
  const index = COURSE_LEVEL_THRESHOLDS.findIndex((threshold) => score < threshold);
  return `L${index === -1 ? 6 : index + 1}`;
}

function readingProfile(lesson, row) {
  const f = row.features;
  const score = Math.max(1, Math.min(6, predict(vector(f))));
  const rawModelLevel = `L${Math.round(score)}`;
  const coverage1K2K = (f.vocabulary.bandCoverage["1K"] ?? 0) + (f.vocabulary.bandCoverage["2K"] ?? 0);
  const coverageAdjustment = vocabularyCoverageAdjustment(coverage1K2K);
  let calibratedScore = Math.max(1, Math.min(6, score + (SECTION_PRIOR[lesson.section] ?? 0) + coverageAdjustment));
  if (lesson.section === "Section 1") calibratedScore = Math.min(calibratedScore, 3.79);
  const internalLevel = calibratedCourseLevel(calibratedScore);
  const sentences = splitAssessmentSentences(lesson.text ?? "");
  const sentenceRows = sentences.map((text) => ({ text, words: tokenizeAssessmentText(text).filter((token) => /^[a-z]/.test(token)).length }));
  const longestSentence = sentenceRows.sort((a, b) => b.words - a.words)[0] ?? { text: "", words: 0 };
  const knownFamilies = [...new Map(tokenizeAssessmentText(lesson.text ?? "")
    .map((token) => familyLookup.get(token)).filter(Boolean)
    .filter((family) => !family.properNoun && !family.numberLike && Number.parseInt(family.frequencyBand, 10) >= 3)
    .map((family) => [family.familyId, family])).values()]
    .sort((a, b) => b.frequencyRank - a.frequencyRank).slice(0, 6)
    .map((family) => ({ headword: family.headword, band: family.frequencyBand }));
  const highCoverage = Object.entries(f.vocabulary.bandCoverage).filter(([band]) => Number.parseInt(band, 10) >= 6).reduce((sum, [, value]) => sum + value, 0);
  const obstacles = [];
  if (f.sentence.maximumLength >= 25) obstacles.push({ code: "long-sentence", label: "长句信息较密" });
  if (f.discourse.subordinatorRate >= 0.04) obstacles.push({ code: "nested-clause", label: "从句与条件关系" });
  if (highCoverage >= 0.035) obstacles.push({ code: "low-frequency", label: "低频词较集中" });
  if (f.discourse.nominalisationRate >= 0.025) obstacles.push({ code: "abstract-nouns", label: "抽象名词较多" });
  if (f.discourse.pronounReferenceRate >= 0.055) obstacles.push({ code: "reference", label: "指代链需要回看" });
  if (f.vocabulary.familyCoverage < 0.92) obstacles.push({ code: "coverage-gap", label: "存在索引外词形" });
  if (!obstacles.length) obstacles.push({ code: "detail-tracking", label: "细节定位与同义改写" });
  return {
    lessonId: lesson.id, title: lesson.title, section: lesson.section,
    experimental: true, officialLexile: false, scoreEligible: false,
    predictedScore: round(score), calibratedScore: round(calibratedScore), rawModelLevel, internalLevel,
    coverage: {
      indexedWordFamilies: round(f.vocabulary.familyCoverage),
      highFrequency1K2K: round(coverage1K2K),
      lowerFrequency6KPlus: round(highCoverage),
    },
    longestSentence, keyVocabulary: knownFamilies, obstacles: obstacles.slice(0, 3),
  };
}

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { curriculum } = await vite.ssrLoadModule("/src/content/course-bank.ts");
  const readings = curriculum.filter((lesson) => lesson.skill === "reading");
  const featureById = new Map(features.rows.map((row) => [row.lessonId, row]));
  const records = readings.map((lesson) => readingProfile(lesson, featureById.get(lesson.id)));
  if (records.length !== 128 || records.some((record) => !record.internalLevel)) throw new Error("Reading backfill must contain 128 complete records");
  const distribution = Object.fromEntries([1,2,3,4,5,6].map((level) => [`L${level}`, records.filter((record) => record.internalLevel === `L${level}`).length]));
  const sectionMeans = Object.fromEntries(["Section 1","Section 2","Section 3"].map((section) => {
    const values = records.filter((record) => record.section === section).map((record) => record.predictedScore);
    return [section, round(values.reduce((sum, value) => sum + value, 0) / values.length)];
  }));
  const payload = {
    version: "reading-course-difficulty-v1-2026.08.02", modelVersion: modelComparison.version,
    featureSchemaVersion: features.rows[0].features.schemaVersion,
    status: "experimental-internal-not-official-lexile", scoreEligible: false,
    notices: ["内部实验难度 L1-L6", "不是 MetaMetrics 官方蓝思认证", "不得用于完整模拟 L 值计分"],
    calibration: { type: "fixed-thresholds-with-gt-section-and-coverage-adjustment", thresholds: COURSE_LEVEL_THRESHOLDS, sectionPrior: SECTION_PRIOR, vocabularyCoverageAdjustment: [{ below: 0.65, add: 1.25 }, { below: 0.72, add: 0.75 }, { below: 0.78, add: 0.35 }, { above: 0.9, add: -0.15 }], rationale: "Correct reference-corpus distribution shift and obvious GT section/vocabulary inversions while preserving the raw model score for audit." },
    count: records.length, distribution, sectionMeans, featureNames: FEATURE_NAMES, records,
  };
  fs.writeFileSync(new URL("../src/content/reading-course-difficulty-v1.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ count: payload.count, distribution, sectionMeans }, null, 2));
} finally {
  await vite.close();
}
