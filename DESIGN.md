# Věda Célestes: implementation plan

## Evidence and current status

The supplied executable was identified as a native Windows installer. Its calculation payload has not been extracted or decompiled. No astronomical algorithms have been recovered or verified. Existing code is an initial JavaScript contract and validation prototype, not a completed native calculation engine.

## Product boundary

Implement original algorithms from documented astronomical methods. Use existing software only as a feature and observable-output reference. Record sources, conventions, numerical tolerances and data provenance for each module. Distinguish astronomical calculations from interpretive astrology rules.

## Offline architecture

The calculation core must run locally without HTTP, account credentials, telemetry or online activation. A provider means a local module or local data reader; it does not imply a hosted API. Version and bundle the ephemeris, timezone and time-scale data needed for reproducible results. Explicitly bound supported dates and accuracy.

Keep the core independent of UI, filesystem persistence and website deployment. Offer a local CLI first, then a browser-compatible interface. Evaluate a compiled core with a WebAssembly target after validating the numerical prototype and available build tools.

## Delivery sequence

1. Harden input contracts and document time/calendar conventions.
2. Implement UTC/TT handling and Julian-date conversion with published reference vectors; resolve timezone ambiguity explicitly.
3. Implement a local ephemeris and report its measured accuracy and supported date interval.
4. Derive sidereal longitudes, rasi, nakshatra, pada, tithi, yoga and karana with boundary tests.
5. Add location-dependent sunrise, ascendant and houses; handle polar and missing-event cases explicitly.
6. Add divisional charts, dashas and transits with documented school/convention choices.
7. Add CLI and browser packaging; verify operation with networking disabled.
8. Audit public files, select the project license and publish the independent repository; integrate the website through a versioned adapter after numerical acceptance.

## Acceptance requirements

Reject impossible inputs and unsupported conventions. Never silently substitute fabricated positions. Publish reference comparisons and accuracy tolerances. Test leap days, timezone transitions, angular wraparound, interval boundaries and unavailable local data. Keep personal birth information in memory unless the user explicitly saves it locally. Treat error causes as private diagnostics and return stable public error codes.
