import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle, IconArrowLeft, IconArrowRight, IconBook2, IconBrain, IconCheck,
  IconClipboardText, IconEye, IconFlask2, IconHeadphones, IconLanguage, IconLibrary,
  IconLock, IconMicrophone, IconPlayerPlay, IconRefresh, IconRobot, IconSearch,
  IconTargetArrow, IconVolume, IconWriting, IconX,
} from "@tabler/icons-react";
import rawLexicon from "./content/lexicon.json";
import { buildLearningLexicon, lexiconQuality } from "./content/lexicon-content.mjs";
import { curriculum, skillMeta, type CourseLesson } from "./content/course-bank";
import { roadmapWeeks } from "./content/roadmap";
import { sentenceChallenges } from "./content/sentence-challenges";
import { speakingDrills } from "./content/speaking-drills";
import {
  buildDailyPlan, createStudyOrder, dateKey, introduceLexiconItem, masteryStats,
  overallProgress, scheduleLexiconReview, scoreRecall, selectReviewAspect,
} from "./learning-engine.mjs";
import { freshState, loadLearningState, saveLearningState } from "./product-storage";
import type { LearningState, LexiconItem, MasteryAspect, Skill, View } from "./product-types";
import "./product.css";

const lexicon = buildLearningLexicon(rawLexicon) as LexiconItem[];
const lexiconById = new Map(lexicon.map((item) => [item.id, item]));
const studyOrder = createStudyOrder(lexicon);
const quality = lexiconQuality(lexicon);

const steps = [
  {title:"复习旧词",subtitle:"到期词和错词优先回来",icon:IconBook2,view:"review" as View},
  {title:"新词与词块",subtitle:"每天 5–10 条，覆盖全部词库",icon:IconLanguage,view:"words" as View},
  {title:"句型实验室",subtitle:`${sentenceChallenges.length} 套递进训练`,icon:IconFlask2,view:"sentence" as View},
  {title:"开口任务",subtitle:`${speakingDrills.length} 个真实场景`,icon:IconMicrophone,view:"speak" as View},
];

let activeFixedAudio: HTMLAudioElement | null = null;
function playFixedAudio(path: string, fallback: string) {
  if (activeFixedAudio) activeFixedAudio.pause();
  const audio = new Audio(path);
  activeFixedAudio = audio;
  audio.play().catch(() => speakEnglish(fallback));
}

function speakEnglish(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = .86;
  utterance.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase() === "en-gb" && /sonia|libby|ryan|serena|daniel|google uk/i.test(v.name))
    ?? voices.find((v) => v.lang.toLowerCase() === "en-gb")
    ?? voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  if (voice) utterance.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function coachPrompt(view: View, state: LearningState, extra = "") {
  const accuracy = state.attempts ? Math.round(state.correct / state.attempts * 100) : 0;
  return `你是我的耐心英语教练。我懂中文、蒙古文和日文，英语基础薄弱，目标是 IELTS General Training 6 分。我正在使用“破壁 IELTS 6”的${view}训练。请先问我卡在哪里，每次只给一级提示；引用我的原句，并把问题分为“影响理解”“影响6分”“只是润色”。当前客观题正确率 ${accuracy}%。${extra ? `\n\n本次材料：\n${extra}` : ""}`;
}

type UpdateState = (next: Partial<LearningState> | ((state: LearningState) => LearningState)) => void;

