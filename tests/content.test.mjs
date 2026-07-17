import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lexicon = JSON.parse(fs.readFileSync(new URL("../src/content/lexicon.json", import.meta.url), "utf8"));
const curriculum = fs.readFileSync(new URL("../src/curriculum.ts", import.meta.url), "utf8");

test("ships exactly 2,400 unique lexical items", () => {
  assert.equal(lexicon.length, 2400);
  assert.equal(new Set(lexicon.map((item) => item.term.toLowerCase())).size, 2400);
  assert.equal(lexicon.filter((item) => item.kind === "chunk").length, 120);
  assert.equal(lexicon.filter((item) => item.kind === "word").length, 2280);
});

test("every lexical item has the required offline learning fields", () => {
  for (const item of lexicon) assert.ok(item.id && item.term && item.meaning && item.kind && item.level);
});

test("General Training curriculum covers all four skills and official sections", () => {
  for (const skill of ["listening", "reading", "writing", "speaking"]) assert.ok(curriculum.includes(`skill:"${skill}"`));
  for (const marker of ["Part 1", "Part 2", "Part 3", "Part 4", "Section 1", "Section 2", "Section 3", "Task 1", "Task 2"]) assert.ok(curriculum.includes(marker));
  assert.equal((curriculum.match(/id:"[lrsw][0-9]+"/g) ?? []).length, 22);
});
