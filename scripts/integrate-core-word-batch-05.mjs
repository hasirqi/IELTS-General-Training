import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifiedCoreWordBatch05 } from "../src/content/verified-core-word-batch-05.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=(relative)=>path.join(root,relative);
const read=(relative)=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates=plan.candidates.filter((item)=>item.batch===5&&item.sourceStatus==="ready");
const terms=Object.keys(verifiedCoreWordBatch05);
if(candidates.length!==200||terms.length!==200) throw new Error(`Batch 05 requires 200 candidates and rows; received ${candidates.length}/${terms.length}.`);
const orderedTerms=candidates.map((item)=>item.term.toLowerCase());
if(JSON.stringify(orderedTerms)!==JSON.stringify(terms)) throw new Error("Batch 05 reviewed rows do not follow source priority 801-1000.");
write("src/content/core-word-batch-05-candidates.json",`${JSON.stringify(candidates,null,2)}\n`);

const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==1800) throw new Error(`Expected 1800 published entries, received ${current.length}.`);
const existing=new Set(current.map((item)=>item.term.toLowerCase()));
const additions=candidates.map((candidate,index)=>{
  const term=candidate.term.toLowerCase();
  if(existing.has(term)) throw new Error(`Duplicate published term: ${term}`);
  const reviewed=verifiedCoreWordBatch05[term];
  return {id:`word-${String(1801+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-05",valueTier:candidate.valueTier,sourceAudio:candidate.audioFile,sourceStart:candidate.start,sourceEnd:candidate.end};
});
write("src/content/lexicon.json",`${JSON.stringify([...current,...additions])}\n`);

let content=read("src/content/lexicon-content.mjs");
content=content
  .replace('import { verifiedCoreWordBatch04 } from "./verified-core-word-batch-04.mjs";','import { verifiedCoreWordBatch04 } from "./verified-core-word-batch-04.mjs";\nimport { verifiedCoreWordBatch05 } from "./verified-core-word-batch-05.mjs";')
  .replace("  verifiedCoreWordBatch04,\n};","  verifiedCoreWordBatch04,\n  verifiedCoreWordBatch05,\n};")
  .replace("const reviewed = verifiedCoreWordBatch04[item.term.toLowerCase()] ??", "const reviewed = verifiedCoreWordBatch05[item.term.toLowerCase()] ?? verifiedCoreWordBatch04[item.term.toLowerCase()] ??");
write("src/content/lexicon-content.mjs",content);

let courses=read("src/content/course-bank.ts");
courses=courses
  .replace('import { curriculumBatch11 } from "./curriculum-batch-11";','import { curriculumBatch11 } from "./curriculum-batch-11";\nimport { curriculumBatch12 } from "./curriculum-batch-12";')
  .replace("...curriculumBatch11];","...curriculumBatch11, ...curriculumBatch12];");
write("src/content/course-bank.ts",courses);

let sentences=read("src/content/sentence-challenges.ts");
sentences=sentences
  .replace('import { sentenceChallengeBatch07 } from "./foundation-batch-07";','import { sentenceChallengeBatch07 } from "./foundation-batch-07";\nimport { sentenceChallengeBatch08 } from "./foundation-batch-08";')
  .replace("...sentenceChallengeBatch07];","...sentenceChallengeBatch07, ...sentenceChallengeBatch08];");
write("src/content/sentence-challenges.ts",sentences);

let drills=read("src/content/speaking-drills.ts");
drills=drills
  .replace('import { speakingDrillBatch07 } from "./foundation-batch-07";','import { speakingDrillBatch07 } from "./foundation-batch-07";\nimport { speakingDrillBatch08 } from "./foundation-batch-08";')
  .replace("...speakingDrillBatch07];","...speakingDrillBatch07, ...speakingDrillBatch08];");
write("src/content/speaking-drills.ts",drills);
console.log(`Integrated ${additions.length} reviewed entries; published lexicon now has ${current.length+additions.length}.`);
