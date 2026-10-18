"""Read-only public feed server; calculates public snapshots only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import threading
import logging
from .feed import current_date, generate, publish
from .engine import calculate, InputError

def make_server(directory, timezone, port=8080, host='127.0.0.1'):
    path = Path(directory)/'latest.json'
    page = Path(__file__).with_name('exhibition.html').read_bytes()
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            if self.path != '/api/chart' or host not in ('127.0.0.1','localhost','::1'):
                return self.respond({'error':{'code':'NOT_FOUND'}},404)
            try:
                length = int(self.headers.get('Content-Length','0'))
                if not 0 < length <= 4096:
                    return self.respond({'error':{'code':'INVALID_BODY_SIZE'}},413)
                self.connection.settimeout(10)
                raw = self.rfile.read(length)
                origin = self.headers.get('Origin')
                if origin and origin != f'http://{self.headers.get("Host")}':
                    return self.respond({'error':{'code':'ORIGIN_REJECTED'}},403)
                if self.headers.get('Content-Type','').split(';')[0] != 'application/json':
                    return self.respond({'error':{'code':'JSON_REQUIRED'}},415)
                self.respond(calculate(json.loads(raw)))
            except (ValueError,InputError) as exc:
                self.respond({'error':{'code':'INVALID_INPUT','message':str(exc)}},400)
            except Exception:
                self.respond({'error':{'code':'CALCULATION_FAILED'}},500)

        def respond(self,body,status=200,content_type='application/json; charset=utf-8'):
            encoded = body if isinstance(body,bytes) else json.dumps(body,ensure_ascii=False,allow_nan=False).encode()
            self.send_response(status)
            self.send_header('Content-Type',content_type)
            self.send_header('Content-Length',str(len(encoded)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Referrer-Policy','no-referrer')
            self.end_headers()
            try:
                self.wfile.write(encoded)
            except (BrokenPipeError,ConnectionResetError):
                pass

        def do_GET(self):
            if self.path == '/':
                return self.respond(page,content_type='text/html; charset=utf-8')
            if self.path not in ('/health','/feed.json'):
                self.send_error(404)
                return
            try:
                payload = json.loads(path.read_text('utf-8'))
                stale = payload['date'] != current_date(timezone)
                body = {'ready':not stale,'date':payload['date'],'stale':stale} if self.path=='/health' else {**payload,'stale':stale}
                status = 503 if self.path=='/health' and stale else 200
            except (OSError,ValueError,KeyError):
                body,status = {'error':{'code':'FEED_UNAVAILABLE'}},503
            encoded = json.dumps(body,ensure_ascii=False,allow_nan=False).encode()
            self.send_response(status)
            self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Content-Length',str(len(encoded)))
            self.send_header('Cache-Control','public, max-age=60')
            self.end_headers()
            self.wfile.write(encoded)
        def log_message(self,*args):
            pass  # Do not log visitor IPs or request paths.
    return ThreadingHTTPServer((host,port),Handler)

def serve(directory, timezone, port=8080, host='127.0.0.1'):
    path = Path(directory)/'latest.json'
    stop = threading.Event()
    def schedule():
        while not stop.is_set():
            try:
                today = current_date(timezone)
                try:
                    old = json.loads(path.read_text('utf-8')) if path.exists() else {}
                except (ValueError,OSError):
                    old = {}
                if old.get('date') != today:
                    publish(generate(today,timezone),directory)
            except Exception:
                logging.error('Feed refresh failed; retaining last successful snapshot.')
            stop.wait(60)
    server = make_server(directory,timezone,port,host)
    threading.Thread(target=schedule,daemon=True).start()
    print(f'Veda Celestes: http://{host}:{server.server_port}',flush=True)
    try:
        server.serve_forever()
    finally:
        stop.set()
        server.server_close()
