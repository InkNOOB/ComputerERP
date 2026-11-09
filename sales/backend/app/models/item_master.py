from decimal import Decimal

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ItemMaster(Base):
    __tablename__ = "ITEM_MASTER"

    IM_ID: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    SKU: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    Item_Name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    Description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    Category: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    Brand: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    ItemType: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    unit_of_measure: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    Price: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )