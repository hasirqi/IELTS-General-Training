import { listeningLessons, type CourseLesson } from "./curriculum-v2";
import { readingLessons } from "./reading-lessons";
import { speakingLessons } from "./speaking-lessons";
import { writingLessons } from "./writing-lessons";

export type { CourseLesson };

export const curriculum: CourseLesson[] = [
  ...listeningLessons,
  ...readingLessons,
  ...writingLessons,
  ...speakingLessons,
];

export const skillMeta = {
  listening: { label: "听力", description: "Part 1–4 · 学习与模考双模式", count: listeningLessons.length },
  reading: { label: "阅读", description: "Section 1–3 · 生活、工作、长文", count: readingLessons.length },
  writing: { label: "写作", description: "Task 1 书信 · Task 2 议论文", count: writingLessons.length },
  speaking: { label: "口语", description: "Part 1、2、3 完整覆盖", count: speakingLessons.length },
} as const;
