
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SalesOrder(Base):
    __tablename__ = "sales_order"

    order_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=False,
    )

    quotation_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("sales_quotation.quotation_id"),
        nullable=True,
    )

    order_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Pending",
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
        default=Decimal("0"),
    )

    details = relationship(
        "SalesOrderDetail",
        back_populates="order",
        cascade="all, delete-orphan",
    )
