
from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountsReceivable(Base):
    __tablename__ = "accounts_receivable"

    AR_ID: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    invoice_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_invoice.invoice_id"),
        nullable=False,
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=False,
    )

    amount_due: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
        default=Decimal("0"),
    )

    balance: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
