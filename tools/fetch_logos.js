// Fetch client logos from Wikipedia page images (usually the company logo, 600px thumb).
// Keeps the Google-favicon fallback already on disk when Wikipedia has nothing usable.
const fs = require("fs");
const { execSync } = require("child_process");
const clients = require("./clients.json");

const TITLES = {
  "aig": "American International Group",
  "deckers": "Deckers Brands",
  "gallagher": "Arthur J. Gallagher & Co.",
  "world-bank": "World Bank",
  "gap": "Gap Inc.",
  "john-deere": "John Deere",
  "davids-bridal": "David's Bridal",
  "live-nation": "Live Nation Entertainment",
  "white-house": "White House",
  "usps": "United States Postal Service",
  "intuit": "Intuit",
  "ford": "Ford Motor Company",
  "fanatics": "Fanatics, Inc.",
  "boeing": "Boeing",
  "mls": "Major League Soccer",
  "ihg": "IHG Hotels & Resorts",
  "aritzia": "Aritzia",
  "kohls": "Kohl's",
  "docusign": "DocuSign",
  "chiquita": "Chiquita Brands International",
  "sara-lee": "Sara Lee Frozen Bakery",
  "loreal": "L'Oréal",
  "builders-firstsource": "Builders FirstSource",
  "united-airlines": "United Airlines",
  "portillos": "Portillo's",
  "butterball": "Butterball",
  "ut-southwestern": "University of Texas Southwestern Medical Center",
  "us-navy": "United States Navy",
  "cedars-sinai": "Cedars-Sinai Medical Center",
  "humana": "Humana",
  "northwestern-medicine": "Northwestern Medicine",
  "tyson": "Tyson Foods",
  "urbn": "Urban Outfitters, Inc.",
  "choice-hotels": "Choice Hotels",
};

const got = [], kept = [], none = [];
for (const c of clients) {
  const title = TITLES[c.slug];
  const dir = "configs/assets/" + c.slug;
  fs.mkdirSync(dir, { recursive: true });
  try {
    const api = "https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=pageimages&format=json&pithumbsize=600&titles=" + encodeURIComponent(title);
    const res = JSON.parse(execSync(`curl -sL --fail -A 'notable-briefing-tool/1.0 (bzabel@notablecap.com)' '${api}'`, { timeout: 20000 }).toString());
    const pages = res.query.pages;
    const page = pages[Object.keys(pages)[0]];
    const src = page && page.thumbnail && page.thumbnail.source;
    if (!src) throw new Error("no pageimage");
    const ext = src.match(/\.(png|jpg|jpeg|svg)/i) ? "" : "";
    execSync(`curl -sL --fail -A 'notable-briefing-tool/1.0 (bzabel@notablecap.com)' -o '${dir}/logo.png' '${src}'`, { timeout: 30000 });
    if (fs.statSync(dir + "/logo.png").size < 800) throw new Error("tiny");
    got.push(c.slug + " <- " + decodeURIComponent(src.split("/").pop()));
  } catch (e) {
    if (fs.existsSync(dir + "/logo.png")) kept.push(c.slug);
    else none.push(c.slug);
  }
}
console.log("WIKIPEDIA (" + got.length + "):"); got.forEach((g) => console.log("  " + g));
console.log("FAVICON FALLBACK (" + kept.length + "): " + kept.join(", "));
console.log("NO LOGO (" + none.length + "): " + (none.join(", ") || "none"));
