import {
  buildLearningLexicon as buildBatch03Lexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
} from "./lexicon-content-batch03.mjs";
import { verifiedWordBatch04 } from "./verified-word-batch-04.mjs";

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
};

export function buildLearningLexicon(items) {
  return buildBatch03Lexicon(items).map((item) => {
    const reviewed = verifiedWordBatch04[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `用“${reviewed.meaning}”在当前场景中说一个英语表达。`,
      contentStatus: "verified",
    };
  });
}
