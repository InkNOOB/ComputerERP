
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SalesReturn(Base):
    __tablename__ = "sales_return"

    return_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    Order_Detail_ID: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_order_detail.order_detail_id"),
        nullable=False
    )

    invoice_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_invoice.invoice_id"),
        nullable=False
    )

    return_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    return_amount: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True
    )
