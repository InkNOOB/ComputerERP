from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

# MATERIAL REQUIREMENT

@router.get("/material-requirements/")
def get_material_requirements(pm_id: int):

    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    b."PM_ID",
                    b."IM_ID",
                    iim."SKU",
                    iim."Item_Name",
                    iim."unit_of_measure",
                    b."MaterialRequired"
                FROM public."BILL_OF_MATERIALS" AS b
                INNER JOIN public."ITEM_MASTER" AS iim
                    ON b."IM_ID" = iim."IM_ID"
                WHERE b."PM_ID" = %s
                ORDER BY iim."Item_Name";
                """,
                (pm_id,)
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "PM_ID": row[0],
                "IM_ID": row[1],
                "SKU": row[2],
                "Item_Name": row[3],
                "unit_of_measure": row[4],
                "MaterialRequired": row[5]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Material requirement error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve material requirements."
        )

    finally:
        database_connection.close()



@router.get("/production-requests/")
def get_production_requests():
    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    po."productionID",
                    po."PM_ID",
                    im."SKU",
                    im."Item_Name",
                    po."WH_ID",
                    po."quantity",
                    po."productCost",
                    po."status",
                    po."created_at",
                    po."reviewed_by",
                    po."reviewed_at"
                FROM public."ProductionOrder" AS po
                INNER JOIN public."PRODUCT_MASTER" AS pm
                    ON po."PM_ID" = pm."PM_ID"
                INNER JOIN public."ITEM_MASTER" AS im
                    ON pm."IM_ID" = im."IM_ID"
                ORDER BY po."productionID" DESC;
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "productionID": row[0],
                "PM_ID": row[1],
                "SKU": row[2],
                "Item_Name": row[3],
                "WH_ID": row[4],
                "quantity": row[5],
                "productCost": row[6],
                "status": row[7],
                "created_at": row[8],
                "reviewed_by": row[9],
                "reviewed_at": row[10]
            }
            for row in rows
        ]

    except Exception as error:
        print(f"Production request retrieval error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve production requests."
        )

    finally:
        database_connection.close()


@router.patch("/production-requests/{production_id}/accept")
def accept_production_request(production_id: int):

    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:

            sql_cursor.execute(
                """
                SELECT
                    "status",
                    "reviewed_by",
                    "reviewed_at"
                FROM public."ProductionOrder"
                WHERE "productionID" = %s
                FOR UPDATE;
                """,
                (production_id,)
            )

            request = sql_cursor.fetchone()

            if request is None:
                raise HTTPException(
                    status_code=404,
                    detail="Production request not found."
                )

            current_status = request[0]
            reviewed_by = request[1]
            reviewed_at = request[2]

            if reviewed_by is None or reviewed_at is None:
                raise HTTPException(
                    status_code=400,
                    detail="This request has not been reviewed by Inventory."
                )

            if current_status != "Pending":
                raise HTTPException(
                    status_code=400,
                    detail="Only pending requests can be accepted."
                )

            sql_cursor.execute(
                """
                UPDATE public."ProductionOrder"
                SET "status" = 'Accepted'
                WHERE "productionID" = %s;
                """,
                (production_id,)
            )

        database_connection.commit()

        return {
            "message": "Production request accepted successfully.",
            "productionID": production_id,
            "status": "Accepted"
        }

    except HTTPException:
        database_connection.rollback()
        raise

    except Exception as error:
        database_connection.rollback()
        print(f"Production request acceptance error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to accept production request."
        )

    finally:
        database_connection.close()
