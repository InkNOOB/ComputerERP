from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

# MATERIAL REQUIREMENT
@router.get("/material-requirements/")
def get_material_requirements():

    database_connection = get_db_connection()

    try:
        with database_connection.cursor() as sql_cursor:
            sql_cursor.execute(
                """
                SELECT
                    p."Production_ID",
                    p."PM_ID",
                    p."QuantityRequired",
                    b."IM_ID",
                    iim."SKU",
                    iim."Item_Name",
                    iim."unit_of_measure",
                    b."MaterialRequired",
                    (
                        p."QuantityRequired" * b."MaterialRequired"
                    ) AS "TotalMaterialRequired"
                FROM public."PRODUCTION" AS p
                INNER JOIN public."BILL_OF_MATERIALS" AS b
                    ON p."PM_ID" = b."PM_ID"
                INNER JOIN public."ITEM_MASTER" AS iim
                    ON b."IM_ID" = iim."IM_ID"
                ORDER BY
                    p."Production_ID",
                    iim."Item_Name";
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "Production_ID": row[0],
                "PM_ID": row[1],
                "QuantityRequired": row[2],
                "IM_ID": row[3],
                "SKU": row[4],
                "Item_Name": row[5],
                "unit_of_measure": row[6],
                "MaterialRequired": row[7],
                "TotalMaterialRequired": row[8]
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
                    rr."RR_ID",
                    rr."IM_ID",
                    iim."SKU",
                    iim."Item_Name",
                    rr."WH_ID",
                    rr."Quantity",
                    rr."issued",
                    rr."status",
                    rr."approved_by",
                    rr."approved_date"
                FROM public."RestockRequest" AS rr
                INNER JOIN public."ITEM_MASTER" AS iim
                    ON rr."IM_ID" = iim."IM_ID"
                WHERE LOWER(iim."ItemType") = 'finished'
                    AND rr."approved_by" IS NOT NULL
                    AND rr."approved_date" IS NOT NULL
                ORDER BY rr."RR_ID" DESC;
                """
            )

            rows = sql_cursor.fetchall()

        return [
            {
                "RR_ID": row[0],
                "IM_ID": row[1],
                "SKU": row[2],
                "Item_Name": row[3],
                "WH_ID": row[4],
                "Quantity": row[5],
                "issued": row[6],
                "status": row[7],
                "approved_by": row[8],
                "approved_date": row[9]
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
