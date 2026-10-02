from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings, UPLOAD_DIR, PROCESSED_DIR, REPORTS_DIR
from backend.database import Base, engine
from backend.seed_data import seed_database
from backend.routes import (
    auth_routes,
    survey_routes,
    sonar_routes,
    dataset_routes,
    model_routes,
    review_routes,
    simulation_routes,
    analytics_routes,
    assistant_routes
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Underwater Marine Debris & Anomaly Detection Intelligence Platform (SIH26057 • MoES)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under API Prefix
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(survey_routes.router, prefix=settings.API_PREFIX)
app.include_router(sonar_routes.router, prefix=settings.API_PREFIX)
app.include_router(dataset_routes.router, prefix=settings.API_PREFIX)
app.include_router(model_routes.router, prefix=settings.API_PREFIX)
app.include_router(review_routes.router, prefix=settings.API_PREFIX)
app.include_router(simulation_routes.router, prefix=settings.API_PREFIX)
app.include_router(analytics_routes.router, prefix=settings.API_PREFIX)
app.include_router(assistant_routes.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def on_startup():
    # Automatically seed default surveys, datasets, models and demo analyst account
    try:
        seed_database()
        print("[AquaSentinel] Database seeded and online.")
    except Exception as e:
        print(f"[AquaSentinel] Seed error: {e}")

from backend.services.hardware_telemetry import get_live_hardware_telemetry

@app.get("/api/health")
def health_check():
    hw = get_live_hardware_telemetry()
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "hardware": hw,
        "gpu_accelerator": f"{hw['gpu']['device_name']} (CUDA {hw['gpu']['cuda_version']})" if hw["cuda_available"] else "CPU Mode",
        "capabilities_supported": 50,
        "dataset_10k_engine": "Active & Auditable",
        "human_in_loop_status": "Enabled"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
