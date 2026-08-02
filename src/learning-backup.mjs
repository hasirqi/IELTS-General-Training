export const LEARNING_BACKUP_SCHEMA = "breakthrough-ielts-learning-backup-1";
export const COURSE_ARTIFACT_PREFIXES = ["ielts-draft-", "ielts-feedback-"];

export function collectCourseArtifacts(storage) {
  const artifacts = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && COURSE_ARTIFACT_PREFIXES.some((prefix) => key.startsWith(prefix))) artifacts[key] = storage.getItem(key) ?? "";
  }
  return artifacts;
}

export function restoreCourseArtifacts(storage, artifacts) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && COURSE_ARTIFACT_PREFIXES.some((prefix) => key.startsWith(prefix))) storage.removeItem(key);
  }
  for (const [key, value] of Object.entries(artifacts ?? {})) {
    if (COURSE_ARTIFACT_PREFIXES.some((prefix) => key.startsWith(prefix)) && typeof value === "string") storage.setItem(key, value);
  }
}

export function buildLearningBackup(state, courseArtifacts, content) {
  const exportedAt = new Date().toISOString();
  return { schemaVersion: LEARNING_BACKUP_SCHEMA, exportedAt, product: "破壁 IELTS 6", content, state: { ...state, lastBackupAt: exportedAt }, courseArtifacts };
}

export function parseLearningBackup(value) {
  if (!value || typeof value !== "object") throw new Error("备份文件不是有效的 JSON 对象");
  if (value.schemaVersion !== LEARNING_BACKUP_SCHEMA) throw new Error("备份版本不受支持，请选择由本产品导出的完整学习备份");
  if (!value.state || typeof value.state !== "object") throw new Error("备份缺少学习状态");
  for (const key of ["completedLessons", "errorLog", "vocabularyTests", "readingAssessments", "measurementSessions"]) {
    if (!Array.isArray(value.state[key])) throw new Error("备份中的 " + key + " 数据不完整");
  }
  if (!value.state.lexiconProgress || typeof value.state.lexiconProgress !== "object") throw new Error("备份缺少词汇复习状态");
  const courseArtifacts = value.courseArtifacts && typeof value.courseArtifacts === "object" ? value.courseArtifacts : {};
  return { ...value, courseArtifacts };
}

export function summarizeLearningBackup(payload) {
  const state = payload.state;
  return {
    exportedAt: payload.exportedAt,
    lexiconProgress: Object.keys(state.lexiconProgress ?? {}).length,
    completedLessons: new Set(state.completedLessons ?? []).size,
    errors: (state.errorLog ?? []).length,
    vocabularyTests: (state.vocabularyTests ?? []).length,
    readingAssessments: (state.readingAssessments ?? []).length,
    courseArtifacts: Object.keys(payload.courseArtifacts ?? {}).length,
  };
}

export function downloadLearningBackup(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ielts-learning-backup-" + payload.exportedAt.slice(0, 10) + ".json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
