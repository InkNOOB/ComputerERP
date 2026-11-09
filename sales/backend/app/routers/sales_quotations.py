
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.customer import Customer
from app.models.item_master import ItemMaster
from app.models.sales_quotation import SalesQuotation
from app.models.sales_quotation_detail import SalesQuotationDetail
from app.schemas.sales_quotation import (
    QuotationDetailResponse,
    SalesQuotationCreate,
    SalesQuotationResponse,
    SalesQuotationStatusUpdate,
)

router = APIRouter(
    prefix="/api/quotations",
    tags=["Sales Quotations"],
)


# Retrieve products that can be added to a quotation.
@router.get("/items")
def get_quotation_items(
    search: str | None = Query(default=None, max_length=150),
    db: Session = Depends(get_db),
):
    statement = select(ItemMaster)

    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            ItemMaster.Item_Name.ilike(term)
            | ItemMaster.SKU.ilike(term)
        )

    statement = statement.order_by(ItemMaster.IM_ID.desc())

    items = db.scalars(statement).all()

    return [
        {
            "IM_ID": item.IM_ID,
            "SKU": item.SKU,
            "Item_Name": item.Item_Name,
            "Category": item.Category,
            "Brand": item.Brand,
            "unit_of_measure": item.unit_of_measure,
            "Price": item.Price,
            "status": item.status,
        }
        for item in items
    ]


# Retrieve all quotations.
@router.get("", response_model=list[SalesQuotationResponse])
def get_quotations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    statement = (
        select(SalesQuotation)
        .options(selectinload(SalesQuotation.details))
        .order_by(SalesQuotation.quotation_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    return db.scalars(statement).all()


# Create a quotation with multiple items.
@router.post(
    "",
    response_model=SalesQuotationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_quotation(
    quotation_data: SalesQuotationCreate,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, quotation_data.customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    # Validate all items and calculate their totals.
    quotation_details = []
    quotation_total = Decimal("0")

    for detail in quotation_data.details:
        item = db.get(ItemMaster, detail.IM_ID)

        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {detail.IM_ID} was not found.",
            )

        if item.Price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item {item.Item_Name} has no available price.",
            )

        unit_price = Decimal(item.Price)
        discount = detail.discount

        gross_total = Decimal(detail.quantity) * unit_price
        discount_amount = gross_total * discount / Decimal("100")
        line_total = gross_total - discount_amount

        quotation_total += line_total

        quotation_details.append(
            {
                "IM_ID": item.IM_ID,
                "quantity": detail.quantity,
                "unit_price": unit_price,
                "discount": discount,
                "line_total": line_total,
            }
        )

    # Create the quotation header.
    quotation = SalesQuotation(
        customer_id=quotation_data.customer_id,
        quotation_date=quotation_data.quotation_date or date.today(),
        status="Draft",
        total_amount=quotation_total,
    )

    try:
        db.add(quotation)
        db.flush()

        # Create the quotation detail records.
        for detail in quotation_details:
            db.add(
                SalesQuotationDetail(
                    quotation_id=quotation.quotation_id,
                    **detail,
                )
            )

        db.commit()

        # Reload the quotation and its details.
        db.refresh(quotation)

        return db.scalar(
            select(SalesQuotation)
            .options(selectinload(SalesQuotation.details))
            .where(
                SalesQuotation.quotation_id == quotation.quotation_id
            )
        )

    except Exception:
        db.rollback()
        raise


# Retrieve one quotation.
@router.get(
    "/{quotation_id}",
    response_model=SalesQuotationResponse,
)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.scalar(
        select(SalesQuotation)
        .options(selectinload(SalesQuotation.details))
        .where(SalesQuotation.quotation_id == quotation_id)
    )

    if quotation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found.",
        )

    return quotation


# Update quotation status.
@router.patch(
    "/{quotation_id}/status",
    response_model=SalesQuotationResponse,
)
def update_quotation_status(
    quotation_id: int,
    status_data: SalesQuotationStatusUpdate,
    db: Session = Depends(get_db),
):
    quotation = db.get(SalesQuotation, quotation_id)

    if quotation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found.",
        )

    quotation.status = status_data.status
    db.commit()

    return db.scalar(
        select(SalesQuotation)
        .options(selectinload(SalesQuotation.details))
        .where(SalesQuotation.quotation_id == quotation_id)
    )
