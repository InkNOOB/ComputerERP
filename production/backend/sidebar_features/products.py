
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
                    iim."SKU",
                    iim."Item_Name",
                    iim."Description",
                    iim."Category",
                    iim."Brand",
                    iim."ItemType",
                    iim."unit_of_measure",
                    iim."Price",
                    iim."status",
                    pm."Manual"
                FROM public."PRODUCT_MASTER" AS pm
                INNER JOIN public."ITEM_MASTER" AS iim
                    ON pm."IM_ID" = iim."IM_ID"
                ORDER BY pm."PM_ID";
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "PM_ID": row[0],
                "IM_ID": row[1],
                "SKU": row[2],
                "Item_Name": row[3],
                "Description": row[4],
                "Category": row[5],
                "Brand": row[6],
                "ItemType": row[7],
                "unit_of_measure": row[8],
                "Price": row[9],
                "status": row[10],
                "Manual": row[11]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Product retrieval error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve products.")

    finally:
        database_connection.close()


@router.get("/available-items/")
def get_available_items():
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    iim."IM_ID",
                    iim."SKU",
                    iim."Item_Name",
                    iim."Category",
                    iim."Brand",
                    iim."ItemType",
                    iim."unit_of_measure",
                    iim."Price",
                    iim."status"
                FROM public."ITEM_MASTER" AS iim
                WHERE LOWER(iim."ItemType") = 'finished'
                AND NOT EXISTS (
                    SELECT 1
                    FROM public."PRODUCT_MASTER" AS pm
                    WHERE pm."IM_ID" = iim."IM_ID"
                )
                ORDER BY iim."Item_Name";
                """)

            rows = sql_cursor.fetchall()

        return [
            {
                "IM_ID": row[0],
                "SKU": row[1],
                "Item_Name": row[2],
                "Category": row[3],
                "Brand": row[4],
                "ItemType": row[5],
                "unit_of_measure": row[6],
                "Price": row[7],
                "status": row[8]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Available items retrieval error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve available items."
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
                SELECT
                    iim."IM_ID",
                    %s
                FROM public."ITEM_MASTER" AS iim
                WHERE iim."IM_ID" = %s
                AND LOWER(iim."ItemType") = 'finished'
                RETURNING "PM_ID", "IM_ID", "Manual";
                """,
                (product.Manual, product.IM_ID))

            row = sql_cursor.fetchone()

            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail="Finished item not found.")

        database_connection.commit()

        return {
            "message": "Product successfully registered.",
            "PM_ID": row[0],
            "IM_ID": row[1],
            "Manual": row[2]}

    except HTTPException:
        database_connection.rollback()
        raise

    except Exception as error:
        database_connection.rollback()
        print(f"Product registration error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register product.")

    finally:
        database_connection.close()