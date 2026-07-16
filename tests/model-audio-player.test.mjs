import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/product.css", import.meta.url), "utf8");

test("speaking reference audio exposes real playback state", () => {
  assert.match(app, /ref=\{modelAudioRef\}/);
  assert.match(app, /onTimeUpdate=/);
  assert.match(app, /onPlay=/);
  assert.match(app, /onPause=/);
  assert.match(app, /onEnded=/);
  assert.match(app, /audioPlaying\?<IconPlayerPause\/>:<IconPlayerPlay\/>/);
  assert.doesNotMatch(app, /playFixedAudio/);
});

test("speaking reference audio reports progress and supports replay", () => {
  assert.match(app, /role="progressbar" aria-label="录音播放进度"/);
  assert.match(app, /formatAudioTime\(audioPosition\)/);
  assert.match(app, /aria-label="从头播放英式示范录音"/);
  assert.match(app, /正在播放英式示范/);
  assert.match(app, /录音播放完成/);
});

test("speaking reference audio has responsive and reduced-motion styles", () => {
  assert.match(css, /\.model-audio-player\.is-playing/);
  assert.match(css, /\.model-audio-track/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});