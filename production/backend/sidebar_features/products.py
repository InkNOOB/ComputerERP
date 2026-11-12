
from fastapi import APIRouter, HTTPException
from database import get_db_connection
from pydantic import BaseModel

router = APIRouter()


class ProductRegistration(BaseModel):
    IM_ID: int
    Manual: str | None = None


@router.get("/")
def get_products():
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    pm."PM_ID",
                    pm."IM_ID",
                    im."Item_Name",
                    pm."Manual"
                FROM public."PRODUCT_MASTER" AS pm
                INNER JOIN public."ITEM_MASTER" AS im
                    ON pm."IM_ID" = im."IM_ID"
                ORDER BY pm."PM_ID";
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "PM_ID": row[0],
                "IM_ID": row[1],
                "Product_Name": row[2],
                "Manual": row[3]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Product retrieval error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve products."
        )

    finally:
        database_connection.close()


@router.post("/")
def register_product(product: ProductRegistration):
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                INSERT INTO public."PRODUCT_MASTER"
                    ("IM_ID", "Manual")
                VALUES (%s, %s)
                RETURNING "PM_ID", "IM_ID", "Manual";
                """,
                (product.IM_ID, product.Manual)
            )

            row = sql_cursor.fetchone()

        database_connection.commit()

        return {
            "message": "Product successfully registered.",
            "PM_ID": row[0],
            "IM_ID": row[1],
            "Manual": row[2]
        }

    except Exception as error:
        database_connection.rollback()
        print(f"Product registration error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register product."
        )

    finally:
        database_connection.close()