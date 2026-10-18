# Third-party components

The original project code is distributed under AGPL-3.0; see LICENSE.

- `pysweph` 2.10.3.6: maintained Python binding to Swiss Ephemeris. Source, notices and upstream licensing: https://github.com/sailorfe/pysweph and https://pypi.org/project/pysweph/2.10.3.6/ .
- Swiss Ephemeris: astronomical C implementation used through that binding. Official source and license: https://github.com/aloistr/swisseph . Calculations in this release explicitly select its built-in Moshier model.
- `tzdata` 2025.2: bundled IANA timezone data. Source and notices: https://github.com/python/tzdata and https://pypi.org/project/tzdata/2025.2/ .
- `@swisseph/browser` 1.3.1: unmodified browser JS and WebAssembly distribution bundled in `browser/lib/`, including its AGPL-3.0 license. Source and build instructions: https://github.com/swisseph-js/swisseph/tree/main/packages/browser . The bundle includes `@swisseph/core` 1.3.1. See browser/README.md for the pinned archive and runtime conventions.

Python dependencies are fetched through the pinned requirements file, not copied into Git. The browser component is self-hosted to avoid runtime CDN dependencies. Retain complete upstream notices in binary distributions. Public application source is in this repository; third-party source distributions are linked above.

JHora installer material is not incorporated. PyJHora, Astronomy Engine and astronomia were research references and are not bundled runtime dependencies.
