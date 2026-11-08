
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SalesInvoice(Base):
    __tablename__ = "sales_invoice"

    invoice_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_order.order_id"),
        nullable=False,
        unique=True,
    )

    invoice_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    total_due: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )
