import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("all 72 listening lessons ship fixed MP3 audio", () => {
  for (let index = 1; index <= 72; index += 1) {
    const file = new URL(`../public/audio/l${index}.mp3`, import.meta.url);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 100_000, `l${index}.mp3 is unexpectedly small`);
    assert.ok(bytes.subarray(0, 3).toString("ascii") === "ID3" || bytes[0] === 0xff, `l${index}.mp3 is not an MP3 stream`);
  }
});
