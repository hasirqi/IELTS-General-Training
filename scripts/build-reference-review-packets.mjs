import fs from "node:fs";
import corpus from "../src/content/text-reference-corpus-voa-120.json" with { type: "json" };
import { buildBlindedReviewPacket } from "../src/reference-labeling-workflow.mjs";

const payload = {
  version: "reference-review-packets-v1-2026.08.01",
  corpusVersion: corpus.version,
  status: "packet-manifests-only-no-human-labels",
  packets: [buildBlindedReviewPacket(corpus.records, "A"), buildBlindedReviewPacket(corpus.records, "B")],
};

fs.writeFileSync(new URL("../src/content/reference-review-packets-v1.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Built ${payload.packets.length} blinded packets with ${payload.packets[0].itemCount} items each.`);
