"""Download the fixed German Thorsten voice, not a device-dependent voice."""
import os
from pathlib import Path
from urllib.request import urlopen
import shutil

target = Path(os.environ.get('VOICE_DIR', 'models'))
target.mkdir(parents=True, exist_ok=True)
base = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/high/'
for name in ['de_DE-thorsten-high.onnx', 'de_DE-thorsten-high.onnx.json', 'MODEL_CARD']:
    destination = target / name
    if destination.exists():
        continue
    temporary = target / (name + '.part')
    with urlopen(base + name, timeout=120) as response, temporary.open('wb') as output:
        shutil.copyfileobj(response, output)
    temporary.replace(destination)
    print('Downloaded ' + name, flush=True)
