import io
import json
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from piper import PiperVoice, SynthesisConfig

model = Path(os.environ.get('VOICE_DIR', 'models')) / 'de_DE-thorsten-high.onnx'
voice = PiperVoice.load(str(model))
lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, body, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != '/health':
            return self.respond(404, b'{}')
        self.respond(200, b'{"ok":true,"voice":"de_DE-thorsten-high"}')

    def do_POST(self):
        if self.path != '/synthesize':
            return self.respond(404, b'{}')
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4096:
                raise ValueError('Invalid request size')
            data = json.loads(self.rfile.read(length))
            text = data.get('text')
            if not isinstance(text, str) or not text.strip() or len(text) > 300:
                raise ValueError('Use between 1 and 300 characters')
            speed = data.get('length_scale', 1.0)
            if speed not in (1.0, 1.25):
                raise ValueError('Invalid speed')
            output = io.BytesIO()
            with lock, wave.open(output, 'wb') as wav:
                voice.synthesize_wav(text, wav, syn_config=SynthesisConfig(length_scale=speed))
            self.respond(200, output.getvalue(), 'audio/wav')
        except ValueError as error:
            self.respond(400, json.dumps({'error': str(error)}).encode())
        except Exception:
            self.respond(500, b'{"error":"Speech synthesis failed"}')

host = os.environ.get('TTS_HOST', '127.0.0.1')
port = int(os.environ.get('TTS_PORT', '5002'))
print(f'German Piper voice ready on {host}:{port}', flush=True)
ThreadingHTTPServer((host, port), Handler).serve_forever()
