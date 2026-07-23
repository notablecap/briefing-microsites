#!/usr/bin/env bash
# Deploy generated microsites to Vercel.
#   ./deploy.sh                  -> deploy every folder in dist/
#   ./deploy.sh dominion-energy  -> deploy one slug
# Each site becomes its own Vercel project named "<slug>-notable"
# (URL: https://<slug>-notable.vercel.app). Requires: `vercel login` once.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 1
fi

node generate.js "${1:-}" || { echo "generation reported warnings — review above before deploying"; read -r -p "Deploy anyway? [y/N] " a; [[ "$a" == "y" ]] || exit 1; }

targets=(dist/*/)
if [[ -n "${1:-}" ]]; then targets=("dist/$1/"); fi

for d in "${targets[@]}"; do
  slug="$(basename "$d")"
  project="${slug}-notable"
  echo "── deploying $slug -> https://${project}.vercel.app"
  (cd "$d" && vercel deploy --prod --yes --name "$project")
done
echo "Done. Reminder: for each NEW project, enable Deployment Protection on preview URLs in the Vercel dashboard (Settings → Deployment Protection)."
