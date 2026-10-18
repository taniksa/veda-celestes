"""Synthetic reference moments, never user birth records. Run with .runtime-next."""
import json
from pathlib import Path
from veda.engine import calculate
import swisseph as swe

moments = [
    ('1800-01-12','12:00','UTC',0,0),
    ('1850-06-15','03:15','UTC',51.5074,-0.1278),
    ('1900-01-01','00:00','UTC',-33.8688,151.2093),
    ('1950-11-21','22:45','UTC',40.7128,-74.006),
    ('1990-05-15','14:30','Europe/London',51.5074,-0.1278),
    ('2000-01-01','12:00','UTC',0,0),
    ('2024-02-29','23:59:59','Asia/Kolkata',12.9716,77.5946),
    ('2024-06-21','12:00','UTC',80,20),
    ('2024-12-21','00:00','UTC',-80,20),
    ('2024-07-20','08:30','Pacific/Auckland',-36.8485,174.7633),
    ('2026-10-18','12:00','Asia/Kolkata',12.9716,77.5946),
    ('2026-10-18','00:00','Asia/Kolkata',12.9716,77.5946),
    ('2100-03-01','06:30','UTC',35,135),
    ('2399-12-20','23:00','UTC',-23,-46),
]
fixtures=[]
for date,time,timezone,latitude,longitude in moments:
    request=dict(date=date,time=time,timezone=timezone,latitude=latitude,longitude=longitude)
    expected=calculate(request)
    from datetime import datetime
    utc=datetime.fromisoformat(expected['instant'])
    jd=swe.julday(utc.year,utc.month,utc.day,utc.hour+utc.minute/60+utc.second/3600)
    expected['siderealAscendant']=swe.houses_ex(jd,latitude,longitude,b'W',swe.FLG_SIDEREAL)[1][0]
    fixtures.append(dict(input=request,expected=expected))
Path('test/browser-fixtures.json').write_text(json.dumps(fixtures,indent=2),encoding='utf-8')
print(f'Generated {len(fixtures)} synthetic native fixtures')
