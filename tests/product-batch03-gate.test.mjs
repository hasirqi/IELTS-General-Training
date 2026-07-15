import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { verifiedWordBatch01 } from "../src/content/verified-word-batch-01.mjs";
import { verifiedWordBatch02 } from "../src/content/verified-word-batch-02.mjs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const previousCourses = [
  "../src/content/curriculum-v2.ts",
  "../src/content/reading-lessons.ts",
  "../src/content/writing-lessons.ts",
  "../src/content/speaking-lessons.ts",
  "../src/content/curriculum-batch-02.ts",
].map(read).join("\n");
const batch03 = read("../src/content/curriculum-batch-03.ts");

const values = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

test("all 300 reviewed word contexts remain unique across both batches", () => {
  const reviewed = [...Object.values(verifiedWordBatch01), ...Object.values(verifiedWordBatch02)];
  assert.equal(reviewed.length, 300);
  const examples = reviewed.map((item) => item.example.toLowerCase());
  const collocations = reviewed.map((item) => item.collocation.toLowerCase());
  assert.equal(new Set(examples).size, 300);
  assert.equal(new Set(collocations).size, 300);
});

test("batch 03 adds only distinct, substantive lesson scenarios", () => {
  const newIds = values(batch03, /id:\s*"([lrsw]\d+)"/g);
  const newTitles = values(batch03, /title:\s*"([^"]+)"/g);
  const previousTitles = new Set(values(previousCourses, /title:\s*"([^"]+)"/g));
  const newQuestions = values(batch03, /q\(\s*"([^"]+)"/g);
  const previousQuestions = new Set(values(previousCourses, /q\(\s*"([^"]+)"/g));
  assert.equal(newIds.length, 32);
  assert.equal(new Set(newIds).size, 32);
  assert.equal(newTitles.length, 32);
  assert.equal(new Set(newTitles).size, 32);
  assert.equal(newQuestions.length, 64);
  assert.equal(new Set(newQuestions).size, 64);
  for (const title of newTitles) assert.equal(previousTitles.has(title), false, `repeated title: ${title}`);
  for (const prompt of newQuestions) assert.equal(previousQuestions.has(prompt), false, `repeated question: ${prompt}`);
  assert.doesNotMatch(batch03, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});
