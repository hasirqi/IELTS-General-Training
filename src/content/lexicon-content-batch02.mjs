import {
  buildLearningLexicon as buildBatch01Lexicon,
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
} from "./lexicon-content-batch01.mjs";
import { verifiedWordBatch02 } from "./verified-word-batch-02.mjs";

export {
  lexiconQuality,
  verifiedChunkContent,
  verifiedWordBatch01,
  verifiedWordBatch02,
};

export function buildLearningLexicon(items) {
  return buildBatch01Lexicon(items).map((item) => {
    const reviewed = verifiedWordBatch02[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `“${reviewed.meaning}”在当前场景中用哪个英语词表达？`,
      contentStatus: "verified",
    };
  });
}
