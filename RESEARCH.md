# Library selection — 18 October 2026

Status: documentation review completed; libraries have not been integrated or benchmarked locally. Upstream accuracy claims remain claims until reproduced in our acceptance tests.

## Selected direction

Use Swiss Ephemeris C as the leading candidate for the precision calculation core, packaged locally with explicit model and data selection. Build our own documented Vedic layer and stable public interface around it. Evaluate a WebAssembly build for browser execution. Pin a reviewed source revision and record checksums before integration.

Swiss Ephemeris supports local Swiss/JPL files and a built-in Moshier model. Its automatic model fallback must be surfaced in our results or rejected when a request requires a particular precision/model. Missing data must never silently change calculation semantics.

This selection uses the upstream open-source distribution; retain its license and attribution. Confirm the exact redistribution terms of every selected code/data component before publishing the combined package. No paid service is required for runtime calculation.

Primary sources:
- https://github.com/aloistr/swisseph
- https://www.astro.com/swisseph/swephinfo_e.htm
- https://www.astro.com/swisseph/swephprg.htm

## Candidates and roles

| Project | Evidence from upstream | Proposed role |
| --- | --- | --- |
| Swiss Ephemeris | Native C; sidereal/astrology interface; local ephemerides and built-in analytical model | Leading precision core; verify model flags and data coverage |
| Astronomy Engine | MIT; C and JavaScript among supported languages; no external dependencies; stated angular accuracy within one arcminute | Compact optional preview engine and independent comparison; evaluate boundary sensitivity before use in fine divisions |
| PyJHora | AGPL-3.0; Vedic features; upstream describes about 6,800 tests assuming Lahiri; Python/Swiss Ephemeris/Qt requirements | Feature/convention and test reference; inspect individual modules before any reuse |
| astronomia | MIT; modular JavaScript implementation of Meeus algorithms and VSOP87 data | Independent numerical checks and selected utilities; no second large runtime dependency by default |
| IANA tz | Timezone database and code | Versioned local historical timezone source; define ambiguous/nonexistent local-time handling |

Sources:
- https://github.com/cosinekitty/astronomy
- https://github.com/naturalstupid/PyJHora
- https://github.com/commenthol/astronomia
- https://github.com/eggert/tz

## Next implementation gate

1. Inspect and pin upstream C source, model conventions and notices.
2. Build a local command-line calculation spike with no network calls.
3. Compare Sun/Moon/planet positions, Lahiri sidereal output and nodes across known epochs, including sign and nakshatra boundaries.
4. Explicitly distinguish UTC, UT1 and TT; record the selected delta-T model and supported date interval.
5. Verify packaging with network disabled and missing/corrupt local data cases.
6. Add Vedic modules incrementally using reference fixtures and declared tolerances.

Compiled core and browser packaging remain engineering work, not completed capabilities. A local library dependency is compatible with service independence: source and required data ship with the application and no hosted provider is contacted.
