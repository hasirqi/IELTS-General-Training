import fs from "node:fs";
import rawLexicon from "../src/content/lexicon.json" with { type: "json" };
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import familyMap from "../src/content/teaching-lexicon-family-map.json" with { type: "json" };
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";
import { vocabularyAnchorDefinitions } from "../src/content/vocabulary-anchor-definitions.mjs";

const VERSION = "anchors-150-2026.07.24-v2";
const selections = {
  "1K": [
    ["available", "adjective"], ["local", "adjective"], ["provide", "verb"], ["instead", "adverb"],
    ["government", "noun"], ["school", "noun"], ["system", "noun"], ["child", "noun"],
    ["put", "verb"], ["mean", "verb"], ["become", "verb"], ["call", "verb"],
    ["generally", "adverb"], ["leave", "verb"], ["feel", "verb"], ["mainly", "adverb"],
    ["keep", "verb"], ["result", "noun"], ["service", "noun"], ["include", "verb"],
    ["information", "noun"], ["community", "noun"], ["public", "adjective"], ["experience", "noun"],
  ],
  "2K": [
    ["require", "verb"], ["notice", "verb"], ["improve", "verb"], ["carry", "verb"],
    ["authority", "noun"], ["centre", "noun"], ["subject", "noun"], ["teacher", "noun"],
    ["foot", "noun"], ["condition", "noun"], ["activity", "noun"], ["product", "noun"],
    ["letter", "noun"], ["pull", "verb"], ["material", "noun"], ["manager", "noun"],
    ["window", "noun"], ["wear", "verb"], ["apply", "verb"], ["claim", "verb"],
    ["rule", "noun"], ["image", "noun"], ["method", "noun"], ["doctor", "noun"],
  ],
  "3K": [
    ["appointment", "noun"], ["confirm", "verb"], ["delay", "verb"], ["rent", "noun"],
    ["parent", "noun"], ["detail", "noun"], ["establish", "verb"], ["scheme", "noun"],
    ["achieve", "verb"], ["occur", "verb"], ["represent", "verb"], ["argue", "verb"],
    ["pattern", "noun"], ["decade", "noun"], ["affect", "verb"], ["identify", "verb"],
    ["resource", "noun"], ["compare", "verb"], ["prepare", "verb"], ["defence", "noun"],
    ["skill", "noun"], ["assume", "verb"], ["procedure", "noun"], ["expert", "noun"],
  ],
  "4K": [
    ["involve", "verb"], ["difficulty", "noun"], ["extend", "verb"], ["contribution", "noun"],
    ["deny", "verb"], ["settle", "verb"], ["employer", "noun"], ["objective", "noun"],
    ["nevertheless", "adverb"], ["demonstrate", "verb"], ["engage", "verb"], ["commit", "verb"],
    ["regulation", "noun"], ["exhibition", "noun"], ["discipline", "noun"], ["remind", "verb"],
    ["photograph", "noun"], ["pension", "noun"], ["unemployment", "noun"], ["asset", "noun"],
    ["vary", "verb"], ["examination", "noun"], ["substantial", "adjective"], ["expand", "verb"],
  ],
  "5K": [
    ["provision", "noun"], ["adopt", "verb"], ["consequence", "noun"], ["proportion", "noun"],
    ["observe", "verb"], ["concentrate", "verb"], ["acquire", "verb"], ["combine", "verb"],
    ["retain", "verb"], ["classroom", "noun"], ["assess", "verb"], ["declare", "verb"],
    ["instruction", "noun"], ["athlete", "noun"], ["acknowledge", "verb"], ["approve", "verb"],
    ["assure", "verb"], ["cancel", "verb"], ["classification", "noun"], ["convenient", "adjective"],
    ["duration", "noun"], ["forecast", "noun"], ["install", "verb"], ["inventory", "noun"],
  ],
  "6K": [
    ["refund", "noun"], ["arise", "verb"], ["propose", "verb"], ["consist", "verb"],
    ["offence", "noun"], ["arrange", "verb"], ["comply", "verb"], ["evaluate", "verb"],
    ["explicit", "adjective"], ["facilitate", "verb"],
  ],
  "7K": [
    ["emerge", "verb"], ["impose", "verb"], ["module", "noun"], ["optional", "adjective"],
    ["verify", "verb"], ["logistics", "noun"], ["allowance", "noun"], ["coupon", "noun"],
    ["fulfill", "verb"], ["fatigue", "noun"],
  ],
  "8K": [
    ["pupil", "noun"], ["undertake", "verb"], ["expenditure", "noun"], ["notify", "verb"],
    ["warranty", "noun"], ["vacant", "adjective"], ["vendor", "noun"], ["bulletin", "noun"],
    ["dispatch", "verb"], ["exempt", "adjective"],
  ],
};

