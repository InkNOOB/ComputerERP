
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, DATABASE_URL, engine

# Models
from app.models.customer import Customer
from app.models.item_master import ItemMaster
from app.models.sales_quotation import SalesQuotation
from app.models.sales_quotation_detail import SalesQuotationDetail
from app.models.sales_order import SalesOrder
from app.models.sales_order_detail import SalesOrderDetail
from app.models.warehouse import Warehouse
from app.models.delivery import Delivery
from app.models.sales_invoice import SalesInvoice
from app.models.accounts_receivable import AccountsReceivable
from app.models.payment_collection import PaymentCollection
from app.models.sales_return import SalesReturn

# Routers
from app.routers.customers import router as customers_router
from app.routers.sales_quotations import router as quotations_router
from app.routers.sales_orders import router as orders_router
from app.routers.deliveries import router as deliveries_router
from app.routers.sales_invoice import router as invoice_router
from app.routers.accounts_receivable import router as accounts_receivable_router
from app.routers.payment_collection import router as payment_collection_router
from app.routers.sales_return import router as sales_return_router


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

# Register routers.
app.include_router(customers_router)
app.include_router(quotations_router)
app.include_router(orders_router)
app.include_router(deliveries_router)
app.include_router(invoice_router)
app.include_router(accounts_receivable_router)
app.include_router(payment_collection_router)
app.include_router(sales_return_router)


@app.get("/")
def home():
    return {
        "message": "Sales Module ERP API is running",
        "docs": "/docs",
        "database": "configured" if DATABASE_URL else "local SQLite",
    }
