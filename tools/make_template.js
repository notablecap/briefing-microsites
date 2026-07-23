// One-time: turn the Dominion .dc.html into template/index.template.html with %%TOKENS%%.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = "/Users/bzabel/Desktop/Microsites/Dominion Energy microsite/Dominion Energy Microsite.dc.html";
let html = fs.readFileSync(SRC, "utf8");

function replaceOnce(from, to, label) {
  const i = html.indexOf(from);
  if (i === -1) throw new Error("NOT FOUND: " + label);
  html = html.slice(0, i) + to + html.slice(i + from.length);
}

function replaceArray(marker, token) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error("NOT FOUND: " + marker);
  const open = html.indexOf("[", start);
  let depth = 0, end = -1;
  for (let i = open; i < html.length; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  html = html.slice(0, open) + token + html.slice(end + 1);
}

// 1) data structures -> tokens
replaceArray("COMPANIES = [", "%%COMPANIES_JS%%");
replaceArray("VERTICALS = [", "%%VERTICALS_JS%%");
// SHORT map (single line object)
html = html.replace(/SHORT = \{[^}]*\};/, "SHORT = %%SHORT_JS%%;");
if (!html.includes("SHORT = %%SHORT_JS%%;")) throw new Error("SHORT map not tokenized");

// 2) logo dependency meta block -> token
const depRe = /(<meta name="ext-resource-dependency"[^>]*>\n?)+/;
if (!depRe.test(html)) throw new Error("dep metas not found");
html = html.replace(depRe, "%%LOGO_DEPS%%\n");

// 3) client copy -> tokens (longest strings first; they contain the client name)
replaceOnce(
  "Fifteen companies from our portfolio, chosen for the teams building Dominion Energy's next era of AI, grid and customer operations, and security.",
  "%%HERO_SUBLINE%%", "hero subline");
replaceOnce(
  "We picked fifteen companies from our portfolio that map to the technology priorities of a modern energy enterprise: frontier AI and the infrastructure to run it, data quality and privacy, cloud and identity security, network and developer infrastructure, and the systems behind customer and field operations.",
  "%%NOTE_P1%%", "note p1");
replaceOnce(
  "Each card opens to a brief and the angle we think fits Dominion Energy best, and you can filter by category. Our full portfolio of 150+ active companies is linked in the top right. Whenever it's convenient, send back the ones worth a closer look.",
  "%%NOTE_P2%%", "note p2");
replaceOnce(
  "Every company here works at the infrastructure layer, across AI, data, security, and the operations of a modern utility. Filter by category, then expand any card for the brief and the angle most relevant to your team.",
  "%%PORTFOLIO_INTRO%%", "portfolio intro");

// 4) client asset paths -> tokens
html = html.split("uploads/Dominion_Energy_logo.svg.webp").join("uploads/%%CLIENT_LOGO%%");
html = html.split("uploads/Dominion-Energy.webp").join("uploads/%%CLIENT_FAVICON%%");

// 5) name + accent -> tokens (after the sentences above are already tokenized)
html = html.split("Dominion Energy").join("%%CLIENT_NAME%%");
html = html.split("#2F6EB5").join("%%ACCENT%%");

// 6) gate hook: right after <body>, optional password gate snippet
replaceOnce("<body>", "<body>\n%%GATE_SNIPPET%%", "body tag");

// sanity: no leftover client-specific residue
const leftovers = (html.match(/Dominion/g) || []).length;
if (leftovers) {
  const idx = html.indexOf("Dominion");
  throw new Error("Leftover 'Dominion' at char " + idx + ": ..." + html.slice(idx - 80, idx + 80));
}

fs.mkdirSync(path.join(ROOT, "template"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "template/index.template.html"), html);

// static template assets
const DOM = path.dirname(SRC);
for (const rel of ["support.js", "assets/notable-wordmark-sage-tight.png",
  "fonts/Alverata-Light.otf", "fonts/Alverata-Regular.otf",
  "fonts/OpenSans-Variable.ttf", "fonts/OpenSans-Italic-Variable.ttf"]) {
  const dest = path.join(ROOT, "template", rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(DOM, rel), dest);
}
console.log("Template written. Tokens:", (html.match(/%%[A-Z_]+%%/g) || []).filter((v, i, a) => a.indexOf(v) === i).join(" "));
