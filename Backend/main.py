from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.api import auth, seats, bookings, admin
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials="*" not in settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(auth.router)
app.include_router(seats.router)
app.include_router(bookings.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Welcome to SkyDesk Pro API", "status": "running"}
