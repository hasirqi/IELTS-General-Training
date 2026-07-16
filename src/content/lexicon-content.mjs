import {
  buildLearningLexicon as buildBaselineLexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
  verifiedWordBatch05,
  verifiedWordBatch06,
} from "./lexicon-content-baseline.mjs";
import { verifiedCoreWordBatch01 } from "./verified-core-word-batch-01.mjs";
import { verifiedCoreWordBatch02 } from "./verified-core-word-batch-02.mjs";

const expandedSenseContent = {
  require: {
    meaning: "需要；要求；规定（必须）",
    meaningNote: "法律、规则或机构作主语时，常译为“规定／要求必须”。",
  },
};

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
  verifiedWordBatch05,
  verifiedWordBatch06,
  verifiedCoreWordBatch01,
  verifiedCoreWordBatch02,
};

export function buildLearningLexicon(items) {
  return buildBaselineLexicon(items).map((item) => {
    const reviewed = verifiedCoreWordBatch02[item.term.toLowerCase()] ?? verifiedCoreWordBatch01[item.term.toLowerCase()];
    const expanded = expandedSenseContent[item.term.toLowerCase()];
    const merged = reviewed ? {
      ...item,
      ...reviewed,
      cue: `用“${reviewed.meaning}”在当前场景中说一个英语表达。`,
      contentStatus: "verified",
    } : item;
    return expanded ? { ...merged, ...expanded } : merged;
  });
}
