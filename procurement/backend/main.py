import psycopg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import suppliers, quotations, purchase_requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(psycopg.OperationalError)
async def db_unavailable(request, exc):
    return JSONResponse(status_code=503, content={"detail": "Database unavailable, try again"})

app.include_router(suppliers.router)
app.include_router(purchase_requests.router)
app.include_router(quotations.router)

@app.get("/")
def home():
    return {"status": "Online"}