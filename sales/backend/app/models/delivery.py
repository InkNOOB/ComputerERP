
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Delivery(Base):
    __tablename__ = "delivery"

    delivery_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_order.order_id"),
        nullable=False,
    )

    WH_ID: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("WAREHOUSE.WH_ID"),
        nullable=False,
    )

    delivery_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    delivery_address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Pending",
    )
