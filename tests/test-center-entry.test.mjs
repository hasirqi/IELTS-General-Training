import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("entering the test center always shows the five-mode landing page", () => {
  assert.ok(app.includes("const [activeTest,setActiveTest] = useState(false)"));
  assert.ok(app.includes("if (!activeTest)"));
  assert.ok(!app.includes("if (!draft) {\n    const lastDate"));
  assert.ok(app.includes("五种模式并列展示"));
});

test("an unfinished local draft is offered as an explicit resume choice", () => {
  assert.ok(app.includes('eyebrow:"上次测试未完成"'));
  assert.ok(app.includes('button:"继续上次测试"'));
  assert.ok(app.includes("action:() => setActiveTest(true)"));
  assert.ok(app.includes("作答进度已保存在本机，也可以从下方重新选择其他模式"));
});

test("starting a mode enters its task while quick routing returns to the center", () => {
  assert.ok(app.includes("setActiveTest(true);\n    setQuickMode(false)"));
  assert.ok(app.includes("setRouteSnapshot(routeEstimate);\n      setActiveTest(false)"));
  assert.ok(app.includes("setShowResult(false); setActiveTest(false);"));
});
