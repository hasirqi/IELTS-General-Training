import { readingAssessmentQuestions } from "./content/reading-assessment-bank-final";
import { buildReadingWeaknessProfile, classifyReadingQuestion } from "./ability-profile.mjs";
import { createMeasurementSession, mergeMeasurementSessions } from "./measurement-data";
import type { LearningError, LearningState, ReadingAssessmentAnswer, ReadingAssessmentResult } from "./product-types";

const questionById=new Map(readingAssessmentQuestions.map(question=>[question.id,question]));

export function completeReadingAssessment(state:LearningState,answers:ReadingAssessmentAnswer[],result:ReadingAssessmentResult){
  const weaknessProfile=buildReadingWeaknessProfile(answers);
  const enriched={...result,weaknessProfile,wrongQuestionIds:answers.filter(answer=>!answer.correct).map(answer=>answer.questionId)};
  const measurement=createMeasurementSession({participantId:state.measurementParticipantId,assessment:"reading-cat",startedAt:result.startedAt,completedAt:result.completedAt,engineVersion:result.engineVersion,bankVersion:result.bankVersion,responses:answers.map(answer=>({itemId:answer.questionId,correct:answer.correct,responseMs:answer.responseMs,difficulty:answer.difficulty,discrimination:answer.discrimination,guessing:1/answer.optionCount,contentVersion:result.bankVersion,level:answer.level}))});
  const newErrors:LearningError[]=answers.filter(answer=>!answer.correct).map(answer=>{const question=questionById.get(answer.questionId);return{id:crypto.randomUUID(),source:"reading-cat",readingCategory:answer.weaknessCategory??classifyReadingQuestion(answer.questionId,answer.kind),passageId:answer.passageId,prompt:question?.prompt??answer.questionId,answer:answer.selectedOption,expected:question?.answer??"回到原文确认证据",createdAt:result.completedAt};}).filter(error=>!state.errorLog.some(existing=>existing.source==="reading-cat"&&existing.prompt===error.prompt&&!existing.resolvedAt));
  return{...state,readingAssessmentDraft:null,readingAssessments:[...state.readingAssessments,enriched].slice(-20),errorLog:[...state.errorLog,...newErrors],measurementSessions:mergeMeasurementSessions(state.measurementSessions,[measurement])};
}
