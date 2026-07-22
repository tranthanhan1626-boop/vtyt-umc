from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ingest, proposals

app = FastAPI(title="Hệ thống dự trù VTYT (UMC)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # thu hẹp lại domain Vercel thật trước khi lên production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(proposals.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
