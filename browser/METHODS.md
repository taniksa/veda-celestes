# Browser experience 0.4.0

All calculations and original interpretive rules run in an isolated local Web Worker. Inputs never enter URLs, server APIs, logs or browser persistent storage. The result includes selected conventions, version provenance and the timing reference. Export is an explicit local download. No paid compute, LLM call or runtime third-party API is used.

## Implemented lenses

- **Vedic:** Lahiri sidereal D1, standard Parashari D9/navamsha, vargottama markers, named nakshatra/pada, numbered panchanga, 120-year Vimshottari mahadasha/antardasha schedule, and sign-level seven-planet graha drishti. Vimshottari uses 365.25-day years and half-open UTC intervals. Its first period is clipped to birth; earlier elapsed balance is retained in the calculation. Different dasha-year conventions will produce different civil dates. D9 is a mathematical division, not physical planetary positions. No node-aspect convention, exact drishti-strength score or total bala score is implied.
- **Western:** tropical positions, whole-sign houses, classical sign dignities (domicile/exaltation/detriment/fall), seven-planet element counts, annual whole-sign profections at the local birthday and reference-date transits. Feb 29 anniversaries use Feb 28 in common years. Natal aspects use 6° and transit contacts 2°. Applying/separating is estimated one hour ahead against the fixed natal point. The reference date is calculated at noon UTC, explicitly not an assumed real-time feed. No bounds, faces or complete essential-dignity score is claimed.
- **Arabic/medieval:** sect-reversed Fortune/Spirit, their sign rulers, the chosen 28 equal tropical mansion grid, and unequal planetary hours in Chaldean order. Hours use a standard −0.833° Sun-centre horizon, sea level and no terrain/weather correction. Missing polar sunrise/sunset cycles return an unavailable state, never fake equal hours. The method is shared across medieval traditions, not uniquely Arabic.
- **Jewish:** fixed Hebrew calendar from browser Intl; standard-sunset day advancement; leap-year, Hebrew-numeral/month display, Omer count and selected seasonal observance markers. Israel/Diaspora and local-practice differences are stated rather than presented as universal. The month–mazal correspondence is one Sefer Yetzirah-based symbolic convention, with both Adars associated with Pisces. This is not the natal Sun sign, a claim of one universal Jewish horoscope, a crescent-sighting calculation or a halakhic ruling. Twilight, candle-lighting, fast postponements and Havdalah are not computed. If sunset cannot be established, the date is marked civil-only.

## Interpretation design

`interpretations.mjs` contains original, deterministic editorial rules. Each reflection carries its specific sign, degree, house, aspect or timing evidence. The rules combine chart factors and generate questions or themes, not inevitable events or diagnoses. They do not recommend medical or financial actions. Calendar facts, numerical astronomy, symbolic conventions and editorial reflections are presented distinctly. Repeated input plus reference date yields identical output without a network request.

## References, not runtime dependencies

- [Swiss Ephemeris source and documentation](https://github.com/aloistr/swisseph)
- [Maitreya/Saravali: Vimshottari durations and proportional subperiods](https://saravali.github.io/astrology/dasa_vimsottari.html)
- [PyJHora author source: chart and divisional conventions](https://github.com/naturalstupid/PyJHora/blob/main/src/jhora/horoscope/chart/charts.py) (reference only; no code copied)
- [Deborah Houlding: traditional sign dignity definitions](https://www.skyscript.co.uk/dig2.html)
- [Skyscript: planetary-hour ruler table](https://www.skyscript.co.uk/hourrule.html)
- [Sefer Yetzirah 5:2, zodiac/month symbolism](https://www.sefaria.org/Sefer_Yetzirah.5.2?lang=en)
- [Shabbat 156a–b, differing discussions of astrology](https://www.sefaria.org/Shabbat.156a)
- [Hebcal date conversion conventions](https://www.hebcal.com/home/219/hebrew-date-converter-rest-api)

## Verification boundaries

See `../benchmark/README.md` for independent NASA/JPL position measurements and Hebcal calendar samples. The earlier 14-moment native/WASM cross-check also remains. Mathematical invariant/boundary tests cover D9, dasha intervals, birthday profections, solar-hour continuity, polar fallback, calendar rollovers and input validation. None establishes the predictive validity of astrology or exhaustive historical accuracy.
