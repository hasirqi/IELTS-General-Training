import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifiedCoreWordBatch02 } from "../src/content/verified-core-word-batch-02.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (relative) => path.join(root, relative);
const read = (relative) => fs.readFileSync(file(relative), "utf8");
const write = (relative, value) => fs.writeFileSync(file(relative), value, "utf8");

const plan = JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates = plan.candidates.filter((item) => item.batch === 2 && item.sourceStatus === "ready");
const terms = Object.keys(verifiedCoreWordBatch02);
if (candidates.length !== 200 || terms.length !== 200) throw new Error(`Batch 02 requires 200 candidates and rows; received ${candidates.length}/${terms.length}.`);
const orderedTerms = candidates.map((item) => item.term.toLowerCase());
if (new Set(orderedTerms).size !== 200) throw new Error("Batch 02 candidate terms are not unique.");
for (const term of orderedTerms) if (!verifiedCoreWordBatch02[term]) throw new Error(`Missing reviewed content: ${term}`);
for (const term of terms) if (!orderedTerms.includes(term)) throw new Error(`Reviewed term is outside batch 02: ${term}`);
write("src/content/core-word-batch-02-candidates.json", `${JSON.stringify(candidates, null, 2)}\n`);

const current = JSON.parse(read("src/content/lexicon.json"));
if (current.length !== 1200) throw new Error(`Expected 1200 published entries, received ${current.length}.`);
const existing = new Set(current.map((item) => item.term.toLowerCase()));
const additions = candidates.map((candidate, index) => {
  const term = candidate.term.toLowerCase();
  if (existing.has(term)) throw new Error(`Duplicate published term: ${term}`);
  const reviewed = verifiedCoreWordBatch02[term];
  return {
    id: `word-${String(1201 + index).padStart(4, "0")}`,
    term,
    phonetic: "",
    part: "单词",
    meaning: reviewed.meaning,
    category: reviewed.category,
    kind: "word",
    level: candidate.valueTier === "active" ? "B1-B2" : "B2",
    sourceBatch: "core-audio-02",
    valueTier: candidate.valueTier,
    sourceAudio: candidate.audioFile,
    sourceStart: candidate.start,
    sourceEnd: candidate.end,
  };
});
write("src/content/lexicon.json", `${JSON.stringify([...current, ...additions])}\n`);

let lexiconContent = read("src/content/lexicon-content.mjs");
lexiconContent = lexiconContent
  .replace('import { verifiedCoreWordBatch01 } from "./verified-core-word-batch-01.mjs";', 'import { verifiedCoreWordBatch01 } from "./verified-core-word-batch-01.mjs";\nimport { verifiedCoreWordBatch02 } from "./verified-core-word-batch-02.mjs";')
  .replace("  verifiedCoreWordBatch01,\n};", "  verifiedCoreWordBatch01,\n  verifiedCoreWordBatch02,\n};")
  .replace("const reviewed = verifiedCoreWordBatch01[item.term.toLowerCase()];", "const reviewed = verifiedCoreWordBatch02[item.term.toLowerCase()] ?? verifiedCoreWordBatch01[item.term.toLowerCase()];");
write("src/content/lexicon-content.mjs", lexiconContent);

let courseBank = read("src/content/course-bank.ts");
courseBank = courseBank
  .replace('import { curriculumBatch08 } from "./curriculum-batch-08";', 'import { curriculumBatch08 } from "./curriculum-batch-08";\nimport { curriculumBatch09 } from "./curriculum-batch-09";')
  .replace("[...previousCurriculum, ...curriculumBatch08]", "[...previousCurriculum, ...curriculumBatch08, ...curriculumBatch09]");
write("src/content/course-bank.ts", courseBank);

let sentences = read("src/content/sentence-challenges.ts");
sentences = sentences
  .replace('import { sentenceChallengeBatch04 } from "./foundation-batch-04";', 'import { sentenceChallengeBatch04 } from "./foundation-batch-04";\nimport { sentenceChallengeBatch05 } from "./foundation-batch-05";')
  .replace("...sentenceChallengeBatch04]", "...sentenceChallengeBatch04, ...sentenceChallengeBatch05]");
write("src/content/sentence-challenges.ts", sentences);

let drills = read("src/content/speaking-drills.ts");
drills = drills
  .replace('import { speakingDrillBatch04 } from "./foundation-batch-04";', 'import { speakingDrillBatch04 } from "./foundation-batch-04";\nimport { speakingDrillBatch05 } from "./foundation-batch-05";')
  .replace("...speakingDrillBatch04]", "...speakingDrillBatch04, ...speakingDrillBatch05]");
write("src/content/speaking-drills.ts", drills);

console.log(`Integrated ${additions.length} reviewed entries; published lexicon now has ${current.length + additions.length}.`);