export function App() {
  const [view, setView] = useState<View>("home");
  const [courseSkill, setCourseSkill] = useState<Skill>("listening");
  const [state, setState] = useState<LearningState>(freshState());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { loadLearningState().then((saved) => { setState(saved); setReady(true); }); }, []);
  useEffect(() => { if (ready) saveLearningState(state); }, [state, ready]);
  useEffect(() => {
    if (!ready || state.dailyPlan.date === dateKey()) return;
    const plan = buildDailyPlan({
      items: lexicon,
      progress: state.lexiconProgress,
      nextLexiconIndex: state.nextLexiconIndex,
      errorLog: state.errorLog,
      attempts: state.attempts,
      correct: state.correct,
    });
    setState((current) => ({ ...current, dailyPlan: plan, reviewIndex: 0, wordIndex: 0, completedSteps: [] }));
  }, [ready, state.dailyPlan.date]);

  const update: UpdateState = (next) => setState((current) => typeof next === "function" ? next(current) : ({ ...current, ...next }));
  const stats = useMemo(() => masteryStats(state.lexiconProgress), [state.lexiconProgress]);
  const completion = overallProgress({ introduced: stats.introduced, totalVocabulary: lexicon.length, completedLessons: state.completedLessons.length, totalLessons: curriculum.length, masteryAverage: stats.average });
  const dueCount = Math.max(0, state.dailyPlan.reviewIds.length - state.reviewIndex);

  const completeStep = (index: number, next: View = "home") => {
    update((current) => ({ ...current, completedSteps: [...new Set([...current.completedSteps, index])], lastStudied: new Date().toISOString() }));
    setView(next);
  };
  const openChat = async (extra = "") => {
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(coachPrompt(view, state, extra));
      setToast("内容已复制，请在 ChatGPT 中粘贴");
    } catch {
      setToast("ChatGPT 已打开；浏览器未允许自动复制");
    }
    setTimeout(() => setToast(""), 3500);
  };
  const reset = () => {
    if (window.confirm("确定清空这台设备上的学习进度吗？词库和课程不会删除。")) setState(freshState());
  };

  return <div className="app-shell">
    <GlobalHeader onHome={() => setView("home")} onLibrary={() => setView("library")} onChat={() => openChat()}/>
    {toast && <div className="toast" role="status">{toast}</div>}
    {view === "home" ? <Home state={state} dueCount={dueCount} onOpen={setView} onOpenCourse={(skill) => { setCourseSkill(skill); setView("courses"); }} onReset={reset}/> :
      <Shell view={view} back={() => setView("home")} progress={completion}>
        {view === "review" && <Review state={state} update={update} done={() => completeStep(0, "words")}/>}
        {view === "words" && <WordLab state={state} update={update} done={() => completeStep(1, "sentence")}/>}
        {view === "sentence" && <SentenceLab state={state} update={update} done={() => completeStep(2, "speak")}/>}
        {view === "speak" && <QuickSpeak state={state} update={update} onCoach={openChat} done={() => completeStep(3)}/>}
        {view === "courses" && <CourseHub state={state} update={update} initialSkill={courseSkill} onCoach={openChat}/>}
        {view === "library" && <Library/>}
        {view === "progress" && <Progress state={state}/>}
        {view === "errors" && <Errors state={state}/>}
      </Shell>}
  </div>;
}

function Home({state,dueCount,onOpen,onOpenCourse,onReset}:{state:LearningState;dueCount:number;onOpen:(view:View)=>void;onOpenCourse:(skill:Skill)=>void;onReset:()=>void}) {
  return <main className="home pragmatic-home">
    <section className="direct-learning">
      <div className="direct-heading"><div><p className="eyebrow">IELTS GENERAL TRAINING · 目标 6.0</p><h1>选择训练</h1></div><p className="quiet-motto">英语难不倒我</p></div>
      <div className="skill-cards primary-skill-cards">{Object.entries(skillMeta).map(([key, meta]) => {
        const icons = { listening: IconHeadphones, reading: IconBook2, writing: IconWriting, speaking: IconMicrophone };
        const Icon = icons[key as Skill];
        const done = state.completedLessons.filter((id) => id.startsWith(key[0])).length;
        return <button key={key} onClick={() => onOpenCourse(key as Skill)}><Icon/><strong>{meta.label}</strong><span>{meta.description}</span><em>{done}/{meta.count} 课完成</em><b>进入训练 <IconArrowRight size={17}/></b></button>;
      })}</div>
    </section>
    <section className="foundation-section">
      <div className="section-heading"><h2>基础训练</h2><span>词汇、句型和开口热身</span></div>
      <div className="foundation-grid">{steps.map((step, index) => { const Icon = step.icon; const done = state.completedSteps.includes(index); return <button key={step.title} onClick={() => onOpen(step.view)}><span className={done ? "foundation-icon done" : "foundation-icon"}>{done ? <IconCheck size={22}/> : <Icon size={25}/>}</span><span><strong>{step.title}</strong><small>{step.subtitle}</small></span><IconArrowRight className="foundation-arrow" size={18}/></button>; })}</div>
    </section>
    <section className="review-strip"><div className="review-count"><IconClipboardText/><span>待复习<span className="review-number"><strong>{dueCount}</strong><small>个</small></span></span></div><div><strong>到期再复习，错词一定回来。</strong><p>不是固定天数，系统会根据正确率和遗忘情况调整。</p></div><button className="outline-button" onClick={() => onOpen("review")}>去复习<IconArrowRight/></button></section>
    <footer className="home-footer"><button onClick={() => onOpen("progress")}><IconTargetArrow/>能力进度</button><button onClick={() => onOpen("errors")}><IconBrain/>错因档案</button><button onClick={onReset}><IconRefresh/>重置本地进度</button></footer>
  </main>;
}

function GlobalHeader({onHome,onLibrary,onChat}:{onHome:()=>void;onLibrary:()=>void;onChat:()=>void}) {
  return <header className="global-header"><div className="global-header-inner"><button className="brand" onClick={onHome} aria-label="返回学习首页"><span className="brand-mark"><IconBook2 size={28}/></span><span><strong>破壁 IELTS 6</strong><small>IELTS GENERAL TRAINING</small></span></button><nav className="header-actions" aria-label="全局导航"><button className="text-button library-header-link" onClick={onLibrary}><IconLibrary size={19}/>词库 {lexicon.length.toLocaleString()} 条</button><button className="text-button" onClick={onChat}><IconRobot size={19}/>向 ChatGPT 提问</button></nav></div></header>;
}

