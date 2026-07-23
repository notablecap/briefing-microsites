#!/usr/bin/env node
// Build static microsites from template + shared company library + per-client configs.
// Usage:
//   node generate.js                 -> build every config in configs/*.json
//   node generate.js dominion-energy -> build one slug
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const template = fs.readFileSync(path.join(ROOT, "template/index.template.html"), "utf8");
const library = JSON.parse(fs.readFileSync(path.join(ROOT, "shared/companies.json"), "utf8"));
const libById = Object.fromEntries(library.map((c) => [c.id, c]));

const DEFAULT_VERTICALS = [
  { id: "ai", name: "AI & Agent Infra" },
  { id: "data", name: "Data Infrastructure" },
  { id: "security", name: "Security & Governance" },
  { id: "dev", name: "Developer & Cloud Infra" },
];
const DEFAULT_SHORT = { ai: "AI infra", data: "Data", security: "Security", dev: "Dev & cloud", cx: "Customer ops" };

function gateSnippet(password) {
  if (!password) return "";
  // Client-side gate. This is a speed bump, not access control: the password is visible in source.
  return `<script>(function(){try{if(sessionStorage.getItem("nc_gate")==="1")return;}catch(e){}
var p=prompt("This briefing is private. Enter the access code:");
if(p!==${JSON.stringify(password)}){document.documentElement.innerHTML="<body style='font-family:sans-serif;padding:60px;color:#232323'><h2>Access code required.</h2><p>Refresh the page to try again, or contact bzabel@notablecap.com.</p></body>";}
else{try{sessionStorage.setItem("nc_gate","1");}catch(e){}}})();</script>`;
}

function esc(s) { return String(s); }

function buildSite(config) {
  const slug = config.slug;
  const warnings = [];

  const verticals = config.verticals || DEFAULT_VERTICALS;
  const short = config.short || DEFAULT_SHORT;

  const companies = config.roster.map((id) => {
    const base = libById[id];
    if (!base) throw new Error(`[${slug}] unknown company id "${id}" (not in shared/companies.json)`);
    const angle = (config.angles || {})[id];
    if (!angle || !angle.pull) warnings.push(`missing angle (pull) for ${id}`);
    if (!angle || !angle.cases || angle.cases.length !== 3) warnings.push(`angle for ${id} should have exactly 3 cases`);
    if ((base.blurb || "").startsWith("DRAFT")) warnings.push(`blurb for ${id} is still a DRAFT`);
    return { ...base, dePull: angle ? angle.pull : "", deCases: angle ? angle.cases || [] : [] };
  });

  // every roster tag must exist in this site's verticals
  const vIds = new Set(verticals.map((v) => v.id));
  for (const c of companies) for (const t of c.tags) if (!vIds.has(t)) warnings.push(`${c.id} tagged "${t}" but no such vertical on this site`);

  const logoDeps = companies
    .map((c) => `<meta name="ext-resource-dependency" content="${c.logo}">`)
    .join("\n");

  let html = template;
  const sub = (token, value) => { html = html.split(token).join(value); };
  sub("%%COMPANIES_JS%%", JSON.stringify(companies, null, 2));
  sub("%%VERTICALS_JS%%", JSON.stringify(verticals, null, 2));
  sub("%%SHORT_JS%%", JSON.stringify(short));
  sub("%%LOGO_DEPS%%", logoDeps);
  const roleLabel = config.roleLabel || (config.role ? "Office of the " + config.role : "");
  const roleBlock = roleLabel
    ? '<div style="margin-top:22px;"><span style="font-family:\'Alverata\',serif;font-weight:300;font-size:clamp(20px,2.6vw,29px);line-height:1.25;letter-spacing:-0.01em;color:#232323;display:inline-block;">' + roleLabel + "</span></div>"
    : "";
  sub("%%ROLE_BLOCK%%", roleBlock);
  sub("%%NOTE_P1%%", esc(config.noteP1));
  sub("%%NOTE_P2%%", esc(config.noteP2));
  sub("%%PORTFOLIO_INTRO%%", esc(config.portfolioIntro));
  sub("%%CLIENT_NAME%%", esc(config.clientName));
  sub("%%ACCENT%%", esc(config.accent));
  sub("%%CLIENT_LOGO%%", esc(config.clientLogo));
  sub("%%CLIENT_FAVICON%%", esc(config.favicon));
  sub("%%GATE_SNIPPET%%", gateSnippet(config.password));

  const leftover = html.match(/%%[A-Z0-9_]+%%/);
  if (leftover) throw new Error(`[${slug}] unreplaced token ${leftover[0]}`);

  // ---- write dist ----
  const out = path.join(ROOT, "dist", slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "logos"), { recursive: true });
  fs.mkdirSync(path.join(out, "uploads"), { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), html);

  // template statics
  for (const rel of ["support.js", "assets/notable-wordmark-sage-tight.png",
    "fonts/Alverata-Light.otf", "fonts/Alverata-Regular.otf",
    "fonts/OpenSans-Variable.ttf", "fonts/OpenSans-Italic-Variable.ttf"]) {
    const dest = path.join(out, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "template", rel), dest);
  }
  // roster logos
  for (const c of companies) {
    const src = path.join(ROOT, "shared", c.logo);
    if (!fs.existsSync(src)) { warnings.push(`logo file missing: ${c.logo}`); continue; }
    fs.copyFileSync(src, path.join(out, c.logo));
  }
  // client assets
  for (const f of [config.clientLogo, config.favicon]) {
    const src = path.join(ROOT, "configs/assets", slug, f);
    if (!fs.existsSync(src)) { warnings.push(`client asset missing: configs/assets/${slug}/${f}`); continue; }
    fs.copyFileSync(src, path.join(out, "uploads", f));
  }

  return warnings;
}

const only = process.argv[2];
const files = fs.readdirSync(path.join(ROOT, "configs"))
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .filter((f) => !only || f === only + ".json");
if (!files.length) { console.error("No configs matched."); process.exit(1); }

let hadWarnings = false;
for (const f of files) {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", f), "utf8"));
  const warnings = buildSite(config);
  const status = warnings.length ? `⚠ ${warnings.length} warning(s)` : "✓";
  console.log(`${status}  dist/${config.slug}`);
  warnings.forEach((w) => console.log("    - " + w));
  if (warnings.length) hadWarnings = true;
}
console.log(files.length + " site(s) built.");
if (hadWarnings) process.exitCode = 2;
