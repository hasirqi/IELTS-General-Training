export const VALIDATION_AREAS = {
  recommendation: { label: "推荐是否合适", hint: "文章和课程是否大多位于当前能力附近或略高一级" },
  errorReturn: { label: "错题是否回来", hint: "词汇和阅读错题是否正确进入复习与错因档案" },
  difficulty: { label: "难度是否倒挂", hint: "标成较低层的材料是否反而明显更难" },
  mobile: { label: "手机操作", hint: "触控、字号、输入、页面切换和安装式 PWA 是否稳定" },
  audio: { label: "录音与播放", hint: "固定 MP3、播放状态和模考一次播放是否稳定" },
};

export function auditLearningState(state, references) {
  const lexiconIds = new Set(references.lexiconIds);
  const lessonIds = new Set(references.lessonIds);
  const danglingProgress = Object.keys(state.lexiconProgress ?? {}).filter((id) => !lexiconIds.has(id));
  const danglingPlan = [...(state.dailyPlan?.reviewIds ?? []), ...(state.dailyPlan?.newIds ?? [])].filter((id) => !lexiconIds.has(id));
  const danglingErrors = (state.errorLog ?? []).filter((item) => item.lexiconId && !lexiconIds.has(item.lexiconId));
  const unknownLessons = (state.completedLessons ?? []).filter((id) => !lessonIds.has(id));
  const duplicateLessons = (state.completedLessons?.length ?? 0) - new Set(state.completedLessons ?? []).size;
  const issues = [
    danglingProgress.length && danglingProgress.length + " 条词汇进度找不到当前词条",
    danglingPlan.length && danglingPlan.length + " 条复习计划引用失效",
    danglingErrors.length && danglingErrors.length + " 条错题引用失效",
    unknownLessons.length && unknownLessons.length + " 条课程记录找不到当前课程",
    duplicateLessons > 0 && duplicateLessons + " 条重复课程完成记录",
  ].filter(Boolean);
  return { ok: issues.length === 0, issues, danglingProgress, danglingPlan, danglingErrors, unknownLessons, duplicateLessons };
}

export function latestValidationByArea(observations) {
  const latest = {};
  for (const observation of observations ?? []) latest[observation.area] = observation;
  return latest;
}

export function elapsedValidationDays(startedAt, now = Date.now()) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 86_400_000));
}
