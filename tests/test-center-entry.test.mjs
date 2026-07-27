import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppProduct.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("entering the test center always shows the five-mode landing page", () => {
  assert.ok(app.includes("const [vocabularyTestActive, setVocabularyTestActive] = useState(false)"));
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
  assert.ok(app.includes("setRouteSnapshot(routeEstimate);\n    setActiveTest(false)"));
  assert.ok(app.includes("setShowResult(false); setActiveTest(false);"));
});


test("back from an active test returns to the five-mode center before home", () => {
  assert.ok(app.includes("const [vocabularyTestActive, setVocabularyTestActive] = useState(false)"));
  assert.ok(app.includes('view === "vocabulary-test" && vocabularyTestActive'));
  assert.ok(app.includes("setVocabularyTestActive(false); return;"));
  assert.ok(app.includes("activeTest={vocabularyTestActive} setActiveTest={setVocabularyTestActive}"));
  assert.ok(app.includes("if (!activeTest) { setQuickMode(false); setShowResult(false); }"));
  assert.ok(app.includes('? "返回测试中心" : "返回首页"'));
});


test("precision CAT starts with scored context items instead of repeating the Yes-No route", () => {
  assert.ok(app.includes('if (intent === "quick-route")'));
  assert.ok(app.includes('phase:"cat",intent,routeItems:[]'));
  assert.ok(app.includes("const initialTheta = recentRoute?.theta ?? 0"));
  assert.ok(app.includes("直接进入英文语境释义 CAT"));
});
