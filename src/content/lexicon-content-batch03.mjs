import {
  buildLearningLexicon as buildBatch02Lexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
} from "./lexicon-content-batch02.mjs";
import { verifiedWordBatch03 } from "./verified-word-batch-03.mjs";

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
  verifiedWordBatch03,
};

export function buildLearningLexicon(items) {
  return buildBatch02Lexicon(items).map((item) => {
    const reviewed = verifiedWordBatch03[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `“${reviewed.meaning}”在当前场景中用哪个英语词表达？`,
      contentStatus: "verified",
    };
  });
}
