import crypto from "node:crypto";
import fs from "node:fs";
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import { analyseTextDifficultyV0, buildWordFamilyLookup } from "../src/text-difficulty-engine.mjs";
import { assignReferenceTextSplits, TEXT_REFERENCE_CORPUS_VERSION } from "../src/text-reference-corpus.mjs";

const BASE = "https://learningenglish.voanews.com";
const LICENCE_URL = `${BASE}/p/6861.html`;
const TERMS_URL = `${BASE}/p/5374.html`;
const SOURCE_ABOUT_URL = `${BASE}/p/5373.html`;
const HUBS = {
  level1: `${BASE}/p/5644.html`,
  level2: `${BASE}/p/6765.html`,
  advancedVerbs: `${BASE}/p/9403.html`,
  advancedSentences: `${BASE}/p/9420.html`,
  advancedFun: `${BASE}/p/9426.html`,
  advancedModals: `${BASE}/p/9404.html`,
  advancedParticles: `${BASE}/p/9417.html`,
  advancedAdjectives: `${BASE}/p/9393.html`,
};
const THIRD_PARTY_PATTERN = /\b(Associated Press|AP Photo|Reuters|Agence France-Presse|AFP|adapted (?:this|the) .* story)\b/i;
const RISKY_TITLE_PATTERN = /\b(song|movie|film|book|popular culture|star wars|bob dylan|elton john|taylor swift|country roads)\b/i;
const THIRD_PARTY_CREATIVE_PATTERN = /\b(song|lyrics?|film|movie|novel|book excerpt|television series|poem)\b/i;
const lookup = buildWordFamilyLookup(familyIndex);