function Shell({view,back,progress,children}:{view:View;back:()=>void;progress:number;children:React.ReactNode}) {
  const labels: Record<View,string> = {home:"学习首页",review:"主动回忆",words:"词义实验室",sentence:"句型实验室",speak:"开口任务",courses:"四项课程",library:`${lexicon.length.toLocaleString()} 词库`,progress:"能力进度",errors:"错因档案"};
  return <main className="lesson-page"><div className="context-header"><button className="icon-button" onClick={back} aria-label="返回首页"><IconArrowLeft/></button><div><small>当前页面</small><strong>{labels[view]}</strong></div></div><div className="lesson-progress" role="progressbar" aria-label="总体学习进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:`${progress}%`}}/></div><span className="progress-caption">总体学习进度 {progress}%</span>{children}</main>;
}

function aspectName(aspect: MasteryAspect) { return ({form:"词形",meaning:"词义",use:"使用"} as const)[aspect]; }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function Review({state,update,done}:{state:LearningState;update:UpdateState;done:()=>void}) {
  const ids = state.dailyPlan.reviewIds;
  if (!ids.length || state.reviewIndex >= ids.length) return <section className="lesson-content"><LearningEmpty title="当前没有到期复习" body="新学内容会在合适的时间回来，不用为了打卡重复刷。" action="进入新词" onAction={done}/></section>;
  const index = state.reviewIndex;
  const item = lexiconById.get(ids[index])!;
  const progress = state.lexiconProgress[item.id];
  const aspect = selectReviewAspect(item, progress) as MasteryAspect;
  const [answer,setAnswer] = useState("");
  const [hint,setHint] = useState(0);
  const [feedback,setFeedback] = useState<{correct:boolean;label:string}|null>(null);
  const contextPrompt = aspect === "use" && item.example ? item.example.replace(new RegExp(escapeRegExp(item.term), "i"), "____") : item.cue ?? `“${item.meaning}”用英语怎么说？`;
  const submit = () => {
    const result = scoreRecall(answer, item.term, hint);
    setFeedback(result);
    update((current) => {
      const now = new Date();
      const base = current.lexiconProgress[item.id] ?? introduceLexiconItem(undefined, item.id, { now, confidence: 2, supportsUse: item.contentStatus === "verified" });
      const scheduled = scheduleLexiconReview(base, aspect, result.quality, now);
      const resolvedErrors = result.correct ? current.errorLog.map((error) => error.lexiconId === item.id && error.aspect === aspect && !error.resolvedAt ? {...error,resolvedAt:now.toISOString()} : error) : current.errorLog;
      const errorLog = result.correct ? resolvedErrors : [...resolvedErrors,{id:crypto.randomUUID(),lexiconId:item.id,aspect,prompt:contextPrompt,answer,expected:item.term,createdAt:now.toISOString()}];
      const remaining = current.dailyPlan.reviewIds.slice(current.reviewIndex + 1);
      const repeatIds = !result.correct && !remaining.includes(item.id) ? [...current.dailyPlan.reviewIds,item.id] : current.dailyPlan.reviewIds;
      return {...current,attempts:current.attempts+1,correct:current.correct+(result.correct?1:0),lexiconProgress:{...current.lexiconProgress,[item.id]:scheduled},errorLog,dailyPlan:{...current.dailyPlan,reviewIds:repeatIds}};
    });
  };
  const next = () => { update({reviewIndex:index+1}); setAnswer(""); setHint(0); setFeedback(null); };
  return <section className="lesson-content recall-card"><div className="lesson-kicker">第 {index+1} / {ids.length} 题 · 本次练 {aspectName(aspect)}</div>{aspect === "form" ? <><h1>听音后拼写</h1><button className="listen-prompt" onClick={() => speakEnglish(item.term)} aria-label={`播放 ${item.term} 的英语发音`}><IconVolume/>播放一次，再写出听到的内容</button></> : <h1>{contextPrompt}</h1>}<p>写出最合适的英语{item.kind === "chunk" ? "词块" : "单词"}</p><label className="answer-field"><span>你的答案</span><input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={!!feedback}/></label>{!feedback ? <div className="answer-actions"><button className="hint-button" onClick={() => setHint(Math.min(2,hint+1))}>给一点提示</button><button className="primary-button" disabled={!answer.trim()} onClick={submit}>检查答案</button></div> : <div className={`feedback ${feedback.correct?"success":"error"}`}>{feedback.correct?<IconCheck/>:<IconX/>}<div><strong>{feedback.label}</strong><p>答案：<b>{item.term}</b> {item.phonetic} · {item.meaning}</p>{item.example && <p>{item.example}</p>}</div><button className="primary-button" onClick={next}>下一题<IconArrowRight/></button></div>}{hint > 0 && !feedback && <div className="hint-box">{hint === 1 ? `首字母是 ${item.term[0].toUpperCase()}` : item.collocation ? `常见搭配：${item.collocation}` : `核心词义：${item.meaning}`}</div>}</section>;
}

