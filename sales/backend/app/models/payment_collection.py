
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PaymentCollection(Base):
    __tablename__ = "payment_collection"

    payment_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    AR_ID: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("accounts_receivable.AR_ID"),
        nullable=False,
    )

    payment_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    payment_method: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )
