import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEARNING_BACKUP_SCHEMA, buildLearningBackup, collectCourseArtifacts, parseLearningBackup,
  restoreCourseArtifacts, summarizeLearningBackup,
} from "../src/learning-backup.mjs";
import { auditLearningState, elapsedValidationDays, latestValidationByArea, VALIDATION_AREAS } from "../src/product-health.mjs";

function storage(initial={}) {
  const values=new Map(Object.entries(initial));
  return { get length(){return values.size;}, key(index){return [...values.keys()][index]??null;}, getItem(key){return values.get(key)??null;}, setItem(key,value){values.set(key,String(value));}, removeItem(key){values.delete(key);}, values };
}
function state() {
  return { schemaVersion:8, lexiconProgress:{"word-1":{}}, dailyPlan:{reviewIds:["word-1"],newIds:[]}, completedLessons:["l1"], errorLog:[], vocabularyTests:[], readingAssessments:[], measurementSessions:[], usageValidationObservations:[] };
}

test("complete backup includes learning state and separate writing or ChatGPT artifacts",()=>{
  const source=storage({"ielts-draft-w1":"letter","ielts-feedback-w1":"feedback","unrelated":"keep"});
  const payload=buildLearningBackup(state(),collectCourseArtifacts(source),{lexicon:"4133-verified"});
  assert.equal(payload.schemaVersion,LEARNING_BACKUP_SCHEMA);
  assert.deepEqual(Object.keys(payload.courseArtifacts).sort(),["ielts-draft-w1","ielts-feedback-w1"]);
  const parsed=parseLearningBackup(JSON.parse(JSON.stringify(payload)));
  assert.equal(summarizeLearningBackup(parsed).courseArtifacts,2);
  const target=storage({"ielts-draft-old":"old","unrelated":"keep"});
  restoreCourseArtifacts(target,parsed.courseArtifacts);
  assert.equal(target.getItem("ielts-draft-old"),null);
  assert.equal(target.getItem("ielts-draft-w1"),"letter");
  assert.equal(target.getItem("unrelated"),"keep");
});

test("backup rejects incomplete or unrelated JSON",()=>{
  assert.throws(()=>parseLearningBackup({}),/版本不受支持/);
  assert.throws(()=>parseLearningBackup({schemaVersion:LEARNING_BACKUP_SCHEMA,state:{}}),/数据不完整/);
});

test("health audit finds dangling references and duplicate course completion",()=>{
  const current={...state(),lexiconProgress:{"missing":{}},dailyPlan:{reviewIds:["word-1","gone"],newIds:[]},completedLessons:["l1","l1","old"],errorLog:[{lexiconId:"gone"}]};
  const result=auditLearningState(current,{lexiconIds:["word-1"],lessonIds:["l1"]});
  assert.equal(result.ok,false);
  assert.equal(result.danglingProgress.length,1);
  assert.equal(result.danglingPlan.length,1);
  assert.equal(result.danglingErrors.length,1);
  assert.equal(result.unknownLessons.length,1);
  assert.equal(result.duplicateLessons,1);
});

test("real-use validation has five durable non-overlapping checks and honest elapsed time",()=>{
  assert.deepEqual(Object.keys(VALIDATION_AREAS),["recommendation","errorReturn","difficulty","mobile","audio"]);
  const observations=[{area:"audio",status:"problem",createdAt:"2026-01-01",note:"a"},{area:"audio",status:"stable",createdAt:"2026-01-02",note:"b"}];
  assert.equal(latestValidationByArea(observations).audio.note,"b");
  assert.equal(elapsedValidationDays("2026-01-01T00:00:00.000Z",new Date("2026-01-15T00:00:00.000Z").getTime()),14);
});

test("health UI exposes full backup, local integrity, empirical gates and manual ChatGPT boundary",()=>{
  const ui=fs.readFileSync("src/ProductHealth.tsx","utf8");
  for(const label of ["导出完整备份","确认导入并替换本机进度","产品健康检查","2–4 周真实使用验证","实证样本与 M9","保持 1PL","不能读取 ChatGPT 回答"]) assert.ok(ui.includes(label),label);
  assert.ok(ui.includes('method:"HEAD"'));
  assert.ok(ui.includes("normalizeLearningState"));
});
