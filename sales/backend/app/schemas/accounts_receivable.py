
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AccountsReceivableCreate(BaseModel):
    invoice_id: int = Field(gt=0)


class AccountsReceivableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    AR_ID: int
    invoice_id: int
    customer_id: int
    amount_due: Decimal
    amount_paid: Decimal
    balance: Decimal
    status: str | None
