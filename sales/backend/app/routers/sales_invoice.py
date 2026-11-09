
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sales_invoice import SalesInvoice
from app.models.sales_order import SalesOrder
from app.schemas.sales_invoice import (
    SalesInvoiceCreate,
    SalesInvoiceResponse,
)

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


# Create a sales invoice from an existing sales order.
@router.post(
    "",
    response_model=SalesInvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice_data: SalesInvoiceCreate,
    db: Session = Depends(get_db),
):
    order = db.get(SalesOrder, invoice_data.order_id)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found.",
        )

    existing_invoice = db.scalar(
        select(SalesInvoice).where(
            SalesInvoice.order_id == invoice_data.order_id
        )
    )

    if existing_invoice is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This sales order already has an invoice.",
        )

    invoice = SalesInvoice(
        order_id=invoice_data.order_id,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        total_due=order.total_amount,
    )

    try:
        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        return invoice

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This sales order already has an invoice.",
        )
