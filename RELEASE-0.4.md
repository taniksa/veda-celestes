# 0.4.0 · Browser experience release

## Delivered

- Original, reproducible chart-specific symbolic readings with visible evidence, no LLM/API call or invented certainty.
- Vedic D9/vargottama, named nakshatras, Vimshottari major/subperiod schedules and sign-level classical aspects.
- Western sign dignities, element counts, local-birthday annual profections and reference-date transits.
- Arabic/medieval Fortune/Spirit ruler context, equal-mansion progress and unequal seasonal planetary hours with explicit polar fallback.
- Separate Jewish calendar/seasonal perspective: Hebrew script/numerals, leap Adar, approximate sunset rollover, Omer and selected observances, with local-practice distinctions.
- Dedicated View the sky and Jewish navigation on the main website, plus four lenses within the personal-chart tool.
- Independent offline-reproducible JPL and Hebcal samples, raw response provenance and public numerical results.

No claim is made that this is every traditional technique, an exhaustive accuracy certification or scientific validation of astrological prediction. See browser/METHODS.md and benchmark/README.md. Runtime remains self-hosted static JS/WASM on the existing site: no new compute host, account, token, payment integration or service tier.

## Automated checks

18 engine JavaScript tests, including the 40-observation JPL benchmark and seven-date Hebcal sample, plus 9 native Python/service tests pass. The main integration has 16 regression tests and a successful production build. The existing repository-wide TypeScript baseline still reports unrelated admin/platform typing issues; no new chart-component type errors were introduced.

The native and HTTP service tests remain for the earlier local Python service; no local Python/Docker service is needed for the new browser experience. Exact method variants and test limitations are retained in the source rather than hidden behind a generalized accuracy claim.
