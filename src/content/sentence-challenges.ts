import { sentenceChallenges as foundationChallenges } from "./sentence-challenges-base";
import { sentenceChallengeBatch02 } from "./foundation-batch-02";

export type { SentenceChallenge } from "./sentence-challenges-base";

export const sentenceChallenges = [
  ...foundationChallenges,
  ...sentenceChallengeBatch02,
];
