FROM python:3.12-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt
FROM python:3.12-slim
COPY --from=build /wheels /wheels
RUN pip install --no-index --find-links=/wheels pysweph==2.10.3.6 tzdata==2025.2 && rm -rf /wheels
RUN useradd --uid 10001 --create-home veda && mkdir /data && chown veda /data
WORKDIR /app
COPY veda ./veda
USER veda
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=60s --start-period=60s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health',timeout=5)"
CMD ["python","-m","veda","serve","--host","0.0.0.0","--output","/data"]
