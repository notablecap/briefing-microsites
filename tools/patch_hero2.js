// Patch pass 2: CFA-style hero (big tight type, highlight band on the client name,
// accent italic "Curated"); retag wispr -> ai; Dominion drops the cx vertical (uses 4-vertical default).
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

// 1) template h1 rework
const tplPath = path.join(ROOT, "template/index.template.html");
let tpl = fs.readFileSync(tplPath, "utf8");
const h1Re = /<h1 style="font-family:'Alverata',serif;[^"]*">\s*<span style="font-style:italic;">Curated<\/span> for<div><span style="color:%%ACCENT%%;">%%CLIENT_NAME%%<\/span><\/div><\/h1>/;
if (!h1Re.test(tpl)) throw new Error("hero h1 not matched");
tpl = tpl.replace(h1Re,
  `<h1 style="font-family:'Alverata',serif;font-weight:400;font-size:clamp(46px,7.2vw,104px);line-height:0.98;letter-spacing:-0.02em;color:#232323;margin:22px 0 0;max-width:16ch;">
      <span style="font-style:italic;font-weight:400;color:%%ACCENT%%;">Curated</span><br>for <span style="background:linear-gradient(180deg,transparent 60%,%%ACCENT%%40 60%);padding:0 .06em;-webkit-box-decoration-break:clone;box-decoration-break:clone;">%%CLIENT_NAME%%</span></h1>`);
fs.writeFileSync(tplPath, tpl);

// 2) role badge: near-black ink + same 60% band, to match the h1 treatment
const genPath = path.join(ROOT, "generate.js");
let gen = fs.readFileSync(genPath, "utf8");
gen = gen.replace("color:#063F32;background:linear-gradient(180deg,transparent 62%,", "color:#232323;background:linear-gradient(180deg,transparent 60%,");
gen = gen.replace("' + config.accent + '40 62%)", "' + config.accent + '40 60%)");
if (gen.includes("62%")) throw new Error("badge patch incomplete");
fs.writeFileSync(genPath, gen);

// 3) wispr -> ai in the shared library
const libPath = path.join(ROOT, "shared/companies.json");
const lib = JSON.parse(fs.readFileSync(libPath, "utf8"));
const w = lib.find((c) => c.id === "wispr");
w.tags = ["ai"];
fs.writeFileSync(libPath, JSON.stringify(lib, null, 2));

// 4) Dominion: drop custom verticals/short -> inherits the 4-vertical default
const domPath = path.join(ROOT, "configs/dominion-energy.json");
const dom = JSON.parse(fs.readFileSync(domPath, "utf8"));
delete dom.verticals;
delete dom.short;
fs.writeFileSync(domPath, JSON.stringify(dom, null, 2));

console.log("Patched: hero h1, role badge, wispr tag, Dominion verticals.");
