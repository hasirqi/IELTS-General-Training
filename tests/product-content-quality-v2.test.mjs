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
const batch09 = read("../src/content/curriculum-batch-09.ts");
const batch10 = read("../src/content/curriculum-batch-10.ts");
const batch11 = read("../src/content/curriculum-batch-11.ts");
const batch12 = read("../src/content/curriculum-batch-12.ts");
const batch13 = read("../src/content/curriculum-batch-13.ts");
const sentenceBase = read("../src/content/sentence-challenges-base.ts");
const foundationBatch02 = read("../src/content/foundation-batch-02.ts");
const foundationBatch03 = read("../src/content/foundation-batch-03.ts");
const foundationBatch04 = read("../src/content/foundation-batch-04.ts");
const foundationBatch05 = read("../src/content/foundation-batch-05.ts");
const foundationBatch06 = read("../src/content/foundation-batch-06.ts");
const foundationBatch07 = read("../src/content/foundation-batch-07.ts");
const foundationBatch08 = read("../src/content/foundation-batch-08.ts");
const foundationBatch09 = read("../src/content/foundation-batch-09.ts");
const sentence = `${sentenceBase}\n${foundationBatch02}\n${foundationBatch03}\n${foundationBatch04}\n${foundationBatch05}\n${foundationBatch06}\n${foundationBatch07}\n${foundationBatch08}\n${foundationBatch09}`;
const drillsBase = read("../src/content/speaking-drills-base.ts");
const drills = `${drillsBase}\n${foundationBatch02}\n${foundationBatch03}\n${foundationBatch04}\n${foundationBatch05}\n${foundationBatch06}\n${foundationBatch07}\n${foundationBatch08}\n${foundationBatch09}`;
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
const batchSections09 = sectionsFor(batch09, "09");
const batchSections10 = sectionsFor(batch10, "10");
const batchSections11 = sectionsFor(batch11, "11");
const batchSections12 = sectionsFor(batch12, "12");
const batchSections13 = sectionsFor(batch13, "13");
const combined = {
  listening: `${listening}\n${batchSections02.listening}\n${batchSections03.listening}\n${batchSections04.listening}\n${batchSections05.listening}\n${batchSections06.listening}\n${batchSections07.listening}\n${batchSections08.listening}\n${batchSections09.listening}\n${batchSections10.listening}\n${batchSections11.listening}\n${batchSections12.listening}\n${batchSections13.listening}`,
  reading: `${reading}\n${batchSections02.reading}\n${batchSections03.reading}\n${batchSections04.reading}\n${batchSections05.reading}\n${batchSections06.reading}\n${batchSections07.reading}\n${batchSections08.reading}\n${batchSections09.reading}\n${batchSections10.reading}\n${batchSections11.reading}\n${batchSections12.reading}\n${batchSections13.reading}`,
  writing: `${writing}\n${batchSections02.writing}\n${batchSections03.writing}\n${batchSections04.writing}\n${batchSections05.writing}\n${batchSections06.writing}\n${batchSections07.writing}\n${batchSections08.writing}\n${batchSections09.writing}\n${batchSections10.writing}\n${batchSections11.writing}\n${batchSections12.writing}\n${batchSections13.writing}`,
  speaking: `${speaking}\n${batchSections02.speaking}\n${batchSections03.speaking}\n${batchSections04.speaking}\n${batchSections05.speaking}\n${batchSections06.speaking}\n${batchSections07.speaking}\n${batchSections08.speaking}\n${batchSections09.speaking}\n${batchSections10.speaking}\n${batchSections11.speaking}\n${batchSections12.speaking}\n${batchSections13.speaking}`,
};

test("thirteen validated curriculum batches contain 352 unique lessons", () => {
  const groups = Object.entries(combined).map(([skill, source]) => {
    const prefix = { listening: "l", reading: "r", writing: "w", speaking: "s" }[skill];
    return ids(source, prefix);
  });
  for (const group of groups) {
    assert.equal(group.length, 88);
    assert.equal(new Set(group).size, 88);
  }
  assert.equal(groups.flat().length, 352);
  assert.equal(new Set(groups.flat()).size, 352);
});

test("all 704 objective questions have English prompts and deterministic answers", () => {
  const listeningQuestions = questions(combined.listening);
  const readingQuestions = questions(combined.reading);
  assert.equal(listeningQuestions.length, 352);
  assert.equal(readingQuestions.length, 352);
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
  const expected = { "Part 1": 23, "Part 2": 23, "Part 3": 21, "Part 4": 21 };
  for (const [part, count] of Object.entries(expected)) {
    assert.equal((combined.listening.match(new RegExp(`section:\\s*"${part}"`, "g")) ?? []).length, count);
  }
  const files = [...combined.listening.matchAll(/audioFile:\s*"(l\d+\.mp3)"/g)].map((match) => match[1]);
  assert.equal(files.length, 88);
  assert.equal(new Set(files).size, 88);
});

test("reading, writing and speaking retain complete official structures", () => {
  const expected = [
    [combined.reading, "Section 1", 30], [combined.reading, "Section 2", 35], [combined.reading, "Section 3", 23],
    [combined.writing, "Task 1", 44], [combined.writing, "Task 2", 44],
    [combined.speaking, "Part 1", 30], [combined.speaking, "Part 2", 29], [combined.speaking, "Part 3", 29],
  ];
  for (const [source, section, count] of expected) {
    assert.equal((source.match(new RegExp(`section:\\s*"${section}`, "g")) ?? []).length, count);
  }
});

test("foundation banks and the 36-week roadmap remain substantive and unique", () => {
  const sentenceIds = ids(sentence, "g");
  const drillIds = ids(drills, "d");
  const weeks = [...roadmap.matchAll(/week:(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(sentenceIds.length, 112);
  assert.equal(new Set(sentenceIds).size, 112);
  assert.equal(drillIds.length, 112);
  assert.equal(new Set(drillIds).size, 112);
  assert.deepEqual(weeks, Array.from({ length: 36 }, (_, index) => index + 1));
});

test("all published course sources contain no placeholder copy", () => {
  for (const source of [listening, reading, writing, speaking, batch02, batch03, batch04, batch05, batch06, batch07, batch08, batch09, batch10, batch11, batch12, batch13, sentence, drills, roadmap]) {
    assert.doesNotMatch(source, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
  }
});
