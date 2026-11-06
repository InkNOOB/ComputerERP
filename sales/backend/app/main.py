from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, DATABASE_URL, engine
from app.models.customer import Customer
from app.routers.customers import router as customers_router

app = FastAPI(
    title="Sales Module ERP API",
    description="Backend API for Sales and Customer Management",
    version="1.0.0",
)

# Allow requests from the Next.js frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables only for local SQLite development.
if not DATABASE_URL:
    Base.metadata.create_all(bind=engine)

app.include_router(customers_router)


@app.get("/")
def home():
    return {
        "message": "Sales Module ERP API is running",
        "docs": "/docs",
        "database": "configured" if DATABASE_URL else "local SQLite",
    }