import fs from "node:fs";
import path from "node:path";
import corpus from "../src/content/text-reference-corpus-voa-120.json" with { type: "json" };
import manifests from "../src/content/reference-review-packets-v1.json" with { type: "json" };
import { materializeBlindedPacket } from "../src/reference-labeling-workflow.mjs";

const slotIndex = process.argv.indexOf("--slot");
const outputIndex = process.argv.indexOf("--output");
const slot = (slotIndex >= 0 ? process.argv[slotIndex + 1] : "").toUpperCase();
if (!/^[AB]$/.test(slot)) throw new Error("Use --slot A or --slot B");
const manifest = manifests.packets.find((packet) => packet.reviewerSlot === slot);
if (!manifest) throw new Error(`Missing reviewer packet ${slot}`);
const packet = materializeBlindedPacket(manifest, corpus.records);
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : path.resolve("audit", `reference-reviewer-${slot.toLowerCase()}.json`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(packet, null, 2)}\n`);
console.log(`Exported blinded reviewer ${slot} packet to ${output}`);
