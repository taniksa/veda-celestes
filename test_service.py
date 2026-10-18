import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from veda.service import make_server
from veda.feed import generate, publish
from test_native import REQUEST

class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        publish(generate('2026-10-18'),self.directory.name)
        self.server = make_server(self.directory.name,'Asia/Kolkata',port=0)
        self.thread = threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(2)
        self.directory.cleanup()

    def request(self,method,path,body=None,headers=None):
        connection = http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=5)
        try:
            connection.request(method,path,body,headers or {})
            response = connection.getresponse()
            return response.status,response.read(),dict(response.getheaders())
        finally:
            connection.close()

    def test_page_feed_chart(self):
        status,page,headers = self.request('GET','/')
        self.assertEqual(status,200)
        self.assertIn('Věda Célestes'.encode(),page)
        self.assertNotIn(b'https://',page)
        status,feed,_ = self.request('GET','/feed.json')
        self.assertEqual(status,200)
        self.assertEqual(len(json.loads(feed)['editions']),3)
        status,chart,headers = self.request('POST','/api/chart',json.dumps(REQUEST),{'Content-Type':'application/json'})
        self.assertEqual(status,200)
        self.assertEqual(len(json.loads(chart)['western']['cusps']),12)
        self.assertEqual(headers['Cache-Control'],'no-store')

    def test_input_errors_and_origins(self):
        for body,headers,expected in [('{}',{'Content-Type':'application/json'},400),('[]',{'Content-Type':'application/json'},400),('{}',{'Content-Type':'text/plain'},415),('{}',{'Content-Type':'application/json','Origin':'https://example.org'},403)]:
            status,_,_ = self.request('POST','/api/chart',body,headers)
            self.assertEqual(status,expected)
        self.assertEqual(self.request('GET','/../requirements.txt')[0],404)

    def test_health_detects_stale_and_missing_feed(self):
        with unittest.mock.patch('veda.service.current_date',return_value='2026-10-19'):
            self.assertEqual(self.request('GET','/health')[0],503)
            self.assertTrue(json.loads(self.request('GET','/feed.json')[1])['stale'])
        (Path(self.directory.name)/'latest.json').unlink()
        self.assertEqual(self.request('GET','/feed.json')[0],503)

if __name__ == '__main__':
    unittest.main()
