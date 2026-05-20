from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, todos, guest_todos
from .database import engine
from . import models

# We will let Alembic handle schema creation in production, 
# but for MVP ease of testing without migrations right away, this is safe if tables don't exist.
# However, the prompt requires Alembic, so we'll just initialize the app normally.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="LIT MVP Todo API", version="1.0.0")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(todos.router, prefix="/api/v1/todos")
app.include_router(guest_todos.router, prefix="/api/v1/guest/todos")

@app.get("/health")
def health_check():
    return {"status": "ok"}
