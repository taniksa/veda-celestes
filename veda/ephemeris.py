"""Normalise maintained and legacy wrapper return contracts in one place."""
import math
import swisseph as swe

def calc_ut(jd, body, flags):
    result = swe.calc_ut(jd, body, flags)
    if len(result) not in (2,3):
        raise RuntimeError('Unsupported ephemeris return contract.')
    values, used = result[:2]
    warning = result[2] if len(result) == 3 else ''
    if warning:
        raise RuntimeError('Ephemeris returned a warning; calculation aborted.')
    if len(values) != 6 or not all(math.isfinite(x) for x in values):
        raise RuntimeError('Ephemeris returned invalid numeric values.')
    return values, used

def houses(jd, lat, lon):
    cusps, axes = swe.houses(jd,lat,lon,b'W')
    if len(cusps) == 13:
        cusps = cusps[1:]
    if len(cusps) != 12 or len(axes) < 1:
        raise RuntimeError('Unsupported house-cusp return contract.')
    return cusps, axes
