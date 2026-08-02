import fs from "node:fs";
import path from "node:path";
import corpus from "../src/content/text-reference-corpus-level-correction-round2-candidates.json" with { type: "json" };
import { buildBlindedReviewPacket, materializeBlindedPacket } from "../src/reference-labeling-workflow.mjs";

const outputIndex = process.argv.indexOf("--audit-dir");
const auditDir = outputIndex >= 0 ? process.argv[outputIndex + 1] : path.resolve("audit", "level-correction-round2-review");
const packet = (slot) => {
  const built = buildBlindedReviewPacket(corpus.records, slot);
  return {
    ...built,
    packetId: `level-correction-round2-28-reviewer-${slot.toLowerCase()}-v1`,
    blindFields: [...new Set([...built.blindFields, "source.targetLevel", "source.name", "source.url", "source.locator"])],
  };
};

const packets = [packet("A"), packet("B")];
const manifest = {
  version: "level-correction-round2-review-packets-v1-2026.08.02",
  corpusVersion: corpus.version,
  status: "packet-manifests-only-no-labels",
  packets,
};

fs.writeFileSync(new URL("../src/content/reference-review-correction-round2-packets-v1.json", import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
fs.mkdirSync(auditDir, { recursive: true });
for (const item of packets) {
  const materialized = materializeBlindedPacket(item, corpus.records);
  fs.writeFileSync(path.join(auditDir, `reviewer-${item.reviewerSlot.toLowerCase()}.json`), `${JSON.stringify(materialized, null, 2)}\n`);
}
console.log(`Built two isolated 28-item packets in ${auditDir}`);
