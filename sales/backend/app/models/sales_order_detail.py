from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SalesOrderDetail(Base):
    __tablename__ = "sales_order_detail"

    order_detail_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_order.order_id"),
        nullable=False,
    )

    IM_ID: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ITEM_MASTER.IM_ID"),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    discount: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
        default=Decimal("0"),
    )

    line_total: Mapped[Decimal] = mapped_column(
        Numeric,
        nullable=False,
    )

    order = relationship(
        "SalesOrder",
        back_populates="details",
    )