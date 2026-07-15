import { speakingDrills as foundationDrills } from "./speaking-drills-base";
import { speakingDrillBatch02 } from "./foundation-batch-02";
import { speakingDrillBatch03 } from "./foundation-batch-03";

export type { SpeakingDrill } from "./speaking-drills-base";
export const speakingDrills = [...foundationDrills, ...speakingDrillBatch02, ...speakingDrillBatch03];
