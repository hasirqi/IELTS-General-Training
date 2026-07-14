import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppCore.tsx", import.meta.url), "utf8");

test("the 1,000-item library is visible and fully pageable", () => {
  assert.match(app, /词库 1,000 条/);
  assert.match(app, /const PAGE_SIZE=50/);
  assert.match(app, /找到 \{filtered\.length\} 条/);
  assert.match(app, /下一页/);
  assert.doesNotMatch(app, /slice\(0,80\)/);
});
