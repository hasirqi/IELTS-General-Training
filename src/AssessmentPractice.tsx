import { useState } from "react";
import { IconArrowLeft, IconCheck, IconRefresh, IconVolume } from "@tabler/icons-react";
import type { CourseLesson } from "./content/course-bank";
import type { LexiconItem, VocabularyAnchor } from "./product-types";
import {
  buildContextSession, buildDailyQuickSession, buildReadingSession, createSessionSeed,
} from "./assessment-session-engine.mjs";

export type PracticeMode = "daily" | "reading" | "context";
type PracticeQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  subtitle?: string;
  context?: string;
  passage?: string;
  passageId?: string;
  passageTitle?: string;
  section?: string;
};

const meta = {
  daily: { title: "每日词汇自测", kicker: "英中释义快速检查", total: 20 },
  context: { title: "语境运用练习", kicker: "完形填空与语境应用", total: 20 },
  reading: { title: "阅读能力测评", kicker: "功能短文与连续篇章", total: 24 },
} as const;

function makeSession(mode: PracticeMode, lexicon: LexiconItem[], anchors: VocabularyAnchor[], curriculum: CourseLesson[]) {
  const seed = createSessionSeed();
  const questions = mode === "daily"
    ? buildDailyQuickSession(anchors, meta.daily.total, seed)
    : mode === "context"
      ? buildContextSession(lexicon, meta.context.total, seed)
      : buildReadingSession(curriculum, 6, seed);
  return { seed, questions: questions as PracticeQuestion[] };
}

export function AssessmentPractice({mode,lexicon,anchors,curriculum,onBack,speak}:{
  mode:PracticeMode;
  lexicon:LexiconItem[];
  anchors:VocabularyAnchor[];
  curriculum:CourseLesson[];
  onBack:()=>void;
  speak:(text:string)=>void;
}) {
  const [session,setSession] = useState(() => makeSession(mode,lexicon,anchors,curriculum));
  const [index,setIndex] = useState(0);
  const [correct,setCorrect] = useState(0);
  const [profile,setProfile] = useState<Record<string,{correct:number;total:number}>>({});
  const question = session.questions[index];
  const done = index >= session.questions.length;
  const restart = () => { setSession(makeSession(mode,lexicon,anchors,curriculum)); setIndex(0); setCorrect(0); setProfile({}); };
  const answer = (option:string) => {
    if (!question) return;
    const isCorrect = option === question.answer;
    if (isCorrect) setCorrect((value) => value + 1);
    setProfile((current) => ({...current,[question.kind]:{correct:(current[question.kind]?.correct ?? 0)+(isCorrect?1:0),total:(current[question.kind]?.total ?? 0)+1}}));
    setIndex((value) => value + 1);
  };
  if (done) return <section className="lesson-content vocabulary-test-page"><div className="lesson-kicker">测试中心 · {meta[mode].title}</div><h1>本轮完成</h1><div className="test-intro compact assessment-practice-result"><IconCheck/><h2>{correct}/{session.questions.length}</h2><p>{mode === "reading" ? "这是已审核课程文章的练习测评结果；文章难度完成双人标定前，不显示模拟 L 值。" : "结果用于本地学习诊断，不改变正式词汇 CAT 的词族估计。"}</p><div className="practice-profile">{Object.entries(profile).map(([kind,value]) => <span key={kind}>{kind === "functional" ? "功能短文" : kind === "continuous" ? "连续篇章" : kind === "context" ? "语境完形" : "英中释义"} {value.correct}/{value.total}</span>)}</div><div className="test-result-actions"><button className="primary-button" onClick={restart}>换一套题<IconRefresh/></button><button className="outline-button" onClick={onBack}>返回测试中心<IconArrowLeft/></button></div></div></section>;
  if (!question) return <section className="lesson-content"><div className="empty-state"><strong>当前题池不足</strong><button className="outline-button" onClick={onBack}>返回测试中心</button></div></section>;
  return <section className="lesson-content vocabulary-test-page assessment-practice-page"><div className="lesson-kicker">{meta[mode].kicker} {index+1}/{session.questions.length} · 本轮随机抽题</div><div className="test-progress" role="progressbar" aria-label={`${meta[mode].title}进度`} aria-valuemin={0} aria-valuemax={session.questions.length} aria-valuenow={index}><span style={{width:`${index/session.questions.length*100}%`}}/></div>
    {mode === "daily" && <div className="test-word"><button className="round-button" onClick={() => speak(question.prompt)} aria-label={`播放 ${question.prompt} 的英语发音`}><IconVolume/></button><h1>{question.prompt}</h1><p>{question.subtitle}</p></div>}
    {mode === "reading" && <article className="assessment-passage"><span>{question.section} · {question.passageTitle}</span>{question.passage?.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>}
    <div className="test-stage"><h2>{mode === "daily" ? "选择最合适的中文意思" : question.prompt}</h2>{question.context && <blockquote className="assessment-context">{question.context}</blockquote>}<div className="test-options">{question.options.map((option) => <button key={option} onClick={() => answer(option)}>{option}</button>)}</div><p className="measurement-note">选择后立即进入下一题；同一轮不会重复题目。</p></div>
  </section>;
}
