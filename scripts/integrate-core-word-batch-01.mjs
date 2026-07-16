import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifiedCoreWordBatch01 } from "../src/content/verified-core-word-batch-01.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), value, "utf8");
const copyIfMissing = (source, target) => {
  const targetPath = path.join(root, target);
  if (!fs.existsSync(targetPath)) fs.copyFileSync(path.join(root, source), targetPath);
};

const candidates = JSON.parse(read("src/content/core-word-batch-01-candidates.json"));
const terms = Object.keys(verifiedCoreWordBatch01);
if (candidates.length !== 200 || terms.length !== 200) throw new Error("Batch 01 must contain exactly 200 candidates and 200 reviewed rows.");
const candidateTerms = candidates.map((item) => item.term.toLowerCase());
if (new Set(candidateTerms).size !== 200) throw new Error("Candidate terms are not unique.");
for (const term of candidateTerms) if (!verifiedCoreWordBatch01[term]) throw new Error(`Missing reviewed content: ${term}`);
for (const term of terms) if (!candidateTerms.includes(term)) throw new Error(`Reviewed term is not in the selected batch: ${term}`);

copyIfMissing("src/content/lexicon.json", "src/content/lexicon-baseline-1000.json");
const baseline = JSON.parse(read("src/content/lexicon-baseline-1000.json"));
if (baseline.length !== 1000) throw new Error(`Expected the frozen baseline to contain 1000 items, received ${baseline.length}.`);
const existing = new Set(baseline.map((item) => item.term.toLowerCase()));
const additions = candidates.map((candidate, index) => {
  const term = candidate.term.toLowerCase();
  if (existing.has(term)) throw new Error(`Selected item already exists in the baseline: ${term}`);
  const reviewed = verifiedCoreWordBatch01[term];
  return {
    id: `word-${String(1001 + index).padStart(4, "0")}`,
    term,
    phonetic: "",
    part: "单词",
    meaning: reviewed.meaning,
    category: reviewed.category,
    kind: "word",
    level: candidate.recommendedTier === "active" ? "B1-B2" : "B2",
    sourceBatch: "core-audio-01",
    valueTier: candidate.recommendedTier,
    sourceAudio: candidate.audioFile,
    sourceStart: candidate.start,
    sourceEnd: candidate.end,
  };
});
write("src/content/lexicon.json", `${JSON.stringify([...baseline, ...additions])}\n`);

copyIfMissing("src/content/lexicon-content.mjs", "src/content/lexicon-content-baseline.mjs");
write("src/content/lexicon-content.mjs", `import {\n  buildLearningLexicon as buildBaselineLexicon,\n  lexiconQuality,\n  verifiedChunkContent,\n  verifiedWordBatch01,\n  verifiedWordBatch02,\n  verifiedWordBatch03,\n  verifiedWordBatch04,\n  verifiedWordBatch05,\n  verifiedWordBatch06,\n} from "./lexicon-content-baseline.mjs";\nimport { verifiedCoreWordBatch01 } from "./verified-core-word-batch-01.mjs";\n\nexport {\n  lexiconQuality,\n  verifiedChunkContent,\n  verifiedWordBatch01,\n  verifiedWordBatch02,\n  verifiedWordBatch03,\n  verifiedWordBatch04,\n  verifiedWordBatch05,\n  verifiedWordBatch06,\n  verifiedCoreWordBatch01,\n};\n\nexport function buildLearningLexicon(items) {\n  return buildBaselineLexicon(items).map((item) => {\n    const reviewed = verifiedCoreWordBatch01[item.term.toLowerCase()];\n    if (!reviewed) return item;\n    return {\n      ...item,\n      ...reviewed,\n      cue: \`用“\${reviewed.meaning}”在当前场景中说一个英语表达。\`,\n      contentStatus: "verified",\n    };\n  });\n}\n`);

copyIfMissing("src/content/course-bank.ts", "src/content/course-bank-batch07.ts");
write("src/content/course-bank.ts", `import { curriculum as previousCurriculum } from "./course-bank-batch07";\nimport { curriculumBatch08 } from "./curriculum-batch-08";\nimport type { CourseLesson } from "./curriculum-v2";\n\nexport type { CourseLesson };\nexport const curriculum: CourseLesson[] = [...previousCurriculum, ...curriculumBatch08];\nconst count = (skill: CourseLesson["skill"]) => curriculum.filter((lesson) => lesson.skill === skill).length;\nexport const skillMeta = {\n  listening: { label: "听力", description: "Part 1–4 · 学习与模考模式", count: count("listening") },\n  reading: { label: "阅读", description: "Section 1–3 · 生活、工作、长文", count: count("reading") },\n  writing: { label: "写作", description: "Task 1 书信 · Task 2 议论文", count: count("writing") },\n  speaking: { label: "口语", description: "Part 1、2、3 完整覆盖", count: count("speaking") },\n} as const;\n`);

write("src/content/sentence-challenges.ts", `import { sentenceChallenges as foundationChallenges } from "./sentence-challenges-base";\nimport { sentenceChallengeBatch02 } from "./foundation-batch-02";\nimport { sentenceChallengeBatch03 } from "./foundation-batch-03";\nimport { sentenceChallengeBatch04 } from "./foundation-batch-04";\n\nexport type { SentenceChallenge } from "./sentence-challenges-base";\nexport const sentenceChallenges = [...foundationChallenges, ...sentenceChallengeBatch02, ...sentenceChallengeBatch03, ...sentenceChallengeBatch04];\n`);
write("src/content/speaking-drills.ts", `import { speakingDrills as foundationDrills } from "./speaking-drills-base";\nimport { speakingDrillBatch02 } from "./foundation-batch-02";\nimport { speakingDrillBatch03 } from "./foundation-batch-03";\nimport { speakingDrillBatch04 } from "./foundation-batch-04";\n\nexport type { SpeakingDrill } from "./speaking-drills-base";\nexport const speakingDrills = [...foundationDrills, ...speakingDrillBatch02, ...speakingDrillBatch03, ...speakingDrillBatch04];\n`);

let app = read("src/AppProduct.tsx");
app = app
  .replace("词库 1,000 条", "词库 {lexicon.length.toLocaleString()} 条")
  .replace('library:"1,000 词库"', 'library:`${lexicon.length.toLocaleString()} 词库`')
  .replace("沿着1,000条学习顺序前进", "沿着完整词库学习顺序前进")
  .replace("词库总进度 {state.nextLexiconIndex}/1,000", "词库总进度 {state.nextLexiconIndex}/{lexicon.length}")
  .replace("全部 1,000 条均进入学习顺序", "全部 {lexicon.length.toLocaleString()} 条均进入学习顺序")
  .replace('<option value="chunk">词块 120</option><option value="word">单词 880</option>', '<option value="chunk">词块 {lexicon.filter((item) => item.kind === "chunk").length}</option><option value="word">单词 {lexicon.filter((item) => item.kind === "word").length}</option>')
  .replace("state.nextLexiconIndex/(1000/36)", "state.nextLexiconIndex/(lexicon.length/36)")
  .replace("{stats.introduced}/1000", "{stats.introduced}/{lexicon.length}");
write("src/AppProduct.tsx", app);

for (let index = 1; index <= 6; index += 1) {
  const file = `tests/product-word-batch-${String(index).padStart(2, "0")}.test.mjs`;
  write(file, read(file).replace("../src/content/lexicon.json", "../src/content/lexicon-baseline-1000.json"));
}

console.log(`Integrated ${additions.length} reviewed words; product lexicon now contains ${baseline.length + additions.length} entries.`);
