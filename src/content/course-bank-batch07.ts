import { curriculum as previousCurriculum } from "./course-bank-batch06";
import { curriculumBatch07 } from "./curriculum-batch-07";
import type { CourseLesson } from "./curriculum-v2";

export type { CourseLesson };
export const curriculum: CourseLesson[] = [...previousCurriculum, ...curriculumBatch07];
const count = (skill: CourseLesson["skill"]) => curriculum.filter((lesson) => lesson.skill === skill).length;
export const skillMeta = {
  listening: { label: "听力", description: "Part 1–4 · 学习与模考模式", count: count("listening") },
  reading: { label: "阅读", description: "Section 1–3 · 生活、工作、长文", count: count("reading") },
  writing: { label: "写作", description: "Task 1 书信 · Task 2 议论文", count: count("writing") },
  speaking: { label: "口语", description: "Part 1、2、3 完整覆盖", count: count("speaking") },
} as const;
