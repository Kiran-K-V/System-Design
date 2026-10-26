FROM python:3.12-slim
RUN pip install --no-cache-dir fastapi==0.115.12 "uvicorn[standard]==0.34.2" asyncpg==0.30.0 redis==5.2.1
COPY main.py /srv/main.py
WORKDIR /srv
ENV PYTHONPATH=/app
