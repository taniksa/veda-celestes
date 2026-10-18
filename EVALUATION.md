# Local POC evaluation — 18 October 2026

## Verified

- Migrated the native path to `pysweph==2.10.3.6`. Normalised its three-field calculation results and 13-entry house tuple. Preserved the former wrapper only in an ignored comparison environment.
- Compared full chart outputs under legacy and maintained wrappers at 24 date/location combinations from 1800 through 2399. Normalised astronomical/tradition outputs were identical. This is compatibility evidence, not independent precision validation.
- Nine Python tests passed: invalid inputs, timezone gaps/overlaps, deterministic calculations and broad J2000 Sun sanity, panchanga/Lot identities, calculations with socket connections forbidden, feed retention after failed replacement, HTTP page/feed/chart routes, request rejection, and stale/missing health behavior.
- Browser inspection confirmed Vedic/Western/Arabic tab changes and invalid timezone display/recovery.
- Dependencies and timezone records run locally. No external resources are referenced by the exhibition page.
- Local chart requests are handled in memory. No personal inputs are persisted by the service. Local-only calculation endpoint is disabled when the service is configured for an internet bind address.

## Local exhibition

Start `start-local.ps1` from PowerShell. Open http://127.0.0.1:8088/ . Read `/health` for readiness and `/feed.json` for all three public editions. The page includes a chart wheel, calculated position table, tradition metrics and JSON export/inspection.

## Unfinished / limitations

- Independent ephemeris accuracy comparison against an authoritative reference is pending. Only a broad Sun sanity check and wrapper parity have passed.
- Current calculations use Moshier and approximate UT by UTC; precision UT1 handling is pending.
- Arabic support currently exposes selected Fortune/Spirit formulas and equal tropical mansions. Vedic support currently exposes selected sidereal/panchanga primitives. Neither represents complete traditional coverage.
- Daily text is basic calculation commentary. Full interpretive systems, sunrise panchanga, dashas and divisional charts are unfinished.
- Docker CLI was unavailable in the local command environment. Docker build/run has not been tested.
- The local HTTP server is an exhibition server, not a production internet deployment. Deployment hardening, rate limits, TLS and a production server remain necessary.
- The pinned timezone database is 2025.2; historical rule corrections after that version are not included. Calculations explicitly use that bundled database.
- Wheel label positions can overlap for tightly clustered bodies; numeric tables retain every value.
- Public source publication and final license/source notices remain pending.
