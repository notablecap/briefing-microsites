#!/usr/bin/env bash
# Deploy generated microsites to Vercel.
#   ./deploy.sh                  -> deploy every folder in dist/
#   ./deploy.sh dominion-energy  -> deploy one slug
# Each site becomes its own Vercel project named "<slug>-notable"
# (URL: https://<slug>-notable.vercel.app). Requires: `./node_modules/.bin/vercel login` once.
set -euo pipefail
cd "$(dirname "$0")"
VERCEL="./node_modules/.bin/vercel"

if [[ ! -x "$VERCEL" ]]; then
  echo "vercel CLI not found. Run: npm install" >&2
  exit 1
fi

node generate.js "${1:-}" || { echo "generation reported warnings — review above before deploying"; read -r -p "Deploy anyway? [y/N] " a; [[ "$a" == "y" ]] || exit 1; }

targets=(dist/*/)
if [[ -n "${1:-}" ]]; then targets=("dist/$1/"); fi

ROOT="$(pwd)"
SCOPE="notablecap"
for d in "${targets[@]}"; do
  slug="$(basename "$d")"
  if [[ -z "${1:-}" && "$slug" == "dominion-energy" ]]; then echo "── skipping dominion-energy (already live as dominion-energy-notable-capital)"; continue; fi
  project="${slug}-notable"
  echo "── deploying $slug -> https://${project}.vercel.app"
  (cd "$d" && "$ROOT/$VERCEL" link --yes --scope "$SCOPE" --project "$project" >/dev/null && "$ROOT/$VERCEL" deploy --prod --yes --scope "$SCOPE")
done
echo "Done. Reminder: for each NEW project, enable Deployment Protection on preview URLs in the Vercel dashboard (Settings → Deployment Protection)."
