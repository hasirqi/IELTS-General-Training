import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const priorSentences = read("../src/content/sentence-challenges-base.ts");
const priorDrills = read("../src/content/speaking-drills-base.ts");
const batch = read("../src/content/foundation-batch-02.ts");
const values = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

test("foundation batch 02 adds exact sentence and speaking ids 37 through 48", () => {
  const expectedSentence = Array.from({ length: 12 }, (_, index) => `g${index + 37}`);
  const expectedDrills = Array.from({ length: 12 }, (_, index) => `d${index + 37}`);
  assert.deepEqual(values(batch, /id:\s*"(g\d+)"/g), expectedSentence);
  assert.deepEqual(values(batch, /id:\s*"(d\d+)"/g), expectedDrills);
});

test("new foundation titles and speaking prompts do not repeat earlier material", () => {
  const previousTitles = new Set(values(`${priorSentences}\n${priorDrills}`, /title:\s*"([^"]+)"/g));
  const newTitles = values(batch, /title:\s*"([^"]+)"/g);
  const previousPrompts = new Set(values(priorDrills, /prompt:\s*"([^"]+)"/g));
  const newDrillPrompts = values(batch.slice(batch.indexOf("speakingDrillBatch02")), /prompt:\s*"([^"]+)"/g);
  assert.equal(newTitles.length, 24);
  assert.equal(new Set(newTitles).size, 24);
  assert.equal(newDrillPrompts.length, 12);
  assert.equal(new Set(newDrillPrompts).size, 12);
  for (const title of newTitles) assert.equal(previousTitles.has(title), false, `repeated title: ${title}`);
  for (const prompt of newDrillPrompts) assert.equal(previousPrompts.has(prompt), false, `repeated prompt: ${prompt}`);
});

test("new sentence questions have three unique options and one valid answer", () => {
  const sentencePart = batch.slice(0, batch.indexOf("speakingDrillBatch02"));
  const rows = [...sentencePart.matchAll(/prompt:"([^"]+)",options:(\[[^\]]+\]),correct:"([^"]+)"/g)];
  assert.equal(rows.length, 12);
  for (const [, prompt, optionsJson, correct] of rows) {
    const options = JSON.parse(optionsJson);
    assert.equal(options.length, 3, prompt);
    assert.equal(new Set(options).size, 3, prompt);
    assert.ok(options.includes(correct), prompt);
  }
  assert.doesNotMatch(batch, /TODO|TBD|lorem ipsum|待完善|示例内容|placeholder/i);
});
