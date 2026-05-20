import multiprocessing
import os

# Render sets WEB_CONCURRENCY from the instance size. Our old formula
# (cpu_count * 2 + 1) ignored that and could spawn 15+ Uvicorn workers; each
# one imports the app and hits the DB at boot → WORKER TIMEOUT + OOM.
_default_workers = min(multiprocessing.cpu_count() * 2 + 1, 4)
workers = max(1, int(os.environ.get("WEB_CONCURRENCY", str(_default_workers))))

bind = "0.0.0.0:8000"
worker_class = "uvicorn.workers.UvicornWorker"
# Default Gunicorn timeout is 30s; slow DB/SSL during startup needs more headroom.
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = 120
errorlog = "-"
accesslog = "-"
loglevel = "info"
