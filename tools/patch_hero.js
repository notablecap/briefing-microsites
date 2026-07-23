// Patch pass: hero role badge replaces the sentence subline; roster reorder; config cleanup.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

// 1) template: swap the hero subline <p> for a %%ROLE_BLOCK%% token
const tplPath = path.join(ROOT, "template/index.template.html");
let tpl = fs.readFileSync(tplPath, "utf8");
const before = tpl;
tpl = tpl.replace(/<p[^>]*>\s*%%HERO_SUBLINE%%\s*<\/p>/, "%%ROLE_BLOCK%%");
if (tpl === before) throw new Error("hero subline <p> not found in template");
fs.writeFileSync(tplPath, tpl);

// 2) generate.js: build role block, drop heroSubline substitution
const genPath = path.join(ROOT, "generate.js");
let gen = fs.readFileSync(genPath, "utf8");
if (!gen.includes('sub("%%HERO_SUBLINE%%"')) throw new Error("heroSubline sub not found in generate.js");
gen = gen.replace(
  '  sub("%%HERO_SUBLINE%%", esc(config.heroSubline));\n',
  `  const roleLabel = config.roleLabel || (config.role ? "Office of the " + config.role : "");
  const roleBlock = roleLabel
    ? '<div style="margin-top:22px;"><span style="font-family:\\'Alverata\\',serif;font-weight:300;font-size:clamp(20px,2.6vw,29px);line-height:1.25;letter-spacing:-0.01em;color:#063F32;background:linear-gradient(180deg,transparent 62%,' + config.accent + '40 62%);padding:0 .14em;display:inline-block;">' + roleLabel + "</span></div>"
    : "";
  sub("%%ROLE_BLOCK%%", roleBlock);\n`
);
fs.writeFileSync(genPath, gen);

// 3) configs: drop heroSubline, set Dominion role + new roster order
const domPath = path.join(ROOT, "configs/dominion-energy.json");
const dom = JSON.parse(fs.readFileSync(domPath, "utf8"));
delete dom.heroSubline;
dom.role = "CTO";
dom.roster = ["anthropic","wispr","browserbase","coder","token","fal","montecarlo","tonic","netbox","valar","echo","act","clover","drata","orca"];
fs.writeFileSync(domPath, JSON.stringify(dom, null, 2));

const tPath = path.join(ROOT, "configs/_template.json");
const t = JSON.parse(fs.readFileSync(tPath, "utf8"));
delete t.heroSubline;
t.roster = ["anthropic","wispr","browserbase","coder","token","fal","montecarlo","tonic","netbox","valar","echo","act","clover","drata","orca"];
t.angles = Object.fromEntries(t.roster.map((id) => [id, t.angles[id] || { pull: "", cases: ["", "", ""] }]));
fs.writeFileSync(tPath, JSON.stringify(t, null, 2));

console.log("Patched template, generator, and both configs.");
