from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db, SessionLocal
from scripts.seed import seed_all
from app.routers import packets as packets_router
from app.routers import candidates as candidates_router
from app.routers import clients as clients_router
from app.routers import pages as pages_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    s = SessionLocal()
    try:
        seed_all(s)
    finally:
        s.close()
    yield

app = FastAPI(title="ProService OCR API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(packets_router.router)
app.include_router(candidates_router.router)
app.include_router(clients_router.router)
app.include_router(pages_router.router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
