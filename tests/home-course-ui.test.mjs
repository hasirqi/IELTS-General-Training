import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/AppCore.tsx", import.meta.url), "utf8");

test("course cards are the only course entry and open their own skill", () => {
  assert.doesNotMatch(app, /className="course-actions"/);
  assert.doesNotMatch(app, />打开 1,000 词库<\/button><button/);
  assert.match(app, /onOpenCourse\(key as CourseLesson\["skill"\]\)/);
  assert.match(app, /useState<CourseLesson\["skill"\]>\(initialSkill\)/);
});
