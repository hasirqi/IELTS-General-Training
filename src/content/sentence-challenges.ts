import { sentenceChallenges as foundationChallenges } from "./sentence-challenges-base";
import { sentenceChallengeBatch02 } from "./foundation-batch-02";
import { sentenceChallengeBatch03 } from "./foundation-batch-03";
import { sentenceChallengeBatch04 } from "./foundation-batch-04";
import { sentenceChallengeBatch05 } from "./foundation-batch-05";

export type { SentenceChallenge } from "./sentence-challenges-base";
export const sentenceChallenges = [...foundationChallenges, ...sentenceChallengeBatch02, ...sentenceChallengeBatch03, ...sentenceChallengeBatch04, ...sentenceChallengeBatch05];
