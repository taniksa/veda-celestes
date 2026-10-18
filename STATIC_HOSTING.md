# Static publication

Build the public-only artifact using the pinned native engine:

```powershell
$env:PYTHONPATH = Join-Path $PWD '.runtime-next'
python build_static.py --start 2026-10-18 --days 366
```

Only `dist/` is uploaded. It contains HTML, response-header rules, a date manifest and public reference JSON. It contains no Python packages, site source, credentials or personal charts.

Coverage: 2026-10-18 through 2027-10-18 inclusive. The browser picks today's date in Asia/Kolkata and fetches `/feeds/YYYY-MM-DD.json`. Future calculated positions can be computed in advance, so runtime scheduling is unnecessary within this release's coverage. After expiry the page explicitly shows a dated snapshot and requests a new bundle. Publishing another bundle is required before coverage expires.

Cloudflare Pages direct upload project name: `veda-celestes`. No Functions or `_worker.js` is shipped. Deploy `dist/` through Wrangler Pages after authenticating with `pages:write` and setting the intended account ID if account listing is unavailable.

The main Tanisha site is not modified by this publication. Its future adapter can read `manifest.json` and select a dated feed in the declared timezone. Interpretations remain initial calculation commentary as documented in EVALUATION.md.
