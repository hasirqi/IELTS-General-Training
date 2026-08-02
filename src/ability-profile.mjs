export const READING_WEAKNESS_META = {
  vocabulary: { label: "词汇理解", training: "回到原句确认词义和搭配，再用上下文排除干扰项" },
  sentence: { label: "长句关系", training: "标出主干、转折和条件关系，再复述整句意思" },
  locating: { label: "信息定位", training: "先圈题干关键词，再回原文寻找同义改写和证据句" },
  inference: { label: "推断态度", training: "区分原文事实与合理推断，拒绝没有证据的扩大结论" },
  mainIdea: { label: "主旨概括", training: "比较开头、结尾和各段功能，用一句话概括作者目的" },
};

export function classifyReadingQuestion(questionId, kind = "continuous") {
  const index = Number(questionId.match(/-q(\d+)$/)?.[1] ?? 1) - 1;
  if (index === 0) return "mainIdea";
  if (kind === "continuous") {
    if (index === 5) return "vocabulary";
    if (index >= 6) return "inference";
    if (index === 3 || index === 4) return "sentence";
    return "locating";
  }
  if (index === 3 || index === 5) return "sentence";
  return "locating";
}

export function buildReadingWeaknessProfile(answers) {
  const profile = Object.fromEntries(Object.keys(READING_WEAKNESS_META).map(key => [key, { correct: 0, total: 0, wrong: 0 }]));
  for (const answer of answers) {
    const category = answer.weaknessCategory ?? classifyReadingQuestion(answer.questionId, answer.kind);
    const entry = profile[category];
    entry.total += 1;
    entry.correct += answer.correct ? 1 : 0;
    entry.wrong += answer.correct ? 0 : 1;
  }
  return profile;
}

export function weakestReadingCategories(profile, limit = 3) {
  return Object.entries(profile ?? {})
    .filter(([, value]) => value.total > 0 && value.wrong > 0)
    .sort((a, b) => (b[1].wrong / b[1].total) - (a[1].wrong / a[1].total) || b[1].wrong - a[1].wrong)
    .slice(0, limit)
    .map(([category, value]) => ({ category, ...READING_WEAKNESS_META[category], ...value }));
}

export function vocabularyLevel(value) {
  if (!value) return null;
  if (value < 2000) return { level: 1, label: "1K–2K 基础" };
  if (value < 3000) return { level: 2, label: "2K–3K 起步" };
  if (value < 4000) return { level: 3, label: "3K–4K 发展" };
  if (value < 5000) return { level: 4, label: "4K–5K GT 基础" };
  if (value < 8000) return { level: 5, label: "5K–8K GT 核心" };
  return { level: 6, label: "8K+ 高阶" };
}

export function gtReadingReadiness(readingResult) {
  if (!readingResult) return { label: "尚未测量", detail: "先完成阅读能力测评，才能形成 GT 阅读趋势。", level: 0 };
  const level = Number(String(readingResult.internalLevel).replace("L", "")) || 1;
  const labels = ["基础起步", "建立生活文本基础", "进入 GT 基础训练", "进入限时定位训练", "接近 6 分所需训练难度", "高难文本挑战"];
  return { label: labels[level - 1], detail: `内部 ${readingResult.internalLevel} · ${readingResult.internalReadingValue}L 实验值`, level };
}

export function assessmentTrend(results, field) {
  if (!results?.length) return { direction: "none", delta: 0, label: "尚无历史" };
  if (results.length === 1) return { direction: "baseline", delta: 0, label: "已建立基线" };
  const latest = Number(results.at(-1)?.[field] ?? 0);
  const previous = Number(results.at(-2)?.[field] ?? 0);
  const delta = latest - previous;
  if (Math.abs(delta) < 1) return { direction: "stable", delta, label: "与上次基本一致" };
  return { direction: delta > 0 ? "up" : "down", delta, label: delta > 0 ? "较上次提高" : "较上次回落" };
}

export function measurementStatus(sessions, calibration) {
  const vocabulary = sessions.filter(item => item.assessment === "vocabulary-cat");
  const reading = sessions.filter(item => item.assessment === "reading-cat");
  const responses = sessions.reduce((sum, item) => sum + item.responses.length, 0);
  return {
    vocabularySessions: vocabulary.length,
    readingSessions: reading.length,
    responses,
    model: calibration?.status === "calibrated" ? "实证 2PL" : "审核参数 1PL",
    empirical: calibration?.status === "calibrated",
    note: calibration?.status === "calibrated" ? "实证参数已通过样本门禁" : "真实样本不足，继续积累；不会用模拟数据替代实证参数",
  };
}
