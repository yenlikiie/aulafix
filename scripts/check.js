import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { validateOrganizations } from "../assets/organizations.js";

for (const directory of ["assets", "scripts", "tests"]) {
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".js"))) {
    execFileSync(process.execPath, ["--check", `${directory}/${file}`], { stdio: "inherit" });
  }
}
assert.deepEqual(validateOrganizations(), [], "Organization configuration must be valid");
const html = readFileSync("index.html", "utf8");
for (const [, file] of html.matchAll(/(?:src|href)="\/aulafix\/([^"]+)"/g)) readFileSync(file);
const bundle = readFileSync("assets/index.js", "utf8");
assert.equal((bundle.match(/jsx\)\(AulaFixIssueDetails,\{report:e\}\)/g) || []).length, 1, "Issue card integration must exist exactly once");
assert.ok(html.includes("/aulafix/assets/organizations.css"), "Feature stylesheet must be linked");
console.log("Passed: JavaScript syntax, organization config, static asset references, issue-card integration.");
