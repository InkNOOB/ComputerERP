
import os

from fastapi import FastAPI

from app.database import Base, DATABASE_URL, engine
from app.models.customer import Customer
from app.routers.customers import router as customers_router

app = FastAPI(
    title="Sales Module ERP API",
    description="Backend API for Sales and Customer Management",
    version="1.0.0",
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
