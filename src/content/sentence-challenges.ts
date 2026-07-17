import { sentenceChallenges as foundationChallenges } from "./sentence-challenges-base";
import { sentenceChallengeBatch02 } from "./foundation-batch-02";
import { sentenceChallengeBatch03 } from "./foundation-batch-03";
import { sentenceChallengeBatch04 } from "./foundation-batch-04";
import { sentenceChallengeBatch05 } from "./foundation-batch-05";
import { sentenceChallengeBatch06 } from "./foundation-batch-06";
import { sentenceChallengeBatch07 } from "./foundation-batch-07";
import { sentenceChallengeBatch08 } from "./foundation-batch-08";
import { sentenceChallengeBatch09 } from "./foundation-batch-09";
import { sentenceChallengeBatch10 } from "./foundation-batch-10";

export type { SentenceChallenge } from "./sentence-challenges-base";
export const sentenceChallenges = [...foundationChallenges, ...sentenceChallengeBatch02, ...sentenceChallengeBatch03, ...sentenceChallengeBatch04, ...sentenceChallengeBatch05, ...sentenceChallengeBatch06, ...sentenceChallengeBatch07, ...sentenceChallengeBatch08, ...sentenceChallengeBatch09, ...sentenceChallengeBatch10];
