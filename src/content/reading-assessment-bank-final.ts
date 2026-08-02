import { readingAssessmentPassages as basePassages, type ReadingPassage } from "./reading-assessment-bank-v1";

const evaluationParagraph=(passage:ReadingPassage)=>`For local decision-makers, the next step is to define a measurable outcome before spending begins, record a baseline and publish a review date. This would show whether ${passage.title.toLowerCase()} delivers its promised benefit without quietly shifting costs to another group.`;

export const readingAssessmentPassages:ReadingPassage[]=basePassages.map(passage=>passage.kind==="continuous"?{...passage,text:`${passage.text}\n\n${evaluationParagraph(passage)}`} : passage);
export const readingAssessmentQuestions=readingAssessmentPassages.flatMap(passage=>passage.questions);
export const readingAssessmentStats={passages:readingAssessmentPassages.length,questions:readingAssessmentQuestions.length,functionalPassages:readingAssessmentPassages.filter(item=>item.kind==="functional").length,continuousPassages:readingAssessmentPassages.filter(item=>item.kind==="continuous").length,byLevel:Object.fromEntries(Array.from({length:6},(_,index)=>[`L${index+1}`,readingAssessmentPassages.filter(item=>item.level===index+1).length])),version:"reading-bank-110-v1"};
export type {ReadingKind,ReadingQuestion,ReadingPassage} from "./reading-assessment-bank-v1";
