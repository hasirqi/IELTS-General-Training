import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");

test("the complete library count is dynamic and fully pageable", () => {
  assert.match(app, /词库 \{lexicon\.length\.toLocaleString\(\)\} 条/);
  assert.match(app, /const PAGE_SIZE\s*=\s*50/);
  assert.match(app, /找到 \{filtered\.length\} 条/);
  assert.match(app, /下一页/);
  assert.doesNotMatch(app, /slice\(0,80\)/);
});
