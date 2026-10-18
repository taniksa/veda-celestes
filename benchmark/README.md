# Independent reference benchmark

This folder keeps reference observations and queries so tests do not depend on a live service.

## NASA/JPL Horizons

`horizons-reference.json` contains **40** observations: Sun, Moon and the eight planets, at four synthetic epochs (2000-01-01, 2010-06-21, 2020-12-21 and 2026-10-18). These are public reference dates, not birth records. The Earth geocenter is the observing origin (`500@399`); quantity 31 supplies apparent IAU76/80 ecliptic-of-date longitude and latitude, airless, UT input. Unmodified responses and their SHA-256 hashes are retained in `horizons-raw/`.

The preselected acceptance limit was **60 arcseconds** per coordinate. The observed maxima with the bundled Swiss Ephemeris 2.10.03 Moshier WASM are:

| Coordinate | Maximum absolute difference |
| --- | ---: |
| Longitude | 0.656012 arcseconds |
| Latitude | 0.405882 arcseconds |

These measurements validate sampled geocentric positions, **not** every date from 1800–2399, house systems, ayanamsha conventions, sunrise/sunset, traditional timing formulas or the truth of astrological interpretations. Horizons and Swiss frame/time models differ slightly. No scientific validity for predictions is inferred.

Reproduce offline: `node benchmark/verify-horizons.mjs` or `node --test test/horizons.test.mjs`. Refresh deliberately: `python benchmark/collect_horizons.py`; Windows environments using the Windows certificate store can pass `--windows-transport`. Both transports keep TLS verification enabled. Do not replace a failed benchmark with invented observations or a looser silent threshold.

References: [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [coordinate quantity 31 and frame conventions](https://ssd.jpl.nasa.gov/horizons/manual.html).

## Hebrew calendar

`hebrew-reference.json` archives seven independent [Hebcal converter](https://www.hebcal.com/home/219/hebrew-date-converter-rest-api) responses, including leap Adar, Rosh Hashanah and a Hanukkah date. Tests compare the browser-Intl fixed-calendar conversion after normalizing transliterations. Sunset advancement is tested separately at the day boundary. This does not validate ritual candle-lighting/nightfall, local holiday practice or every historical calendar date.

Refresh: `python benchmark/collect_hebrew.py` (same optional `--windows-transport`). The application calls neither NASA nor Hebcal at runtime. These developer-only retrieval tools accept only the synthetic fixtures in their source.
