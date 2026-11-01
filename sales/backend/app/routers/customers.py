from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/api/customers", tags=["Customers"])


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
            status_code=409,
            detail="A customer with this email may already exist.",
        )

    return customer


@router.get("", response_model=list[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
):
    statement = select(Customer).order_by(Customer.customer_id.desc())
    return db.scalars(statement).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found.")

    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found.")

    updates = customer_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The email may already belong to another customer.",
        )

    return customer


@router.delete("/{customer_id}", response_model=CustomerResponse)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # Keep the record because existing orders and invoices may reference it.
    customer.status = False

    db.commit()
    db.refresh(customer)

    return customer