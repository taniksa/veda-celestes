"""Independent synthetic calendar fixtures; application does not call Hebcal."""
import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
import time
from collect_horizons import fetch_reference

DATES=['2000-01-01','2023-09-16','2024-03-24','2024-04-23','2024-06-12','2025-01-01','2026-10-18']
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--windows-transport',action='store_true')
    args=parser.parse_args()
    records=[]
    for day in DATES:
        url='https://www.hebcal.com/converter?cfg=json&date='+day+'&g2h=1&strict=1'
        response=json.loads(fetch_reference(url,args.windows_transport))
        if 'error' in response or 'hy' not in response:
            raise RuntimeError(str(response))
        records.append({'date':day,'query':url,'response':response})
        print(day,response['hy'],response['hm'],response['hd'],flush=True)
        time.sleep(.3)
    Path(__file__).with_name('hebrew-reference.json').write_text(json.dumps({'source':'Hebcal Hebrew Date Converter API','retrievedAt':datetime.now(timezone.utc).isoformat(),'records':records},ensure_ascii=False,indent=2),encoding='utf-8')