const meaningOverrides = {
  public: "公共的；公开的",
  rent: "租金；租赁费用",
  expert: "专家；行家",
  objective: "目标；目的",
  photograph: "照片；相片",
};

const lexicon = buildLearningLexicon(rawLexicon);
const lexiconByTerm = new Map(lexicon.map((item) => [item.term.toLowerCase(), item]));
const mappingById = new Map(familyMap.map((item) => [item.lexiconId, item]));
const familyById = new Map(familyIndex.map((item) => [item.familyId, item]));

const drafts = Object.entries(selections).flatMap(([band, entries]) => entries.map(([term, partOfSpeech]) => {
  const item = lexiconByTerm.get(term);
  if (!item) throw new Error(`Missing reviewed lexicon item: ${term}`);
  const mapping = mappingById.get(item.id);
  if (!mapping || mapping.familyIds.length !== 1) throw new Error(`Ambiguous family mapping: ${term}`);
  const family = familyById.get(mapping.familyIds[0]);
  if (family.frequencyBand !== band) throw new Error(`${term} expected ${band}, received ${family.frequencyBand}`);
  return { item, family, band, partOfSpeech, focusedMeaning: meaningOverrides[term] ?? item.meaning };
}));

function optionSet(target, index, valueFor) {
  const pool = drafts.filter((entry) =>
    entry.partOfSpeech === target.partOfSpeech
    && entry.item.id !== target.item.id
  );
  const distractors = [];
  let cursor = (index * 17 + target.family.frequencyRank) % pool.length;
  while (distractors.length < 3) {
    const value = valueFor(pool[cursor % pool.length]);
    const correct = valueFor(target);
    if (value !== correct && !distractors.includes(value)) distractors.push(value);
    cursor += 19;
  }
  const options = [valueFor(target), ...distractors];
  const rotation = index % 4;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

const anchors = drafts.map((entry, index) => {
  const englishDefinition = vocabularyAnchorDefinitions[entry.item.term.toLowerCase()];
  if (!englishDefinition) throw new Error(`Missing authored English definition: ${entry.item.term}`);
  return ({
  id: `anchor-${String(index + 1).padStart(3, "0")}`,
  familyId: entry.family.familyId,
  lexiconId: entry.item.id,
  term: entry.item.term,
  partOfSpeech: entry.partOfSpeech,
  focusedMeaning: entry.focusedMeaning,
  meaningNote: entry.item.meaningNote ?? "",
  example: entry.item.example,
  contextSentence: entry.item.example,
  collocation: entry.item.collocation,
  englishDefinition,
  definitionOptions: optionSet(entry, index, (candidate) => vocabularyAnchorDefinitions[candidate.item.term.toLowerCase()]),
  correctDefinition: englishDefinition,
  chineseOptions: optionSet(entry, index, (candidate) => candidate.focusedMeaning),
  correctChinese: entry.focusedMeaning,
  frequencyRank: entry.family.frequencyRank,
  frequencyBand: entry.band,
  difficulty: Number((-2.55 + ((entry.family.frequencyRank - 1) / 7_999) * 4.35).toFixed(3)),
  discrimination: 1,
  guessing: 0.25,
  reviewStatus: "item-authored",
  review: {
    reviewedAt: "2026-07-24",
    basis: "existing verified teaching entry plus anchor-specific family, POS and option review",
    checks: ["family", "frequency-band", "part-of-speech", "focused-meaning", "english-definition", "unique-definition-options", "unique-chinese-options", "context"],
  },
  source: {
    wordFamilyIndexVersion: familyIndex[0].version,
    teachingLexiconId: entry.item.id,
  },
  version: VERSION,
  });
});

fs.writeFileSync(
  new URL("../src/content/vocabulary-anchor-bank-150.json", import.meta.url),
  `${JSON.stringify(anchors, null, 2)}\n`,
);
console.log(`Wrote ${anchors.length} reviewed anchors (${VERSION})`);
