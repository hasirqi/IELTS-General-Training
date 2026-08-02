import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import candidates from "../src/content/text-reference-corpus-level-correction-round2-candidates.json" with { type: "json" };
import reviewed from "../src/content/text-reference-corpus-ai-reviewed-190.json" with { type: "json" };
import { TEXT_DIFFICULTY_ENGINE_VERSION, splitAssessmentSentences } from "../src/text-difficulty-engine.mjs";

const BOILERPLATE = /Project Gutenberg|START OF|END OF|Transcriber|Produced by|Online Distributed Proofreading|https?:\/\/|www\.|\.{5,}|@/i;
const wordCount = (text) => (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;
const sourceLocator = (record) => `${record.source.url}#${record.source.locator}`;

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(resolved);
    return /\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name) ? [resolved] : [];
  });
}

test("round two contains exactly 20 L1 and 8 L5 source-reviewed candidates", () => {
  assert.equal(candidates.records.length, 28);
  assert.deepEqual(candidates.counts, {
    total: 28,
    targetL1: 20,
    targetL5: 8,
    independentlyAiReviewed: 0,
    scoringEligible: 0,
  });
  assert.equal(candidates.records.filter((record) => record.provisionalInternalLevel === "L1").length, 20);
  assert.equal(candidates.records.filter((record) => record.provisionalInternalLevel === "L5").length, 8);
});

test("round two text, source locator and hashes are unique, clean and non-overlapping", () => {
  const priorHashes = new Set(reviewed.records.map((record) => record.contentHash));
  assert.equal(new Set(candidates.records.map((record) => record.contentHash)).size, 28);
  assert.equal(new Set(candidates.records.map(sourceLocator)).size, 28);
  for (const record of candidates.records) {
    assert.equal(record.contentHash, `sha256:${crypto.createHash("sha256").update(record.text).digest("hex")}`, record.id);
    assert.equal(priorHashes.has(record.contentHash), false, record.id);
    assert.ok(wordCount(record.text) >= 70, record.id);
    assert.ok(wordCount(record.text) <= 460, record.id);
    assert.equal(BOILERPLATE.test(record.text), false, record.id);
    assert.match(record.source.url, /^https:\/\//, record.id);
    assert.match(record.source.licenceUrl, /^https:\/\//, record.id);
    assert.equal(record.features.engineVersion, TEXT_DIFFICULTY_ENGINE_VERSION, record.id);
    assert.equal(record.features.audit.insufficientText, false, record.id);
  }
});

test("L1 candidates are continuous passages rather than question lists", () => {
  for (const record of candidates.records.filter((item) => item.provisionalInternalLevel === "L1")) {
    const sentences = Math.max(1, splitAssessmentSentences(record.text).length);
    const questionRate = (record.text.match(/\?/g) ?? []).length / sentences;
    assert.ok(questionRate <= 0.3, `${record.id}: ${questionRate}`);
  }
});

test("round two has a fixed split and every scoring gate remains closed", () => {
  assert.equal(candidates.records.filter((record) => record.split === "train").length, 19);
  assert.equal(candidates.records.filter((record) => record.split === "validation").length, 5);
  assert.equal(candidates.records.filter((record) => record.split === "holdout").length, 4);
  assert.equal(candidates.scoreEligible, false);
  for (const record of candidates.records) {
    assert.equal(record.reviewStatus, "source-reviewed");
    assert.deepEqual(record.humanLabels, []);
    assert.deepEqual(record.aiLabels, []);
    assert.equal(record.internalLevel, null);
    assert.equal(record.scoreEligible, false);
  }
});

test("unreviewed round two candidates are not imported by runtime source", () => {
  const needle = "text-reference-corpus-level-correction-round2-candidates";
  const imports = sourceFiles("src")
    .filter((file) => !file.endsWith("text-reference-corpus-level-correction-round2-candidates.json"))
    .filter((file) => fs.readFileSync(file, "utf8").includes(needle));
  assert.deepEqual(imports, []);
});
