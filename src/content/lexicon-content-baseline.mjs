import {
  buildLearningLexicon as buildBatch05Lexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
  verifiedWordBatch05,
} from "./lexicon-content-batch05.mjs";
import { verifiedWordBatch06 } from "./verified-word-batch-06.mjs";

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
  verifiedWordBatch04,
  verifiedWordBatch05,
  verifiedWordBatch06,
};

export function buildLearningLexicon(items) {
  return buildBatch05Lexicon(items).map((item) => {
    const reviewed = verifiedWordBatch06[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `用“${reviewed.meaning}”在当前场景中说一个英语表达。`,
      contentStatus: "verified",
    };
  });
}
