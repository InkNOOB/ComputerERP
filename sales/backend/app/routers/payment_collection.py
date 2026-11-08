
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounts_receivable import AccountsReceivable
from app.models.payment_collection import PaymentCollection
from app.schemas.payment_collection import (
    PaymentCollectionCreate,
    PaymentCollectionResponse,
)

router = APIRouter(
    prefix="/api/payment-collections",
    tags=["Payment Collections"],
)


# Retrieve all payment collections.
@router.get("", response_model=list[PaymentCollectionResponse])
def get_payment_collections(db: Session = Depends(get_db)):
    statement = (
        select(PaymentCollection)
        .order_by(PaymentCollection.payment_id.desc())
    )

    return db.scalars(statement).all()


# Retrieve one payment collection.
@router.get("/{payment_id}", response_model=PaymentCollectionResponse)
def get_payment_collection(
    payment_id: int,
    db: Session = Depends(get_db),
):
    payment = db.get(PaymentCollection, payment_id)

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment collection not found.",
        )

    return payment


# Record a payment and update its Accounts Receivable balance.
@router.post(
    "",
    response_model=PaymentCollectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment_collection(
    payment_data: PaymentCollectionCreate,
    db: Session = Depends(get_db),
):
    ar_record = db.scalar(
        select(AccountsReceivable)
        .where(AccountsReceivable.AR_ID == payment_data.AR_ID)
        .with_for_update()
    )

    if ar_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Accounts receivable record not found.",
        )

    payment_amount = Decimal(str(payment_data.amount_paid))
    current_balance = Decimal(str(ar_record.balance))

    if payment_amount > current_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount cannot exceed the remaining balance.",
        )

    payment = PaymentCollection(
        AR_ID=payment_data.AR_ID,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method,
        amount_paid=payment_amount,
    )

    ar_record.amount_paid = (
        Decimal(str(ar_record.amount_paid)) + payment_amount
    )

    ar_record.balance = current_balance - payment_amount

    if ar_record.balance == Decimal("0"):
        ar_record.status = "Paid"
    else:
        ar_record.status = "Partially Paid"

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    except Exception:
        db.rollback()
        raise
