import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const directory = path.resolve("tests");
const files = fs.readdirSync(directory).filter((file) => file.endsWith(".test.mjs")).sort();
for (const file of files) await import(pathToFileURL(path.join(directory,file)).href);
