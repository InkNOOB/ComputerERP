from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.sales_order import SalesOrder
from app.models.warehouse import Warehouse
from app.schemas.delivery import (
    DeliveryCreate,
    DeliveryResponse,
    DeliveryStatusUpdate,
)

router = APIRouter(
    prefix="/api/deliveries",
    tags=["Deliveries"],
)


# Retrieve all deliveries.
@router.get("", response_model=list[DeliveryResponse])
def get_deliveries(db: Session = Depends(get_db)):
    statement = (
        select(Delivery)
        .order_by(Delivery.delivery_id.desc())
    )

    return db.scalars(statement).all()

# Retrieve available warehouses.
@router.get("/warehouses")
def get_warehouses(db: Session = Depends(get_db)):
    statement = text("""
        SELECT
            "WH_ID",
            "Warehouse_Name",
            "Location"
        FROM public."WAREHOUSE"
        ORDER BY "Warehouse_Name"
    """)

    return db.execute(statement).mappings().all()

# Retrieve one delivery.
@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if delivery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found.",
        )

    return delivery


# Create a delivery.
@router.post(
    "",
    response_model=DeliveryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_delivery(
    delivery_data: DeliveryCreate,
    db: Session = Depends(get_db),
):
    order = db.get(SalesOrder, delivery_data.order_id)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found.",
        )

    warehouse = db.get(Warehouse, delivery_data.WH_ID)

    if warehouse is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found.",
        )

    delivery = Delivery(
        order_id=delivery_data.order_id,
        WH_ID=delivery_data.WH_ID,
        delivery_date=delivery_data.delivery_date,
        delivery_address=delivery_data.delivery_address,
        status="Pending",
    )

    try:
        db.add(delivery)
        db.commit()
        db.refresh(delivery)

        return delivery

    except Exception:
        db.rollback()
        raise


# Update delivery status.
@router.patch(
    "/{delivery_id}/status",
    response_model=DeliveryResponse,
)
def update_delivery_status(
    delivery_id: int,
    status_data: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if delivery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found.",
        )

    delivery.status = status_data.status

    try:
        db.commit()
        db.refresh(delivery)

        return delivery

    except Exception:
        db.rollback()
        raise


