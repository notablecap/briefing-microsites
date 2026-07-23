// Extract the COMPANIES and VERTICALS array literals from an existing microsite HTML file.
// Usage: node extract_companies.js <path-to-html> <out-json>
const fs = require("fs");
const vm = require("vm");

const [, , srcPath, outPath] = process.argv;
const html = fs.readFileSync(srcPath, "utf8");

function sliceArray(marker) {
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const open = html.indexOf("[", start);
  // walk brackets to find the matching close
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    const ch = html[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  return null;
}

const companiesSrc = sliceArray("COMPANIES = [");
const verticalsSrc = sliceArray("VERTICALS = [");
if (!companiesSrc) {
  console.error("COMPANIES array not found in " + srcPath);
  process.exit(1);
}

const sandbox = {};
vm.createContext(sandbox);
const companies = vm.runInContext("(" + companiesSrc + ")", sandbox);
const verticals = verticalsSrc ? vm.runInContext("(" + verticalsSrc + ")", sandbox) : null;

fs.writeFileSync(outPath, JSON.stringify({ verticals, companies }, null, 2));
console.log(
  "Wrote " + outPath + ": " + companies.length + " companies -> " + companies.map((c) => c.id).join(", ")
);
