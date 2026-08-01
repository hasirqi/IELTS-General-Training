import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import corpus from "../src/content/text-reference-corpus-voa-120.json" with { type: "json" };
import { assignReferenceTextSplits, corpusGateSummary } from "../src/text-reference-corpus.mjs";
import { TEXT_DIFFICULTY_ENGINE_VERSION } from "../src/text-difficulty-engine.mjs";

const THIRD_PARTY_PATTERN = /\b(Associated Press|AP Photo|Reuters|Agence France-Presse|AFP|adapted (?:this|the) .* story)\b/i;
const wordCount = (text) => text.trim().split(/\s+/).length;

test("VOA seed contains 120 unique public-domain source candidates", () => {
  assert.equal(corpus.counts.total, 120);
  assert.equal(corpus.records.length, 120);
  assert.equal(corpus.counts.level1Course, 48);
  assert.equal(corpus.counts.level2Course, 30);
  assert.equal(corpus.counts.advancedGrammar, 42);
  assert.equal(new Set(corpus.records.map((record) => record.source.url)).size, 120);
  assert.equal(new Set(corpus.records.map((record) => record.contentHash)).size, 120);
  assert.match(corpus.sourceRegister.licenceUrl, /^https:\/\/learningenglish\.voanews\.com\//);
  assert.match(corpus.sourceRegister.termsUrl, /^https:\/\/learningenglish\.voanews\.com\//);
});

test("every stored text matches its hash and passes basic extraction gates", () => {
  for (const record of corpus.records) {
    const hash = `sha256:${crypto.createHash("sha256").update(record.text).digest("hex")}`;
    assert.equal(record.contentHash, hash, record.id);
    assert.ok(wordCount(record.text) >= 35, record.id);
    assert.ok(wordCount(record.text) <= 520, record.id);
    assert.ok(!THIRD_PARTY_PATTERN.test(record.text), record.id);
    assert.equal(record.source.name, "VOA Learning English");
    assert.match(record.source.url, /^https:\/\/learningenglish\.voanews\.com\/a\//);
    assert.equal(record.features.engineVersion, TEXT_DIFFICULTY_ENGINE_VERSION);
  }
});

test("provisional review queue is balanced across six levels", () => {
  for (let level = 1; level <= 6; level += 1) {
    assert.equal(corpus.records.filter((record) => record.provisionalInternalLevel === `L${level}`).length, 20);
  }
  assert.equal(corpus.counts.provisionalLabelMethod, "official-source-level-and-course-sequence-then-v0-features-balanced-20-per-level");
});

test("fixed split assignment is deterministic and exactly 70/20/10 for 120 records", () => {
  const reassigned = assignReferenceTextSplits(corpus.records.map((record) => ({ ...record, split: "holdout" })));
  assert.deepEqual(reassigned.map(({ id, split }) => ({ id, split })), corpus.records.map(({ id, split }) => ({ id, split })));
  assert.equal(corpus.records.filter((record) => record.split === "train").length, 84);
  assert.equal(corpus.records.filter((record) => record.split === "validation").length, 24);
  assert.equal(corpus.records.filter((record) => record.split === "holdout").length, 12);
});

test("source-reviewed candidates cannot enter calibration before two independent human labels", () => {
  const summary = corpusGateSummary(corpus.records);
  assert.equal(corpus.status, "source-reviewed-awaiting-two-independent-human-labels");
  assert.equal(corpus.scoreEligible, false);
  assert.equal(corpus.counts.independentlyHumanLabelled, 0);
  assert.equal(summary.total, 120);
  assert.equal(summary.featureEligible, 0);
  assert.equal(summary.scoringEligible, 0);
  assert.equal(summary.targetReached, false);
  for (const record of corpus.records) {
    assert.deepEqual(record.humanLabels, []);
    assert.equal(record.internalLevel, null);
    assert.equal(record.scoreEligible, false);
  }
});
