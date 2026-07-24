import { curriculum as previousCurriculum } from "./course-bank-batch07";
import { curriculumBatch08 } from "./curriculum-batch-08";
import { curriculumBatch09 } from "./curriculum-batch-09";
import { curriculumBatch10 } from "./curriculum-batch-10";
import { curriculumBatch11 } from "./curriculum-batch-11";
import { curriculumBatch12 } from "./curriculum-batch-12";
import { curriculumBatch13 } from "./curriculum-batch-13";
import { curriculumBatch14 } from "./curriculum-batch-14";
import { curriculumBatch15 } from "./curriculum-batch-15";
import { curriculumBatch16 } from "./curriculum-batch-16";
import { curriculumBatch17 } from "./curriculum-batch-17";
import { curriculumBatch18 } from "./curriculum-batch-18";
import { curriculumBatch19 } from "./curriculum-batch-19";
import { curriculumBatch20 } from "./curriculum-batch-20";
import { curriculumBatch21 } from "./curriculum-batch-21";
import { curriculumBatch22 } from "./curriculum-batch-22";
import { curriculumBatch23 } from "./curriculum-batch-23";
import type { CourseLesson } from "./curriculum-v2";

export type { CourseLesson };
export const curriculum: CourseLesson[] = [...previousCurriculum, ...curriculumBatch08, ...curriculumBatch09, ...curriculumBatch10, ...curriculumBatch11, ...curriculumBatch12, ...curriculumBatch13, ...curriculumBatch14, ...curriculumBatch15, ...curriculumBatch16, ...curriculumBatch17, ...curriculumBatch18, ...curriculumBatch19, ...curriculumBatch20, ...curriculumBatch21, ...curriculumBatch22, ...curriculumBatch23];
const count = (skill: CourseLesson["skill"]) => curriculum.filter((lesson) => lesson.skill === skill).length;
export const skillMeta = {
  listening: { label: "听力", description: "Part 1–4 · 学习与模考模式", count: count("listening") },
  reading: { label: "阅读", description: "Section 1–3 · 生活、工作、长文", count: count("reading") },
  writing: { label: "写作", description: "Task 1 书信 · Task 2 议论文", count: count("writing") },
  speaking: { label: "口语", description: "Part 1、2、3 完整覆盖", count: count("speaking") },
} as const;
