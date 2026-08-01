function normalizeSeed(seed) {
  const value = Number(seed) >>> 0;
  return value || 0x9e3779b9;
}

function nextRandom(state) {
  let value = state.value += 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function shuffleWithSeed(items, seed) {
  const result = [...items];
  const state = { value: normalizeSeed(seed) };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(nextRandom(state) * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function sampleWithoutReplacement(items, count, seed) {
  return shuffleWithSeed(items, seed).slice(0, Math.min(count, items.length));
}

export function createSessionSeed() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] || Date.now();
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildDailyQuickSession(anchors, count, seed) {
  const bands = new Map();
  for (const anchor of anchors) {
    const band = anchor.frequencyBand ?? "other";
    if (!bands.has(band)) bands.set(band, []);
    bands.get(band).push(anchor);
  }
  const bandOrder = shuffleWithSeed([...bands.keys()], seed ^ 0x51f15e);
  const selected = [];
  let round = 0;
  while (selected.length < count && round < anchors.length) {
    for (const band of bandOrder) {
      const pool = shuffleWithSeed(bands.get(band), seed + round * 131 + bandOrder.indexOf(band));
      const candidate = pool[round % pool.length];
      if (candidate && !selected.some((item) => item.id === candidate.id)) selected.push(candidate);
      if (selected.length >= count) break;
    }
    round += 1;
  }
  return selected.map((anchor, index) => ({
    id: `daily-${anchor.id}`,
    kind: "daily",
    prompt: anchor.term,
    subtitle: anchor.frequencyBand,
    options: shuffleWithSeed(anchor.chineseOptions, seed + index * 97),
    answer: anchor.correctChinese,
    lexiconId: anchor.lexiconId,
  }));
}

export function buildContextSession(lexicon, count, seed) {
  const candidates = lexicon.filter((item) => {
    if (!item.example || !item.term || item.contentStatus !== "verified") return false;
    return new RegExp(`\\b${escaped(item.term)}\\b`, "i").test(item.example);
  });
  const selected = sampleWithoutReplacement(candidates, count, seed ^ 0xa11ce);
  return selected.map((item, index) => {
    const pool = lexicon.filter((candidate) => candidate.id !== item.id && candidate.part === item.part && candidate.term !== item.term);
    const distractors = sampleWithoutReplacement(pool, 3, seed + index * 193).map((candidate) => candidate.term);
    return {
      id: `context-${item.id}`,
      kind: "context",
      prompt: "Choose the word or phrase that best completes the sentence.",
      context: item.example.replace(new RegExp(`\\b${escaped(item.term)}\\b`, "i"), "____"),
      options: shuffleWithSeed([item.term, ...distractors], seed + index * 211),
      answer: item.term,
      lexiconId: item.id,
      category: item.category,
    };
  }).filter((item) => item.options.length === 4 && new Set(item.options).size === 4);
}

export function buildReadingSession(curriculum, passageCount, seed) {
  const lessons = curriculum.filter((lesson) => lesson.skill === "reading" && lesson.text && lesson.questions?.length >= 4);
  const functional = lessons.filter((lesson) => !/Section 3/i.test(lesson.section));
  const continuous = lessons.filter((lesson) => /Section 3/i.test(lesson.section));
  const functionalCount = Math.ceil(passageCount / 2);
  const continuousCount = passageCount - functionalCount;
  const passages = shuffleWithSeed([
    ...sampleWithoutReplacement(functional, functionalCount, seed ^ 0xf00d),
    ...sampleWithoutReplacement(continuous, continuousCount, seed ^ 0xc0de),
  ], seed ^ 0x1234);
  return passages.flatMap((lesson, passageIndex) =>
    shuffleWithSeed(lesson.questions, seed + passageIndex * 307).map((question, questionIndex) => ({
      id: `reading-${lesson.id}-${questionIndex}`,
      kind: /Section 3/i.test(lesson.section) ? "continuous" : "functional",
      prompt: question.prompt,
      passage: lesson.text,
      passageId: lesson.id,
      passageTitle: lesson.title,
      section: lesson.section,
      options: shuffleWithSeed(question.options, seed + passageIndex * 401 + questionIndex * 17),
      answer: question.answer,
      explanation: question.explanation,
    })),
  );
}
