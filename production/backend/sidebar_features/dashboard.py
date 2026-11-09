from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary():
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_orders,
                    COALESCE(SUM("QuantityRequired"), 0) AS total_quantity_required,
                    COALESCE(SUM("QuantityProduced"), 0) AS total_quantity_produced
                FROM public."PRODUCTION";
                """ )

            row = sql_cursor.fetchone()

        return {
            "total_orders": row[0],
            "total_quantity_required": row[1],
            "total_quantity_produced": row[2] }

    except Exception as error:
        print(f"Dashboard summary error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard summary." )

    finally:
        database_connection.close()
