
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.models.sales_invoice import SalesInvoice
from app.models.sales_order import SalesOrder
from app.schemas.sales_invoice import (
    SalesInvoiceCreate,
    SalesInvoiceResponse,
)
from app.models.accounts_receivable import AccountsReceivable

router = APIRouter(
    prefix="/api/invoices",
    tags=["Sales Invoices"],
)


# Retrieve all sales invoices.
@router.get("", response_model=list[SalesInvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    statement = (
        select(SalesInvoice)
        .order_by(SalesInvoice.invoice_id.desc())
    )

    return db.scalars(statement).all()


# Retrieve one sales invoice.
@router.get("/{invoice_id}", response_model=SalesInvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
):
    invoice = db.get(SalesInvoice, invoice_id)

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales invoice not found.",
        )

    return invoice

# Create a sales invoice and its corresponding accounts receivable record.
@router.post("", response_model=SalesInvoiceResponse, status_code=201)
def create_invoice(
    invoice_data: SalesInvoiceCreate,
    db: Session = Depends(get_db)
):
    order = db.get(SalesOrder, invoice_data.order_id)

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found."
        )

    existing_invoice = db.scalar(
        select(SalesInvoice).where(
            SalesInvoice.order_id == invoice_data.order_id
        )
    )

    if existing_invoice is not None:
        raise HTTPException(
            status_code=409,
            detail="This sales order already has an invoice."
        )

    invoice = SalesInvoice(
        order_id=invoice_data.order_id,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        total_due=order.total_amount,
    )

    try:
        # Save the invoice temporarily to generate its ID.
        db.add(invoice)
        db.flush()

        # Automatically create the corresponding AR record.
        amount_due = Decimal(str(invoice.total_due))

        accounts_receivable = AccountsReceivable(
            invoice_id=invoice.invoice_id,
            customer_id=order.customer_id,
            amount_due=amount_due,
            amount_paid=Decimal("0"),
            balance=amount_due,
            status="Unpaid",
        )

        db.add(accounts_receivable)

        # Save both records together.
        db.commit()
        db.refresh(invoice)

        return invoice

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unable to create invoice and accounts receivable record."
        )