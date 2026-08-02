import crypto from "node:crypto";
import fs from "node:fs";
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import priorCandidates from "../src/content/text-reference-corpus-level-correction-candidates.json" with { type: "json" };
import reviewed from "../src/content/text-reference-corpus-level-correction-ai-reviewed-70.json" with { type: "json" };
import combined from "../src/content/text-reference-corpus-ai-reviewed-190.json" with { type: "json" };
import { analyseTextDifficultyV0, buildWordFamilyLookup, splitAssessmentSentences } from "../src/text-difficulty-engine.mjs";
import { assignReferenceTextSplits } from "../src/text-reference-corpus.mjs";

const GUTENBERG_LICENCE = "https://www.gutenberg.org/policy/license.html";
const lookup = buildWordFamilyLookup(familyIndex);
const readers = [
  { id: "14642", title: "McGuffey's Eclectic Primer, Revised Edition" },
  { id: "14640", title: "McGuffey's First Eclectic Reader, Revised Edition" },
  { id: "1489", title: "The New McGuffey First Reader" },
  { id: "67302", title: "The Summers Readers: First Reader" },
];

const wordCount = (text) => (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;
const sha = (text) => `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
const complexity = (features) => (features.vocabulary.meanLogFrequencyRank ?? 0)
  + features.sentence.meanLength * 0.055
  + features.wordForm.longWordRate * 4
  + features.discourse.nominalisationRate * 4
  + features.discourse.subordinatorRate * 2;

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Breakthrough-IELTS-Research/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchBook(id) {
  const urls = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
  ];
  for (const url of urls) {
    try {
      const text = await fetchText(url);
      if (text.length > 3000) return { text, textUrl: url };
    } catch {}
  }
  throw new Error(`No text for ${id}`);
}

function bookBody(text) {
  const start = text.match(/\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*{3}/i);
  const end = text.match(/\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  return text.slice(start ? start.index + start[0].length : 0, end ? end.index : text.length)
    .replace(/\r/g, "")
    .replace(/\[[^\]]{1,120}\]/g, " ")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/-{3,}/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanParagraph(value) {
  return value.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function readerPassages(text) {
  const excluded = /Project Gutenberg|Transcriber|SUGGESTIONS TO TEACHERS|PHONIC|VOCABULARY|ECLECTIC EDUCATIONAL|Copyright|LESSON\s+[IVXLC\d]+|WORDS OFTEN MISPRONOUNCED|READING REVIEW/i;
  const paragraphs = bookBody(text).split(/\n\s*\n/).map(cleanParagraph)
    .filter((paragraph) => wordCount(paragraph) >= 12)
    .filter((paragraph) => !excluded.test(paragraph))
    .filter((paragraph) => (paragraph.match(/[A-Z]/g) ?? []).length / Math.max(paragraph.length, 1) < 0.18)
    .filter((paragraph) => !/\.{5,}|@|https?:\/\//.test(paragraph));
  const windows = [];
  for (let start = 0; start < paragraphs.length; start += 1) {
    const selected = [];
    let words = 0;
    for (let index = start; index < paragraphs.length && words < 150; index += 1) {
      const paragraph = paragraphs[index];
      const count = wordCount(paragraph);
      if (selected.length && words + count > 180) break;
      selected.push(paragraph);
      words += count;
      if (words >= 70) break;
    }
    if (words < 70 || words > 180) continue;
    const passage = selected.join(" ");
    const sentenceCount = Math.max(1, splitAssessmentSentences(passage).length);
    const questionRate = (passage.match(/\?/g) ?? []).length / sentenceCount;
    if (questionRate > 0.3) continue;
    const features = analyseTextDifficultyV0(passage, lookup);
    const commonCoverage = (features.vocabulary.bandCoverage["1K"] ?? 0) + (features.vocabulary.bandCoverage["2K"] ?? 0);
    if (features.audit.insufficientText || features.vocabulary.familyCoverage < 0.9 || commonCoverage < 0.88) continue;
    if (features.sentence.meanLength > 12.5 || features.wordForm.longWordRate > 0.14) continue;
    windows.push({ passage, start, features, score: complexity(features) });
  }
  return windows;
}

function wordSet(text) {
  return new Set((text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []));
}

function overlap(first, second) {
  const a = wordSet(first);
  const b = wordSet(second);
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function essayWindows(text, existingText) {
  const sentences = splitAssessmentSentences(bookBody(text)).filter((sentence) => wordCount(sentence) >= 5);
  const windows = [];
  for (let start = 0; start < Math.min(sentences.length, 1000); start += 10) {
    const selected = [];
    let words = 0;
    for (let index = start; index < sentences.length && words < 400; index += 1) {
      const count = wordCount(sentences[index]);
      if (selected.length && words + count > 460) break;
      selected.push(sentences[index]);
      words += count;
      if (words >= 300) break;
    }
    if (words < 280) continue;
    const passage = selected.join(" ");
    if (/Project Gutenberg|Literary Archive Foundation|Gutenberg-tm|LIMITED WARRANTY|electronic work|Produced by|Online Distributed Proofreading|https?:\/\/|www\.|\.{6,}|@/i.test(passage)) continue;
    if (overlap(passage, existingText) > 0.52) continue;
    const features = analyseTextDifficultyV0(passage, lookup);
    if (features.audit.insufficientText || features.vocabulary.familyCoverage < 0.78) continue;
    windows.push({ passage, start, features, score: complexity(features) });
  }
  return windows;
}

const existingHashes = new Set(combined.records.map((record) => record.contentHash));
const l5Scores = reviewed.records.filter((record) => record.internalLevel === "L5").map((record) => complexity(record.features)).sort((a, b) => a - b);
const l5Target = l5Scores[Math.floor(l5Scores.length / 2)];

const l1Rows = [];
for (const reader of readers) {
  const downloaded = await fetchBook(reader.id);
  const selected = readerPassages(downloaded.text)
    .filter((row) => !existingHashes.has(sha(row.passage)))
    .sort((a, b) => a.score - b.score)
    .filter((row, index, rows) => rows.slice(0, index).every((prior) => overlap(row.passage, prior.passage) < 0.5))
    .slice(0, 5);
  if (selected.length !== 5) throw new Error(`Reader ${reader.id} produced ${selected.length}/5 passages`);
  l1Rows.push(...selected.map((row) => ({ ...row, ...reader, textUrl: downloaded.textUrl })));
}

const l5Sources = priorCandidates.records.filter((record) => record.provisionalInternalLevel === "L5");
const l5Rows = [];
for (const source of l5Sources) {
  const downloaded = await fetchBook(source.source.ebookId);
  const best = essayWindows(downloaded.text, source.text)
    .sort((a, b) => Math.abs(a.score - l5Target) - Math.abs(b.score - l5Target))[0];
  if (best && !existingHashes.has(sha(best.passage))) l5Rows.push({ ...best, title: source.title, source: source.source, textUrl: downloaded.textUrl });
}
l5Rows.sort((a, b) => Math.abs(a.score - l5Target) - Math.abs(b.score - l5Target));
if (l5Rows.length < 8) throw new Error(`L5 source shortage ${l5Rows.length}/8`);

const records = assignReferenceTextSplits([
  ...l1Rows.map((row, index) => ({
    id: `correction-r2-l1-${String(index + 1).padStart(3, "0")}`,
    title: `${row.title} — passage ${row.start + 1}`,
    text: row.passage,
    contentHash: sha(row.passage),
    source: { name: "Project Gutenberg", url: `https://www.gutenberg.org/ebooks/${row.id}`, textUrl: row.textUrl, ebookId: row.id, locator: `paragraph window ${row.start + 1}`, licence: "Public domain in the USA; Project Gutenberg licence and trademark text excluded from excerpt", licenceUrl: GUTENBERG_LICENCE, licenceStatus: "landing-page-public-domain-verified", targetLevel: "L1" },
    split: "train", reviewStatus: "source-reviewed", provisionalInternalLevel: "L1", humanLabels: [], aiLabels: [], internalLevel: null, scoreEligible: false, features: row.features,
  })),
  ...l5Rows.slice(0, 8).map((row, index) => ({
    id: `correction-r2-l5-${String(index + 1).padStart(3, "0")}`,
    title: `${row.title} — alternate passage ${row.start + 1}`,
    text: row.passage,
    contentHash: sha(row.passage),
    source: { ...row.source, textUrl: row.textUrl, locator: `sentence window ${row.start + 1}`, targetLevel: "L5" },
    split: "train", reviewStatus: "source-reviewed", provisionalInternalLevel: "L5", humanLabels: [], aiLabels: [], internalLevel: null, scoreEligible: false, features: row.features,
  })),
]);

if (records.length !== 28 || new Set(records.map((record) => record.contentHash)).size !== 28) throw new Error("Round 2 uniqueness gate failed");
if (records.some((record) => existingHashes.has(record.contentHash))) throw new Error("Round 2 overlaps existing corpus");
const payload = {
  version: "reference-corpus-level-correction-round2-candidates-v1-2026.08.02",
  snapshotDate: "2026-08-02",
  status: "source-reviewed-awaiting-independent-ai-review",
  scoreEligible: false,
  counts: { total: 28, targetL1: 20, targetL5: 8, independentlyAiReviewed: 0, scoringEligible: 0 },
  records,
};
fs.writeFileSync(new URL("../src/content/text-reference-corpus-level-correction-round2-candidates.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload.counts));
