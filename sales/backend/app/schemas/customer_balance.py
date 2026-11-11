
# Import Decimal for accurate financial values.
from decimal import Decimal

# Import Pydantic BaseModel for defining response schemas.
from pydantic import BaseModel


# Schema for returning a customer's financial balance summary.
# This defines the structure of the data returned by the Customer Balance API.
class CustomerBalanceResponse(BaseModel):

    # Unique identifier of the customer.
    customer_id: int

    # Full name of the customer.
    name: str

    # Customer classification (Individual or Business).
    customer_type: str

    # Indicates whether the customer account is active.
    # True means active, while False means inactive.
    status: bool

    # Combined amount due from all customer invoices.
    total_amount_due: Decimal

    # Combined amount already paid by the customer.
    total_amount_paid: Decimal

    # Combined remaining balance across all customer invoices.
    outstanding_balance: Decimal
