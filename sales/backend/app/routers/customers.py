# Import required libraries.
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Import database, model, and schemas.
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerStatusUpdate,
    CustomerUpdate,
)

# Create Customers API router.
router = APIRouter(prefix="/api/customers", tags=["Customers"])


# Find a customer by ID.
def get_customer_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)

    # Return an error if the customer does not exist.
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


# Create a new customer.
@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    # Create a customer using the provided data.
    customer = Customer(**customer_data.model_dump())

    db.add(customer)

    try:
        # Save the new customer.
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        # Undo changes if an error occurs.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email may already exist.",
        )

    return customer


# Get all customers with search and pagination.
@router.get("", response_model=list[CustomerResponse])
def get_customers(
    search: str | None = Query(default=None, max_length=150),
    active_only: bool = True,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Get customer records.
    statement = select(Customer)

    # Show only active customers.
    if active_only:
        statement = statement.where(Customer.status.is_(True))

    # Search by customer name, email, or contact.
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Customer.name.ilike(term),
                Customer.email.ilike(term),
                Customer.contact.ilike(term),
            )
        )

    # Sort and limit the results.
    statement = (
        statement
        .order_by(Customer.customer_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    return db.scalars(statement).all()


# Get one customer by ID.
@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return get_customer_or_404(db, customer_id)


# Update customer information.
@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
):
    # Find the customer.
    customer = get_customer_or_404(db, customer_id)

    # Get only the fields provided for updating.
    updates = customer_data.model_dump(exclude_unset=True)

    # Check if there are fields to update.
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update.",
        )

    # Apply the changes.
    for field, value in updates.items():
        setattr(customer, field, value)

    try:
        # Save the updated customer.
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        # Undo changes if an error occurs.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The email may already belong to another customer.",
        )

    return customer


# Deactivate a customer.
@router.delete("/{customer_id}", response_model=CustomerResponse)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    # Find the customer.
    customer = get_customer_or_404(db, customer_id)

    # Return the customer if already inactive.
    if not customer.status:
        return customer

    # Set customer status to inactive.
    customer.status = False
    db.commit()
    db.refresh(customer)

    return customer


# Update a customer's active or inactive status.
@router.patch(
    "/{customer_id}/status",
    response_model=CustomerResponse,
)
def update_customer_status(
    customer_id: int,
    status_data: CustomerStatusUpdate,
    db: Session = Depends(get_db),
):
    # Find the customer.
    customer = get_customer_or_404(db, customer_id)

    # Apply the new status.
    customer.status = status_data.status

    db.commit()
    db.refresh(customer)

    return customer