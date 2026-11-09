
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SalesReturnCreate(BaseModel):
    Order_Detail_ID: int = Field(gt=0)
    invoice_id: int = Field(gt=0)
    return_date: date
    quantity: int = Field(gt=0)
    reason: str | None = None
    return_amount: Decimal | None = Field(default=None, ge=0)


class SalesReturnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    return_id: int
    Order_Detail_ID: int
    invoice_id: int
    return_date: date
    quantity: int
    reason: str | None
    return_amount: Decimal | None
