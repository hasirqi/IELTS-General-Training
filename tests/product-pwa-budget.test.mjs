import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const config = fs.readFileSync(new URL("../vite.config.mjs", import.meta.url), "utf8");

test("PWA precache budget covers the reviewed offline curriculum bundle", () => {
  assert.match(config, /maximumFileSizeToCacheInBytes:\s*3\s*\*\s*1024\s*\*\s*1024/);
});
