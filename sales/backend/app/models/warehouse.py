from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Warehouse(Base):
    __tablename__ = "WAREHOUSE"

    WH_ID: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    Warehouse_Name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    Location: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )