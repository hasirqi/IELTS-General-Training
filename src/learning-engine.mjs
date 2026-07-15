const DAY_MS = 86_400_000;

export function normalizeAnswer(value = "") {
  return value.trim().toLowerCase().replace(/[.!?,'’]/g, "").replace(/\s+/g, " ");
}

export function scoreRecall(answer, expected, hints = 0) {
  const correct = normalizeAnswer(answer) === normalizeAnswer(expected);
  if (!correct) return { correct: false, quality: 1, label: "还没想起来" };
  if (hints > 0) return { correct: true, quality: 3, label: "提示后想起" };
  return { correct: true, quality: 5, label: "独立想起" };
}

export function calculateNextReview({ quality, stability = 1, difficulty = 5 }) {
  const q = Math.max(0, Math.min(5, quality));
  const nextDifficulty = Math.max(1, Math.min(10, difficulty + (3 - q) * 0.45));
  const growth = q < 3 ? 0.35 : 1 + (q - 2) * (1.15 - nextDifficulty * 0.035);
  const nextStability = Math.max(0.25, Math.round(stability * growth * 100) / 100);
  const intervalDays = q < 3 ? 1 : Math.max(1, Math.round(nextStability * 2.4));
  return { stability: nextStability, difficulty: Math.round(nextDifficulty * 100) / 100, intervalDays };
}

export function adaptiveDailyLoad({ dueReviews, recentAccuracy }) {
  const reviewMinutes = Math.min(12, Math.max(dueReviews ? 5 : 0, Math.ceil(dueReviews / 2)));
  const newItems = recentAccuracy < 0.55 ? 5 : recentAccuracy < 0.8 ? 8 : 10;
  return { reviewMinutes, newItems, totalMinutes: reviewMinutes + 30 };
}

export function dedupeEvents(events) {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createStudyOrder(items) {
  const featured = items.filter((item) => item.kind === "word" && item.cue && item.example && item.collocation);
  const featuredIds = new Set(featured.map((item) => item.id));
  const chunks = items.filter((item) => item.kind === "chunk");
  const words = items.filter((item) => item.kind === "word" && !featuredIds.has(item.id));
  const ordered = [...featured];
  let chunkIndex = 0;
  let wordIndex = 0;
  while (chunkIndex < chunks.length || wordIndex < words.length) {
    if (chunkIndex < chunks.length) ordered.push(chunks[chunkIndex++]);
    for (let count = 0; count < 3 && wordIndex < words.length; count += 1) ordered.push(words[wordIndex++]);
  }
  return ordered.map((item) => item.id);
}

export function dueReviewIds(progress, now = new Date()) {
  const at = new Date(now).getTime();
  return Object.values(progress)
    .filter((item) => new Date(item.dueAt).getTime() <= at)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .map((item) => item.id);
}

export function buildDailyPlan({ items, progress, nextLexiconIndex = 0, errorLog = [], attempts = 0, correct = 0, now = new Date() }) {
  const order = createStudyOrder(items);
  const accuracy = attempts ? correct / attempts : 0.72;
  const overdue = dueReviewIds(progress, now);
  const unresolvedErrors = errorLog.filter((error) => error.lexiconId && !error.resolvedAt).map((error) => error.lexiconId);
  const reviewIds = [...new Set([...unresolvedErrors, ...overdue])].filter((id) => order.includes(id)).slice(0, 24);
  const { newItems } = adaptiveDailyLoad({ dueReviews: reviewIds.length, recentAccuracy: accuracy });
  const newIds = order.slice(nextLexiconIndex, Math.min(order.length, nextLexiconIndex + newItems));
  return { date: dateKey(now), reviewIds, newIds };
}

export function selectReviewAspect(item, progress) {
  const available = item.example && item.collocation ? ["form", "meaning", "use"] : ["form", "meaning"];
  const mastery = progress?.mastery ?? { form: 0, meaning: 0, use: 0 };
  return available.slice().sort((a, b) => mastery[a] - mastery[b] || available.indexOf(a) - available.indexOf(b))[0];
}

function clampMastery(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function introduceLexiconItem(existing, itemId, { now = new Date(), confidence = 3, supportsUse = false } = {}) {
  const stamp = new Date(now).toISOString();
  const current = existing ?? {
    id: itemId,
    introducedAt: stamp,
    lastReviewedAt: stamp,
    dueAt: stamp,
    stability: 1,
    difficulty: 5,
    exposures: 0,
    lapses: 0,
    mastery: { form: 0, meaning: 0, use: 0 },
  };
  const gain = confidence <= 2 ? 8 : confidence === 3 ? 18 : 28;
  return {
    ...current,
    lastReviewedAt: stamp,
    dueAt: new Date(new Date(now).getTime() + DAY_MS).toISOString(),
    exposures: current.exposures + 1,
    mastery: {
      form: clampMastery(current.mastery.form + gain * 0.8),
      meaning: clampMastery(current.mastery.meaning + gain),
      use: clampMastery(current.mastery.use + (supportsUse ? gain * 0.65 : 0)),
    },
  };
}

export function scheduleLexiconReview(existing, aspect, quality, now = new Date()) {
  if (!existing) throw new Error("Cannot schedule an item before it is introduced");
  const next = calculateNextReview({ quality, stability: existing.stability, difficulty: existing.difficulty });
  const change = quality < 3 ? -8 : quality === 3 ? 8 : 18;
  return {
    ...existing,
    lastReviewedAt: new Date(now).toISOString(),
    dueAt: new Date(new Date(now).getTime() + next.intervalDays * DAY_MS).toISOString(),
    stability: next.stability,
    difficulty: next.difficulty,
    exposures: existing.exposures + 1,
    lapses: existing.lapses + (quality < 3 ? 1 : 0),
    mastery: { ...existing.mastery, [aspect]: clampMastery(existing.mastery[aspect] + change) },
  };
}

export function masteryStats(progress) {
  const values = Object.values(progress);
  if (!values.length) return { introduced: 0, mastered: 0, average: 0 };
  const scores = values.map((item) => (item.mastery.form + item.mastery.meaning + item.mastery.use) / 3);
  return {
    introduced: values.length,
    mastered: scores.filter((score) => score >= 70).length,
    average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
  };
}

export function overallProgress({ introduced, totalVocabulary, completedLessons, totalLessons, masteryAverage }) {
  const coverage = totalVocabulary ? introduced / totalVocabulary : 0;
  const lessons = totalLessons ? completedLessons / totalLessons : 0;
  const mastery = masteryAverage / 100;
  return Math.round(Math.min(1, coverage * 0.45 + mastery * 0.3 + lessons * 0.25) * 100);
}

export function buildThirtySixWeekRoadmap(items) {
  const order = createStudyOrder(items);
  const base = Math.floor(order.length / 36);
  const remainder = order.length % 36;
  let cursor = 0;
  return Array.from({ length: 36 }, (_, index) => {
    const size = base + (index < remainder ? 1 : 0);
    const ids = order.slice(cursor, cursor + size);
    cursor += size;
    return { week: index + 1, ids };
  });
}
