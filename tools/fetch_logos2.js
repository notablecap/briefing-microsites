// v2: pull the actual logo file from each Wikipedia article's image list (infobox logo),
// no-shell curl so apostrophes in titles are safe. Overwrites photo/lead-image mistakes.
const fs = require("fs");
const { execFileSync } = require("child_process");
const clients = require("./clients.json");

const TITLES = {
  "aig": "American International Group", "deckers": "Deckers Brands",
  "gallagher": "Arthur J. Gallagher & Co.", "world-bank": "World Bank",
  "gap": "Gap Inc.", "john-deere": "John Deere", "davids-bridal": "David's Bridal",
  "live-nation": "Live Nation Entertainment", "white-house": "White House",
  "usps": "United States Postal Service", "intuit": "Intuit", "ford": "Ford Motor Company",
  "fanatics": "Fanatics, Inc.", "boeing": "Boeing", "mls": "Major League Soccer",
  "ihg": "IHG Hotels & Resorts", "aritzia": "Aritzia", "kohls": "Kohl's",
  "docusign": "DocuSign", "chiquita": "Chiquita Brands International",
  "sara-lee": "Sara Lee Frozen Bakery", "loreal": "L'Oréal",
  "builders-firstsource": "Builders FirstSource", "united-airlines": "United Airlines",
  "portillos": "Portillo's", "butterball": "Butterball",
  "ut-southwestern": "University of Texas Southwestern Medical Center",
  "us-navy": "United States Navy", "cedars-sinai": "Cedars-Sinai Medical Center",
  "humana": "Humana", "northwestern-medicine": "Northwestern Medicine",
  "tyson": "Tyson Foods", "urbn": "Urban Outfitters, Inc.", "choice-hotels": "Choice Hotels",
};

const UA = "notable-briefing-tool/1.0 (bzabel@notablecap.com)";
function api(params) {
  const url = "https://en.wikipedia.org/w/api.php?format=json&" + new URLSearchParams(params).toString();
  return JSON.parse(execFileSync("curl", ["-sL", "--fail", "-A", UA, url], { timeout: 20000 }).toString());
}
function download(url, dest) {
  execFileSync("curl", ["-sL", "--fail", "-A", UA, "-o", dest, url], { timeout: 30000 });
  return fs.statSync(dest).size > 800;
}

const BAD = /commons|wikipedia|wiki letter|padlock|question|edit|increase|decrease|symbol|ambox|stub|flag of|map|seal of (?!the united states navy)/i;

const results = [];
for (const c of clients) {
  const dir = "configs/assets/" + c.slug;
  fs.mkdirSync(dir, { recursive: true });
  let status = "no-logo";
  try {
    const res = api({ action: "query", redirects: 1, prop: "images", imlimit: 100, titles: TITLES[c.slug] });
    const page = Object.values(res.query.pages)[0];
    const imgs = (page.images || []).map((i) => i.title).filter((t) => !BAD.test(t));
    let cand = imgs.filter((t) => /logo|wordmark|emblem/i.test(t));
    // prefer svg, then png
    cand.sort((a, b) => (/\.svg$/i.test(b) ? 1 : 0) - (/\.svg$/i.test(a) ? 1 : 0));
    if (cand.length) {
      const info = api({ action: "query", prop: "imageinfo", iiprop: "url", iiurlwidth: 600, titles: cand[0] });
      const ii = Object.values(info.query.pages)[0].imageinfo[0];
      const url = ii.thumburl || ii.url;
      if (download(url, dir + "/logo.png")) status = "logo: " + cand[0].replace("File:", "");
    }
  } catch (e) { status = "error: " + String(e.message).slice(0, 60); }
  results.push([c.slug, status]);
}
for (const [s, st] of results) console.log(s.padEnd(24), st);
