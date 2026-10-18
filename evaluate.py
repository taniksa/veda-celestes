"""Reproducible wrapper comparison payload; run under each isolated dependency set."""
import json
from veda.engine import calculate

samples = []
for date in ['1800-01-01','1900-07-01','2000-01-01','2026-10-18','2100-06-15','2399-12-31']:
    for latitude,longitude in [(0,0),(12.9716,77.5946),(-33.8688,151.2093),(66,20)]:
        chart = calculate({'date':date,'time':'12:00','timezone':'UTC','latitude':latitude,'longitude':longitude})
        samples.append({'date':date,'latitude':latitude,'longitude':longitude,'western':chart['western'],'vedic':chart['vedic'],'arabic':chart['arabic']})
print(json.dumps(samples,sort_keys=True,allow_nan=False))
