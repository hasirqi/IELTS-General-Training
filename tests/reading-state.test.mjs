import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("schema v8 persists and migrates reading CAT drafts and experimental results",()=>{
  const types=fs.readFileSync("src/product-types.ts","utf8");
  const storage=fs.readFileSync("src/product-storage.ts","utf8");
  assert.ok(types.includes("schemaVersion: 8"));
  assert.ok(types.includes("readingAssessmentDraft: ReadingAssessmentDraft | null"));
  assert.ok(types.includes("readingAssessments: ReadingAssessmentResult[]"));
  assert.ok(storage.includes("readingAssessmentDraft: null"));
  assert.ok(storage.includes('saved?.readingAssessmentDraft?.mode === "reading-cat-v1"'));
  assert.ok(storage.includes("result.experimental === true && result.official === false"));
});
