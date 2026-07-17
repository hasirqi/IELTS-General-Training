import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifiedCoreWordBatch04 } from "../src/content/verified-core-word-batch-04.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=(relative)=>path.join(root,relative);
const read=(relative)=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates=plan.candidates.filter((item)=>item.batch===4&&item.sourceStatus==="ready");
const terms=Object.keys(verifiedCoreWordBatch04);
if(candidates.length!==200||terms.length!==200) throw new Error(`Batch 04 requires 200 candidates and rows; received ${candidates.length}/${terms.length}.`);
const orderedTerms=candidates.map((item)=>item.term.toLowerCase());
if(JSON.stringify(orderedTerms)!==JSON.stringify(terms)) throw new Error("Batch 04 reviewed rows do not follow source priority 601-800.");
write("src/content/core-word-batch-04-candidates.json",`${JSON.stringify(candidates,null,2)}\n`);

const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==1600) throw new Error(`Expected 1600 published entries, received ${current.length}.`);
const existing=new Set(current.map((item)=>item.term.toLowerCase()));
const additions=candidates.map((candidate,index)=>{
  const term=candidate.term.toLowerCase();
  if(existing.has(term)) throw new Error(`Duplicate published term: ${term}`);
  const reviewed=verifiedCoreWordBatch04[term];
  return {id:`word-${String(1601+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-04",valueTier:candidate.valueTier,sourceAudio:candidate.audioFile,sourceStart:candidate.start,sourceEnd:candidate.end};
});
write("src/content/lexicon.json",`${JSON.stringify([...current,...additions])}\n`);

let content=read("src/content/lexicon-content.mjs");
content=content
  .replace('import { verifiedCoreWordBatch03 } from "./verified-core-word-batch-03.mjs";','import { verifiedCoreWordBatch03 } from "./verified-core-word-batch-03.mjs";\nimport { verifiedCoreWordBatch04 } from "./verified-core-word-batch-04.mjs";')
  .replace("  verifiedCoreWordBatch03,\n};","  verifiedCoreWordBatch03,\n  verifiedCoreWordBatch04,\n};")
  .replace("const reviewed = verifiedCoreWordBatch03[item.term.toLowerCase()] ??", "const reviewed = verifiedCoreWordBatch04[item.term.toLowerCase()] ?? verifiedCoreWordBatch03[item.term.toLowerCase()] ??");
write("src/content/lexicon-content.mjs",content);

let courses=read("src/content/course-bank.ts");
courses=courses
  .replace('import { curriculumBatch10 } from "./curriculum-batch-10";','import { curriculumBatch10 } from "./curriculum-batch-10";\nimport { curriculumBatch11 } from "./curriculum-batch-11";')
  .replace("...curriculumBatch10];","...curriculumBatch10, ...curriculumBatch11];");
write("src/content/course-bank.ts",courses);

let sentences=read("src/content/sentence-challenges.ts");
sentences=sentences
  .replace('import { sentenceChallengeBatch06 } from "./foundation-batch-06";','import { sentenceChallengeBatch06 } from "./foundation-batch-06";\nimport { sentenceChallengeBatch07 } from "./foundation-batch-07";')
  .replace("...sentenceChallengeBatch06];","...sentenceChallengeBatch06, ...sentenceChallengeBatch07];");
write("src/content/sentence-challenges.ts",sentences);

let drills=read("src/content/speaking-drills.ts");
drills=drills
  .replace('import { speakingDrillBatch06 } from "./foundation-batch-06";','import { speakingDrillBatch06 } from "./foundation-batch-06";\nimport { speakingDrillBatch07 } from "./foundation-batch-07";')
  .replace("...speakingDrillBatch06];","...speakingDrillBatch06, ...speakingDrillBatch07];");
write("src/content/speaking-drills.ts",drills);
console.log(`Integrated ${additions.length} reviewed entries; published lexicon now has ${current.length+additions.length}.`);
