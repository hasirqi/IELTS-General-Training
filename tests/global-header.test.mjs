import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppCore.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/course.css", import.meta.url), "utf8");

test("one global header renders outside every page view", () => {
  assert.match(app, /<GlobalHeader onHome=/);
  assert.ok(app.indexOf("<GlobalHeader") < app.indexOf('view==="home"'));
  assert.equal((app.match(/className="global-header"/g) ?? []).length, 1);
  assert.match(app, /词库 1,000 条/);
  assert.match(app, /向 ChatGPT 提问/);
});

test("global header stays visible while page content scrolls", () => {
  assert.match(css, /\.global-header\{position:sticky;top:0;z-index:100/);
  assert.doesNotMatch(app, /className="lesson-header"/);
  assert.match(app, /className="context-header"/);
});
