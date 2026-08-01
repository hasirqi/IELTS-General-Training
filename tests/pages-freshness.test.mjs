import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const main = fs.readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8");

test("PWA checks for updates and reloads once when a new worker takes control", () => {
  assert.ok(main.includes("onRegisteredSW(_swUrl, registration)"));
  assert.ok(main.includes("registration?.update()"));
  assert.ok(main.includes('addEventListener("controllerchange"'));
  assert.ok(main.includes("if (refreshingForUpdate) return"));
  assert.ok(main.includes("window.location.reload()"));
});

test("the latest reviewed anchor count is visible on home and in the test center", () => {
  assert.ok(app.includes('subtitle:`${vocabularyAnchors.length} 个已审核锚点，自适应定位`'));
  assert.ok(app.includes("{vocabularyAnchors.length} 个已审核计分锚点"));
  assert.ok(app.includes("五种模式均从各自题池重新随机抽取"));
});
