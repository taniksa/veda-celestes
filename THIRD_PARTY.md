# Third-party components

The original project code is distributed under AGPL-3.0; see LICENSE.

- `pysweph` 2.10.3.6: maintained Python binding to Swiss Ephemeris. Source, notices and upstream licensing: https://github.com/sailorfe/pysweph and https://pypi.org/project/pysweph/2.10.3.6/ .
- Swiss Ephemeris: astronomical C implementation used through that binding. Official source and license: https://github.com/aloistr/swisseph . Calculations in this release explicitly select its built-in Moshier model.
- `tzdata` 2025.2: bundled IANA timezone data. Source and notices: https://github.com/python/tzdata and https://pypi.org/project/tzdata/2025.2/ .

Dependencies are fetched through the pinned requirements file. They are not copied into Git. Retain their complete upstream notices in installed or binary distributions. The public application source is in this repository; source distributions of the pinned third-party releases are available from the links above.

JHora installer material is not incorporated. PyJHora, Astronomy Engine and astronomia were research references and are not bundled runtime dependencies.