function LearningEmpty({title,body,action,onAction}:{title:string;body:string;action:string;onAction:()=>void}) {
  return <div className="empty-state learning-empty"><IconCheck/><strong>{title}</strong><p>{body}</p><button className="primary-button" onClick={onAction}>{action}<IconArrowRight/></button></div>;
}

function WordLab({state,update,done}:{state:LearningState;update:UpdateState;done:()=>void}) {
  const ids = state.dailyPlan.newIds;
  if (!ids.length || state.wordIndex >= ids.length) return <section className="lesson-content"><LearningEmpty title="本轮新词已经完成" body="先让记忆稳定；下一轮会继续沿着完整词库学习顺序前进。" action="进入句型" onAction={done}/></section>;
  const index = state.wordIndex;
  const item = lexiconById.get(ids[index])!;
  const learn = (confidence: number) => {
    update((current) => {
      const alreadyIntroduced = !!current.lexiconProgress[item.id];
      const progress = introduceLexiconItem(current.lexiconProgress[item.id], item.id, { confidence, supportsUse:false });
      return {...current,wordIndex:index+1,nextLexiconIndex:alreadyIntroduced?current.nextLexiconIndex:Math.min(studyOrder.length,current.nextLexiconIndex+1),lexiconProgress:{...current.lexiconProgress,[item.id]:progress},lastStudied:new Date().toISOString()};
    });
  };
  return <section className="lesson-content word-lab"><div className="lesson-kicker">新词 {index+1} / {ids.length} · 词库总进度 {state.nextLexiconIndex}/{lexicon.length}</div><div className="word-heading"><div><div className={`content-status ${item.contentStatus}`}>{item.contentStatus === "verified" ? "形·义·用已审核" : "当前练形·义"}</div><h1>{item.term}</h1><p>{item.phonetic || "发音标记待补"} · {item.part}</p></div><button className="round-button" onClick={() => speakEnglish(item.term)} aria-label={`播放 ${item.term} 的英语发音`}><IconVolume/></button></div><div className="meaning-block"><span>常用意思</span><strong>{item.meaning}</strong>{item.meaningNote && <small>{item.meaningNote}</small>}{item.example && <p>{item.example}</p>}</div>{item.contentStatus === "verified" ? <div className="word-grid"><div><span>常见搭配</span><strong>{item.collocation}</strong></div><div><span>使用场景</span><strong>{item.category}</strong></div></div> : <div className="content-gate"><IconAlertTriangle/><div><strong>用法内容尚未通过人工审核</strong><p>本轮只练词形和核心义，不用模板例句冒充真实语境。</p></div></div>}<div className="confidence-row word-confidence" aria-label="选择你对这个词的熟悉程度"><button onClick={() => learn(5)}>认识</button><button onClick={() => learn(3)}>不确定</button><button onClick={() => learn(1)}>不认识</button></div></section>;
}

function SentenceLab({state,update,done}:{state:LearningState;update:UpdateState;done:()=>void}) {
  const challenge = sentenceChallenges[state.sentenceIndex % sentenceChallenges.length];
  const [choice,setChoice] = useState("");
  const correct = choice === challenge.correct;
  const finish = () => { update((current) => ({...current,sentenceIndex:current.sentenceIndex+1})); done(); };
  return <section className="lesson-content sentence-lab"><div className="lesson-kicker">句型 {state.sentenceIndex % sentenceChallenges.length + 1} / {sentenceChallenges.length} · {challenge.level} · {challenge.principle}</div><h1>{challenge.title}</h1><div className="sentence-parts">{challenge.segments.map((part,index) => <div key={`${part.text}-${index}`} className={`part part-${index%4}`}><span>{part.role}</span><strong>{part.text}</strong></div>)}</div><div className="challenge"><p>{challenge.prompt}</p><div className="choice-row">{challenge.options.map((option) => <button className={choice===option?"selected":""} key={option} onClick={() => setChoice(option)}>{option}</button>)}</div>{choice && <div className={`feedback-line ${correct?"success":"error"}`}>{correct?<IconCheck/>:<IconX/>}<span>{correct?challenge.explanation:challenge.errorHint}</span></div>}</div><button className="primary-button wide" disabled={!correct} onClick={finish}>进入开口任务<IconArrowRight/></button></section>;
}

