// Ingest the 510-row copy matrix (tools/source-matrix.xlsx) into all 34 client configs.
// Source of truth for angle copy: the workbook. Brand data: tools/clients.json.
// Usage: node tools/ingest_matrix.js
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.resolve(__dirname, "..");
const wb = XLSX.readFile(path.join(__dirname, "source-matrix.xlsx"));
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Copy Matrix"], { defval: "" });
const clients = JSON.parse(fs.readFileSync(path.join(__dirname, "clients.json"), "utf8"));
const clientArr = Array.isArray(clients) ? clients : clients.clients;
const tmpl = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", "_template.json"), "utf8"));
const ROSTER = tmpl.roster;

// Workbook client name -> slug
const CLIENT_MAP = {
  "AIG": "aig", "Aritzia": "aritzia", "Boeing": "boeing", "Builders FirstSource": "builders-firstsource",
  "Butterball": "butterball", "Cedars-Sinai": "cedars-sinai", "Chiquita": "chiquita", "Choice Hotels": "choice-hotels",
  "David's Bridal": "davids-bridal", "Deckers Brands": "deckers", "DocuSign": "docusign", "Fanatics": "fanatics",
  "Ford": "ford", "Gallagher": "gallagher", "Humana": "humana", "IHG": "ihg", "Intuit": "intuit",
  "John Deere": "john-deere", "Kohl's": "kohls", "L'Oréal": "loreal", "Live Nation Entertainment": "live-nation",
  "Major League Soccer": "mls", "Northwestern Medicine (Chicago)": "northwestern-medicine", "Portillo's": "portillos",
  "Sara Lee Frozen Bakery": "sara-lee", "The Gap, Inc.": "gap", "The White House": "white-house",
  "The World Bank": "world-bank", "Tyson Foods": "tyson", "U.S. Navy": "us-navy", "U.S. Postal Service": "usps",
  "URBN": "urbn", "UT Southwestern Medical Center": "ut-southwestern", "United Airlines": "united-airlines"
};
// Workbook portco name -> library id
const PORTCO_MAP = {
  "Anthropic": "anthropic", "Wispr Flow": "wispr", "Browserbase": "browserbase", "Coder": "coder",
  "Token Security": "token", "fal": "fal", "Monte Carlo": "montecarlo", "Tonic": "tonic",
  "NetBox Labs": "netbox", "Valar": "valar", "Echo": "echo", "Act Security": "act",
  "Clover Security": "clover", "Drata": "drata", "Orca Security": "orca"
};
const ORG_PHRASE = { CDO: "data organization", CTO: "technology organization", CIO: "information and technology organization" };

// ---- collect + validate -----------------------------------------------------
const bySlug = {};
const problems = [];
for (const r of rows) {
  const slug = CLIENT_MAP[String(r["Client"]).trim()];
  const pid = PORTCO_MAP[String(r["Portfolio Company"]).trim()];
  if (!slug) { problems.push("unmapped client: " + r["Client"]); continue; }
  if (!pid) { problems.push("unmapped portco: " + r["Portfolio Company"]); continue; }
  const pull = String(r["Paragraph"]).trim();
  const cases = [r["Bullet 1"], r["Bullet 2"], r["Bullet 3"]].map((b) => String(b).trim());
  if (!pull) problems.push(`${slug}/${pid}: empty paragraph`);
  cases.forEach((c, i) => { if (!c) problems.push(`${slug}/${pid}: empty bullet ${i + 1}`); });
  bySlug[slug] = bySlug[slug] || {};
  if (bySlug[slug][pid]) problems.push(`${slug}/${pid}: duplicate row`);
  bySlug[slug][pid] = { pull, cases };
}
for (const c of clientArr) {
  const have = Object.keys(bySlug[c.slug] || {});
  const missing = ROSTER.filter((id) => !have.includes(id));
  if (missing.length) problems.push(`${c.slug}: missing angles for ${missing.join(", ")}`);
}
if (problems.length) {
  console.error("VALIDATION FAILED (" + problems.length + "):\n" + problems.join("\n"));
  process.exit(1);
}

// ---- asset detection --------------------------------------------------------
function findAsset(slug, base) {
  const dir = path.join(ROOT, "configs", "assets", slug);
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => f.toLowerCase().startsWith(base + "."));
  return hit || null;
}

// ---- write configs ----------------------------------------------------------
let written = 0;
const warnings = [];
for (const c of clientArr) {
  const org = ORG_PHRASE[c.role] || "technology organization";
  const logo = findAsset(c.slug, "logo");
  const favicon = findAsset(c.slug, "favicon");
  if (!logo) warnings.push(c.slug + ": no logo file in configs/assets/" + c.slug);
  if (!favicon) warnings.push(c.slug + ": no favicon file in configs/assets/" + c.slug);
  const angles = {};
  for (const id of ROSTER) angles[id] = bySlug[c.slug][id];
  const config = {
    slug: c.slug,
    clientName: c.clientName || c.name,
    role: c.role,
    accent: c.accent,
    clientLogo: logo || "logo.png",
    favicon: favicon || "favicon.png",
    password: "",
    emailRecipients: "bzabel@notablecap.com",
    noteP1: `We picked fifteen companies from our portfolio that map to the priorities of ${(c.clientName || c.name)}'s ${org}: frontier AI and the infrastructure to run it economically, the data foundations underneath, and the security and developer tooling that let both move to production.`,
    noteP2: `Each card opens to a brief and the angle we think fits ${(c.clientName || c.name)} best, and you can filter by category. Our full portfolio of 150+ active companies is linked in the top right. Whenever it's convenient, send back the ones worth a closer look.`,
    portfolioIntro: `Every company here works at the infrastructure layer, across AI, data, security, and developer tooling, with an angle on where it fits ${(c.clientName || c.name)}'s agenda. Filter by category, then expand any card for the brief.`,
    roster: ROSTER,
    angles
  };
  fs.writeFileSync(path.join(ROOT, "configs", c.slug + ".json"), JSON.stringify(config, null, 2) + "\n");
  written++;
}
console.log(written + " configs written from " + rows.length + " matrix rows.");
if (warnings.length) console.log("WARNINGS:\n" + warnings.join("\n"));
