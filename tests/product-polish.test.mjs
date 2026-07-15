import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import lexicon from "../src/content/lexicon.json" with { type: "json" };
import { buildLearningLexicon } from "../src/content/lexicon-content.mjs";

test("internal lexicon category names are converted to learner-facing labels", () => {
  const items = buildLearningLexicon(lexicon);
  assert.equal(items.some((item) => item.category === "ielts"), false);
  assert.equal(items.some((item) => item.category === "General Training 高频"), true);
});

test("long word headings cannot force the pronunciation line outside the card", () => {
  const css = fs.readFileSync(new URL("../src/product-fixes.css", import.meta.url), "utf8");
  assert.match(css, /\.word-heading > div\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("the PWA manifest retains the Chinese product name", () => {
  const config = fs.readFileSync(new URL("../vite.config.mjs", import.meta.url), "utf8");
  assert.match(config, /name:\s*"破壁 IELTS 6"/);
});
