import {
  buildLearningLexicon as buildBaseLexicon,
  lexiconQuality,
  verifiedChunkContent,
} from "./lexicon-content-base.mjs";

const categoryNames = {
  foundation: "基础高频",
  ielts: "General Training 高频",
  daily: "日常事务",
  health: "医疗健康",
  travel: "交通出行",
  shopping: "购物服务",
  housing: "住房租赁",
  work: "工作职场",
  community: "社区生活",
  environment: "环境与公共事务",
  reading: "阅读信号词",
  writing: "写作表达",
  speaking: "口语表达",
};

export { lexiconQuality, verifiedChunkContent };

export function buildLearningLexicon(items) {
  return buildBaseLexicon(items).map((item) => ({
    ...item,
    category: categoryNames[item.category] ?? "通用基础",
  }));
}
