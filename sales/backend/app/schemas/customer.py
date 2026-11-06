
import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    customer_type: Literal["Individual", "Business"] = "Individual"

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Customer name cannot be empty.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        if not value:
            return None

        # Permit common phone number characters.
        if not re.fullmatch(r"[0-9+().\-\s]+", value):
            raise ValueError("Phone number contains invalid characters.")

        return value


class CustomerUpdate(BaseModel):
    customer_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    customer_type: Literal["Individual", "Business"] | None = None

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        if not value:
            raise ValueError("Customer name cannot be empty.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        if not value:
            return None

        if not re.fullmatch(r"[0-9+().\-\s]+", value):
            raise ValueError("Phone number contains invalid characters.")

        return value


class CustomerStatusUpdate(BaseModel):
    status: bool


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: int
    name: str
    email: EmailStr | None
    phone: str | None
    address: str | None