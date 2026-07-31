import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import {
  analyseTextDifficultyV0,
  buildWordFamilyLookup,
  cleanAssessmentText,
  splitAssessmentSentences,
  TEXT_DIFFICULTY_ENGINE_VERSION,
} from "../src/text-difficulty-engine.mjs";
import { corpusGateSummary, referenceTextSplit, validateReferenceTextRecord } from "../src/text-reference-corpus.mjs";

const courseFeatures = JSON.parse(fs.readFileSync(new URL("../src/content/reading-course-features-v0.json", import.meta.url), "utf8"));
const lookup = buildWordFamilyLookup(familyIndex);

test("text cleaning and sentence splitting are deterministic", () => {
  const source = "  Dr. Lee said, “The clinic opens at 9.”\r\nPlease arrive early!  ";
  assert.equal(cleanAssessmentText(source), 'Dr. Lee said, "The clinic opens at 9."\nPlease arrive early!');
  assert.deepEqual(splitAssessmentSentences(source), ['Dr. Lee said, "The clinic opens at 9."', 'Please arrive early!']);
});

test("V0 extracts auditable lexical, sentence, discourse and semantic features without a score", () => {
  const result = analyseTextDifficultyV0("The council reopened the library. Although repairs continue, visitors can use the main reading room today.", lookup);
  assert.equal(result.engineVersion, TEXT_DIFFICULTY_ENGINE_VERSION);
  assert.equal(result.status, "features-only");
  assert.equal(result.counts.sentences, 2);
  assert.ok(result.counts.wordTokens >= 15);
  assert.ok(result.sentence.meanLength > 0);
  assert.ok(result.vocabulary.familyCoverage > 0.8);
  assert.ok(result.discourse.subordinatorRate > 0);
  assert.equal(result.semantics.proxyOnly, true);
  assert.equal(result.audit.scoreEligible, false);
  assert.equal(result.audit.internalLevel, null);
});

test("word-family coverage uses the 20K family members and reports out-of-index types", () => {
  const result = analyseTextDifficultyV0("The visitors were reading notices. Qzxvplm remained unexplained.", lookup);
  assert.ok(result.vocabulary.familyCoverage > 0.5);
  assert.ok(result.vocabulary.outOfIndexTypes.includes("qzxvplm"));
  assert.equal(Object.keys(result.vocabulary.bandCoverage).length, 20);
  assert.equal(lookup.get("forest").headword, "forest");
});

test("reference corpus split is stable and source, licence and double labels are mandatory", () => {
  assert.equal(referenceTextSplit("reference-101"), referenceTextSplit("reference-101"));
  const valid = validateReferenceTextRecord({
    id: "reference-101",
    title: "Library notice",
    source: { name: "Example authority", url: "https://example.test/library", licence: "CC BY 4.0" },
    contentHash: "sha256:example",
    reviewStatus: "feature-approved",
    split: referenceTextSplit("reference-101"),
    humanLabels: [{ reviewer: "A", level: "L2" }, { reviewer: "B", level: "L2" }],
    internalLevel: "L2",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.featureEligible, true);
  assert.equal(valid.scoringEligible, false);
  const invalid = validateReferenceTextRecord({ id: "bad", reviewStatus: "candidate-unreviewed" });
  assert.ok(invalid.issues.includes("missing-licence"));
  assert.ok(invalid.issues.includes("insufficient-human-labels"));
});

test("600-text completion gate cannot be satisfied by draft or singly labelled records", () => {
  const drafts = Array.from({ length: 600 }, (_, index) => ({
    id: `draft-${index}`,
    title: `Draft ${index}`,
    source: { name: "draft", localPath: "draft.txt", licence: "unknown" },
    contentHash: `sha256:${index}`,
    reviewStatus: "candidate-unreviewed",
    split: referenceTextSplit(`draft-${index}`),
    humanLabels: [],
    internalLevel: `L${index % 6 + 1}`,
  }));
  const summary = corpusGateSummary(drafts);
  assert.equal(summary.total, 600);
  assert.equal(summary.featureEligible, 0);
  assert.equal(summary.scoringEligible, 0);
  assert.equal(summary.targetReached, false);
});

test("all 128 existing reading lessons have repeatable feature snapshots and no fabricated level", () => {
  assert.equal(courseFeatures.count, 128);
  assert.equal(courseFeatures.rows.length, 128);
  assert.equal(new Set(courseFeatures.rows.map((row) => row.lessonId)).size, 128);
  assert.equal(courseFeatures.status, "features-only");
  assert.equal(courseFeatures.scoreEligible, false);
  for (const row of courseFeatures.rows) {
    assert.equal(row.features.engineVersion, TEXT_DIFFICULTY_ENGINE_VERSION);
    assert.equal(row.features.audit.scoreEligible, false);
    assert.equal(row.features.audit.internalLevel, null);
    assert.ok(row.features.counts.wordTokens > 0);
  }
});
