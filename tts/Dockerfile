FROM python:3.12-slim
WORKDIR /app
COPY tts/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY tts/download_voice.py tts/server.py ./
ENV VOICE_DIR=/app/models TTS_HOST=0.0.0.0 TTS_PORT=5002
RUN python download_voice.py && useradd --system --uid 10001 piper
USER piper
EXPOSE 5002
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5002/health', timeout=3)"
CMD ["python", "server.py"]
