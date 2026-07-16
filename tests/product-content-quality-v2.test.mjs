import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const listening = read("../src/content/curriculum-v2.ts");
const reading = read("../src/content/reading-lessons.ts");
const writing = read("../src/content/writing-lessons.ts");
const speaking = read("../src/content/speaking-lessons.ts");
const batch02 = read("../src/content/curriculum-batch-02.ts");
const batch03 = read("../src/content/curriculum-batch-03.ts");
const batch04 = read("../src/content/curriculum-batch-04.ts");
const batch05 = read("../src/content/curriculum-batch-05.ts");
const batch06 = read("../src/content/curriculum-batch-06.ts");
const batch07 = read("../src/content/curriculum-batch-07.ts");
const batch08 = read("../src/content/curriculum-batch-08.ts");
const sentenceBase = read("../src/content/sentence-challenges-base.ts");
const foundationBatch02 = read("../src/content/foundation-batch-02.ts");
const foundationBatch03 = read("../src/content/foundation-batch-03.ts");
const foundationBatch04 = read("../src/content/foundation-batch-04.ts");
const sentence = `${sentenceBase}\n${foundationBatch02}\n${foundationBatch03}\n${foundationBatch04}`;
const drillsBase = read("../src/content/speaking-drills-base.ts");
const drills = `${drillsBase}\n${foundationBatch02}\n${foundationBatch03}\n${foundationBatch04}`;
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

const batchSection = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const sectionsFor = (source, suffix) => ({
  listening: batchSection(source, `export const listeningBatch${suffix}`, `export const readingBatch${suffix}`),
  reading: batchSection(source, `export const readingBatch${suffix}`, "const task1Checklist"),
  writing: batchSection(source, `export const writingBatch${suffix}`, `export const speakingBatch${suffix}`),
  speaking: batchSection(source, `export const speakingBatch${suffix}`, `export const curriculumBatch${suffix}`),
});
const batchSections02 = sectionsFor(batch02, "02");
const batchSections03 = sectionsFor(batch03, "03");
const batchSections04 = sectionsFor(batch04, "04");
const batchSections05 = sectionsFor(batch05, "05");
const batchSections06 = sectionsFor(batch06, "06");
const batchSections07 = sectionsFor(batch07, "07");
const batchSections08 = sectionsFor(batch08, "08");
const combined = {
  listening: `${listening}\n${batchSections02.listening}\n${batchSections03.listening}\n${batchSections04.listening}\n${batchSections05.listening}\n${batchSections06.listening}\n${batchSections07.listening}\n${batchSections08.listening}`,
  reading: `${reading}\n${batchSections02.reading}\n${batchSections03.reading}\n${batchSections04.reading}\n${batchSections05.reading}\n${batchSections06.reading}\n${batchSections07.reading}\n${batchSections08.reading}`,
  writing: `${writing}\n${batchSections02.writing}\n${batchSections03.writing}\n${batchSections04.writing}\n${batchSections05.writing}\n${batchSections06.writing}\n${batchSections07.writing}\n${batchSections08.writing}`,
  speaking: `${speaking}\n${batchSections02.speaking}\n${batchSections03.speaking}\n${batchSections04.speaking}\n${batchSections05.speaking}\n${batchSections06.speaking}\n${batchSections07.speaking}\n${batchSections08.speaking}`,
};

test("eight validated curriculum batches contain 272 unique lessons", () => {
  const groups = Object.entries(combined).map(([skill, source]) => {
    const prefix = { listening: "l", reading: "r", writing: "w", speaking: "s" }[skill];
    return ids(source, prefix);
  });
  for (const group of groups) {
    assert.equal(group.length, 68);
    assert.equal(new Set(group).size, 68);
  }
  assert.equal(groups.flat().length, 272);
  assert.equal(new Set(groups.flat()).size, 272);
});

test("all 544 objective questions have English prompts and deterministic answers", () => {
  const listeningQuestions = questions(combined.listening);
  const readingQuestions = questions(combined.reading);
  assert.equal(listeningQuestions.length, 272);
  assert.equal(readingQuestions.length, 272);
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
  const expected = { "Part 1": 18, "Part 2": 18, "Part 3": 16, "Part 4": 16 };
  for (const [part, count] of Object.entries(expected)) {
    assert.equal((combined.listening.match(new RegExp(`section:\\s*"${part}"`, "g")) ?? []).length, count);
  }
  const files = [...combined.listening.matchAll(/audioFile:\s*"(l\d+\.mp3)"/g)].map((match) => match[1]);
  assert.equal(files.length, 68);
  assert.equal(new Set(files).size, 68);
});

test("reading, writing and speaking retain complete official structures", () => {
  const expected = [
    [combined.reading, "Section 1", 25], [combined.reading, "Section 2", 25], [combined.reading, "Section 3", 18],
    [combined.writing, "Task 1", 34], [combined.writing, "Task 2", 34],
    [combined.speaking, "Part 1", 25], [combined.speaking, "Part 2", 24], [combined.speaking, "Part 3", 19],
  ];
  for (const [source, section, count] of expected) {
    assert.equal((source.match(new RegExp(`section:\\s*"${section}`, "g")) ?? []).length, count);
  }
});

test("foundation banks and the 36-week roadmap remain substantive and unique", () => {
  const sentenceIds = ids(sentence, "g");
  const drillIds = ids(drills, "d");
  const weeks = [...roadmap.matchAll(/week:(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(sentenceIds.length, 72);
  assert.equal(new Set(sentenceIds).size, 72);
  assert.equal(drillIds.length, 72);
  assert.equal(new Set(drillIds).size, 72);
  assert.deepEqual(weeks, Array.from({ length: 36 }, (_, index) => index + 1));
});

test("all published course sources contain no placeholder copy", () => {
  for (const source of [listening, reading, writing, speaking, batch02, batch03, batch04, batch05, batch06, batch07, batch08, sentence, drills, roadmap]) {
    assert.doesNotMatch(source, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
  }
});