function QuickSpeak({state,update,onCoach,done}:{state:LearningState;update:UpdateState;onCoach:(extra:string)=>void;done:()=>void}) {
  const drill = speakingDrills[state.speakingIndex % speakingDrills.length];
  const [text,setText] = useState("");
  const [listening,setListening] = useState(false);
  const [modelShown,setModelShown] = useState(false);
  const keywordScore = useMemo(() => drill.keywords.filter((word) => text.toLowerCase().includes(word.toLowerCase())).length,[text,drill]);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  const record = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event:any) => setText(event.results[0][0].transcript);
    recognition.start();
  };
  const finish = () => { update((current) => ({...current,speakingIndex:current.speakingIndex+1})); done(); };
  return <section className="lesson-content speak-lab"><div className="lesson-kicker">开口 {state.speakingIndex % speakingDrills.length + 1} / {speakingDrills.length} · {drill.level} · {drill.scenario}</div><h1>{drill.title}</h1><div className="speaking-prompt-card"><span>任务</span><strong>{drill.prompt}</strong><p>追问：{drill.followUp}</p></div>{supported && <button className={`record-button ${listening?"recording":""}`} onClick={record}><IconMicrophone/><span>{listening?"正在听…":"按下开始说"}</span></button>}<label className="writing-area compact"><span>{supported?"识别不准时可手动修正":"输入你说的话"} · {wordCount} 词</span><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type or correct your spoken answer here..."/></label>{text && <div className="transcript"><span>本地检查</span><strong>关键词 {keywordScore}/{drill.keywords.length}</strong><p>先保证意思完整；关键词只是提醒，不是口语分数。</p></div>}<div className="speak-actions"><button className="outline-button" onClick={() => setModelShown((shown) => !shown)}><IconEye/>{modelShown?"收起参考":"查看参考表达"}</button><button className="outline-button" disabled={!text.trim()} onClick={() => onCoach(`请按 IELTS Speaking 的 Fluency and Coherence、Lexical Resource、Grammatical Range and Accuracy、Pronunciation 四项反馈。不要假装听到音频；只能评价下面的转写。\n题目：${drill.prompt}\n我的回答：${text}`)}><IconRobot/>复制给 ChatGPT</button></div>{modelShown && <div className="model-answer"><span>参考，不必背诵</span><p>{drill.model}</p>{drill.id === "d01" && <button onClick={() => playFixedAudio("./audio/quick-speak.mp3",drill.model)}><IconPlayerPlay/>播放固定录音</button>}</div>}<button className="primary-button wide" disabled={wordCount<5} onClick={finish}>完成本轮开口<IconCheck/></button></section>;
}

function CourseHub({state,update,initialSkill,onCoach}:{state:LearningState;update:UpdateState;initialSkill:Skill;onCoach:(extra:string)=>void}) {
  const [skill,setSkill] = useState<Skill>(initialSkill);
  const [selected,setSelected] = useState<CourseLesson|null>(null);
  if (selected) return <CoursePlayer lesson={selected} onCoach={onCoach} done={(result) => { update((current) => { const ratio = result?.total ? result.correct/result.total : 0; const delta = result?.total ? (ratio>=.75?.1:ratio>=.5?.05:0) : .03; return {...current,completedLessons:[...new Set([...current.completedLessons,selected.id])],lastStudied:new Date().toISOString(),skill:{...current.skill,[selected.skill]:Math.min(6,current.skill[selected.skill]+delta)}}; }); setSelected(null); }} back={() => setSelected(null)}/>;
  return <section className="lesson-content course-hub"><div className="lesson-kicker">{curriculum.length} 节原创 General Training 训练 · 题目与答案逐项校验</div><h1>听说读写课程</h1><div className="skill-tabs">{Object.entries(skillMeta).map(([key,meta]) => <button key={key} className={skill===key?"selected":""} onClick={() => setSkill(key as Skill)}>{meta.label}<span>{meta.count} 课</span></button>)}</div><div className="lesson-list">{curriculum.filter((lesson) => lesson.skill === skill).map((lesson,index) => <button key={lesson.id} onClick={() => setSelected(lesson)}><span className="lesson-index">{state.completedLessons.includes(lesson.id)?<IconCheck/>:index+1}</span><span><em>{lesson.section} · {lesson.level}</em><strong>{lesson.title}</strong><small>{lesson.focus}</small></span><b>{lesson.minutes} 分钟<IconArrowRight/></b></button>)}</div></section>;
}

