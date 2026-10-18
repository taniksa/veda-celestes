"""Versioned daily snapshots with atomic replacement and last-success retention."""
from datetime import date, datetime
import json
import os
from pathlib import Path
import tempfile
from .engine import calculate, SIGNS

def generate(day, timezone='Asia/Kolkata', latitude=12.9716, longitude=77.5946):
    date.fromisoformat(day)
    chart = calculate({'date':day,'time':'12:00','timezone':timezone,'latitude':latitude,'longitude':longitude})
    editions = {}
    for tradition in ('vedic','western','arabic'):
        planets = chart['vedic' if tradition=='vedic' else 'western']['planets']
        readings = []
        for i, sign in enumerate(SIGNS):
            moon_house = (SIGNS.index(planets['moon']['sign'])-i)%12+1
            basis = {'moonSolarHouse':moon_house,'reference':'sign as first whole-sign solar house'}
            reading = f"The tropical Moon occupies solar house {moon_house} from {sign}."
            if tradition == 'vedic':
                panchanga = chart['vedic']['panchanga']
                reading = f"The Lahiri sidereal Moon occupies solar house {moon_house} from {sign}; tithi {panchanga['tithi']} and nakshatra {panchanga['nakshatra']} mark this noon snapshot."
                basis['panchanga'] = panchanga
            elif tradition == 'arabic':
                arabic = chart['arabic']
                basis = {'fortune':arabic['fortune'],'spirit':arabic['spirit'],'sect':arabic['sect'],'lunarMansion':arabic['lunarMansion'],'scope':'shared location-specific snapshot; not sign-personalised'}
                reading = f"In this {arabic['sect']} chart, Fortune lies in {arabic['fortune']['sign']} and Spirit in {arabic['spirit']['sign']}; the Moon occupies equal tropical mansion {arabic['lunarMansion']}. These positions are shared across this reference chart."
            readings.append({'sign':sign.lower(),'name':sign,'reading':reading,
                             'basis':basis,'interpretationStatus':'initial calculation commentary; expanded interpretive rules pending'})
        editions[tradition] = {'date':day,'edition':tradition,'signs':readings,'details':chart[tradition]}
    return {'schemaVersion':'1','date':day,'reference':{'time':'12:00','timezone':timezone,'latitude':latitude,'longitude':longitude},'provenance':chart['provenance'],'editions':editions}

def publish(payload, directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    data = json.dumps(payload,ensure_ascii=False,allow_nan=False).encode('utf-8')
    # Entire generation succeeds before replacing latest.json. Readers see old or new.
    fd, name = tempfile.mkstemp(prefix='.feed-',dir=directory)
    try:
        with os.fdopen(fd,'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name,directory/'latest.json')
    finally:
        if os.path.exists(name):
            os.unlink(name)

def current_date(timezone):
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo(timezone)).date().isoformat()
