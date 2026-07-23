# Notable Briefing Microsites

One template, N client sites. Each client microsite ("Curated for X") is generated
from `template/index.template.html` + `shared/companies.json` + one config in `configs/`.

## Layout
- `template/` — the site shell (tokenized Dominion Energy design, July 2026) + fonts, support.js, Notable wordmark
- `shared/companies.json` — the company library: shared blurbs, one-liners, customers, logos, links. Edit here once, every site picks it up on next generate.
- `shared/logos/` — canonical logo files
- `configs/<slug>.json` — everything client-specific: name, accent color, logo/favicon, intro copy, roster (which 15 companies), and `angles` (the per-company "why this matters for X" pull + 3 use-case bullets)
- `configs/assets/<slug>/` — that client's logo + favicon files
- `configs/_template.json` — copy this to start a new client
- `dist/` — generated output (gitignored)
- `tools/` — one-time extraction/assembly scripts used to bootstrap from the old per-client folders

## Workflow
1. New client: `cp configs/_template.json configs/acme-cio.json`, drop logo + favicon in `configs/assets/acme-cio/`, fill in copy + angles.
2. `node generate.js acme-cio` (or no arg for all sites). Warnings list missing angles/logos/draft blurbs.
3. `./deploy.sh acme-cio` (or no arg for all). Each slug becomes Vercel project `<slug>-notable`.

Template change (fix a typo, restyle a card): edit `template/index.template.html`, then `node generate.js && ./deploy.sh` — all sites update.

Shared content change (company blurb, logo, link): edit `shared/companies.json`, regenerate, redeploy.

## Notes
- `password` in a config adds a client-side gate. It is visible in page source — a courtesy speed bump, not access control. Don't reuse anything sensitive.
- Known gaps at bootstrap: Orca logo missing (`shared/logos/orca.png`); Orca + LocalStack blurbs are marked DRAFT in `shared/companies.json` and need review.
- Generated `dist/` output is reproducible; never hand-edit files in `dist/`.