type LessonResult = { correct:number; total:number } | undefined;
function CoursePlayer({lesson,done,back,onCoach}:{lesson:CourseLesson;done:(result?:LessonResult)=>void;back:()=>void;onCoach:(extra:string)=>void}) {
  const objective = lesson.skill === "listening" || lesson.skill === "reading";
  const [question,setQuestion] = useState(0);
  const [answers,setAnswers] = useState<Record<number,string>>({});
  const [submitted,setSubmitted] = useState(false);
  const [mode,setMode] = useState<"learn"|"mock">("learn");
  const [audioStarted,setAudioStarted] = useState(false);
  const [audioError,setAudioError] = useState(false);
  const [draft,setDraft] = useState(() => localStorage.getItem(`ielts-draft-${lesson.id}`) ?? "");
  const [spoken,setSpoken] = useState("");
  const [listen,setListen] = useState(false);
  const [feedbackText,setFeedbackText] = useState(() => localStorage.getItem(`ielts-feedback-${lesson.id}`) ?? "");
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const current = lesson.questions?.[question];
  const choice = answers[question] ?? "";
  const correct = choice === current?.answer;
  const result = lesson.questions ? lesson.questions.reduce((sum,item,index) => sum + (answers[index] === item.answer ? 1 : 0),0) : 0;
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const writingTarget = lesson.section.startsWith("Task 2") ? 250 : 150;
  const speakingWords = spoken.trim() ? spoken.trim().split(/\s+/).length : 0;
  const speakingTarget = lesson.section === "Part 2" ? 60 : 12;
  const resetObjective = (nextMode: "learn"|"mock") => { audioRef.current?.pause(); setMode(nextMode); setQuestion(0); setAnswers({}); setSubmitted(false); setAudioStarted(false); };
  const record = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.onstart = () => setListen(true);
    recognition.onend = () => setListen(false);
    recognition.onresult = (event:any) => setSpoken(Array.from(event.results).map((entry:any) => entry[0].transcript).join(" "));
    recognition.start();
  };
  const nextQuestion = () => {
    if (question < (lesson.questions?.length ?? 1) - 1) setQuestion((value) => value+1);
    else setSubmitted(true);
  };
  const playMock = () => {
    if (!audioRef.current || audioStarted) return;
    setAudioStarted(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => setAudioError(true));
  };
  const saveDraft = (value:string) => { setDraft(value); localStorage.setItem(`ielts-draft-${lesson.id}`,value); };
  const saveFeedback = (value:string) => { setFeedbackText(value); localStorage.setItem(`ielts-feedback-${lesson.id}`,value); };
  const askWritingCoach = () => onCoach(`请按 IELTS General Training Writing 官方四个维度给出保守估分和证据：Task Achievement/Task Response、Coherence and Cohesion、Lexical Resource、Grammatical Range and Accuracy。先引用我的原句，再区分“影响理解”“影响6分”“只是润色”。\n题目：${lesson.task}\n任务点：${lesson.bullets?.join("；")}\n我的作文（${wordCount}词）：\n${draft}`);
  const askSpeakingCoach = () => onCoach(`请按 IELTS Speaking 四个维度给出保守反馈。你没有音频，只能评价转写中的流利连贯、词汇和语法；Pronunciation 必须标注“无法从转写判断”。\n题目：${lesson.task ?? lesson.prompts?.join(" / ")}\n我的回答：\n${spoken}`);
  return <section className="lesson-content course-player"><button className="back-inline" onClick={back}><IconArrowLeft/>返回课程目录</button><div className="lesson-kicker">{lesson.section} · {lesson.minutes} 分钟 · {lesson.focus}</div><h1>{lesson.title}</h1>
    {lesson.skill === "listening" && <><div className="mode-selector" role="group" aria-label="听力模式"><button className={mode==="learn"?"selected":""} onClick={() => resetObjective("learn")}>学习模式<span>可重播，提交后看原文</span></button><button className={mode==="mock"?"selected":""} onClick={() => resetObjective("mock")}>模考模式<span>只能播放一次，不能拖动</span></button></div><div className="audio-card"><div><IconHeadphones/><span><strong>{mode === "mock" ? "一次播放录音" : "标准英式录音"}</strong><small>{lesson.speakers} · 固定 MP3</small></span></div>{mode === "learn" ? <audio ref={audioRef} controls preload="metadata" src={`./audio/${lesson.audioFile}`} onCanPlay={() => setAudioError(false)} onError={() => setAudioError(true)}>你的浏览器不支持音频播放。</audio> : <><audio ref={audioRef} preload="metadata" src={`./audio/${lesson.audioFile}`} onError={() => setAudioError(true)}/><button className="mock-play" disabled={audioStarted} onClick={playMock}>{audioStarted?<IconLock/>:<IconPlayerPlay/>}{audioStarted?"本次录音已经开始，不能重播":"播放本次录音"}</button></>}{audioError && <div className="audio-error"><IconX/><span>固定录音加载失败。</span>{mode === "learn" && <button onClick={() => lesson.text && speakEnglish(lesson.text)}>临时设备朗读</button>}</div>}</div>{!submitted ? <div className="transcript-lock"><IconLock/>完成全部题目后才能查看听力原文</div> : <details open><summary>听力原文</summary><p className="source-text">{lesson.text}</p></details>}</>}
    {lesson.skill === "reading" && <article className="reading-passage">{lesson.text?.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>}
    {objective && current && !submitted && <div className="question-card"><span>第 {question+1}/{lesson.questions?.length} 题</span><h2>{current.prompt}</h2><div className="option-list">{current.options.map((option) => <button key={option} className={choice===option?(mode==="learn"?(correct?"correct":"wrong"):"selected"):""} onClick={() => setAnswers((values) => ({...values,[question]:option}))} disabled={mode==="learn" && !!choice}>{option}</button>)}</div>{choice && mode === "learn" && <div className={`feedback-line ${correct?"success":"error"}`}>{correct?<IconCheck/>:<IconX/>}<span>{correct?"答对了。":`正确答案：${current.answer}。`} {current.explanation}</span></div>}<button className="primary-button wide" disabled={!choice || (lesson.skill === "listening" && mode === "mock" && !audioStarted)} onClick={nextQuestion}>{question<(lesson.questions?.length??1)-1?"下一题":"提交本课"}<IconArrowRight/></button></div>}
    {objective && submitted && <div className="result-panel"><IconCheck/><div><span>本课结果</span><strong>{result}/{lesson.questions?.length}</strong><p>{result === lesson.questions?.length ? "信息定位稳定。" : "错题已经记录在本课结果中，先看证据再重做。"}</p></div><button className="primary-button" onClick={() => done({correct:result,total:lesson.questions?.length??0})}>记录并完成</button></div>}
    {lesson.skill === "writing" && <><div className="writing-task"><strong>{lesson.task}</strong><ul>{lesson.bullets?.map((item) => <li key={item}>{item}</li>)}</ul></div><label className="writing-area"><span>自动保存到本机 · 当前 {wordCount}/{writingTarget} 词</span><textarea value={draft} onChange={(event) => saveDraft(event.target.value)} placeholder="Start writing here..."/></label><Checklist items={lesson.checklist??[]}/><div className="coach-transfer"><button className="outline-button" disabled={wordCount<30} onClick={askWritingCoach}><IconRobot/>复制作文并打开 ChatGPT</button><label><span>把 ChatGPT 的反馈粘贴回来保存</span><textarea value={feedbackText} onChange={(event) => saveFeedback(event.target.value)} placeholder="Paste feedback here..."/></label></div><button className="primary-button wide" disabled={wordCount<writingTarget} onClick={() => done()}>达到字数并完成本课</button></>}
    {lesson.skill === "speaking" && <><div className="speaking-prompts">{lesson.task && <h2>{lesson.task}</h2>}<ul>{lesson.bullets?.map((item) => <li key={item}>{item}</li>)}</ul>{lesson.prompts?.map((prompt) => <p key={prompt}>{prompt}</p>)}</div>{("webkitSpeechRecognition" in window || "SpeechRecognition" in window) && <button className={`record-button ${listen?"recording":""}`} onClick={record}><IconMicrophone/><span>{listen?"正在记录，完成后停顿…":"开始回答"}</span></button>}<label className="writing-area compact"><span>转写可手动修正 · {speakingWords}/{speakingTarget} 词</span><textarea value={spoken} onChange={(event) => setSpoken(event.target.value)} placeholder="Your spoken answer appears here..."/></label><button className="outline-button coach-button" disabled={speakingWords<5} onClick={askSpeakingCoach}><IconRobot/>复制转写并打开 ChatGPT</button><label className="writing-area compact"><span>把 ChatGPT 的反馈粘贴回来保存</span><textarea value={feedbackText} onChange={(event) => saveFeedback(event.target.value)} placeholder="Paste feedback here..."/></label><button className="primary-button wide" disabled={speakingWords<speakingTarget} onClick={() => done()}>完成本课</button></>}
  </section>;
}

