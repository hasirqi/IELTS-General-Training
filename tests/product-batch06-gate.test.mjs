import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const previous = ["../src/content/curriculum-v2.ts","../src/content/reading-lessons.ts","../src/content/writing-lessons.ts","../src/content/speaking-lessons.ts","../src/content/curriculum-batch-02.ts","../src/content/curriculum-batch-03.ts","../src/content/curriculum-batch-04.ts","../src/content/curriculum-batch-05.ts"].map(read).join("\n");
const batch = read("../src/content/curriculum-batch-06.ts");
const values = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);
test("batch 06 contains exact lesson ids 49 through 56", () => { for (const prefix of ["l","r","w","s"]) assert.deepEqual(values(batch,new RegExp(`id:\\s*"(${prefix}\\d+)"`,`g`)),Array.from({length:8},(_,i)=>`${prefix}${i+49}`)); });
test("batch 06 scenarios and questions are unique and substantive", () => {
  const titles=values(batch,/title:\s*"([^"]+)"/g), questions=values(batch,/q\(\s*"([^"]+)"/g);
  const priorTitles=new Set(values(previous,/title:\s*"([^"]+)"/g)), priorQuestions=new Set(values(previous,/q\(\s*"([^"]+)"/g));
  assert.equal(titles.length,32); assert.equal(new Set(titles).size,32); assert.equal(questions.length,64); assert.equal(new Set(questions).size,64);
  for(const value of titles) assert.equal(priorTitles.has(value),false,`repeated title: ${value}`); for(const value of questions) assert.equal(priorQuestions.has(value),false,`repeated question: ${value}`);
  assert.doesNotMatch(batch,/TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});
test("batch 06 listening has one fixed audio per lesson",()=>assert.deepEqual(values(batch,/audioFile:\s*"(l\d+\.mp3)"/g),Array.from({length:8},(_,i)=>`l${i+49}.mp3`)));
