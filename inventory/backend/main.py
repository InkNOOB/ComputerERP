
import psycopg
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from auth import require_inventory
from routers import (
    warehouses,
    item_master,
    dashboard,
    stock_ledger,
    stock_actions,
    orders,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://computer-erp-inventory-frontend.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(psycopg.OperationalError)
async def db_unavailable(request, exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database unavailable, try again"}
    )

# Register and protect all Inventory routers
for module in (
    warehouses,
    item_master,
    dashboard,
    stock_ledger,
    stock_actions,
    orders,
):
    app.include_router(
        module.router,
        dependencies=[Depends(require_inventory)]
    )

@app.get("/")
def home():
    return {"status": "Online"}
