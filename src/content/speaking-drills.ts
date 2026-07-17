import { speakingDrills as foundationDrills } from "./speaking-drills-base";
import { speakingDrillBatch02 } from "./foundation-batch-02";
import { speakingDrillBatch03 } from "./foundation-batch-03";
import { speakingDrillBatch04 } from "./foundation-batch-04";
import { speakingDrillBatch05 } from "./foundation-batch-05";
import { speakingDrillBatch06 } from "./foundation-batch-06";
import { speakingDrillBatch07 } from "./foundation-batch-07";
import { speakingDrillBatch08 } from "./foundation-batch-08";
import { speakingDrillBatch09 } from "./foundation-batch-09";
import { speakingDrillBatch10 } from "./foundation-batch-10";
import { speakingDrillBatch11 } from "./foundation-batch-11";
import { speakingDrillBatch12 } from "./foundation-batch-12";
import { speakingDrillBatch13 } from "./foundation-batch-13";
import { speakingDrillBatch14 } from "./foundation-batch-14";

export type { SpeakingDrill } from "./speaking-drills-base";
export const speakingDrills = [...foundationDrills, ...speakingDrillBatch02, ...speakingDrillBatch03, ...speakingDrillBatch04, ...speakingDrillBatch05, ...speakingDrillBatch06, ...speakingDrillBatch07, ...speakingDrillBatch08, ...speakingDrillBatch09, ...speakingDrillBatch10, ...speakingDrillBatch11, ...speakingDrillBatch12, ...speakingDrillBatch13, ...speakingDrillBatch14];
