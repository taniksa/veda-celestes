# Browser calculation component

`chart-worker.mjs` runs the 0.4.0 `experience.mjs` orchestration, `chart-engine.mjs`, traditional techniques, Hebrew calendar and original editorial reflections in a dedicated Web Worker. Input is posted only to that local worker, never to a server. There is no personal-data storage or telemetry. The main-site React tab renders the results. See [METHODS.md](METHODS.md) for precise scope and conventions.

The unmodified library files in `lib/` are pinned to **@swisseph/browser 1.3.1**, from https://registry.npmjs.org/@swisseph/browser/-/browser-1.3.1.tgz. Upstream source/build instructions: https://github.com/swisseph-js/swisseph/tree/main/packages/browser. Its AGPL-3.0 license is included in `lib/LICENSE`; the parent project is also AGPL-3.0. No CDN runtime calls or external ephemeris downloads are used. Only built-in Moshier + speed flags are requested. Deploy the two JS files and WASM together.

Birth moments support 1800–2399, Gregorian calendar, latitude ±89.5°, longitude ±180°. Whole-sign houses, Lahiri sidereal zodiac, five major tropical aspects with 6° orb, numbered panchanga, sect-reversed Fortune/Spirit and equal tropical lunar mansions are explicit conventions. This is not the entirety of any tradition, a rectification tool, or a prediction of events.

Timezone resolution uses the browser's Intl timezone database (unlike Python's pinned tzdata). Ambiguous/nonexistent DST times are rejected; enter UTC when the intended occurrence is known. Historic results may differ when host timezone databases differ. All entered coordinates are explicit; there is no geolocation or place-name lookup.

The native/browser cross-check tests compare longitudes, ascendant, panchanga, aspects, sect and lots at 14 moments. Separately, 40 independently archived NASA/JPL observations sample apparent geocentric positions, and seven Hebcal conversions sample the Hebrew calendar. See [benchmark results and limitations](../benchmark/README.md). Predictive validity is not inferred from astronomical accuracy.
