import fs from "node:fs";
import reviewed150 from "../src/content/vocabulary-anchor-bank-150.json" with { type: "json" };
import candidateManifest from "../src/content/vocabulary-anchor-candidates-600.json" with { type: "json" };
import { vocabularyAnchorReview1K } from "../src/content/vocabulary-anchor-review-1k.mjs";

const VERSION = "anchors-186-2026.07.24-v1";
const candidates = candidateManifest.candidates.filter((candidate) => candidate.frequencyBand === "1K");

if (candidates.length !== 36) throw new Error(`Expected 36 reviewed 1K candidates, received ${candidates.length}`);
if (Object.keys(vocabularyAnchorReview1K).length !== 36) throw new Error("The 1K review map must contain 36 entries");

const drafts = candidates.map((candidate) => {
  const authored = vocabularyAnchorReview1K[candidate.term.toLowerCase()];
  if (!authored) throw new Error(`Missing authored review for ${candidate.term}`);
  return { ...candidate, ...authored };
});

function optionSet(target, index, valueFor, customValues = []) {
  const pool = [
    ...reviewed150.map((anchor) => ({
      partOfSpeech: anchor.partOfSpeech,
      englishDefinition: anchor.englishDefinition,
      focusedMeaning: anchor.focusedMeaning,
      id: anchor.id,
    })),
    ...drafts,
  ].filter((entry) => entry.partOfSpeech === target.partOfSpeech && entry.term !== target.term && entry.id !== target.id);
  const correct = valueFor(target);
  const values = [...customValues, ...pool.map(valueFor)].filter((value, valueIndex, all) =>
    value && value !== correct && all.indexOf(value) === valueIndex,
  );
  if (values.length < 3) throw new Error(`${target.term} lacks three same-POS distractors`);
  const offset = (target.frequencyRank + index * 17) % values.length;
  const distractors = Array.from({ length: 3 }, (_, distractorIndex) =>
    values[(offset + distractorIndex * 7) % values.length],
  );
  if (new Set(distractors).size !== 3) throw new Error(`${target.term} generated duplicate distractors`);
  const options = [correct, ...distractors];
  const rotation = index % 4;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

const reviewed1K = drafts.map((draft, index) => ({
  id: draft.plannedAnchorId,
  familyId: draft.familyId,
  lexiconId: draft.lexiconId,
  term: draft.term,
  partOfSpeech: draft.partOfSpeech,
  focusedMeaning: draft.focusedMeaning,
  meaningNote: draft.meaningNote,
  example: draft.contextSentence,
  contextSentence: draft.contextSentence,
  collocation: draft.collocation,
  englishDefinition: draft.englishDefinition,
  definitionOptions: optionSet(
    draft,
    index,
    (entry) => entry.englishDefinition,
    draft.decoyDefinitions,
  ),
  correctDefinition: draft.englishDefinition,
  chineseOptions: optionSet(
    draft,
    index,
    (entry) => entry.focusedMeaning,
    draft.decoyMeanings,
  ),
  correctChinese: draft.focusedMeaning,
  frequencyRank: draft.frequencyRank,
  frequencyBand: draft.frequencyBand,
  difficulty: Number((-2.55 + ((draft.frequencyRank - 1) / 7_999) * 4.35).toFixed(3)),
  discrimination: 1,
  guessing: 0.25,
  reviewStatus: "item-authored",
  review: {
    reviewedAt: "2026-07-24",
    basis: "manual 1K POS and sense-focused English definition review over verified teaching context",
    checks: [
      "family",
      "frequency-band",
      "part-of-speech",
      "focused-meaning",
      "english-definition",
      "same-pos-distractors",
      "unique-definition-options",
      "unique-chinese-options",
      "sense-context-match",
      "context",
    ],
  },
  source: draft.source,
  version: VERSION,
}));

const anchors = [...reviewed150, ...reviewed1K];
if (new Set(anchors.map((anchor) => anchor.id)).size !== anchors.length) throw new Error("Duplicate anchor id");
if (new Set(anchors.map((anchor) => anchor.familyId)).size !== anchors.length) throw new Error("Duplicate anchor family");

fs.writeFileSync(
  new URL("../src/content/vocabulary-anchor-bank-186.json", import.meta.url),
  `${JSON.stringify(anchors, null, 2)}\n`,
);
console.log(`Wrote ${anchors.length} reviewed anchors (${VERSION})`);
