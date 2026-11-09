from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/")
def get_orders():
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    po."productionID",
                    po."PM_ID",
                    po."quantity",
                    po."productCost",
                    iim."SKU",
                    iim."Item_Name"
                FROM public."PRODUCTION_ORDER" AS po
                INNER JOIN public."PRODUCTION" AS p
                    ON po."productionID" = p."Production_ID"
                INNER JOIN public."PRODUCT_MASTER" AS pm
                    ON po."PM_ID" = pm."PM_ID"
                INNER JOIN public."ITEM_MASTER" AS iim
                    ON pm."IM_ID" = iim."IM_ID"
                WHERE LOWER(p."status") = 'completed'
                ORDER BY po."productionID" DESC;
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "productionID": row[0],
                "PM_ID": row[1],
                "quantity": row[2],
                "productCost": row[3],
                "SKU": row[4],
                "Item_Name": row[5]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Orders retrieval error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve production orders."
        )

    finally:
        database_connection.close()
