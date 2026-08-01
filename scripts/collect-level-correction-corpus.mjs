import crypto from "node:crypto";
import fs from "node:fs";
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import { analyseTextDifficultyV0, buildWordFamilyLookup, splitAssessmentSentences } from "../src/text-difficulty-engine.mjs";
import { assignReferenceTextSplits } from "../src/text-reference-corpus.mjs";

const CDC_ARCHIVE = "https://archive.cdc.gov/www_cdc_gov";
const CDC = "https://www.cdc.gov";
const CDC_URLS = [
  "/coronavirus/2019-ncov/easy-to-read/get-medicine-for-covid-19.html",
  "/coronavirus/2019-ncov/easy-to-read/healthy-school-year.html",
  "/coronavirus/2019-ncov/easy-to-read/make-a-plan.html",
  "/coronavirus/2019-ncov/easy-to-read/prevent-getting-sick/how-covid-spreads.html",
  "/coronavirus/2019-ncov/easy-to-read/prevent-getting-sick/stay-safe.html",
  "/coronavirus/2019-ncov/easy-to-read/stay-safe-when-people-visit-your-home.html",
  "/coronavirus/2019-ncov/easy-to-read/symptoms-testing.html",
  "/coronavirus/2019-ncov/easy-to-read/testing/diagnostic-testing.html",
  "/coronavirus/2019-ncov/easy-to-read/vaccine-booster-shot.html",
  "/coronavirus/2019-ncov/easy-to-read/vaccines-children-teens.html",
  "/coronavirus/2019-ncov/easy-to-read/vaccines-people-with-disabilities.html",
  "/coronavirus/2019-ncov/easy-to-read/weakened-immune.html",
  "/coronavirus/2019-ncov/easy-to-read/what-to-do-around-someone-with-covid-19.html",
  "/coronavirus/2019-ncov/easy-to-read/what-to-do-if-you-have-covid.html",
].map((path) => `${CDC_ARCHIVE}${path}`).concat([
  `${CDC}/disability-and-health/covid-19-resources/easy-read-needle-phobia.html`,
  `${CDC}/disability-inclusion/resources/easy-read-frequent-mental-distress.html`,
  `${CDC}/disability-emergency-preparedness/communication-resources/coping-easy-read.html`,
  `${CDC}/disability-emergency-preparedness/communication-resources/emergency-plan-easy-read.html`,
  `${CDC}/disability-emergency-preparedness/communication-resources/emergency-preparedness-easy-read.html`,
  `${CDC}/disability-emergency-preparedness/communication-resources/leaving-in-emergency-easy-read.html`,
  `${CDC}/covid/communication/people-with-disabilities.html`,
]);

const GUTENBERG_BOOKSHELF = "https://www.gutenberg.org/ebooks/bookshelf/57?sort_order=title";
const GUTENBERG_LICENCE = "https://www.gutenberg.org/policy/license.html";
const FEDERAL_COPYRIGHT_GUIDE = "https://www.usa.gov/government-copyright";
const lookup = buildWordFamilyLookup(familyIndex);

