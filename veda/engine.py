"""Local Swiss Ephemeris calculations. No network or personal-data storage."""
from datetime import datetime, timezone
import math
import threading
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from importlib import metadata, resources
from . import ephemeris
import swisseph as swe

LOCK = threading.RLock()  # Swiss Ephemeris configuration is process-global.
SIGNS = ('Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces')
BODIES = {'sun': swe.SUN, 'moon': swe.MOON, 'mercury': swe.MERCURY, 'venus': swe.VENUS, 'mars': swe.MARS, 'jupiter': swe.JUPITER, 'saturn': swe.SATURN, 'uranus': swe.URANUS, 'neptune': swe.NEPTUNE, 'pluto': swe.PLUTO, 'mean_node': swe.MEAN_NODE}

class InputError(ValueError):
    code = 'INVALID_INPUT'

def angle(value):
    return value % 360

def placement(longitude):
    longitude = angle(longitude)
    return {'longitude': longitude, 'sign': SIGNS[int(longitude // 30)], 'degree': longitude % 30}

def instant(request):
    try:
        naive = datetime.fromisoformat(f"{request['date']}T{request['time']}")
        if naive.tzinfo is not None:
            raise InputError('Use a local time without an offset and supply timezone separately.')
        zone_name = request['timezone']
        if not isinstance(zone_name,str) or '..' in zone_name or zone_name.startswith(('/', '\\')):
            raise InputError('Invalid timezone name.')
        try:
            with resources.files('tzdata.zoneinfo').joinpath(*zone_name.split('/')).open('rb') as zone_file:
                zone = ZoneInfo.from_file(zone_file,key=zone_name)
        except (FileNotFoundError,IsADirectoryError,ValueError) as exc:
            raise InputError('Unknown timezone.') from exc
        candidates = {naive.replace(tzinfo=zone, fold=fold).astimezone(timezone.utc) for fold in (0,1)
                      if naive.replace(tzinfo=zone, fold=fold).astimezone(timezone.utc).astimezone(zone).replace(tzinfo=None) == naive}
        if len(candidates) != 1:
            raise InputError('Local time is ambiguous or nonexistent; provide an unambiguous time.')
        utc = candidates.pop()
        if not 1800 <= utc.year <= 2399:
            raise InputError('This release supports years 1800–2399.')
        return utc
    except (KeyError, ValueError, TypeError, ZoneInfoNotFoundError) as exc:
        if isinstance(exc, InputError):
            raise
        raise InputError('Supply valid date, local time and IANA timezone.') from exc

def coordinate(request, name, limit):
    value = request.get(name)
    if isinstance(value, bool) or not isinstance(value, (float,int)) or not math.isfinite(value) or abs(value) > limit:
        raise InputError(f'{name} must be a finite number between {-limit} and {limit}.')
    return value

def calculate(request):
    if not isinstance(request, dict):
        raise InputError('Request must be an object.')
    utc = instant(request)
    lat, lon = coordinate(request,'latitude',90), coordinate(request,'longitude',180)
    if request.get('ayanamsha', 'lahiri') != 'lahiri':
        raise InputError('Supported ayanamsha: lahiri.')
    with LOCK:
        jd = swe.julday(utc.year,utc.month,utc.day,utc.hour+utc.minute/60+utc.second/3600)
        flags = swe.FLG_MOSEPH | swe.FLG_SPEED
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        tropical, sidereal = {}, {}
        for name, body in BODIES.items():
            values, used = ephemeris.calc_ut(jd, body, flags)
            if name != 'mean_node' and not used & swe.FLG_MOSEPH:
                raise RuntimeError('Unexpected ephemeris model; calculation aborted.')
            sid_values, _ = ephemeris.calc_ut(jd,body,flags | swe.FLG_SIDEREAL)
            tropical[name] = {**placement(values[0]), 'speed': values[3], 'retrograde': values[3] < 0}
            sidereal[name] = {**placement(sid_values[0]),'speed':sid_values[3],'retrograde':sid_values[3]<0}
        sidereal['ketu'] = placement(sidereal['mean_node']['longitude']+180)
        cusps, axes = ephemeris.houses(jd,lat,lon)
        asc = axes[0]
        equatorial, _ = ephemeris.calc_ut(jd,swe.SUN,flags | swe.FLG_EQUATORIAL)
        altitude = swe.azalt(jd,swe.EQU2HOR,(lon,lat,0),0,15,equatorial[:3])[1]
        day = altitude >= 0
        sun, moon = tropical['sun']['longitude'], tropical['moon']['longitude']
        fortune = angle(asc + (moon-sun if day else sun-moon))
        spirit = angle(asc + (sun-moon if day else moon-sun))
        elongation = angle(moon-sun)
        moon_sid = sidereal['moon']['longitude']
        aspects = []
        names = list(BODIES)[:-1]
        for i, a in enumerate(names):
            for b in names[i+1:]:
                distance = abs(angle(tropical[a]['longitude']-tropical[b]['longitude']+180)-180)
                for label, exact in [('conjunction',0),('sextile',60),('square',90),('trine',120),('opposition',180)]:
                    if abs(distance-exact) <= 6:
                        aspects.append({'bodies':[a,b],'aspect':label,'orb':abs(distance-exact)})
        return {'schemaVersion':'1', 'engineVersion':'0.2.0', 'instant':utc.isoformat(),
                'provenance':{'library':'Swiss Ephemeris','version':swe.version,'model':'Moshier','timezoneDatabase':'tzdata '+metadata.version('tzdata'),'supportedYears':[1800,2399], 'timeConvention':'UTC supplied as UT approximation; Swiss delta-T model', 'accuracy':'Independent acceptance benchmarking pending'},
                'western':{'zodiac':'tropical','planets':tropical,'ascendant':placement(asc),'houseSystem':'whole-sign','cusps':list(cusps),'aspects':aspects},
                'vedic':{'zodiac':'sidereal','ayanamsha':'Lahiri','ayanamshaDegrees':swe.get_ayanamsa_ut(jd),'planets':sidereal,
                         'panchanga':{'tithi':int(elongation//12)+1,'paksha':'shukla' if elongation<180 else 'krishna','nakshatra':int(moon_sid/(40/3))+1,'pada':int((moon_sid%(40/3))/(10/3))+1,'yoga':int(angle(sidereal['sun']['longitude']+moon_sid)/(40/3))+1,'karanaHalfTithi':int(elongation//6)+1}},
                'arabic':{'convention':'Hellenistic-derived Fortune/Spirit; reverse formulas by sect; equal tropical lunar mansions', 'sect':'day' if day else 'night','sectRule':'Sun geometric centre altitude >= 0 degrees','fortune':placement(fortune),'spirit':placement(spirit),'lunarMansion':int(moon/(360/28))+1}}
