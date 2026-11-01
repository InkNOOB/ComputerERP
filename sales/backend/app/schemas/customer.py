from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CustomerCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=150)
    email: str | None = None
    phone: str | None = None
    address: str | None = None

    customer_type: Literal["Individual", "Business"] = "Individual"


class CustomerUpdate(BaseModel):
    customer_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    customer_type: Literal["Individual", "Business"] | None = None
    status: bool | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: int
    customer_name: str
    email: str | None
    phone: str | None
    address: str | None
    customer_type: str
    status: bool
    created_at: datetime