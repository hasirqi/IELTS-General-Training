export const TEXT_DIFFICULTY_ENGINE_VERSION = "text-difficulty-v0-2026.08.01";
export const TEXT_DIFFICULTY_FEATURE_SCHEMA_VERSION = "text-features-v0-2026.08.01";
export const WORD_FAMILY_INDEX_VERSION = "wf20k-2026.07.24-v1";

const FREQUENCY_BANDS = ["1K", "2K", "3K", "4K", "5K", "6K", "7K", "8K", "9K", "10K", "11K", "12K", "13K", "14K", "15K", "16K", "17K", "18K", "19K", "20K"];
const CONNECTIVES = new Set(["although", "because", "but", "consequently", "despite", "however", "if", "moreover", "nevertheless", "otherwise", "since", "so", "therefore", "though", "unless", "whereas", "while", "yet"]);
const SUBORDINATORS = new Set(["although", "as", "because", "before", "if", "once", "since", "that", "though", "unless", "until", "when", "where", "whereas", "whether", "while", "who", "which", "whose"]);
const PRONOUNS = new Set(["he", "her", "hers", "him", "his", "it", "its", "itself", "she", "their", "theirs", "them", "themselves", "they", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves"]);
const FUNCTION_WORDS = new Set(["a", "an", "and", "as", "at", "be", "been", "but", "by", "do", "for", "from", "had", "has", "have", "he", "her", "him", "his", "i", "if", "in", "is", "it", "its", "me", "my", "nor", "not", "of", "on", "or", "our", "she", "so", "than", "that", "the", "their", "them", "they", "this", "to", "us", "was", "we", "were", "what", "when", "which", "who", "will", "with", "would", "you", "your"]);
const NOMINAL_SUFFIXES = ["acy", "age", "ance", "ence", "hood", "ism", "ity", "ment", "ness", "ship", "tion", "sion"];

const round = (value, digits = 4) => Number(value.toFixed(digits));
const rate = (count, total) => total ? round(count / total) : 0;

export function cleanAssessmentText(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitAssessmentSentences(text) {
  const clean = cleanAssessmentText(text);
  if (!clean) return [];
  return clean
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof)\./g, "$1<dot>")
    .split(/(?<=[.!?]["'])\s+|(?<=[.!?])\s+|\n(?=[A-Z0-9])/)
    .map((sentence) => sentence.replaceAll("<dot>", ".").trim())
    .filter(Boolean);
}

export function tokenizeAssessmentText(text) {
  return cleanAssessmentText(text).toLowerCase().match(/[a-z]+(?:'[a-z]+)?|\d+(?:[.,:]\d+)*/g) ?? [];
}

export function buildWordFamilyLookup(families) {
  const lookup = new Map();
  for (const family of families) lookup.set(String(family.headword).toLowerCase(), family);
  for (const family of families) {
    for (const form of new Set(family.members ?? [])) {
      const normalized = String(form).toLowerCase();
      if (!lookup.has(normalized)) lookup.set(normalized, family);
    }
  }
  return lookup;
}

export function countEnglishSyllables(word) {
  const value = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!value) return 0;
  if (value.length <= 3) return 1;
  const stripped = value.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "").replace(/^y/, "");
  return Math.max(1, (stripped.match(/[aeiouy]{1,2}/g) ?? []).length);
}

function movingAverageTypeTokenRatio(tokens, windowSize = 50) {
  if (!tokens.length) return 0;
  if (tokens.length <= windowSize) return rate(new Set(tokens).size, tokens.length);
  let total = 0;
  let windows = 0;
  for (let index = 0; index <= tokens.length - windowSize; index += windowSize) {
    total += new Set(tokens.slice(index, index + windowSize)).size / windowSize;
    windows += 1;
  }
  return round(total / windows);
}

export function analyseTextDifficultyV0(text, familiesOrLookup) {
  const cleanText = cleanAssessmentText(text);
  const sentences = splitAssessmentSentences(cleanText);
  const tokens = tokenizeAssessmentText(cleanText);
  const wordTokens = tokens.filter((token) => /^[a-z]/.test(token));
  const lookup = familiesOrLookup instanceof Map ? familiesOrLookup : buildWordFamilyLookup(familiesOrLookup ?? []);
  const matched = wordTokens.map((token) => lookup.get(token) ?? null);
  const known = matched.filter(Boolean);
  const outOfIndex = [...new Set(wordTokens.filter((_, index) => !matched[index]))].sort();
  const sentenceLengths = sentences.map((sentence) => tokenizeAssessmentText(sentence).filter((token) => /^[a-z]/.test(token)).length).filter(Boolean);
  const meanSentenceLength = sentenceLengths.length ? sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length : 0;
  const sentenceVariance = sentenceLengths.length ? sentenceLengths.reduce((sum, value) => sum + (value - meanSentenceLength) ** 2, 0) / sentenceLengths.length : 0;
  const bandCounts = Object.fromEntries(FREQUENCY_BANDS.map((band) => [band, 0]));
  for (const family of known) if (bandCounts[family.frequencyBand] !== undefined) bandCounts[family.frequencyBand] += 1;
  const syllables = wordTokens.map(countEnglishSyllables);
  const longWords = wordTokens.filter((token, index) => token.length >= 7 || syllables[index] >= 3);
  const nominalisations = wordTokens.filter((token) => NOMINAL_SUFFIXES.some((suffix) => token.length > suffix.length + 3 && token.endsWith(suffix)));
  const concretenessValues = known.map((family) => family.concreteness).filter((value) => Number.isFinite(value));
  const paragraphCount = cleanText ? cleanText.split(/\n{2,}/).filter(Boolean).length : 0;
  const uniqueSentenceProfiles = new Set(sentenceLengths.map((length) => Math.min(5, Math.floor(length / 5))));
  const lexicalTokens = wordTokens.filter((token) => !FUNCTION_WORDS.has(token));

  return {
    engineVersion: TEXT_DIFFICULTY_ENGINE_VERSION,
    schemaVersion: TEXT_DIFFICULTY_FEATURE_SCHEMA_VERSION,
    familyIndexVersion: WORD_FAMILY_INDEX_VERSION,
    status: "features-only",
    counts: {
      characters: cleanText.length,
      paragraphs: paragraphCount,
      sentences: sentences.length,
      tokens: tokens.length,
      wordTokens: wordTokens.length,
      uniqueWords: new Set(wordTokens).size,
      matchedFamilyTokens: known.length,
      outOfIndexTokens: matched.length - known.length,
    },
    sentence: {
      meanLength: round(meanSentenceLength),
      logMeanLength: meanSentenceLength ? round(Math.log(meanSentenceLength)) : 0,
      maximumLength: sentenceLengths.length ? Math.max(...sentenceLengths) : 0,
      lengthCoefficientOfVariation: meanSentenceLength ? round(Math.sqrt(sentenceVariance) / meanSentenceLength) : 0,
      profileDiversity: rate(uniqueSentenceProfiles.size, Math.min(6, Math.max(1, sentenceLengths.length))),
    },
    vocabulary: {
      meanLogFrequencyRank: known.length ? round(known.reduce((sum, family) => sum + Math.log(family.frequencyRank), 0) / known.length) : null,
      meanZipfFrequency: known.length ? round(known.reduce((sum, family) => sum + family.zipfFrequency, 0) / known.length) : null,
      familyCoverage: rate(known.length, wordTokens.length),
      bandCoverage: Object.fromEntries(FREQUENCY_BANDS.map((band) => [band, rate(bandCounts[band], wordTokens.length)])),
      outOfIndexTypes: outOfIndex,
      typeTokenRatio: rate(new Set(wordTokens).size, wordTokens.length),
      movingAverageTypeTokenRatio: movingAverageTypeTokenRatio(wordTokens),
    },
    wordForm: {
      meanSyllables: syllables.length ? round(syllables.reduce((sum, value) => sum + value, 0) / syllables.length) : 0,
      longWordRate: rate(longWords.length, wordTokens.length),
    },
    discourse: {
      connectiveRate: rate(wordTokens.filter((token) => CONNECTIVES.has(token)).length, wordTokens.length),
      subordinatorRate: rate(wordTokens.filter((token) => SUBORDINATORS.has(token)).length, wordTokens.length),
      pronounReferenceRate: rate(wordTokens.filter((token) => PRONOUNS.has(token)).length, wordTokens.length),
      nominalisationRate: rate(nominalisations.length, wordTokens.length),
      lexicalDensity: rate(lexicalTokens.length, wordTokens.length),
    },
    semantics: {
      meanConcreteness: concretenessValues.length ? round(concretenessValues.reduce((sum, value) => sum + value, 0) / concretenessValues.length) : null,
      concretenessCoverage: rate(concretenessValues.length, known.length),
      abstractnessProxy: rate(nominalisations.length, wordTokens.length),
      proxyOnly: true,
    },
    audit: {
      insufficientText: wordTokens.length < 20 || sentences.length < 2,
      lowFamilyCoverage: wordTokens.length > 0 && known.length / wordTokens.length < 0.8,
      unavailableFeatures: concretenessValues.length ? [] : ["meanConcreteness"],
      scoreEligible: false,
      internalLevel: null,
    },
  };
}
