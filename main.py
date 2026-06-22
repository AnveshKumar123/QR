from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

from api import auth_routes, qr_route, contact_route
from core.config import settings
from core.logging import logger
from db.base import engine
from models.models import Base

app = FastAPI(title="QR Contact Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(qr_route.router, prefix="/api", tags=["qr"])
app.include_router(contact_route.router, prefix="/api", tags=["contact"])

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

    @app.get("/favicon.svg")
    async def get_favicon():
        favicon_path = os.path.join(frontend_dir, "favicon.svg")
        if os.path.exists(favicon_path):
            return FileResponse(favicon_path)
        raise HTTPException(status_code=404)

    @app.get("/icons.svg")
    async def get_icons():
        icons_path = os.path.join(frontend_dir, "icons.svg")
        if os.path.exists(icons_path):
            return FileResponse(icons_path)
        raise HTTPException(status_code=404)

    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        if catchall.startswith("api/") or catchall.startswith("health"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = os.path.join(frontend_dir, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404)

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True)
