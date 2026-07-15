import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const previousCourses = [
  "../src/content/curriculum-v2.ts", "../src/content/reading-lessons.ts",
  "../src/content/writing-lessons.ts", "../src/content/speaking-lessons.ts",
  "../src/content/curriculum-batch-02.ts", "../src/content/curriculum-batch-03.ts",
  "../src/content/curriculum-batch-04.ts",
].map(read).join("\n");
const batch05 = read("../src/content/curriculum-batch-05.ts");
const values = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

test("batch 05 contains eight new lessons for every skill", () => {
  for (const prefix of ["l", "r", "w", "s"]) {
    const expected = Array.from({ length: 8 }, (_, index) => `${prefix}${index + 41}`);
    assert.deepEqual(values(batch05, new RegExp(`id:\\s*"(${prefix}\\d+)"`, "g")), expected);
  }
});

test("batch 05 scenarios and questions are substantive and non-repeating", () => {
  const newTitles = values(batch05, /title:\s*"([^"]+)"/g);
  const priorTitles = new Set(values(previousCourses, /title:\s*"([^"]+)"/g));
  const newQuestions = values(batch05, /q\(\s*"([^"]+)"/g);
  const priorQuestions = new Set(values(previousCourses, /q\(\s*"([^"]+)"/g));
  assert.equal(newTitles.length, 32);
  assert.equal(new Set(newTitles).size, 32);
  assert.equal(newQuestions.length, 64);
  assert.equal(new Set(newQuestions).size, 64);
  for (const title of newTitles) assert.equal(priorTitles.has(title), false, `repeated title: ${title}`);
  for (const prompt of newQuestions) assert.equal(priorQuestions.has(prompt), false, `repeated question: ${prompt}`);
  assert.doesNotMatch(batch05, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});

test("batch 05 listening lessons map one-to-one to audio files", () => {
  const files = values(batch05, /audioFile:\s*"(l\d+\.mp3)"/g);
  assert.deepEqual(files, Array.from({ length: 8 }, (_, index) => `l${index + 41}.mp3`));
});
