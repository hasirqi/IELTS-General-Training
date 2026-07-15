import {
  buildLearningLexicon as buildPreviousLexicon,
  lexiconQuality,
  verifiedChunkContent,
} from "./lexicon-content-prebatch.mjs";
import { verifiedWordBatch01 } from "./verified-word-batch-01.mjs";

export { lexiconQuality, verifiedChunkContent, verifiedWordBatch01 };

export function buildLearningLexicon(items) {
  return buildPreviousLexicon(items).map((item) => {
    const reviewed = verifiedWordBatch01[item.term.toLowerCase()];
    if (!reviewed) return item;
    return {
      ...item,
      ...reviewed,
      cue: `“${reviewed.meaning}”在当前场景中用哪个英语词表达？`,
      contentStatus: "verified",
    };
  });
}
