import re
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr | None = None
    contact: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    customer_type: Literal["Individual", "Business"] = "Individual"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Customer name cannot be empty.")

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if value else None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        if not re.fullmatch(r"[0-9+().\-\s]+", value):
            raise ValueError("Invalid phone number.")

        return value


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None
    contact: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    customer_type: Literal["Individual", "Business"] | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Customer name cannot be empty.")

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower() if value else None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        if not re.fullmatch(r"[0-9+().\-\s]+", value):
            raise ValueError("Invalid phone number.")

        return value


class CustomerStatusUpdate(BaseModel):
    status: bool


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: int
    name: str
    email: EmailStr | None
    contact: str | None
    address: str | None
    customer_type: Literal["Individual", "Business"]
    status: bool