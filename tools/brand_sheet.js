// Generate brand-review.html: all 34 nameplates as they'll render, for one-pass approval.
const fs = require("fs");
const path = require("path");
const clients = require("./clients.json");

const card = (c) => `
<div style="background:#fff;border:1px solid #E7E7E7;border-radius:14px;padding:26px 28px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
    <div style="font-family:'Georgia',serif;font-size:34px;line-height:1.02;color:#232323;">
      <span style="font-style:italic;color:${c.accent};">Curated</span><br>
      for <span style="background:linear-gradient(180deg,transparent 60%,${c.accent}40 60%);padding:0 .06em;">${c.clientName}</span>
    </div>
    <span style="font-size:11px;font-weight:700;color:#fff;background:${c.accent};border-radius:6px;padding:4px 8px;white-space:nowrap;">${c.role}</span>
  </div>
  <div style="font-family:'Georgia',serif;font-size:15px;color:#232323;margin-top:10px;">Office of the ${c.role}</div>
  <div style="display:flex;align-items:center;gap:14px;margin-top:18px;padding:12px 14px;background:#F5F3F2;border:1px solid #E7E7E7;border-radius:10px;">
    <img src="configs/assets/${c.slug}/logo.png" style="height:34px;max-width:170px;object-fit:contain;" onerror="this.replaceWith('MISSING LOGO')">
    <div style="font-size:12px;color:#5C5C5C;">nav logo @ light background</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;margin-top:14px;font-size:12.5px;color:#5C5C5C;">
    <span style="width:14px;height:14px;border-radius:4px;background:${c.accent};display:inline-block;border:1px solid #ddd;"></span>
    <code>${c.accent}</code>
    <span>·</span><code>${c.slug}-notable.vercel.app</code>
  </div>
</div>`;

const section = (role) => `
<h2 style="font-family:Georgia,serif;font-weight:400;margin:44px 0 6px;">${role} (${clients.filter((c) => c.role === role).length})</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;">
${clients.filter((c) => c.role === role).map(card).join("\n")}
</div>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Brand review — 34 briefing sites</title></head>
<body style="background:#F5F3F2;color:#232323;font-family:system-ui,sans-serif;margin:0;padding:36px;">
<h1 style="font-family:Georgia,serif;font-weight:400;margin:0;">Brand review — 34 briefing microsites</h1>
<p style="color:#5C5C5C;max-width:720px;">Each card shows the hero nameplate as it will render (accent italic + highlight band), the role line, the sourced logo on the site's light background, the accent hex, and the deploy URL. Reply with corrections by slug: wrong color, wrong logo, wrong display name.</p>
${section("CDO")}${section("CTO")}${section("CIO")}
</body></html>`;
fs.writeFileSync(path.join(__dirname, "..", "brand-review.html"), html);
console.log("brand-review.html written:", clients.length, "clients");