function Checklist({items}:{items:string[]}) {
  const [checked,setChecked] = useState<string[]>([]);
  return <div className="checklist"><strong>6 分自检</strong>{items.map((item) => <label key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => setChecked((current) => current.includes(item)?current.filter((value) => value!==item):[...current,item])}/>{item}</label>)}</div>;
}

function Library() {
  const PAGE_SIZE = 50;
  const [query,setQuery] = useState("");
  const [kind,setKind] = useState("all");
  const [status,setStatus] = useState("all");
  const [page,setPage] = useState(1);
  const filtered = useMemo(() => lexicon.filter((item) => (kind === "all" || item.kind === kind) && (status === "all" || item.contentStatus === status) && (!query || `${item.term}${item.meaning}`.toLowerCase().includes(query.toLowerCase()))),[query,kind,status]);
  const pages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const current = Math.min(page,pages);
  const list = filtered.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE);
  const resetPage = (setter:(value:string)=>void,value:string) => { setter(value); setPage(1); };
  const go = (next:number) => { setPage(next); window.scrollTo({top:0,behavior:"smooth"}); };
  return <section className="lesson-content library-page"><div className="lesson-kicker">全部 {lexicon.length.toLocaleString()} 条均进入学习顺序 · 用法内容分批人工验收</div><h1>离线词库</h1><div className="library-quality"><div><strong>{quality.verified}</strong><span>条形·义·用已审核</span></div><div><strong>{quality.coreOnly}</strong><span>条当前只练形·义</span></div></div><div className="library-tools expanded"><label className="search-field"><span className="sr-only">搜索词库</span><IconSearch/><input aria-label="搜索英文或中文" value={query} onChange={(event) => resetPage(setQuery,event.target.value)} placeholder="搜英文或中文"/></label><label><span>类型</span><select aria-label="按词条类型筛选" value={kind} onChange={(event) => resetPage(setKind,event.target.value)}><option value="all">全部类型</option><option value="chunk">词块 {lexicon.filter((item) => item.kind === "chunk").length}</option><option value="word">单词 {lexicon.filter((item) => item.kind === "word").length}</option></select></label><label><span>内容状态</span><select aria-label="按内容审核状态筛选" value={status} onChange={(event) => resetPage(setStatus,event.target.value)}><option value="all">全部状态</option><option value="verified">形·义·用已审核</option><option value="core-only">当前只练形·义</option></select></label></div><p className="result-count">找到 {filtered.length} 条 · 第 {current}/{pages} 页 · 本页 {list.length} 条</p><div className="lexicon-grid">{list.map((item,index) => <article key={item.id}><div><em>#{(current-1)*PAGE_SIZE+index+1} · {item.kind==="chunk"?"词块":"单词"}</em><button onClick={() => speakEnglish(item.term)} aria-label={`播放 ${item.term} 的英语发音`} title={`播放 ${item.term}`}><IconVolume/></button></div><div className={`mini-status ${item.contentStatus}`}>{item.contentStatus === "verified" ? "用法已审核" : "核心义"}</div><h2>{item.term}</h2><small>{item.phonetic}</small><p>{item.meaning}</p>{item.example && <blockquote>{item.example}</blockquote>}</article>)}</div><nav className="library-pagination" aria-label="词库分页"><button disabled={current===1} onClick={() => go(current-1)}><IconArrowLeft/>上一页</button><span>第 <strong>{current}</strong> 页，共 {pages} 页</span><button disabled={current===pages} onClick={() => go(current+1)}>下一页<IconArrowRight/></button></nav></section>;
}

function Progress({state}:{state:LearningState}) {
  const stats = masteryStats(state.lexiconProgress);
  const accuracy = state.attempts ? Math.round(state.correct/state.attempts*100) : 0;
  const week = Math.min(36,Math.max(1,Math.floor(state.nextLexiconIndex/(lexicon.length/36))+1));
  const roadmap = roadmapWeeks[week-1];
  const total = curriculum.length;
  return <section className="lesson-content progress-page"><div className="lesson-kicker">能力地图 · 只使用真实训练数据</div><h1>当前学习进度</h1><div className="roadmap-current"><span>36 周路线 · 第 {week} 周</span><strong>{roadmap.theme}</strong><p>{roadmap.stage} · {roadmap.skillFocus}</p></div><div className="skill-list">{Object.entries(state.skill).map(([name,value]) => <div key={name}><span>{({listening:"听力",reading:"阅读",writing:"写作",speaking:"口语"} as Record<string,string>)[name]}</span><progress max="6" value={value}/><strong>{value.toFixed(1)}</strong></div>)}</div><div className="metrics expanded"><div><span>词库已接触</span><strong>{stats.introduced}/{lexicon.length}</strong></div><div><span>综合掌握</span><strong>{stats.average}%</strong></div><div><span>回忆正确率</span><strong>{accuracy}%</strong></div><div><span>课程完成</span><strong>{state.completedLessons.length}/{total}</strong></div></div></section>;
}

function Errors({state}:{state:LearningState}) {
  const unresolved = state.errorLog.filter((error) => !error.resolvedAt);
  return <section className="lesson-content errors-page"><div className="lesson-kicker">错误不是污点，是下一步路线</div><h1>错因档案</h1>{!unresolved.length ? <div className="empty-state"><IconBrain/><strong>当前没有未解决错题</strong><p>答错的词会进入复习计划；答对后自动标记解决。</p></div> : <div className="error-list">{unresolved.slice().reverse().map((error) => <div key={error.id}><span>{error.aspect?`${aspectName(error.aspect)} · `:""}{error.prompt}</span><p>你的答案：{error.answer||"未作答"}</p><strong>正确答案：{error.expected}</strong></div>)}</div>}</section>;
}
