import {
  buildLearningLexicon as buildBatch04Lexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
} from "./lexicon-content-batch04.mjs";
import { verifiedWordBatch05 } from "./verified-word-batch-05.mjs";

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
  verifiedWordBatch05,
};

export function buildLearningLexicon(items) {
  return buildBatch04Lexicon(items).map((item) => {
    const reviewed = verifiedWordBatch05[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `用“${reviewed.meaning}”在当前场景中说一个英语表达。`,
      contentStatus: "verified",
    };
  });
}
