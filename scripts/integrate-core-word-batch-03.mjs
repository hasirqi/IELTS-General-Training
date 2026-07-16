import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifiedCoreWordBatch03 } from "../src/content/verified-core-word-batch-03.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const file=(relative)=>path.join(root,relative);
const read=(relative)=>fs.readFileSync(file(relative),"utf8");
const write=(relative,value)=>fs.writeFileSync(file(relative),value,"utf8");
const plan=JSON.parse(read("ysgpc/extracted/expansion-plan.json"));
const candidates=plan.candidates.filter((item)=>item.batch===3&&item.sourceStatus==="ready");
const terms=Object.keys(verifiedCoreWordBatch03);
if(candidates.length!==200||terms.length!==200) throw new Error(`Batch 03 requires 200 candidates and rows; received ${candidates.length}/${terms.length}.`);
const orderedTerms=candidates.map((item)=>item.term.toLowerCase());
if(new Set(orderedTerms).size!==200) throw new Error("Batch 03 candidates are not unique.");
for(const term of orderedTerms) if(!verifiedCoreWordBatch03[term]) throw new Error(`Missing reviewed content: ${term}`);
for(const term of terms) if(!orderedTerms.includes(term)) throw new Error(`Reviewed term outside batch 03: ${term}`);
write("src/content/core-word-batch-03-candidates.json",`${JSON.stringify(candidates,null,2)}\n`);

const current=JSON.parse(read("src/content/lexicon.json"));
if(current.length!==1400) throw new Error(`Expected 1400 published entries, received ${current.length}.`);
const existing=new Set(current.map((item)=>item.term.toLowerCase()));
const additions=candidates.map((candidate,index)=>{
  const term=candidate.term.toLowerCase();
  if(existing.has(term)) throw new Error(`Duplicate published term: ${term}`);
  const reviewed=verifiedCoreWordBatch03[term];
  return {id:`word-${String(1401+index).padStart(4,"0")}`,term,phonetic:"",part:"单词",meaning:reviewed.meaning,category:reviewed.category,kind:"word",level:"B1-B2",sourceBatch:"core-audio-03",valueTier:candidate.valueTier,sourceAudio:candidate.audioFile,sourceStart:candidate.start,sourceEnd:candidate.end};
});
write("src/content/lexicon.json",`${JSON.stringify([...current,...additions])}\n`);

let content=read("src/content/lexicon-content.mjs");
content=content
  .replace('import { verifiedCoreWordBatch02 } from "./verified-core-word-batch-02.mjs";','import { verifiedCoreWordBatch02 } from "./verified-core-word-batch-02.mjs";\nimport { verifiedCoreWordBatch03 } from "./verified-core-word-batch-03.mjs";')
  .replace("  verifiedCoreWordBatch02,\n};","  verifiedCoreWordBatch02,\n  verifiedCoreWordBatch03,\n};")
  .replace("const reviewed = verifiedCoreWordBatch02[item.term.toLowerCase()] ?? verifiedCoreWordBatch01[item.term.toLowerCase()];","const reviewed = verifiedCoreWordBatch03[item.term.toLowerCase()] ?? verifiedCoreWordBatch02[item.term.toLowerCase()] ?? verifiedCoreWordBatch01[item.term.toLowerCase()];");
write("src/content/lexicon-content.mjs",content);

let courses=read("src/content/course-bank.ts");
courses=courses.replace('import { curriculumBatch09 } from "./curriculum-batch-09";','import { curriculumBatch09 } from "./curriculum-batch-09";\nimport { curriculumBatch10 } from "./curriculum-batch-10";').replace("...curriculumBatch09]","...curriculumBatch09, ...curriculumBatch10]");
write("src/content/course-bank.ts",courses);
let sentences=read("src/content/sentence-challenges.ts");
sentences=sentences.replace('import { sentenceChallengeBatch05 } from "./foundation-batch-05";','import { sentenceChallengeBatch05 } from "./foundation-batch-05";\nimport { sentenceChallengeBatch06 } from "./foundation-batch-06";').replace("...sentenceChallengeBatch05]","...sentenceChallengeBatch05, ...sentenceChallengeBatch06]");
write("src/content/sentence-challenges.ts",sentences);
let drills=read("src/content/speaking-drills.ts");
drills=drills.replace('import { speakingDrillBatch05 } from "./foundation-batch-05";','import { speakingDrillBatch05 } from "./foundation-batch-05";\nimport { speakingDrillBatch06 } from "./foundation-batch-06";').replace("...speakingDrillBatch05]","...speakingDrillBatch05, ...speakingDrillBatch06]");
write("src/content/speaking-drills.ts",drills);
console.log(`Integrated ${additions.length} reviewed entries; published lexicon now has ${current.length+additions.length}.`);
