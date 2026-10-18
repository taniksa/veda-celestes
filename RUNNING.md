# Run the native prototype

The working calculation path is Python calling the compiled Swiss Ephemeris C extension. The earlier JavaScript prototype remains a separate contract experiment. No website deployment has been changed.

Install once with Python 3.12 (building the extension may require a C compiler):

```sh
python -m pip install -r requirements.txt
python -m unittest test_native -v
python -m veda feed --date 2026-10-18 --output feeds
python -m veda serve --output feeds --timezone Asia/Kolkata
```

On this development machine the maintained dependencies are isolated in `.runtime-next`; `start-local.ps1` sets the path and serves on loopback port 8088. The former `.runtime` directory is retained only for wrapper comparison. Both dependency versions are pinned in requirements.txt. The timezone package version is 2025.2 and its bundled records are selected explicitly; reviewing later timezone updates remains pending.

Read-only service endpoints: `/feed.json` and `/health` on port 8080. Generation uses noon in the configured timezone and Bengaluru reference coordinates. The scheduler checks every minute and generates when the local date changes. Failed generation retains the previous complete feed. Stale feeds expose `stale: true`; stale health returns 503.

```sh
docker build -t veda-celestes .
docker run --rm -p 127.0.0.1:8080:8080 -v veda-feed:/data veda-celestes
```

Docker configuration is provided but has not been verified on a Docker daemon. Deploy behind a production reverse proxy with request/time limits and TLS before internet exposure. The service exposes only precomputed public data; no birth-chart submission endpoint exists.

## Implemented calculation scope

Explicit built-in Moshier ephemeris, 1800–2399 input range; tropical positions and speeds, Lahiri sidereal positions, mean node/Ketu, whole-sign houses, major aspects with a fixed six-degree orb, numbered panchanga components, and Fortune/Spirit reversed by day/night sect. Arabic lunar mansions use an explicitly equal tropical 28-part division; this is one selected convention, not a complete Arabic tradition implementation.

UTC is currently treated as an approximation to UT for calculation. High-precision UT1 handling, reference benchmarking, named karanas, sunrise/day panchanga, dashas, divisional charts, expanded traditional methods, polished interpretations, GUI and website adapter remain unfinished. Public interpretation text is calculation commentary. Do not represent it as complete personalised forecasting.

## Upstream notices

Swiss Ephemeris: https://github.com/aloistr/swisseph

Maintained Python binding: https://github.com/sailorfe/pysweph

Timezone data: https://www.iana.org/time-zones

Retain upstream source/license notices when packaging the distribution. Final project licensing and a complete source-distribution manifest must be completed before public release.
