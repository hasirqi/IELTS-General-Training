import type { WordItem } from "./types";

export const reviewWords: WordItem[] = [
  { word: "appointment", phonetic: "/əˈpɔɪntmənt/", part: "名词", meaning: "预约；约定", cue: "我明天有一个医生预约。", example: "I have a doctor's appointment tomorrow.", collocation: "make an appointment", japanese: "予約（よやく）" },
  { word: "available", phonetic: "/əˈveɪləbəl/", part: "形容词", meaning: "可用的；有空的", cue: "这个座位有人吗？", example: "Is this seat available?", collocation: "available from Monday" },
  { word: "confirm", phonetic: "/kənˈfɜːm/", part: "动词", meaning: "确认", cue: "请确认你的预订。", example: "Please confirm your booking.", collocation: "confirm the details" },
  { word: "delay", phonetic: "/dɪˈleɪ/", part: "名词／动词", meaning: "延误；推迟", cue: "火车延误了二十分钟。", example: "The train has a twenty-minute delay.", collocation: "a slight delay" },
  { word: "require", phonetic: "/rɪˈkwaɪə/", part: "动词", meaning: "需要；要求", cue: "这份工作需要经验。", example: "This job requires experience.", collocation: "be required to" },
  { word: "refund", phonetic: "/ˈriːfʌnd/", part: "名词／动词", meaning: "退款", cue: "我可以申请退款吗？", example: "Can I get a refund?", collocation: "full refund" },
  { word: "local", phonetic: "/ˈləʊkəl/", part: "形容词", meaning: "当地的", cue: "当地公共汽车每小时一班。", example: "The local bus runs every hour.", collocation: "local facilities" },
  { word: "provide", phonetic: "/prəˈvaɪd/", part: "动词", meaning: "提供", cue: "酒店提供免费早餐。", example: "The hotel provides free breakfast.", collocation: "provide information" },
  { word: "rent", phonetic: "/rent/", part: "名词／动词", meaning: "租金；租用", cue: "这里租一套房要多少钱？", example: "How much is it to rent a flat here?", collocation: "pay the rent" },
  { word: "notice", phonetic: "/ˈnəʊtɪs/", part: "名词／动词", meaning: "通知；注意到", cue: "请阅读墙上的通知。", example: "Please read the notice on the wall.", collocation: "give notice" },
  { word: "instead", phonetic: "/ɪnˈsted/", part: "副词", meaning: "代替；反而", cue: "我们改坐公共汽车吧。", example: "Let's take the bus instead.", collocation: "instead of" },
  { word: "improve", phonetic: "/ɪmˈpruːv/", part: "动词", meaning: "改善；提高", cue: "我想提高英语。", example: "I want to improve my English.", collocation: "improve steadily" }
];

export const newWords = reviewWords.slice(0, 8);

export const sentenceChallenge = {
  segments: [
    { text: "I", role: "主语" },
    { text: "would like", role: "表达意愿" },
    { text: "to confirm", role: "动作" },
    { text: "my appointment", role: "对象" }
  ],
  prompt: "请选择最自然的结尾：I would like to confirm ___ appointment.",
  options: ["my", "me", "mine"],
  correct: "my",
  explanation: "appointment 是名词，前面需要形容词性物主代词 my。"
};
