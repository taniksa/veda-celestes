# Security policy

Věda Célestes must remain stateless by default. The engine accepts only the fields necessary for a single calculation and must not log or persist birth details, location data, identifiers or IP addresses.

Production credentials belong in the consuming deployment's secret store, never in this repository. If a secret or personal record is committed, revoke/rotate it first, then remove it from version control and notify maintainers privately.
