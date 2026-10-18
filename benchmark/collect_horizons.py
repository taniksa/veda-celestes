"""Fetch public, synthetic JPL reference observations. Never accepts birth records.

Run explicitly for a refreshed benchmark; application runtime does not call JPL.
Raw responses, exact queries and normalized fixtures are committed for offline tests.
"""
import csv
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import io
import json
import os
import subprocess
from pathlib import Path
import time
from urllib.parse import urlencode
from urllib.request import urlopen

EPOCHS=['2000-01-01T12:00:00+00:00','2010-06-21T00:00:00+00:00','2020-12-21T12:00:00+00:00','2026-10-18T06:30:00+00:00']
TARGETS={'sun':'10','moon':'301','mercury':'199','venus':'299','mars':'499','jupiter':'599','saturn':'699','uranus':'799','neptune':'899','pluto':'999'}

def fetch_reference(url,windows_transport=False):
    if windows_transport:
        command="$ErrorActionPreference='Stop'; $r=Invoke-WebRequest -UseBasicParsing -Uri $env:VEDA_REFERENCE_URL; [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($r.Content))"
        encoded=subprocess.check_output(['powershell.exe','-NoProfile','-NonInteractive','-Command',command],env={**os.environ,'VEDA_REFERENCE_URL':url},timeout=90)
        return base64.b64decode(encoded)
    with urlopen(url,timeout=60) as response:
        return response.read()

def collect(windows_transport=False):
    output=Path(__file__).resolve().parent
    (output/'horizons-raw').mkdir(exist_ok=True)
    jds=[datetime.fromisoformat(t).timestamp()/86400+2440587.5 for t in EPOCHS]
    records=[]
    for body,target in TARGETS.items():
        params={'format':'json','COMMAND':f"'{target}'",'OBJ_DATA':"'YES'",'MAKE_EPHEM':"'YES'",'EPHEM_TYPE':"'OBSERVER'",'CENTER':"'500@399'",'TLIST':"'"+','.join(f'{jd:.9f}' for jd in jds)+"'",'TLIST_TYPE':"'JD'",'TIME_TYPE':"'UT'",'QUANTITIES':"'31'",'REF_SYSTEM':"'ICRF'",'APPARENT':"'AIRLESS'",'CAL_FORMAT':"'JD'",'CSV_FORMAT':"'YES'",'EXTRA_PREC':"'YES'"}
        url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params)
        raw=fetch_reference(url,windows_transport)
        payload=json.loads(raw)
        result=payload.get('result','')
        if payload.get('error') or '$$SOE' not in result:
            raise RuntimeError(f'{body}: '+str(payload.get('error',result[-1000:])))
        # Preserve service output verbatim; response includes target/kernel/frame metadata.
        (output/'horizons-raw'/f'{body}.json').write_bytes(raw)
        rows=list(csv.reader(io.StringIO(result.split('$$SOE')[1].split('$$EOE')[0].strip())))
        if len(rows)!=len(jds):
            raise RuntimeError(f'{body}: unexpected observation count {len(rows)}')
        for i,row in enumerate(rows):
            # CAL_FORMAT=JD: JD, solar-presence flag, lunar-presence flag, longitude, latitude.
            if abs(float(row[0])-jds[i])>1e-7 or len(row)<5:
                raise RuntimeError(f'{body}: unexpected CSV layout {row}')
            records.append({'body':body,'target':target,'instant':EPOCHS[i],'julianDay':float(row[0]),'longitude':float(row[3]),'latitude':float(row[4]),'query':url,'rawSha256':hashlib.sha256(raw).hexdigest()})
        print(body,len(rows),flush=True)
        time.sleep(.6)
    report={'source':'NASA/JPL Horizons observer ephemerides','quantity':31,'origin':'Earth geocenter (500@399)','frame':'IAU76/80 apparent ecliptic of date, airless','retrievedAt':datetime.now(timezone.utc).isoformat(),'epochs':EPOCHS,'thresholdArcseconds':60,'records':records}
    (output/'horizons-reference.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Collected',len(records),'independent observations')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--windows-transport',action='store_true',help='Use Windows certificate validation via PowerShell')
    collect(parser.parse_args().windows_transport)
