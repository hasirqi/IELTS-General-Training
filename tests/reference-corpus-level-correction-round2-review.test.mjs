import assert from "node:assert/strict";
import test from "node:test";
import corpus from "../src/content/text-reference-corpus-level-correction-round2-candidates.json" with { type: "json" };
import manifests from "../src/content/reference-review-correction-round2-packets-v1.json" with { type: "json" };
import { materializeBlindedPacket } from "../src/reference-labeling-workflow.mjs";

test("round two review packets cover the same 28 texts in different orders", () => {
  assert.equal(manifests.packets.length, 2);
  const [first, second] = manifests.packets;
  assert.equal(first.itemCount, 28);
  assert.equal(second.itemCount, 28);
  assert.deepEqual([...first.order].sort(), [...second.order].sort());
  assert.notDeepEqual(first.order, second.order);
  assert.equal(new Set(first.order).size, 28);
});

test("round two packets hide source, target and computed features", () => {
  for (const manifest of manifests.packets) {
    const packet = materializeBlindedPacket(manifest, corpus.records);
    for (const item of packet.items) {
      assert.deepEqual(Object.keys(item), ["sequence", "itemId", "title", "text", "response"]);
      assert.deepEqual(item.response, { level: null, confidence: null, evidenceCodes: [], note: "" });
      assert.equal("features" in item, false);
      assert.equal("provisionalInternalLevel" in item, false);
      assert.equal("source" in item, false);
      assert.equal("split" in item, false);
    }
  }
});
