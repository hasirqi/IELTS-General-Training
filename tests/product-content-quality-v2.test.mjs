import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const listening = read("../src/content/curriculum-v2.ts");
const reading = read("../src/content/reading-lessons.ts");
const writing = read("../src/content/writing-lessons.ts");
const speaking = read("../src/content/speaking-lessons.ts");
const sentence = read("../src/content/sentence-challenges.ts");
const drills = read("../src/content/speaking-drills.ts");
const roadmap = read("../src/content/roadmap.ts");

function ids(source, prefix) {
  return [...source.matchAll(new RegExp(`id:\"(${prefix}\\d+)\"`, "g"))].map((match) => match[1]);
}

function questions(source) {
  const pattern = /q\("([^"]+)",(\[[^\]]+\]),"([^"]+)","([^"]*)"\)/g;
  return [...source.matchAll(pattern)].map((match) => ({ prompt:match[1], options:JSON.parse(match[2]), answer:match[3], explanation:match[4] }));
}

test("the first complete curriculum batch contains 64 unique lessons", () => {
  const groups = [ids(listening,"l"),ids(reading,"r"),ids(writing,"w"),ids(speaking,"s")];
  for (const group of groups) {
    assert.equal(group.length,16);
    assert.equal(new Set(group).size,16);
  }
  assert.equal(groups.flat().length,64);
});

test("all 128 objective questions have English prompts and deterministic answers", () => {
  const objective = [...questions(listening),...questions(reading)];
  assert.equal(questions(listening).length,64);
  assert.equal(questions(reading).length,64);
  for (const question of objective) {
    assert.match(question.prompt,/^[A-Za-z]/);
    assert.doesNotMatch(question.prompt,/[一-鿿]/);
    assert.equal(question.options.length,3,question.prompt);
    assert.equal(new Set(question.options).size,3,question.prompt);
    assert.ok(question.options.includes(question.answer),question.prompt);
    assert.ok(question.explanation.length>=4,question.prompt);
  }
});

test("listening deliberately gives beginners more Part 1 and Part 2 practice", () => {
  const expected = {"Part 1":5,"Part 2":5,"Part 3":3,"Part 4":3};
  for (const [part,count] of Object.entries(expected)) assert.equal((listening.match(new RegExp(`section:\"${part}\"`,"g"))??[]).length,count);
  const files = [...listening.matchAll(/audioFile:\"(l\d+\.mp3)\"/g)].map((match)=>match[1]);
  assert.equal(files.length,16);
  assert.equal(new Set(files).size,16);
});

test("reading, writing and speaking cover their official structures", () => {
  assert.equal((reading.match(/section:\"Section 1\"/g)??[]).length,6);
  assert.equal((reading.match(/section:\"Section 2\"/g)??[]).length,5);
  assert.equal((reading.match(/section:\"Section 3\"/g)??[]).length,5);
  assert.equal((writing.match(/section:\"Task 1/g)??[]).length,8);
  assert.equal((writing.match(/section:\"Task 2/g)??[]).length,8);
  assert.equal((speaking.match(/section:\"Part 1\"/g)??[]).length,6);
  assert.equal((speaking.match(/section:\"Part 2\"/g)??[]).length,5);
  assert.equal((speaking.match(/section:\"Part 3\"/g)??[]).length,5);
});

test("foundation banks and the long-term roadmap are substantive and unique", () => {
  const sentenceIds = ids(sentence,"g");
  const drillIds = ids(drills,"d");
  const weeks = [...roadmap.matchAll(/week:(\d+)/g)].map((match)=>Number(match[1]));
  assert.equal(sentenceIds.length,36);
  assert.equal(new Set(sentenceIds).size,36);
  assert.equal(drillIds.length,36);
  assert.equal(new Set(drillIds).size,36);
  assert.deepEqual(weeks,Array.from({length:36},(_,index)=>index+1));
});

test("published course banks contain no placeholder copy", () => {
  for (const source of [listening,reading,writing,speaking,sentence,drills,roadmap]) assert.doesNotMatch(source,/TODO|TBD|lorem ipsum|待补|示例内容/i);
});
