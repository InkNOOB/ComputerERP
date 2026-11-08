
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


QuotationStatus = Literal[
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
    "Expired",
]


class QuotationDetailCreate(BaseModel):
    IM_ID: int = Field(gt=0)
    quantity: int = Field(gt=0)
    discount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )


class SalesQuotationCreate(BaseModel):
    customer_id: int = Field(gt=0)
    quotation_date: date | None = None
    details: list[QuotationDetailCreate] = Field(min_length=1)


class QuotationDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quotation_detail_id: int
    quotation_id: int
    IM_ID: int
    quantity: int
    unit_price: Decimal
    discount: Decimal
    line_total: Decimal


class SalesQuotationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    quotation_id: int
    customer_id: int
    quotation_date: date
    status: QuotationStatus
    total_amount: Decimal
    details: list[QuotationDetailResponse]


class SalesQuotationStatusUpdate(BaseModel):
    status: QuotationStatus
