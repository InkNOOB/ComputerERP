
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DeliveryStatus = Literal[
    "Pending",
    "Preparing",
    "Shipped",
    "Delivered",
    "Cancelled",
]


class DeliveryCreate(BaseModel):
    order_id: int = Field(gt=0)
    WH_ID: int = Field(gt=0)
    delivery_date: date | None = None
    delivery_address: str = Field(min_length=1)


class DeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    delivery_id: int
    order_id: int
    WH_ID: int
    delivery_date: date | None
    delivery_address: str
    status: DeliveryStatus


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
