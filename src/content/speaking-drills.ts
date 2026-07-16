import { speakingDrills as foundationDrills } from "./speaking-drills-base";
import { speakingDrillBatch02 } from "./foundation-batch-02";
import { speakingDrillBatch03 } from "./foundation-batch-03";
import { speakingDrillBatch04 } from "./foundation-batch-04";
import { speakingDrillBatch05 } from "./foundation-batch-05";
import { speakingDrillBatch06 } from "./foundation-batch-06";

export type { SpeakingDrill } from "./speaking-drills-base";
export const speakingDrills = [...foundationDrills, ...speakingDrillBatch02, ...speakingDrillBatch03, ...speakingDrillBatch04, ...speakingDrillBatch05, ...speakingDrillBatch06];
