from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_db_connection

router = APIRouter()


class ProductionOrderInput(BaseModel):
    PM_ID: int
    WH_ID: int
    QuantityRequired: int = Field(gt=0)
    StartDate: datetime
    Deadline: datetime

class ProductionProgressInput(BaseModel):
    QuantityProduced: int = Field(ge=0)


# GET: Retrieve production orders
@router.get("/")
def get_orders():
    conn = get_db_connection()
    cur = conn.cursor()
    #return []

    try:
        cur.execute("""
            SELECT
                "Production_ID",
                "PM_ID",
                "WH_ID",
                "QuantityRequired",
                "QuantityProduced",
                "StartDate",
                "Deadline",
                status
            FROM public."PRODUCTION"
            ORDER BY "Production_ID" DESC
        """)

        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()

        return [dict(zip(columns, row)) for row in rows]

    finally:
        cur.close()
        conn.close()


# POST: Create a production order
@router.post("/")
def create_order(order: ProductionOrderInput):
    database_connection = get_db_connection()

    try:
        if order.Deadline <= order.StartDate:
            raise HTTPException(
                status_code=400,
                detail="Deadline must be later than StartDate."
            )

        with database_connection.cursor() as sql_cursor:

            # Check if the finished product exists
            sql_cursor.execute(
                """
                SELECT 1
                FROM public."PRODUCT_MASTER"
                WHERE "PM_ID" = %s;
                """,
                (order.PM_ID,)
            )

            if sql_cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Product not found."
                )

            # Check if the warehouse exists
            sql_cursor.execute(
                """
                SELECT 1
                FROM public."WAREHOUSE"
                WHERE "WH_ID" = %s;
                """,
                (order.WH_ID,)
            )

            if sql_cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Warehouse not found."
                )

            # Insert production order
            sql_cursor.execute(
                """
                INSERT INTO public."PRODUCTION"
                    (
                        "PM_ID",
                        "WH_ID",
                        "QuantityRequired",
                        "QuantityProduced",
                        "StartDate",
                        "Deadline",
                        "status"
                    )
                VALUES (%s, %s, %s, 0, %s, %s, 'Pending')
                RETURNING "Production_ID";
                """,
                (
                    order.PM_ID,
                    order.WH_ID,
                    order.QuantityRequired,
                    order.StartDate,
                    order.Deadline
                )
            )

            production_id = sql_cursor.fetchone()[0]

        database_connection.commit()

        return {
            "message": "Production order created successfully.",
            "Production_ID": production_id,
            "PM_ID": order.PM_ID,
            "WH_ID": order.WH_ID,
            "QuantityRequired": order.QuantityRequired,
            "QuantityProduced": 0,
            "status": "Pending"
        }

    except HTTPException:
        database_connection.rollback()
        raise

    except Exception as error:
        database_connection.rollback()
        print(f"Order creation error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create production order."
        )

    finally:
        database_connection.close()

# PATCH: Update production progress
@router.patch("/{production_id}/progress")
def update_production_progress(
    production_id: int,
    progress: ProductionProgressInput
):
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:

            # Retrieve and lock the production order
            sql_cursor.execute(
                """
                SELECT
                    "QuantityRequired",
                    status
                FROM public."PRODUCTION"
                WHERE "Production_ID" = %s
                FOR UPDATE;
                """,
                (production_id,)
            )

            order = sql_cursor.fetchone()

            if order is None:
                raise HTTPException(
                    status_code=404,
                    detail="Production order not found."
                )

            quantity_required = order[0]
            current_status = order[1]
            quantity_produced = progress.QuantityProduced

            # Prevent updates to completed production orders
            if current_status == "Completed":
                raise HTTPException(
                    status_code=400,
                    detail="Completed production orders cannot be updated."
                    
    )

            # Prevent production beyond the required quantity
            if quantity_produced > quantity_required:
                raise HTTPException(
                    status_code=400,
                    detail="Quantity produced cannot exceed quantity required."
                )

            # Automatically determine production status
            if quantity_produced == 0:
                status = "Pending"
            elif quantity_produced < quantity_required:
                status = "Ongoing"
            else:
                status = "Completed"

            # Update production quantity and status together
            sql_cursor.execute(
                """
                UPDATE public."PRODUCTION"
                SET
                    "QuantityProduced" = %s,
                    "status" = %s
                WHERE "Production_ID" = %s;
                """,
                (quantity_produced, status, production_id)
            )

        database_connection.commit()

        remaining = quantity_required - quantity_produced
        progress_percentage = round(
            (quantity_produced / quantity_required) * 100, 2
        )

        return {
            "message": "Production progress updated successfully.",
            "Production_ID": production_id,
            "QuantityRequired": quantity_required,
            "QuantityProduced": quantity_produced,
            "Remaining": remaining,
            "Progress": progress_percentage,
            "status": status
        }

    except HTTPException:
        database_connection.rollback()
        raise

    except Exception as error:
        database_connection.rollback()
        print(f"Production progress update error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update production progress."
        )

    finally:
        database_connection.close()