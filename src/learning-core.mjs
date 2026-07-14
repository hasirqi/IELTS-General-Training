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
  const reviewMinutes = Math.min(10, Math.max(5, Math.ceil(dueReviews / 2)));
  const newItems = recentAccuracy < 0.55 ? 5 : recentAccuracy < 0.8 ? 8 : 10;
  return { reviewMinutes, newItems, totalMinutes: reviewMinutes + 30 };
}

export function dedupeEvents(events) {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
