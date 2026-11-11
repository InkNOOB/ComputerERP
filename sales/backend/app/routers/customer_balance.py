
# Import Decimal for handling financial values.
from decimal import Decimal

# Import FastAPI tools for routing, dependency injection, and HTTP errors.
from fastapi import APIRouter, Depends, HTTPException, status

# Import SQLAlchemy aggregate and query functions.
from sqlalchemy import func, select

# Import SQLAlchemy database session.
from sqlalchemy.orm import Session

# Import the database session dependency.
from app.database import get_db

# Import the Customer and Accounts Receivable database models.
from app.models.customer import Customer
from app.models.accounts_receivable import AccountsReceivable

# Import the response schema for customer balance summaries.
from app.schemas.customer_balance import CustomerBalanceResponse


# Create the Customer Balance API router.
router = APIRouter(
    prefix="/api/customer-balances",
    tags=["Customer Balances"],
)


# Retrieve balance summaries for all customers.
@router.get("", response_model=list[CustomerBalanceResponse])
def get_customer_balances(
    # Provides access to the database session.
    db: Session = Depends(get_db),
):
    # Select customer information and calculate financial totals
    # using the customer's related Accounts Receivable records.
    statement = (
        select(
            Customer.customer_id,
            Customer.name,
            Customer.customer_type,
            Customer.status,

            # Calculate the total amount owed across all invoices.
            # Use zero when the customer has no AR records.
            func.coalesce(
                func.sum(AccountsReceivable.amount_due), 0
            ).label("total_amount_due"),

            # Calculate the total amount paid across all invoices.
            # Use zero when the customer has no recorded payments.
            func.coalesce(
                func.sum(AccountsReceivable.amount_paid), 0
            ).label("total_amount_paid"),

            # Calculate the customer's total outstanding balance.
            # This represents the remaining amount the customer owes.
            func.coalesce(
                func.sum(AccountsReceivable.balance), 0
            ).label("outstanding_balance"),
        )

        # Include customers even if they have no AR records.
        .outerjoin(
            AccountsReceivable,
            AccountsReceivable.customer_id == Customer.customer_id,
        )

        # Group the financial totals by customer.
        .group_by(
            Customer.customer_id,
            Customer.name,
            Customer.customer_type,
            Customer.status,
        )

        # Display the newest customer records first.
        .order_by(Customer.customer_id.desc())
    )

    # Execute the query and return the results as mappings.
    # Each result contains the selected customer information and calculated totals.
    return db.execute(statement).mappings().all()


# Retrieve the balance summary of one specific customer.
@router.get(
    "/{customer_id}",
    response_model=CustomerBalanceResponse,
)
def get_customer_balance(
    # ID of the customer whose balance will be retrieved.
    customer_id: int,

    # Provides access to the database session.
    db: Session = Depends(get_db),
):
    # Select the customer's information and calculate
    # the financial totals from related AR records.
    statement = (
        select(
            Customer.customer_id,
            Customer.name,
            Customer.customer_type,
            Customer.status,

            # Calculate the customer's total amount due.
            # Use zero if no AR records exist.
            func.coalesce(
                func.sum(AccountsReceivable.amount_due), 0
            ).label("total_amount_due"),

            # Calculate the customer's total payments received.
            # Use zero if no payments have been recorded.
            func.coalesce(
                func.sum(AccountsReceivable.amount_paid), 0
            ).label("total_amount_paid"),

            # Calculate the customer's remaining balance.
            # Use zero if no outstanding balance exists.
            func.coalesce(
                func.sum(AccountsReceivable.balance), 0
            ).label("outstanding_balance"),
        )

        # Connect customer information with Accounts Receivable.
        .outerjoin(
            AccountsReceivable,
            AccountsReceivable.customer_id == Customer.customer_id,
        )

        # Retrieve only the requested customer.
        .where(Customer.customer_id == customer_id)

        # Group the financial totals by customer.
        .group_by(
            Customer.customer_id,
            Customer.name,
            Customer.customer_type,
            Customer.status,
        )
    )

    # Execute the query and retrieve the first matching result.
    # mappings() returns the selected values in a dictionary-like format.
    result = db.execute(statement).mappings().first()

    # Return an error if the requested customer does not exist.
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    # Return the customer's information and calculated balance summary.
    return result