function decodeHtml(value) {
  const named = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function plainText(html) {
  return decodeHtml(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<(amp-(?:audio|video|youtube)|figure)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line && !/^(Image|Embed|Share|XS|SM|MD|LG|Direct link|Download|Your browser)/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jsonLd(html) {
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(decodeHtml(match[1].trim()));
      if (value?.headline) return value;
    } catch {}
  }
  return {};
}

function articleBody(html) {
  const start = html.search(/<div class="container wsw">/i);
  if (start < 0) return "";
  const after = html.slice(start);
  const stops = [after.search(/<div class="comments/i), after.search(/<footer\b/i), after.search(/<div[^>]+class="[^"]*article-sharing/i)].filter((value) => value > 0);
  return after.slice(0, stops.length ? Math.min(...stops) : after.length);
}

function lessonConversation(body) {
  const start = body.search(/<h2[^>]*>\s*Conversation\s*<\/h2>/i);
  if (start < 0) return "";
  const after = body.slice(start).replace(/^<h2[^>]*>[\s\S]*?<\/h2>/i, "");
  const end = after.search(/<h2\b/i);
  return plainText(end > 0 ? after.slice(0, end) : after);
}

function advancedText(body) {
  const wordsHeading = body.search(/<h[2-6][^>]*>\s*Words in This Story/i);
  const commentsHeading = body.search(/<h[2-6][^>]*>\s*(?:Write to us|What do you think)/i);
  const stops = [wordsHeading, commentsHeading].filter((value) => value > 0);
  return plainText(stops.length ? body.slice(0, Math.min(...stops)) : body);
}

function excerpt(text, maximumWords = 520) {
  const tokens = text.split(/\s+/);
  if (tokens.length <= maximumWords) return text;
  const shortened = tokens.slice(0, maximumWords).join(" ");
  const lastStop = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf("!"), shortened.lastIndexOf("?"));
  return (lastStop > shortened.length * 0.72 ? shortened.slice(0, lastStop + 1) : shortened).trim();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Breakthrough-IELTS-Research/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function absoluteArticleLinks(html) {
  return [...new Set([...html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/a/"))
    .map((href) => new URL(href, BASE).href))];
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try { results[index] = await mapper(items[index], index); }
      catch (error) { results[index] = { error: String(error), url: items[index] }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function lessonNumber(headline) {
  const match = headline.match(/Lesson\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

async function collectHub(hub, type) {
  const hubHtml = await fetchText(hub);
  const links = absoluteArticleLinks(hubHtml);
  const rows = await mapPool(links, 6, async (url) => {
    const ampUrl = url.replace(`${BASE}/a/`, `${BASE}/amp/`);
    const html = await fetchText(ampUrl);
    const metadata = jsonLd(html);
    const body = articleBody(html);
    const text = type === "advanced" ? advancedText(body) : lessonConversation(body);
    return { url, ampUrl, metadata, rawBody: body, text: excerpt(text) };
  });
  return rows.filter((row) => !row.error);
}

const level1Raw = await collectHub(HUBS.level1, "lesson");
const level2Raw = await collectHub(HUBS.level2, "lesson");
const advancedRaw = [
  ...await collectHub(HUBS.advancedVerbs, "advanced"),
  ...await collectHub(HUBS.advancedSentences, "advanced"),
  ...await collectHub(HUBS.advancedFun, "advanced"),
  ...await collectHub(HUBS.advancedModals, "advanced"),
  ...await collectHub(HUBS.advancedParticles, "advanced"),
  ...await collectHub(HUBS.advancedAdjectives, "advanced"),
];

const level1 = level1Raw
  .filter((row) => /Level 1/i.test(row.metadata.articleSection ?? "") && lessonNumber(row.metadata.headline ?? "") && row.text.split(/\s+/).length >= 35)
  .sort((a, b) => lessonNumber(a.metadata.headline) - lessonNumber(b.metadata.headline))
  .slice(0, 48);
const level2 = level2Raw
  .filter((row) => /Level 2/i.test(row.metadata.articleSection ?? "") && lessonNumber(row.metadata.headline ?? "") && row.text.split(/\s+/).length >= 60)
  .sort((a, b) => lessonNumber(a.metadata.headline) - lessonNumber(b.metadata.headline))
  .slice(0, 30);
const advanced = advancedRaw
  .filter((row) => row.text.split(/\s+/).length >= 180 && !THIRD_PARTY_PATTERN.test(row.rawBody) && !THIRD_PARTY_CREATIVE_PATTERN.test(row.rawBody) && !RISKY_TITLE_PATTERN.test(row.metadata.headline ?? ""))
  .filter((row, index, rows) => rows.findIndex((candidate) => candidate.url === row.url) === index)
  .filter((row, index, rows) => rows.findIndex((candidate) => candidate.text === row.text) === index)
  .sort((a, b) => a.metadata.headline.localeCompare(b.metadata.headline))
  .slice(0, 42);

if (level1.length !== 48 || level2.length !== 30 || advanced.length !== 42) {
  throw new Error(`Corpus shortage: L1 source ${level1.length}/48, L2 source ${level2.length}/30, advanced ${advanced.length}/42`);
}

function record(row, sourceGroup, ordinal) {
  const id = `voa-${sourceGroup}-${String(ordinal).padStart(3, "0")}`;
  const text = row.text;
  return {
    id,
    title: row.metadata.headline,
    text,
    contentHash: `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`,
    source: {
      name: "VOA Learning English",
      url: row.url,
      licence: "Public domain when produced exclusively by VOA; VOA credit required",
      licenceUrl: LICENCE_URL,
      termsUrl: TERMS_URL,
      officialLevel: sourceGroup === "level1" ? "Beginning — Let's Learn English Level 1" : sourceGroup === "level2" ? "Beginning/Intermediate — Let's Learn English Level 2" : "Advanced — Everyday Grammar",
      articleSection: row.metadata.articleSection ?? "",
      publishedAt: row.metadata.datePublished ?? null,
    },
    split: "train",
    reviewStatus: "source-reviewed",
    provisionalInternalLevel: null,
    humanLabels: [],
    internalLevel: null,
    scoreEligible: false,
    features: analyseTextDifficultyV0(text, lookup),
  };
}

const baseRecords = [
  ...level1.map((row, index) => record(row, "level1", index + 1)),
  ...level2.map((row, index) => record(row, "level2", index + 1)),
  ...advanced.map((row, index) => record(row, "advanced", index + 1)),
];
const sourceOrder = { level1: 1, level2: 2, advanced: 3 };
const provisionalOrder = [...baseRecords].sort((a, b) => {
  const aGroup = a.id.split("-")[1];
  const bGroup = b.id.split("-")[1];
  const sourceDelta = sourceOrder[aGroup] - sourceOrder[bGroup];
  if (sourceDelta) return sourceDelta;
  if (aGroup !== "advanced") return a.id.localeCompare(b.id);
  const score = (item) => (item.features.vocabulary.meanLogFrequencyRank ?? 0) + item.features.sentence.meanLength * 0.04 + item.features.wordForm.longWordRate;
  return score(a) - score(b) || a.id.localeCompare(b.id);
});
for (const [index, item] of provisionalOrder.entries()) item.provisionalInternalLevel = `L${Math.floor(index / 20) + 1}`;
const records = assignReferenceTextSplits(baseRecords);

const payload = {
  version: `${TEXT_REFERENCE_CORPUS_VERSION}-voa-seed-120`,
  snapshotDate: "2026-08-01",
  status: "source-reviewed-awaiting-two-independent-human-labels",
  scoreEligible: false,
  sourceRegister: {
    publisher: "Voice of America / VOA Learning English",
    aboutUrl: SOURCE_ABOUT_URL,
    licenceUrl: LICENCE_URL,
    termsUrl: TERMS_URL,
    licenceFinding: "VOA states that Learning English texts produced exclusively by VOA are public domain and may be reprinted with credit; third-party agency material is excluded.",
    exclusionPatterns: [THIRD_PARTY_PATTERN.source, THIRD_PARTY_CREATIVE_PATTERN.source, RISKY_TITLE_PATTERN.source],
  },
  counts: {
    total: records.length,
    level1Course: level1.length,
    level2Course: level2.length,
    advancedGrammar: advanced.length,
    independentlyHumanLabelled: 0,
    scoringEligible: 0,
    provisionalLabelMethod: "official-source-level-and-course-sequence-then-v0-features-balanced-20-per-level",
  },
  records,
};

fs.writeFileSync(new URL("../src/content/text-reference-corpus-voa-120.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload.counts));
