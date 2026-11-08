
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PaymentCollectionCreate(BaseModel):
    AR_ID: int = Field(gt=0)
    payment_date: date
    payment_method: str | None = None
    amount_paid: Decimal = Field(gt=0)


class PaymentCollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: int
    AR_ID: int
    payment_date: date
    payment_method: str | None
    amount_paid: Decimal
