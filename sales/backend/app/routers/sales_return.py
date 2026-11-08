
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sales_return import SalesReturn
from app.models.sales_order_detail import SalesOrderDetail
from app.models.sales_invoice import SalesInvoice
from app.schemas.sales_return import (
    SalesReturnCreate,
    SalesReturnResponse,
)

router = APIRouter(
    prefix="/api/returns",
    tags=["Sales Returns"],
)


@router.get("", response_model=list[SalesReturnResponse])
def get_returns(db: Session = Depends(get_db)):
    statement = select(SalesReturn).order_by(
        SalesReturn.return_id.desc()
    )
    return db.scalars(statement).all()


@router.get("/{return_id}", response_model=SalesReturnResponse)
def get_return(return_id: int, db: Session = Depends(get_db)):
    record = db.get(SalesReturn, return_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales return not found.",
        )

    return record


@router.post(
    "",
    response_model=SalesReturnResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_return(
    return_data: SalesReturnCreate,
    db: Session = Depends(get_db),
):
    try:
        detail = db.scalar(
            select(SalesOrderDetail)
            .where(
                SalesOrderDetail.order_detail_id
                == return_data.Order_Detail_ID
            )
            .with_for_update()
        )

        if detail is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales order detail not found.",
            )

        invoice = db.get(
            SalesInvoice,
            return_data.invoice_id,
        )

        if invoice is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales invoice not found.",
            )

        if invoice.order_id != detail.order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The invoice does not belong to the selected sales order item.",
            )

        previous_quantity = db.scalar(
            select(
                func.coalesce(
                    func.sum(SalesReturn.quantity),
                    0,
                )
            ).where(
                SalesReturn.Order_Detail_ID
                == return_data.Order_Detail_ID
            )
        )

        remaining_quantity = (
            detail.quantity - int(previous_quantity or 0)
        )

        if return_data.quantity > remaining_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Return quantity exceeds the remaining returnable quantity ({remaining_quantity}).",
            )

        if return_data.return_amount is not None:
            calculated_amount = return_data.return_amount
        else:
            calculated_amount = (
                Decimal(str(detail.line_total))
                / Decimal(detail.quantity)
                * Decimal(return_data.quantity)
            )

        record = SalesReturn(
            Order_Detail_ID=return_data.Order_Detail_ID,
            invoice_id=return_data.invoice_id,
            return_date=return_data.return_date,
            quantity=return_data.quantity,
            reason=return_data.reason,
            return_amount=calculated_amount,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
