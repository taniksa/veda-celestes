# Věda Célestes

**Věda Célestes** is a privacy-first, open-source calculation prototype for Vedic, Western and selected Arabic astrology methods.

Public static exhibition: https://veda-celestes.pages.dev/

License: AGPL-3.0. See LICENSE and THIRD_PARTY.md. Main-site integration is documented in COMPOSITE.md and is not yet activated.

## Design principles

- **Clean-room implementation** — no installer binary, extracted application files, or decompiled source is included.
- **Privacy by default** — requests are evaluated in memory and never persisted by the core engine.
- **Deterministic calculations** — a request specifies its calculation context and the response records its engine/provider version.
- **Strict contracts** — invalid dates, times, coordinates, timezones and provider responses fail with explicit machine-readable errors.
- **Provider isolation** — astronomy/ephemeris data is injected behind an adapter so it can be audited, replaced and tested independently.
- **No silent fallbacks** — calculations never invent ephemeris values when a provider is unavailable.

## Working local proof of concept

The native Python path uses the maintained `pysweph` wrapper over Swiss Ephemeris C. It generates local planetary positions, selected Vedic/Western/Arabic calculations, daily feeds and a browser exhibition. Run `start-local.ps1` and open http://127.0.0.1:8088/ . See [EVALUATION.md](EVALUATION.md) for verified results and remaining limitations, and [RUNNING.md](RUNNING.md) for packaging notes.

## Earlier JavaScript foundation

The initial code supplies validation, a structured error model, a safe computation boundary and an ephemeris-provider contract. Accurate chart, panchanga, transit and dasha modules will be added only once their astronomical algorithms and data provenance are verified.

## Security boundary

Do not commit secrets, site configuration, personal birth data, consultation records, installer binaries or extracted files. The repository's `.gitignore` blocks common forms of those materials, but review every commit before publishing.

## Website integration

The TanishaKsamudr site will consume published calculation results through a dedicated adapter. It will not embed engine credentials or retain personal chart inputs in client storage.
