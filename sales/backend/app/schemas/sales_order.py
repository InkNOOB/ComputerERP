
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SalesOrderStatus = Literal[
    "Pending",
    "Approved",
    "Processing",
    "Completed",
    "Cancelled",
]


class SalesOrderDetailCreate(BaseModel):
    IM_ID: int = Field(gt=0)
    quantity: int = Field(gt=0)
    discount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )


class SalesOrderCreate(BaseModel):
    customer_id: int = Field(gt=0)
    quotation_id: int | None = Field(default=None, gt=0)
    order_date: date | None = None
    details: list[SalesOrderDetailCreate] = Field(min_length=1)


class SalesOrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_detail_id: int
    order_id: int
    IM_ID: int
    quantity: int
    unit_price: Decimal
    discount: Decimal
    line_total: Decimal


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    customer_id: int
    quotation_id: int | None
    order_date: date
    status: SalesOrderStatus
    total_amount: Decimal
    details: list[SalesOrderDetailResponse]


class SalesOrderStatusUpdate(BaseModel):
    status: SalesOrderStatus
