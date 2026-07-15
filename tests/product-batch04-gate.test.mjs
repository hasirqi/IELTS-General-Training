import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const previousCourses = [
  "../src/content/curriculum-v2.ts",
  "../src/content/reading-lessons.ts",
  "../src/content/writing-lessons.ts",
  "../src/content/speaking-lessons.ts",
  "../src/content/curriculum-batch-02.ts",
  "../src/content/curriculum-batch-03.ts",
].map(read).join("\n");
const batch04 = read("../src/content/curriculum-batch-04.ts");

const values = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

test("batch 04 contains eight new lessons for every skill", () => {
  const expected = {
    l: Array.from({ length: 8 }, (_, index) => `l${index + 33}`),
    r: Array.from({ length: 8 }, (_, index) => `r${index + 33}`),
    w: Array.from({ length: 8 }, (_, index) => `w${index + 33}`),
    s: Array.from({ length: 8 }, (_, index) => `s${index + 33}`),
  };
  for (const [prefix, ids] of Object.entries(expected)) {
    assert.deepEqual(values(batch04, new RegExp(`id:\\s*"(${prefix}\\d+)"`, "g")), ids);
  }
});

test("batch 04 scenarios and objective questions do not repeat earlier content", () => {
  const newTitles = values(batch04, /title:\s*"([^"]+)"/g);
  const previousTitles = new Set(values(previousCourses, /title:\s*"([^"]+)"/g));
  const newQuestions = values(batch04, /q\(\s*"([^"]+)"/g);
  const previousQuestions = new Set(values(previousCourses, /q\(\s*"([^"]+)"/g));
  assert.equal(newTitles.length, 32);
  assert.equal(new Set(newTitles).size, 32);
  assert.equal(newQuestions.length, 64);
  assert.equal(new Set(newQuestions).size, 64);
  for (const title of newTitles) assert.equal(previousTitles.has(title), false, `repeated title: ${title}`);
  for (const prompt of newQuestions) assert.equal(previousQuestions.has(prompt), false, `repeated question: ${prompt}`);
  assert.doesNotMatch(batch04, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});

test("batch 04 listening lessons map one-to-one to audio files", () => {
  const files = values(batch04, /audioFile:\s*"(l\d+\.mp3)"/g);
  assert.deepEqual(files, Array.from({ length: 8 }, (_, index) => `l${index + 33}.mp3`));
});
