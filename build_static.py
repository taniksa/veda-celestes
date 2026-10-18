"""Export only public UI and precomputed reference snapshots for static hosting."""
import argparse
from datetime import date, timedelta
import json
from pathlib import Path
import re
from veda.feed import generate

def build(start, days, output):
    if not 1 <= days <= 366:
        raise ValueError('Generate between 1 and 366 days per release.')
    output = Path(output)
    output.mkdir(parents=True,exist_ok=True)
    feeds = output/'feeds'
    feeds.mkdir(exist_ok=True)
    dates = [(date.fromisoformat(start)+timedelta(days=i)).isoformat() for i in range(days)]
    for day in dates:
        payload = generate(day)
        (feeds/f'{day}.json').write_text(json.dumps(payload,ensure_ascii=False,allow_nan=False),encoding='utf-8')
    manifest = {'schemaVersion':'1','timezone':'Asia/Kolkata','firstDate':dates[0],'lastDate':dates[-1],'dates':dates,'reference':'Bengaluru, 12:00 Asia/Kolkata','mode':'precomputed-static'}
    (output/'manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
    page = Path('veda/exhibition.html').read_text('utf-8')
    form = '''<form class="panel" id="chart-form"><h2>Explore a daily sky</h2><p class="small">Precomputed public snapshots for Bengaluru at 12:00 Asia/Kolkata.</p><label for="date">Snapshot date</label><input id="date" type="date" required><button class="submit" id="calculate">View this sky</button><p class="error small" id="error" role="alert"></p><p class="small" id="coverage"></p><p class="small">This static edition serves calculated reference charts. Personal birth-chart calculation is available in the local application.</p></form>'''
    page = re.sub(r'<form class="panel" id="chart-form">.*?</form>',lambda _:form,page,flags=re.S)
    begin = page.index('async function calculate(event)')
    end = page.index("$('chart-form').addEventListener",begin)
    page = page[:begin]+'''let manifest=null;
function todayInZone(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const values=Object.fromEntries(parts.map(p=>[p.type,p.value]));return values.year+'-'+values.month+'-'+values.day}
async function calculate(event){event?.preventDefault();$('error').textContent='';$('calculate').disabled=true;try{const day=$('date').value;if(!manifest.dates.includes(day))throw Error('No snapshot is included for this date.');const response=await fetch('/feeds/'+day+'.json');if(!response.ok)throw Error('Snapshot unavailable. Please retry.');const feed=await response.json();chart={schemaVersion:feed.schemaVersion,instant:feed.date+' · 12:00 Asia/Kolkata',provenance:feed.provenance,vedic:feed.editions.vedic.details,western:feed.editions.western.details,arabic:feed.editions.arabic.details};render();const current=day===todayInZone();$('status').textContent=current?'Today’s calculated snapshot':'Viewing snapshot · '+day;$('feed-status').textContent=day+' · '+(current?'Current edition':'Selected dated edition')+' · 12 signs per tradition';$('daily-json').href='/feeds/'+day+'.json';}catch(error){$('error').textContent=error.message;$('status').textContent='Snapshot unavailable'}finally{$('calculate').disabled=false}}
async function initialise(){try{const response=await fetch('/manifest.json');if(!response.ok)throw Error();manifest=await response.json();const today=todayInZone();$('date').min=manifest.firstDate;$('date').max=manifest.lastDate;$('date').value=manifest.dates.includes(today)?today:manifest.lastDate;$('coverage').textContent='Included dates: '+manifest.firstDate+' to '+manifest.lastDate+'.';await calculate();if(!manifest.dates.includes(today))$('error').textContent='Today is outside this release’s coverage. A dated snapshot is shown; publish a new feed bundle to refresh.';}catch(error){$('status').textContent='Unable to load the snapshot index.'}}
''' + page[end:]
    page = page.replace('fetch(\'/feed.json\').then', 'fetch(\'/feed.json\').then')
    start_fetch = page.index("fetch('/feed.json').then")
    page = page[:start_fetch]+'initialise();\n</script></html>\n'
    page = page.replace('href="/feed.json"','id="daily-json" href="/manifest.json"')
    page = page.replace('Local Observatory','Daily Observatory').replace('Local observatory · POC','Daily observatory · Preview').replace('computed locally with a native astronomy engine','precomputed with a native astronomy engine').replace('Local exhibition · No external fonts, scripts, APIs or telemetry','Static exhibition · Precomputed daily snapshots · No telemetry')
    (output/'index.html').write_text(page,encoding='utf-8')
    (output/'404.html').write_text('<!doctype html><title>Snapshot not found</title><p>This snapshot is unavailable. <a href="/">Return to Věda Célestes</a></p>',encoding='utf-8')
    (output/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; connect-src \'self\'; frame-ancestors \'none\'\n/manifest.json\n  Cache-Control: no-cache\n/feeds/*\n  Cache-Control: public, max-age=86400\n',encoding='utf-8')
    with (output/'_headers').open('a',encoding='utf-8') as headers:
        headers.write('/manifest.json\n  Access-Control-Allow-Origin: *\n/feeds/*\n  Access-Control-Allow-Origin: *\n')
    return manifest

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--start',required=True)
    parser.add_argument('--days',type=int,default=366)
    parser.add_argument('--output',default='dist')
    args=parser.parse_args()
    print(json.dumps(build(args.start,args.days,args.output)))
