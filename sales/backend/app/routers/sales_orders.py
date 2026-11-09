
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.customer import Customer
from app.models.item_master import ItemMaster
from app.models.sales_quotation import SalesQuotation
from app.models.sales_order import SalesOrder
from app.models.sales_order_detail import SalesOrderDetail
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderResponse,
    SalesOrderStatusUpdate,
)

router = APIRouter(
    prefix="/api/orders",
    tags=["Sales Orders"],
)


# Retrieve products that can be added to an order.
@router.get("/items")
def get_order_items(
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


# Retrieve all sales orders.
@router.get("", response_model=list[SalesOrderResponse])
def get_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    statement = (
        select(SalesOrder)
        .options(selectinload(SalesOrder.details))
        .order_by(SalesOrder.order_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    return db.scalars(statement).all()


# Create a sales order with multiple products.
@router.post(
    "",
    response_model=SalesOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: SalesOrderCreate,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, order_data.customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    if not customer.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This customer is inactive.",
        )

    # Validate the optional quotation.
    quotation = None

    if order_data.quotation_id is not None:
        quotation = db.get(SalesQuotation, order_data.quotation_id)

        if quotation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quotation not found.",
            )

        if quotation.customer_id != order_data.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quotation does not belong to this customer.",
            )

        if quotation.status != "Accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only accepted quotations can be converted to orders.",
            )

        # Prevent converting the same quotation more than once.
        existing_order = db.scalar(
            select(SalesOrder).where(
                SalesOrder.quotation_id == order_data.quotation_id
            )
        )

        if existing_order is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This quotation has already been converted to an order.",
            )

    # Validate products and calculate totals.
    order_details = []
    order_total = Decimal("0")

    for detail in order_data.details:
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

        order_total += line_total

        order_details.append(
            {
                "IM_ID": item.IM_ID,
                "quantity": detail.quantity,
                "unit_price": unit_price,
                "discount": discount,
                "line_total": line_total,
            }
        )

    order = SalesOrder(
        customer_id=order_data.customer_id,
        quotation_id=order_data.quotation_id,
        order_date=order_data.order_date or date.today(),
        status="Pending",
        total_amount=order_total,
    )

    try:
        db.add(order)
        db.flush()

        for detail in order_details:
            db.add(
                SalesOrderDetail(
                    order_id=order.order_id,
                    **detail,
                )
            )

        db.commit()

        return db.scalar(
            select(SalesOrder)
            .options(selectinload(SalesOrder.details))
            .where(SalesOrder.order_id == order.order_id)
        )

    except Exception:
        db.rollback()
        raise


# Retrieve one sales order.
@router.get(
    "/{order_id}",
    response_model=SalesOrderResponse,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = db.scalar(
        select(SalesOrder)
        .options(selectinload(SalesOrder.details))
        .where(SalesOrder.order_id == order_id)
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found.",
        )

    return order


# Update sales order status.
@router.patch(
    "/{order_id}/status",
    response_model=SalesOrderResponse,
)
def update_order_status(
    order_id: int,
    status_data: SalesOrderStatusUpdate,
    db: Session = Depends(get_db),
):
    order = db.get(SalesOrder, order_id)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found.",
        )

    order.status = status_data.status

    try:
        db.commit()

        return db.scalar(
            select(SalesOrder)
            .options(selectinload(SalesOrder.details))
            .where(SalesOrder.order_id == order_id)
        )

    except Exception:
        db.rollback()
        raise
