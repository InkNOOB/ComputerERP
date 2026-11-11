# Import required libraries.
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Import database, models, and schemas.
from app.database import get_db
from app.models.accounts_receivable import AccountsReceivable
from app.models.sales_invoice import SalesInvoice
from app.models.sales_order import SalesOrder
from app.schemas.accounts_receivable import (
    AccountsReceivableCreate,
    AccountsReceivableResponse,
)

# Create Accounts Receivable API router.
router = APIRouter(
    prefix="/api/accounts-receivable",
    tags=["Accounts Receivable"],
)


# Get all accounts receivable records.
@router.get("", response_model=list[AccountsReceivableResponse])
def get_accounts_receivable(db: Session = Depends(get_db)):
    # Get all records, newest first.
    statement = (
        select(AccountsReceivable)
        .order_by(AccountsReceivable.AR_ID.desc())
    )

    return db.scalars(statement).all()


# Get one accounts receivable record.
@router.get("/{ar_id}", response_model=AccountsReceivableResponse)
def get_account_receivable(
    ar_id: int,
    db: Session = Depends(get_db),
):
    # Find the record by ID.
    record = db.get(AccountsReceivable, ar_id)

    # Check if the record exists.
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accounts receivable record not found.",
        )

    return record


# Create an accounts receivable record.
@router.post(
    "",
    response_model=AccountsReceivableResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_accounts_receivable(
    ar_data: AccountsReceivableCreate,
    db: Session = Depends(get_db),
):
    # Find the related invoice.
    invoice = db.get(SalesInvoice, ar_data.invoice_id)

    # Check if the invoice exists.
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales invoice not found.",
        )

    # Check if an AR record already exists for this invoice.
    existing_record = db.scalar(
        select(AccountsReceivable).where(
            AccountsReceivable.invoice_id == ar_data.invoice_id
        )
    )

    if existing_record is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invoice already has an accounts receivable record.",
        )

    # Find the related sales order.
    order = db.get(SalesOrder, invoice.order_id)

    # Check if the sales order exists.
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related sales order not found.",
        )

    # Get the total amount due.
    amount_due = Decimal(str(invoice.total_due))

    # Prepare the new AR record.
    record = AccountsReceivable(
        invoice_id=invoice.invoice_id,
        customer_id=order.customer_id,
        amount_due=amount_due,
        amount_paid=Decimal("0"),
        balance=amount_due,
        status="Unpaid",
    )

    try:
        # Save the record to the database.
        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    except IntegrityError:
        # Undo changes if saving fails.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An accounts receivable record for this invoice may already exist.",
        )