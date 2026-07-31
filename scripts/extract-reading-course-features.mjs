import fs from "node:fs";
import { createServer } from "vite";
import familyIndex from "../src/content/word-family-index-20k.json" with { type: "json" };
import { analyseTextDifficultyV0, buildWordFamilyLookup, TEXT_DIFFICULTY_ENGINE_VERSION } from "../src/text-difficulty-engine.mjs";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { curriculum } = await server.ssrLoadModule("/src/content/course-bank.ts");
  const reading = curriculum.filter((lesson) => lesson.skill === "reading");
  const lookup = buildWordFamilyLookup(familyIndex);
  const rows = reading.map((lesson) => ({
    lessonId: lesson.id,
    title: lesson.title,
    section: lesson.section,
    focus: lesson.focus,
    source: "first-party-course-content",
    reviewStatus: "course-source-reviewed",
    features: analyseTextDifficultyV0(lesson.text ?? "", lookup),
  }));
  const payload = {
    version: "reading-course-features-v0-2026.08.01",
    engineVersion: TEXT_DIFFICULTY_ENGINE_VERSION,
    generatedFrom: "src/content/course-bank.ts",
    status: "features-only",
    scoreEligible: false,
    count: rows.length,
    rows,
  };
  fs.writeFileSync(new URL("../src/content/reading-course-features-v0.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Extracted ${rows.length} reading-course feature records.`);
} finally {
  await server.close();
}
