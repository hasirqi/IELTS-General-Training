import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const listening = read("../src/content/curriculum-v2.ts");
const reading = read("../src/content/reading-lessons.ts");
const writing = read("../src/content/writing-lessons.ts");
const speaking = read("../src/content/speaking-lessons.ts");
const batch02 = read("../src/content/curriculum-batch-02.ts");
const sentence = read("../src/content/sentence-challenges.ts");
const drills = read("../src/content/speaking-drills.ts");
const roadmap = read("../src/content/roadmap.ts");

function ids(source, prefix) {
  return [...source.matchAll(new RegExp(`id:\\s*"(${prefix}\\d+)"`, "g"))].map((match) => match[1]);
}

function questions(source) {
  const pattern = /q\(\s*"([^"]+)"\s*,\s*(\[[^\]]+\])\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)/g;
  return [...source.matchAll(pattern)].map((match) => ({
    prompt: match[1],
    options: JSON.parse(match[2]),
    answer: match[3],
    explanation: match[4],
  }));
}

const batchSection = (start, end) => batch02.slice(batch02.indexOf(start), batch02.indexOf(end));
const batchSections = {
  listening: batchSection("export const listeningBatch02", "export const readingBatch02"),
  reading: batchSection("export const readingBatch02", "const task1Checklist"),
  writing: batchSection("export const writingBatch02", "export const speakingBatch02"),
  speaking: batchSection("export const speakingBatch02", "export const curriculumBatch02"),
};
const combined = {
  listening: `${listening}\n${batchSections.listening}`,
  reading: `${reading}\n${batchSections.reading}`,
  writing: `${writing}\n${batchSections.writing}`,
  speaking: `${speaking}\n${batchSections.speaking}`,
};

test("two validated curriculum batches contain 96 unique lessons", () => {
  const groups = Object.entries(combined).map(([skill, source]) => {
    const prefix = { listening: "l", reading: "r", writing: "w", speaking: "s" }[skill];
    return ids(source, prefix);
  });
  for (const group of groups) {
    assert.equal(group.length, 24);
    assert.equal(new Set(group).size, 24);
  }
  assert.equal(groups.flat().length, 96);
  assert.equal(new Set(groups.flat()).size, 96);
});

test("all 192 objective questions have English prompts and deterministic answers", () => {
  const listeningQuestions = questions(combined.listening);
  const readingQuestions = questions(combined.reading);
  assert.equal(listeningQuestions.length, 96);
  assert.equal(readingQuestions.length, 96);
  for (const question of [...listeningQuestions, ...readingQuestions]) {
    assert.match(question.prompt, /^[A-Za-z]/);
    assert.doesNotMatch(question.prompt, /[\u3400-\u9fff]/);
    assert.equal(question.options.length, 3, question.prompt);
    assert.equal(new Set(question.options).size, 3, question.prompt);
    assert.ok(question.options.includes(question.answer), question.prompt);
    assert.ok(question.explanation.length >= 4, question.prompt);
  }
});

test("listening keeps all four official parts and fixed audio coverage", () => {
  const expected = { "Part 1": 7, "Part 2": 7, "Part 3": 5, "Part 4": 5 };
  for (const [part, count] of Object.entries(expected)) {
    assert.equal((combined.listening.match(new RegExp(`section:\\s*"${part}"`, "g")) ?? []).length, count);
  }
  const files = [...combined.listening.matchAll(/audioFile:\s*"(l\d+\.mp3)"/g)].map((match) => match[1]);
  assert.equal(files.length, 24);
  assert.equal(new Set(files).size, 24);
});

test("reading, writing and speaking retain complete official structures", () => {
  const expected = [
    [combined.reading, "Section 1", 9], [combined.reading, "Section 2", 8], [combined.reading, "Section 3", 7],
    [combined.writing, "Task 1", 12], [combined.writing, "Task 2", 12],
    [combined.speaking, "Part 1", 9], [combined.speaking, "Part 2", 8], [combined.speaking, "Part 3", 7],
  ];
  for (const [source, section, count] of expected) {
    assert.equal((source.match(new RegExp(`section:\\s*"${section}`, "g")) ?? []).length, count);
  }
});

test("foundation banks and the 36-week roadmap remain substantive and unique", () => {
  const sentenceIds = ids(sentence, "g");
  const drillIds = ids(drills, "d");
  const weeks = [...roadmap.matchAll(/week:(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(sentenceIds.length, 36);
  assert.equal(new Set(sentenceIds).size, 36);
  assert.equal(drillIds.length, 36);
  assert.equal(new Set(drillIds).size, 36);
  assert.deepEqual(weeks, Array.from({ length: 36 }, (_, index) => index + 1));
});

test("all published course sources contain no placeholder copy", () => {
  for (const source of [listening, reading, writing, speaking, batch02, sentence, drills, roadmap]) {
    assert.doesNotMatch(source, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
  }
});
