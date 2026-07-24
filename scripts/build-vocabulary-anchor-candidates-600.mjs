import fs from "node:fs";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import currentAnchors from "../src/content/vocabulary-anchor-bank-186.json" with { type: "json" };
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import familyMap from "../src/content/teaching-lexicon-family-map.json" with { type: "json" };
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";

const VERSION = "anchor-candidates-600-2026.07.24-v1";
const FINAL_TARGETS = {
  "1K": 60, "2K": 60, "3K": 60, "4K": 60, "5K": 60, "6K": 60, "7K": 60, "8K": 60,
  "9K": 15, "10K": 15, "11K": 15, "12K": 15, "13K": 15, "14K": 15,
  "15K": 5, "16K": 5, "17K": 5, "18K": 5, "19K": 5, "20K": 5,
};

const lexicon = buildLearningLexicon(rawLexicon);
const lexiconById = new Map(lexicon.map((item) => [item.id, item]));
const familyById = new Map(familyIndex.map((family) => [family.familyId, family]));
const mappingByLexiconId = new Map(familyMap.map((mapping) => [mapping.lexiconId, mapping]));
const currentFamilyIds = new Set(currentAnchors.map((anchor) => anchor.familyId));
const currentCounts = currentAnchors.reduce((counts, anchor) => {
  counts[anchor.frequencyBand] = (counts[anchor.frequencyBand] ?? 0) + 1;
  return counts;
}, {});

function bandBounds(band) {
  const index = Number.parseInt(band, 10);
  return { start: (index - 1) * 1000 + 1, end: index * 1000 };
}

function selectStratified(pool, finalTarget, currentBandAnchors) {
  const { start, end } = bandBounds(pool[0].family.frequencyBand);
  const targets = Array.from({ length: finalTarget }, (_, index) =>
    start + ((index + 0.5) * (end - start + 1)) / finalTarget,
  );
  const occupiedSlots = new Set();
  const assignedAnchors = new Set();
  const assignments = currentBandAnchors
    .flatMap((anchor) => targets.map((target, slot) => ({
      anchorId: anchor.id,
      slot,
      distance: Math.abs(anchor.frequencyRank - target),
    })))
    .sort((a, b) => a.distance - b.distance || a.slot - b.slot);

  for (const assignment of assignments) {
    if (assignedAnchors.has(assignment.anchorId) || occupiedSlots.has(assignment.slot)) continue;
    assignedAnchors.add(assignment.anchorId);
    occupiedSlots.add(assignment.slot);
  }

  const usedFamilies = new Set();
  const selected = [];
  for (let slot = 0; slot < targets.length; slot += 1) {
    if (occupiedSlots.has(slot)) continue;
    const candidate = pool
      .filter(({ family }) => !usedFamilies.has(family.familyId))
      .sort((a, b) =>
        Math.abs(a.family.frequencyRank - targets[slot])
        - Math.abs(b.family.frequencyRank - targets[slot])
        || a.family.frequencyRank - b.family.frequencyRank,
      )[0];
    if (!candidate) break;
    usedFamilies.add(candidate.family.familyId);
    selected.push(candidate);
  }
  return selected;
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`, "i").test(text);
}

function candidateFor(mapping) {
  if (mapping.familyIds.length !== 1 || mapping.outcome !== "direct") return null;
  const item = lexiconById.get(mapping.lexiconId);
  const family = familyById.get(mapping.familyIds[0]);
  if (!item || !family || currentFamilyIds.has(family.familyId)) return null;
  const term = item.term.toLowerCase();
  if (!/^[a-z]+(?:[-'][a-z]+)?$/.test(term)) return null;
  if (family.headword !== term || family.properNoun || family.numberLike) return null;
  if (!FINAL_TARGETS[family.frequencyBand]) return null;
  if (!item.meaning || !item.example || !item.collocation) return null;
  if (!containsTerm(item.example, term) || !containsTerm(item.collocation, term)) return null;
  return { item, family };
}

const eligibleByBand = {};
for (const mapping of familyMap) {
  const candidate = candidateFor(mapping);
  if (!candidate) continue;
  (eligibleByBand[candidate.family.frequencyBand] ??= []).push(candidate);
}
for (const entries of Object.values(eligibleByBand)) {
  entries.sort((a, b) =>
    a.family.frequencyRank - b.family.frequencyRank
    || a.item.term.localeCompare(b.item.term),
  );
}

const selected = [];
for (const [band, finalTarget] of Object.entries(FINAL_TARGETS)) {
  const needed = finalTarget - (currentCounts[band] ?? 0);
  if (needed < 0) throw new Error(`${band} already exceeds final target`);
  const pool = eligibleByBand[band] ?? [];
  if (pool.length < needed) {
    throw new Error(`${band} needs ${needed} candidates but only ${pool.length} are eligible`);
  }
  const currentBandAnchors = currentAnchors.filter((anchor) => anchor.frequencyBand === band);
  const stratified = selectStratified(pool, finalTarget, currentBandAnchors);
  if (stratified.length !== needed) {
    throw new Error(`${band} stratified selection produced ${stratified.length}, expected ${needed}`);
  }
  const selectedOffset = selected.length;
  selected.push(...stratified.map(({ item, family }, index) => ({
    candidateId: `candidate-${String(selectedOffset + index + 1).padStart(3, "0")}`,
    plannedAnchorId: `anchor-${String(currentAnchors.length + selectedOffset + index + 1).padStart(3, "0")}`,
    familyId: family.familyId,
    lexiconId: item.id,
    term: item.term,
    focusedMeaning: item.meaning,
    meaningNote: item.meaningNote ?? "",
    contextSentence: item.example,
    collocation: item.collocation,
    frequencyRank: family.frequencyRank,
    frequencyBand: family.frequencyBand,
    source: {
      teachingLexiconId: item.id,
      wordFamilyIndexVersion: family.version,
    },
    reviewStatus: "candidate-unreviewed",
    requiredReview: [
      "part-of-speech",
      "focused-english-definition",
      "three-same-pos-definition-distractors",
      "sense-context-match",
      "option-uniqueness",
      "cross-bank-duplication",
    ],
    version: VERSION,
  })));
}

const additionsByBand = selected.reduce((counts, candidate) => {
  counts[candidate.frequencyBand] = (counts[candidate.frequencyBand] ?? 0) + 1;
  return counts;
}, {});
const finalCounts = Object.fromEntries(Object.keys(FINAL_TARGETS).map((band) => [
  band,
  (currentCounts[band] ?? 0) + (additionsByBand[band] ?? 0),
]));

const manifest = {
  version: VERSION,
  generatedAt: "2026-07-24",
  scoringEligible: false,
  currentReviewedCount: currentAnchors.length,
  candidateCount: selected.length,
  plannedReviewedTotal: currentAnchors.length + selected.length,
  finalTargets: FINAL_TARGETS,
  currentCounts,
  additionsByBand,
  finalCounts,
  gate: "Every candidate remains excluded from scoring until all requiredReview checks pass and reviewStatus becomes item-authored.",
  candidates: selected,
};

fs.writeFileSync(
  new URL("../src/content/vocabulary-anchor-candidates-600.json", import.meta.url),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Wrote ${selected.length} candidates for a final ${manifest.plannedReviewedTotal}-anchor bank`);
