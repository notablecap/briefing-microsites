// One-time assembly: build shared/companies.json (company library), copy logos,
// and write configs/dominion-energy.json as the parity-test config.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MS = "/Users/bzabel/Desktop/Microsites";
const DOM_DIR = path.join(MS, "Dominion Energy microsite");
const JLL_DIR = path.join(MS, "JLL Notable companies microsite ");
const BD_DIR = path.join(MS, "Becton Dickinson");

const dom = require("./dominion.raw.json");
const jll = require("./jll.raw.json");

const byId = (arr) => Object.fromEntries(arr.map((c) => [c.id, c]));
const D = byId(dom.companies);
const J = byId(jll.companies);

// ---- logo consolidation: canonical file per company in shared/logos ----
const logoCopies = []; // [srcAbs, destName]
function useLogo(srcDir, srcRel, destName) {
  logoCopies.push([path.join(srcDir, srcRel), destName]);
  return "logos/" + destName;
}

// shared fields only (dePull/deCases are per-client and live in configs)
function lib(src, overrides = {}) {
  const { dePull, deCases, ...shared } = src;
  return { ...shared, ...overrides };
}

const library = [];

// From Dominion (newest copy of these blurbs)
const domIds = ["anthropic","gladly","montecarlo","netbox","token","valar","tonic","browserbase","coder","patronus","fal","act","clover","wispr","generalist"];
for (const id of domIds) {
  const c = D[id];
  const destName = path.basename(c.logo);
  library.push(lib(c, { logo: useLogo(DOM_DIR, c.logo, destName) }));
}

// From JLL (companies Dominion lacks)
for (const id of ["drata", "echo", "vercel", "descope", "beacon"]) {
  const c = J[id];
  const destName = path.basename(c.logo);
  library.push(lib(c, { logo: useLogo(JLL_DIR, c.logo, destName) }));
}

// Stubs: Orca + LocalStack (no existing blurbs anywhere) — DRAFTS, flag for Ben's review
library.push({
  id: "orca", name: "Orca Security", logo: "logos/orca.png", // MISSING FILE — add to shared/logos
  stage: null,
  oneLiner: "Agentless cloud security across your entire cloud estate.",
  blurb: "DRAFT — REVIEW BEFORE PUBLISH. Orca Security is the agentless cloud security platform. One deployment-free connection covers AWS, Azure, and Google Cloud, surfacing vulnerabilities, misconfigurations, exposed data, and identity risk across VMs, containers, and serverless — then prioritizes the attack paths that actually matter instead of a flood of alerts.",
  customers: [], tags: ["security"],
  link: "https://orca.security/", caseStudyLink: null, caseStudyName: null,
});

library.push({
  id: "localstack", name: "LocalStack", logo: useLogo(BD_DIR, "681e4d77a183f92570e14555_localstack-logo.svg", "localstack.svg"),
  stage: null,
  oneLiner: "The local cloud: develop and test AWS applications entirely on your machine.",
  blurb: "DRAFT — REVIEW BEFORE PUBLISH. LocalStack is a high-fidelity emulator of AWS that runs on a laptop or in CI. Teams develop and test cloud applications locally — no shared dev accounts, no cloud bills for test runs, no waiting on deploys — then ship to real AWS with confidence. It has become standard tooling for enterprise platform teams tightening their inner development loop.",
  customers: [], tags: ["dev"],
  link: "https://www.localstack.cloud/", caseStudyLink: null, caseStudyName: null,
});

fs.writeFileSync(path.join(ROOT, "shared/companies.json"), JSON.stringify(library, null, 2));

// copy logos
for (const [src, destName] of logoCopies) {
  fs.copyFileSync(src, path.join(ROOT, "shared/logos", destName));
}

// ---- Dominion parity config ----
const angles = {};
for (const c of dom.companies) angles[c.id] = { pull: c.dePull || "", cases: c.deCases || [] };

const dominionConfig = {
  slug: "dominion-energy",
  clientName: "Dominion Energy",
  role: "",
  accent: "#2F6EB5",
  clientLogo: "Dominion_Energy_logo.svg.webp",
  favicon: "Dominion-Energy.webp",
  emailRecipients: "bzabel@notablecap.com",
  heroSubline: "Fifteen companies from our portfolio, chosen for the teams building Dominion Energy's next era of AI, grid and customer operations, and security.",
  noteP1: "We picked fifteen companies from our portfolio that map to the technology priorities of a modern energy enterprise: frontier AI and the infrastructure to run it, data quality and privacy, cloud and identity security, network and developer infrastructure, and the systems behind customer and field operations.",
  noteP2: "Each card opens to a brief and the angle we think fits Dominion Energy best, and you can filter by category. Our full portfolio of 150+ active companies is linked in the top right. Whenever it's convenient, send back the ones worth a closer look.",
  portfolioIntro: "Every company here works at the infrastructure layer, across AI, data, security, and the operations of a modern utility. Filter by category, then expand any card for the brief and the angle most relevant to your team.",
  verticals: dom.verticals,
  short: { ai: "AI infra", data: "Data", security: "Security", dev: "Dev & network", cx: "Customer & field" },
  roster: domIds,
  angles,
};
fs.mkdirSync(path.join(ROOT, "configs/assets/dominion-energy"), { recursive: true });
fs.copyFileSync(path.join(DOM_DIR, "uploads/Dominion_Energy_logo.svg.webp"), path.join(ROOT, "configs/assets/dominion-energy/Dominion_Energy_logo.svg.webp"));
fs.copyFileSync(path.join(DOM_DIR, "uploads/Dominion-Energy.webp"), path.join(ROOT, "configs/assets/dominion-energy/Dominion-Energy.webp"));
fs.writeFileSync(path.join(ROOT, "configs/dominion-energy.json"), JSON.stringify(dominionConfig, null, 2));

console.log("Library:", library.length, "companies:", library.map((c) => c.id).join(", "));
console.log("Logos copied:", logoCopies.length);
console.log("Dominion parity config written.");
