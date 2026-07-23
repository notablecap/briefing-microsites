// Update pass: real Orca/LocalStack entries from Cisco, add kong+torq to library,
// new canonical roster in _template, Dominion roster swap + angles for drata/echo/orca.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const CISCO_DIR = "/Users/bzabel/Desktop/Microsites/# Cisco Microsite Portfolio__Before I build this, I need clarification on several points___## Critical Questions___1. __Pan";

const cisco = require("./cisco.raw.json");
const cById = Object.fromEntries(cisco.companies.map((c) => [c.id, c]));
const library = JSON.parse(fs.readFileSync(path.join(ROOT, "shared/companies.json"), "utf8"));

function fromCisco(id, destName) {
  const { dePull, deCases, ...shared } = cById[id];
  fs.copyFileSync(path.join(CISCO_DIR, shared.logo), path.join(ROOT, "shared/logos", destName));
  shared.logo = "logos/" + destName;
  return shared;
}

// replace DRAFT orca + localstack with Cisco's real entries
const replace = { orca: fromCisco("orca", "orca.png"), localstack: fromCisco("localstack", "localstack.svg") };
for (let i = 0; i < library.length; i++) if (replace[library[i].id]) library[i] = replace[library[i].id];
// add kong + torq (free additions for future rosters)
for (const id of ["kong", "torq"]) if (!library.some((c) => c.id === id)) {
  library.push(fromCisco(id, id + path.extname(cById[id].logo)));
}
fs.writeFileSync(path.join(ROOT, "shared/companies.json"), JSON.stringify(library, null, 2));

// ---- canonical roster in _template.json (Tonic in, LocalStack out) ----
const CANON = ["anthropic","browserbase","clover","token","coder","montecarlo","wispr","act","fal","netbox","valar","tonic","drata","echo","orca"];
const tpl = JSON.parse(fs.readFileSync(path.join(ROOT, "configs/_template.json"), "utf8"));
tpl.roster = CANON;
tpl.angles = Object.fromEntries(CANON.map((id) => [id, { pull: "", cases: ["", "", ""] }]));
fs.writeFileSync(path.join(ROOT, "configs/_template.json"), JSON.stringify(tpl, null, 2));

// ---- Dominion config: remove gladly/patronus/generalist, add drata/echo/orca ----
const dom = JSON.parse(fs.readFileSync(path.join(ROOT, "configs/dominion-energy.json"), "utf8"));
dom.roster = ["anthropic","montecarlo","tonic","netbox","token","valar","browserbase","coder","echo","fal","act","clover","drata","orca","wispr"];
for (const id of ["gladly", "patronus", "generalist"]) delete dom.angles[id];

dom.angles.drata = {
  pull: "A utility answers to more frameworks than almost any business: SOX, NERC obligations, state commissions, and the security questionnaires flowing both directions with hundreds of vendors. Drata turns that from a quarterly evidence fire drill into an always-on system: controls monitored continuously, evidence collected automatically, and internal and third-party risk visible in one place.",
  cases: [
    "Continuous control monitoring and automated evidence collection across corporate IT and cloud.",
    "Map one set of controls to many frameworks, including custom frameworks for regulatory obligations.",
    "Standing visibility into vendor and third-party risk instead of annual questionnaire cycles.",
  ],
};
dom.angles.echo = {
  pull: "Every application Dominion builds sits on open-source components someone has to keep patched, and in critical infrastructure the vulnerability backlog is a regulatory issue, not just an engineering one. Echo removes the burden at the source: hardened, CVE-free, FIPS-validated base images and dependencies, so teams ship on clean foundations instead of chasing scanner findings.",
  cases: [
    "CVE-free container base images and dependencies for the software behind grid, billing, and customer systems.",
    "FIPS-validated, hardened components that meet the bar of a regulated operator.",
    "Cut the patching and end-of-life support burden that consumes security and platform engineering time.",
  ],
};
dom.angles.orca = {
  pull: "Dominion's cloud estate spans the corporate side of a critical-infrastructure operator: data platforms, customer systems, and a growing AI footprint. Orca covers all of it agentlessly, with nothing to deploy and no coverage gaps, and prioritizes the handful of attack paths that actually reach sensitive data or critical systems instead of burying the team in alerts.",
  cases: [
    "Agentless, full-estate cloud visibility within hours, with nothing to install or maintain.",
    "Attack-path prioritization that surfaces what actually threatens customer data and critical systems.",
    "One CNAPP for posture, vulnerabilities, workload and data protection, and cloud compliance evidence.",
  ],
};
fs.writeFileSync(path.join(ROOT, "configs/dominion-energy.json"), JSON.stringify(dom, null, 2));
console.log("Library now:", library.map((c) => c.id).join(", "));
console.log("Dominion roster:", dom.roster.join(", "));
