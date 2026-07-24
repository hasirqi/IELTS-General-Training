import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-candidates-600.json", import.meta.url),
    "utf8",
  ),
);
const reviewed = JSON.parse(
  fs.readFileSync(
    new URL("../src/content/vocabulary-anchor-bank-150.json", import.meta.url),
    "utf8",
  ),
);

const expectedFinalCounts = {
  "1K": 60, "2K": 60, "3K": 60, "4K": 60, "5K": 60, "6K": 60, "7K": 60, "8K": 60,
  "9K": 15, "10K": 15, "11K": 15, "12K": 15, "13K": 15, "14K": 15,
  "15K": 5, "16K": 5, "17K": 5, "18K": 5, "19K": 5, "20K": 5,
};

test("600-anchor expansion manifest has the exact planned distribution", () => {
  assert.equal(reviewed.length, 150);
  assert.equal(manifest.candidateCount, 450);
  assert.equal(manifest.plannedReviewedTotal, 600);
  assert.deepEqual(manifest.finalCounts, expectedFinalCounts);
  assert.equal(
    Object.values(manifest.finalCounts).reduce((sum, count) => sum + count, 0),
    600,
  );
});

test("candidate layer is explicitly excluded from scoring", () => {
  assert.equal(manifest.scoringEligible, false);
  for (const candidate of manifest.candidates) {
    assert.equal(candidate.reviewStatus, "candidate-unreviewed");
    assert.ok(candidate.requiredReview.includes("focused-english-definition"));
    assert.ok(candidate.requiredReview.includes("three-same-pos-definition-distractors"));
    assert.ok(candidate.requiredReview.includes("option-uniqueness"));
  }
});

test("candidate identities and source mappings are unique", () => {
  for (const key of ["candidateId", "plannedAnchorId", "familyId", "lexiconId", "term"]) {
    const values = manifest.candidates.map((candidate) => candidate[key].toLowerCase());
    assert.equal(new Set(values).size, values.length, `${key} contains duplicates`);
  }

  const reviewedFamilies = new Set(reviewed.map((anchor) => anchor.familyId));
  const reviewedTerms = new Set(reviewed.map((anchor) => anchor.term.toLowerCase()));
  for (const candidate of manifest.candidates) {
    assert.ok(!reviewedFamilies.has(candidate.familyId));
    assert.ok(!reviewedTerms.has(candidate.term.toLowerCase()));
    assert.equal(candidate.source.teachingLexiconId, candidate.lexiconId);
  }
});

test("every candidate carries auditable teaching context without placeholder text", () => {
  const placeholderPattern = /\b(?:todo|tbd|placeholder|sample text|lorem ipsum)\b/i;
  for (const candidate of manifest.candidates) {
    const termPattern = new RegExp(
      `\\b${candidate.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es|ed|ing)?\\b`,
      "i",
    );
    assert.ok(candidate.focusedMeaning.trim().length >= 1);
    assert.ok(candidate.contextSentence.split(/\s+/).length >= 5);
    assert.match(candidate.contextSentence, /[.!?]$/);
    assert.match(candidate.contextSentence, termPattern);
    assert.match(candidate.collocation, termPattern);
    assert.doesNotMatch(
      `${candidate.focusedMeaning} ${candidate.contextSentence} ${candidate.collocation}`,
      placeholderPattern,
    );
  }
});

test("unreviewed candidate data is not imported by the runtime CAT", () => {
  const runtimeFiles = [
    "../src/AppProduct.tsx",
    "../src/vocabulary-cat-engine.mjs",
  ];
  for (const relativePath of runtimeFiles) {
    const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(source, /vocabulary-anchor-candidates-600/);
  }
});

test("final anchors cover each frequency band instead of clustering at its start", () => {
  const combined = [...reviewed, ...manifest.candidates];
  for (let index = 1; index <= 20; index += 1) {
    const band = `${index}K`;
    const lowerBoundary = (index - 1) * 1000;
    const upperBoundary = index * 1000 + 1;
    const ranks = combined
      .filter((anchor) => anchor.frequencyBand === band)
      .map((anchor) => anchor.frequencyRank)
      .sort((a, b) => a - b);
    const bounded = [lowerBoundary, ...ranks, upperBoundary];
    const maximumGap = Math.max(
      ...bounded.slice(1).map((rank, rankIndex) => rank - bounded[rankIndex]),
    );
    const allowedGap = index <= 8 ? 80 : index <= 14 ? 100 : 250;
    assert.ok(maximumGap <= allowedGap, `${band} maximum gap is ${maximumGap}`);
  }
});