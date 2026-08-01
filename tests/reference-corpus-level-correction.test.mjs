import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import candidates from "../src/content/text-reference-corpus-level-correction-candidates.json" with { type: "json" };
import reviewed from "../src/content/text-reference-corpus-ai-reviewed-120.json" with { type: "json" };
import { TEXT_DIFFICULTY_ENGINE_VERSION } from "../src/text-difficulty-engine.mjs";

const BOILERPLATE = /Project Gutenberg|START OF (?:THE|THIS) PROJECT|END OF (?:THE|THIS) PROJECT|www\.gutenberg|Literary Archive Foundation|Travel requirements to enter the United States|&[a-z]+;|\.{6,}|@/i;
const wordCount = (text) => (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;

function sourceLocator(record) {
  return `${record.source.url}#${record.source.locator ?? "full-text"}`;
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(resolved);
    return /\.(?:js|jsx|mjs|ts|tsx)$/.test(entry.name) ? [resolved] : [];
  });
}

test("level-correction batch contains 70 source-reviewed L1, L5 and L6 candidates", () => {
  assert.equal(candidates.records.length, 70);
  assert.deepEqual(candidates.counts, {
    total: 70,
    targetL1: 20,
    targetL5: 20,
    targetL6: 30,
    independentlyAiReviewed: 0,
    scoringEligible: 0,
  });
  assert.equal(candidates.records.filter((record) => record.provisionalInternalLevel === "L1").length, 20);
  assert.equal(candidates.records.filter((record) => record.provisionalInternalLevel === "L5").length, 20);
  assert.equal(candidates.records.filter((record) => record.provisionalInternalLevel === "L6").length, 30);
});

test("candidate text, source locator and hashes are unique and clean", () => {
  const priorHashes = new Set(reviewed.records.map((record) => record.contentHash));
  assert.equal(new Set(candidates.records.map((record) => record.contentHash)).size, 70);
  assert.equal(new Set(candidates.records.map(sourceLocator)).size, 70);
  for (const record of candidates.records) {
    assert.equal(record.contentHash, `sha256:${crypto.createHash("sha256").update(record.text).digest("hex")}`, record.id);
    assert.equal(priorHashes.has(record.contentHash), false, record.id);
    assert.ok(wordCount(record.text) >= 100, record.id);
    assert.ok(wordCount(record.text) <= 560, record.id);
    assert.equal(BOILERPLATE.test(record.text), false, record.id);
    assert.match(record.source.url, /^https:\/\//, record.id);
    assert.match(record.source.licenceUrl, /^https:\/\//, record.id);
    assert.equal(record.features.engineVersion, TEXT_DIFFICULTY_ENGINE_VERSION, record.id);
    assert.equal(record.features.audit.insufficientText, false, record.id);
  }
});

test("fixed 70/20/10 split and content gates remain closed", () => {
  assert.equal(candidates.records.filter((record) => record.split === "train").length, 49);
  assert.equal(candidates.records.filter((record) => record.split === "validation").length, 14);
  assert.equal(candidates.records.filter((record) => record.split === "holdout").length, 7);
  assert.equal(candidates.scoreEligible, false);
  for (const record of candidates.records) {
    assert.equal(record.reviewStatus, "source-reviewed");
    assert.deepEqual(record.humanLabels, []);
    assert.deepEqual(record.aiLabels, []);
    assert.equal(record.internalLevel, null);
    assert.equal(record.scoreEligible, false);
  }
});

test("unreviewed correction candidates are not imported by runtime source", () => {
  const needle = "text-reference-corpus-level-correction-candidates";
  const imports = sourceFiles("src")
    .filter((file) => !file.endsWith("text-reference-corpus-level-correction-candidates.json"))
    .filter((file) => fs.readFileSync(file, "utf8").includes(needle));
  assert.deepEqual(imports, []);
});
