from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.api import auth, seats, bookings, admin, payment
from app.core.config import settings

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Bulletproof CORS — always include production domains
REQUIRED_ORIGINS = [
    "https://skydesk360.com",
    "https://www.skydesk360.com",
    "https://skydesk-frontend.onrender.com",
]

origins = list(set(settings.CORS_ORIGINS + REQUIRED_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(seats.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(payment.router)

@app.get("/")
def root():
    return {"message": "Welcome to SkyDesk Pro API", "status": "running"}
