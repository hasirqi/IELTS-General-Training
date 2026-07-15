import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppCore.tsx", import.meta.url), "utf8");
const vite = fs.readFileSync(new URL("../vite.config.mjs", import.meta.url), "utf8");

test("all four listening lessons ship fixed British-English MP3 audio", () => {
  for (const id of ["l1", "l2", "l3", "l4"]) {
    const file = new URL(`../public/audio/${id}.mp3`, import.meta.url);
    const data = fs.readFileSync(file);
    assert.ok(data.length > 100_000, `${id}.mp3 is unexpectedly small`);
    assert.ok(data.subarray(0, 3).toString("ascii") === "ID3" || data[0] === 0xff, `${id}.mp3 is not an MP3 stream`);
  }
  assert.match(app, /标准英式录音/);
  assert.match(app, /\.\/audio\/\$\{lesson\.id\}\.mp3/);
  assert.match(app, /\.\/audio\/quick-speak\.mp3/);
  assert.ok(fs.statSync(new URL("../public/audio/quick-speak.mp3", import.meta.url)).size > 10_000);
  assert.match(vite, /woff2,mp3/);
});

test("browser pronunciation always requests an English voice", () => {
  assert.match(app, /utterance\.lang="en-GB"/);
  assert.match(app, /v\.lang\.toLowerCase\(\)\.startsWith\("en"\)/);
});
