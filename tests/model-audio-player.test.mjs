import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/product.css", import.meta.url), "utf8");

test("every speaking reference shows one simple play button", () => {
  assert.match(app, /className=\{`reference-play-button/);
  assert.match(app, /audioPlaying\?"正在播放…":"播放参考表达"/);
  assert.match(app, /disabled=\{audioPlaying\}/);
  assert.doesNotMatch(app, /model-audio-track|model-audio-replay|formatAudioTime/);
});

test("reference play state returns to idle when playback finishes", () => {
  assert.match(app, /onEnded=\{\(\) => setAudioPlaying\(false\)\}/);
  assert.match(app, /speakEnglish\(drill\.model, \(\) => setAudioPlaying\(false\)\)/);
  assert.match(app, /aria-label=\{audioPlaying\?"参考表达正在播放":"播放参考表达"\}/);
});

test("simple reference button keeps the existing fixed first recording", () => {
  assert.match(app, /src="\.\/audio\/quick-speak\.mp3"/);
  assert.match(css, /\.reference-play-button\.is-playing/);
});