import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from veda.engine import calculate, instant, InputError, angle
from veda.feed import generate, publish

REQUEST = {'date':'2000-01-01','time':'12:00','timezone':'UTC','latitude':0.0,'longitude':0.0}

class NativeTests(unittest.TestCase):
    def test_j2000_sun_sanity_and_determinism(self):
        first = calculate(REQUEST)
        self.assertEqual(first,calculate(REQUEST))
        # Broad astronomical sanity check, not an independent precision benchmark.
        self.assertAlmostEqual(first['western']['planets']['sun']['longitude'],280.37,delta=.1)
        self.assertEqual(first['provenance']['model'],'Moshier')

    def test_calculation_requires_no_network(self):
        with patch('socket.socket.connect',side_effect=AssertionError('Network forbidden')):
            self.assertEqual(len(calculate(REQUEST)['western']['cusps']),12)

    def test_bad_inputs(self):
        for change in ({'date':'2026-02-30'},{'latitude':float('nan')},{'longitude':True},{'ayanamsha':'invented'}):
            with self.assertRaises(InputError):
                calculate({**REQUEST,**change})

    def test_dst_gap_and_overlap(self):
        for day,time in [('2026-03-08','02:30'),('2026-11-01','01:30')]:
            with self.assertRaises(InputError):
                instant({**REQUEST,'date':day,'time':time,'timezone':'America/New_York'})

    def test_lots_and_panchanga_ranges(self):
        chart = calculate(REQUEST)
        self.assertEqual(angle(chart['vedic']['planets']['mean_node']['longitude']+180),chart['vedic']['planets']['ketu']['longitude'])
        p = chart['vedic']['panchanga']
        for key,maximum in [('tithi',30),('nakshatra',27),('pada',4),('yoga',27),('karanaHalfTithi',60)]:
            self.assertTrue(1<=p[key]<=maximum)
        asc = chart['western']['ascendant']['longitude']
        self.assertAlmostEqual(angle(chart['arabic']['fortune']['longitude']+chart['arabic']['spirit']['longitude']),angle(2*asc))

    def test_feed_and_failed_replace_preserves_previous(self):
        payload = generate('2026-10-18')
        self.assertEqual(set(payload['editions']),{'vedic','western','arabic'})
        self.assertTrue(all(len(edition['signs'])==12 for edition in payload['editions'].values()))
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            publish(payload,directory)
            before = (Path(directory)/'latest.json').read_bytes()
            with patch('veda.feed.os.replace',side_effect=OSError('simulated write failure')):
                with self.assertRaises(OSError):
                    publish({'date':'2026-10-19'},directory)
            self.assertEqual(before,(Path(directory)/'latest.json').read_bytes())
            self.assertEqual(len(list(Path(directory).iterdir())),1)

if __name__ == '__main__':
    unittest.main()
