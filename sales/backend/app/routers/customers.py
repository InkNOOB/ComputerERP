
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerStatusUpdate,
    CustomerUpdate,
)

router = APIRouter(prefix="/api/customers", tags=["Customers"])


def get_customer_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    customer = Customer(**customer_data.model_dump())

    db.add(customer)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email may already exist.",
        )

    return customer


@router.get("", response_model=list[CustomerResponse])
def get_customers(
    search: str | None = Query(default=None, max_length=150),
    active_only: bool = True,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    statement = select(Customer)

    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Customer.name.ilike(term),
                Customer.email.ilike(term),
                Customer.contact.ilike(term),
            )
        )

    statement = (
        statement
        .order_by(Customer.customer_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    return db.scalars(statement).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return get_customer_or_404(db, customer_id)


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
):
    customer = get_customer_or_404(db, customer_id)

    updates = customer_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update.",
        )

    for field, value in updates.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The email may already belong to another customer.",
        )

    return customer


@router.delete("/{customer_id}", response_model=CustomerResponse)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = get_customer_or_404(db, customer_id)

    if not customer.status:
        return customer

    customer.status = False
    db.commit()
    db.refresh(customer)

    return customer


@router.patch(
    "/{customer_id}/status",
    response_model=CustomerResponse,
)
def update_customer_status(
    customer_id: int,
    status_data: CustomerStatusUpdate,
    db: Session = Depends(get_db),
):
    customer = get_customer_or_404(db, customer_id)

    customer.status = status_data.status

    db.commit()
    db.refresh(customer)

    return customer
