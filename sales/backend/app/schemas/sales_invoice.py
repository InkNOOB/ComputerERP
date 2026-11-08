
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SalesInvoiceCreate(BaseModel):
    order_id: int = Field(gt=0)
    invoice_date: date
    due_date: date | None = None


class SalesInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invoice_id: int
    order_id: int
    invoice_date: date
    due_date: date | None
    total_due: Decimal
