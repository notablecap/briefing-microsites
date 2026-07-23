// v3: targeted fixes — explicit Commons file candidates per slug, first that resolves wins.
const fs = require("fs");
const { execFileSync } = require("child_process");

const FIXES = {
  "world-bank": ["File:The World Bank logo.svg", "File:World Bank logo.svg"],
  "kohls": ["File:Kohl's logo.svg", "File:Kohls logo.svg"],
  "us-navy": ["File:Emblem of the United States Navy.svg"],
  "docusign": ["File:DocuSign logo.svg", "File:Docusign-logo.svg", "File:DocuSign Logo.png"],
  "sara-lee": ["File:Sara Lee logo.svg", "File:Sara-Lee-Logo.svg", "File:Sara Lee brand logo.png"],
  "portillos": ["File:Portillo's logo.svg", "File:Portillos logo.svg", "File:Portillo's Restaurants logo.png"],
  "urbn": ["File:URBN logo.svg", "File:Urban Outfitters, Inc. logo.svg", "File:URBN (company) logo.svg"],
  "ut-southwestern": ["File:UT Southwestern Medical Center logo.svg", "File:UTSW logo.svg", "File:UT Southwestern logo.png"],
  "humana": ["File:Humana logo.svg", "File:Humana.svg"],
  "tyson": ["File:Tyson Foods corporate logo (2024).svg", "File:Tyson Foods logo.svg"],
  "choice-hotels": ["File:Choice Hotels logo.svg", "File:Choice Hotels International logo.svg"],
};

const UA = "notable-briefing-tool/1.0 (bzabel@notablecap.com)";
function curl(args) { return execFileSync("curl", ["-sL", "--fail", "-A", UA, ...args], { timeout: 30000 }); }
function tryFile(fileTitle, dest) {
  const url = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=imageinfo&iiprop=url&iiurlwidth=600&titles=" + encodeURIComponent(fileTitle);
  const res = JSON.parse(curl([url]).toString());
  const page = Object.values(res.query.pages)[0];
  if (!page.imageinfo) return false;
  const ii = page.imageinfo[0];
  curl(["-o", dest, ii.thumburl || ii.url]);
  return fs.statSync(dest).size > 800;
}

for (const [slug, candidates] of Object.entries(FIXES)) {
  const dest = "configs/assets/" + slug + "/logo.png";
  let done = "STILL MISSING";
  for (const f of candidates) {
    try { if (tryFile(f, dest)) { done = f; break; } } catch (e) {}
  }
  console.log(slug.padEnd(18), done);
}