function decodeHtml(value) {
  const named = {
    amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " ", rsquo: "'", lsquo: "'",
    rdquo: '"', ldquo: '"', ndash: "-", mdash: "-", hellip: "...", ntilde: "n",
  };
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function plainText(html) {
  return decodeHtml(String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<(figure|nav|aside)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromHtml(html) {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = heading ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Untitled";
  return plainText(title).replace(/\s*\|.*$/, "").trim();
}

function mainHtml(html) {
  const start = html.search(/<main\b/i);
  if (start < 0) return html;
  const after = html.slice(start);
  const end = after.search(/<\/main>/i);
  return end > 0 ? after.slice(0, end) : after;
}

function cdcArticleHtml(html) {
  const easyRead = html.match(/<div[^>]*class=["'][^"']*\beasyread\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (easyRead) return easyRead;

  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (article) return article;

  return mainHtml(html);
}

function wordCount(text) {
  return (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length;
}

function excerptFromSentences(text, minimum = 140, maximum = 360) {
  const sentences = splitAssessmentSentences(text)
    .filter((sentence) => wordCount(sentence) >= 3)
    .filter((sentence) => !/^(updated|last reviewed|content source|related pages|references|sources|share)$/i.test(sentence));
  const selected = [];
  let words = 0;
  for (const sentence of sentences) {
    const count = wordCount(sentence);
    if (selected.length && words + count > maximum) break;
    selected.push(sentence);
    words += count;
    if (words >= minimum) break;
  }
  return selected.join(" ").trim();
}

function excerptWindows(text, minimum = 100, maximum = 220) {
  const sentences = splitAssessmentSentences(text)
    .filter((sentence) => wordCount(sentence) >= 3)
    .filter((sentence) => !/^(updated|last reviewed|content source|related pages|references|sources|share)$/i.test(sentence));
  const windows = [];
  let selected = [];
  let words = 0;
  for (const sentence of sentences) {
    const count = wordCount(sentence);
    if (selected.length && words + count > maximum) {
      if (words >= minimum) windows.push(selected.join(" "));
      selected = [];
      words = 0;
    }
    selected.push(sentence);
    words += count;
  }
  if (words >= minimum) windows.push(selected.join(" "));
  return windows.map((text, index) => ({ text, segmentIndex: index + 1 }));
}

function complexity(features) {
  return (features.vocabulary.meanLogFrequencyRank ?? 0)
    + features.sentence.meanLength * 0.055
    + features.wordForm.longWordRate * 4
    + features.discourse.nominalisationRate * 4
    + features.discourse.subordinatorRate * 2;
}

function sha(text) {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Breakthrough-IELTS-Research/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await mapper(items[index], index); }
      catch (error) { results[index] = { error: String(error), input: items[index] }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function gutenbergBody(text) {
  const startMatch = text.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  const endMatch = text.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const start = startMatch ? startMatch.index + startMatch[0].length : 0;
  const end = endMatch ? endMatch.index : text.length;
  return text.slice(start, end)
    .replace(/\r/g, "")
    .replace(/\[[^\]]{1,80}\]/g, " ")
    .replace(/^[ \t]*[A-Z][A-Z\s\d.,'?:-]{8,}[ \t]*$/gm, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bestGutenbergExcerpt(text) {
  const sentences = splitAssessmentSentences(gutenbergBody(text)).filter((sentence) => wordCount(sentence) >= 5);
  const windows = [];
  for (let start = 0; start < Math.min(sentences.length, 900); start += 8) {
    const selected = [];
    let words = 0;
    for (let index = start; index < sentences.length && words < 520; index += 1) {
      const count = wordCount(sentences[index]);
      if (selected.length && words + count > 560) break;
      selected.push(sentences[index]);
      words += count;
      if (words >= 340) break;
    }
    if (words < 300) continue;
    const passage = selected.join(" ");
    if (/Project Gutenberg|Literary Archive Foundation|Gutenberg-tm|LIMITED WARRANTY|electronic work|\.{6,}|@/i.test(passage)) continue;
    const features = analyseTextDifficultyV0(passage, lookup);
    if (features.audit.insufficientText || features.vocabulary.familyCoverage < 0.72) continue;
    windows.push({ passage, features, score: complexity(features) });
  }
  return windows.sort((a, b) => b.score - a.score)[0] ?? null;
}

async function fetchGutenbergText(id) {
  const candidates = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
  ];
  for (const url of candidates) {
    try {
      const text = await fetchText(url);
      if (text.length > 5000) return { text, textUrl: url };
    } catch {}
  }
  throw new Error(`No plain text for Gutenberg ${id}`);
}

async function collectCdc() {
  const rows = await mapPool(CDC_URLS, 4, async (url) => {
    const html = await fetchText(url);
    const title = titleFromHtml(html);
    const body = plainText(cdcArticleHtml(html))
      .replace(/Travel requirements to enter the United States are changing, starting November 8, 2021\. More information is available here\s*\.?/gi, " ")
      .replace(/\bEspanol\b/gi, " ");
    return excerptWindows(body).map(({ text, segmentIndex }) => {
      const features = analyseTextDifficultyV0(text, lookup);
      return { url, title, text, segmentIndex, features, score: complexity(features) };
    });
  });
  const valid = rows.filter((row) => !row.error).flat()
    .filter((row, index, all) => all.findIndex((candidate) => candidate.text === row.text) === index)
    .sort((a, b) => a.score - b.score)
    .slice(0, 20);
  if (valid.length !== 20) throw new Error(`CDC L1 shortage: ${valid.length}/20`);
  return valid;
}

async function collectGutenberg() {
  const hubUrls = Array.from({ length: 5 }, (_, index) => `${GUTENBERG_BOOKSHELF}&start_index=${index * 25 + 1}`);
  const hubs = await mapPool(hubUrls, 3, fetchText);
  const ids = [...new Set(hubs.flatMap((html) => [...html.matchAll(/href="\/ebooks\/(\d+)"/g)].map((match) => match[1])))];
  const landingRows = await mapPool(ids, 5, async (id) => {
    const url = `https://www.gutenberg.org/ebooks/${id}`;
    const html = await fetchText(url);
    const metadata = plainText(html);
    if (!/Language\s+English/i.test(metadata) || !/Copyright\s+Public domain in the USA/i.test(metadata)) throw new Error("not-English-public-domain");
    return { id, url, title: titleFromHtml(html) };
  });
  const eligible = landingRows.filter((row) => !row.error);
  const textRows = await mapPool(eligible, 4, async (row) => {
    const downloaded = await fetchGutenbergText(row.id);
    const selected = bestGutenbergExcerpt(downloaded.text);
    if (!selected) throw new Error(`No suitable excerpt for ${row.id}`);
    return { ...row, ...downloaded, text: selected.passage, features: selected.features, score: selected.score };
  });
  const valid = textRows.filter((row) => !row.error)
    .filter((row, index, all) => all.findIndex((candidate) => candidate.text === row.text) === index)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
  if (valid.length !== 50) throw new Error(`Gutenberg shortage: ${valid.length}/50`);
  return valid;
}

const [cdcRows, gutenbergRows] = await Promise.all([collectCdc(), collectGutenberg()]);
const highRows = gutenbergRows.slice(0, 30);
const mediumRows = gutenbergRows.slice(30, 50);

function cdcRecord(row, index) {
  return {
    id: `correction-l1-${String(index + 1).padStart(3, "0")}`,
    title: `${row.title} — passage ${row.segmentIndex}`,
    text: row.text,
    contentHash: sha(row.text),
    source: {
      name: "Centers for Disease Control and Prevention",
      url: row.url,
      locator: `passage ${row.segmentIndex}`,
      licence: "U.S. federal government work candidate; page-level CDC content source retained and third-party material excluded",
      licenceUrl: FEDERAL_COPYRIGHT_GUIDE,
      licenceStatus: "federal-source-verified-requires-final-page-audit",
      targetLevel: "L1",
    },
    split: "train",
    reviewStatus: "source-reviewed",
    provisionalInternalLevel: "L1",
    humanLabels: [],
    aiLabels: [],
    internalLevel: null,
    scoreEligible: false,
    features: row.features,
  };
}

function gutenbergRecord(row, targetLevel, index) {
  return {
    id: `correction-${targetLevel.toLowerCase()}-${String(index + 1).padStart(3, "0")}`,
    title: row.title,
    text: row.text,
    contentHash: sha(row.text),
    source: {
      name: "Project Gutenberg",
      url: row.url,
      textUrl: row.textUrl,
      ebookId: row.id,
      licence: "Public domain in the USA; Project Gutenberg licence and trademark text excluded from excerpt",
      licenceUrl: GUTENBERG_LICENCE,
      licenceStatus: "landing-page-public-domain-verified",
      targetLevel,
    },
    split: "train",
    reviewStatus: "source-reviewed",
    provisionalInternalLevel: targetLevel,
    humanLabels: [],
    aiLabels: [],
    internalLevel: null,
    scoreEligible: false,
    features: row.features,
  };
}

const records = assignReferenceTextSplits([
  ...cdcRows.map(cdcRecord),
  ...mediumRows.map((row, index) => gutenbergRecord(row, "L5", index)),
  ...highRows.map((row, index) => gutenbergRecord(row, "L6", index)),
]);
const hashes = new Set(records.map((record) => record.contentHash));
const sourceLocators = new Set(records.map((record) => `${record.source.url}#${record.source.locator ?? "full-text"}`));
if (records.length !== 70 || hashes.size !== 70 || sourceLocators.size !== 70) throw new Error("Correction corpus uniqueness gate failed");

const payload = {
  version: "reference-corpus-level-correction-candidates-v1-2026.08.01",
  snapshotDate: "2026-08-01",
  status: "source-reviewed-awaiting-independent-ai-review",
  scoreEligible: false,
  sourceRegisters: [
    {
      publisher: "Centers for Disease Control and Prevention",
      copyrightGuide: FEDERAL_COPYRIGHT_GUIDE,
      finding: "Easy Read pages identify CDC program content sources. Federal status is not assumed for unrelated third-party material; final page-level audit remains required.",
    },
    {
      publisher: "Project Gutenberg",
      bookshelf: GUTENBERG_BOOKSHELF,
      licenceUrl: GUTENBERG_LICENCE,
      finding: "Each selected landing page states English and public domain in the USA. Gutenberg licence and trademark boilerplate is removed from excerpts.",
    },
  ],
  counts: {
    total: records.length,
    targetL1: records.filter((record) => record.provisionalInternalLevel === "L1").length,
    targetL5: records.filter((record) => record.provisionalInternalLevel === "L5").length,
    targetL6: records.filter((record) => record.provisionalInternalLevel === "L6").length,
    independentlyAiReviewed: 0,
    scoringEligible: 0,
  },
  records,
};

fs.writeFileSync(new URL("../src/content/text-reference-corpus-level-correction-candidates.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload.counts));
