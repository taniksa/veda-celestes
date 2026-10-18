# Relationship to the main website

Věda Célestes is the calculation and publication component of the broader TanishaKsamudr project. It has its own public source repository and static deployment. The main website and shop remain a separately deployed consumer.

```text
Věda Célestes local engine
  -> precomputed dated JSON and manifest
  -> https://veda-celestes.pages.dev
  -> main website horoscope adapter (not yet implemented)
```

## Feed contract

1. Fetch `https://veda-celestes.pages.dev/manifest.json`.
2. Determine today's date in the manifest timezone (`Asia/Kolkata`).
3. If the date is listed, fetch `/feeds/YYYY-MM-DD.json`.
4. Read `editions.vedic`, `editions.western` or `editions.arabic`. Each includes date, 12 sign entries and calculated details. The feed also includes public location/time reference and model provenance.
5. Validate schema version and date. Retain the last valid edition on errors and label its age explicitly. Never relabel an old edition as current.

For the initial release the current main-site dated Markdown loader is still active. This publication does not switch it over. The future website adapter must map these structured fields rather than assume they have exactly the same schema as the existing horoscope endpoint.

Browser requests to public feed JSON are allowed through explicit CORS headers. This does not expose a private calculation service. No main-site credentials, birth records or production configuration belong in this repository.

## Operational independence

Static snapshots run through 2027-10-18 and are selected daily without a running calculation host. Regenerate and redeploy before coverage expires. A failure in this component must leave the shop and main-site rendering available, using a clearly dated last-known reading where appropriate.
