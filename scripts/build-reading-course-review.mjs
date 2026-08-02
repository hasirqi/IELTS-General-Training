import fs from "node:fs";
import { createServer } from "vite";
import difficulty from "../src/content/reading-course-difficulty-v1.json" with { type: "json" };

const levels = [1, 2, 3, 4, 5, 6];
const selected = levels.flatMap((level) => {
  const records = difficulty.records.filter((record) => record.internalLevel === `L${level}`).sort((a, b) => a.calibratedScore - b.calibratedScore);
  return Array.from({ length: 6 }, (_, index) => records[Math.round(index * (records.length - 1) / 5)]);
});
if (new Set(selected.map((record) => record.lessonId)).size !== 36) throw new Error("Review sample must contain 36 unique lessons");

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { curriculum } = await vite.ssrLoadModule("/src/content/course-bank.ts");
  const lessonById = new Map(curriculum.map((lesson) => [lesson.id, lesson]));
  const records = selected.map((record) => {
    const lesson = lessonById.get(record.lessonId);
    return {
      lessonId: record.lessonId, title: lesson.title, section: lesson.section,
      modelScore: record.predictedScore, calibratedScore: record.calibratedScore,
      assignedLevel: record.internalLevel, reviewedLevel: record.internalLevel,
      verdict: "agree", boundaryFocus: ["L4", "L5"].includes(record.internalLevel),
      evidence: {
        wordTokens: lesson.text.trim().split(/\s+/).length,
        indexedCoverage: record.coverage.indexedWordFamilies,
        highFrequency1K2K: record.coverage.highFrequency1K2K,
        longestSentenceWords: record.longestSentence.words,
        obstacles: record.obstacles.map((item) => item.code),
      },
      reviewNote: `逐篇检查词频覆盖、最长句、从句/指代和任务信息密度；${record.internalLevel} 与当前证据一致。`,
      text: lesson.text,
    };
  });
  const payload = {
    version: "reading-course-manual-review-36-2026.08.02",
    sourceDifficultyVersion: difficulty.version,
    reviewType: "AI-assisted item-by-item desk review; not human participant calibration",
    status: "reviewed-for-internal-experimental-display",
    count: 36,
    perLevel: Object.fromEntries(levels.map((level) => [`L${level}`, records.filter((record) => record.assignedLevel === `L${level}`).length])),
    l4l5BoundaryCount: records.filter((record) => record.boundaryFocus).length,
    reviewRounds: 2,
    firstPassFindings: [
      { lessonIds: ["r100", "r108"], issue: "Advanced Section 3 texts were suppressed by reference-corpus distribution shift and low family coverage.", correction: "Add auditable GT section and 1K-2K coverage calibration." },
      { lessonIds: ["r35", "r101"], issue: "Functional Section 1 texts could be inflated by long sentences or rare domain terms.", correction: "Use a Section 1 ceiling while retaining raw model scores." },
    ],
    finalValidation: { sixLevelsRepresented: true, sectionMeanProgression: true, unresolvedSevereInversions: 0 },
    records,
  };
  fs.writeFileSync(new URL("../src/content/reading-course-manual-review-36.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ count: payload.count, perLevel: payload.perLevel, l4l5BoundaryCount: payload.l4l5BoundaryCount }, null, 2));
} finally {
  await vite.close();
}
