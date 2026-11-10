
from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(
    prefix="/stock_ledger",
    tags=["Stock Ledger"]
)

from datetime import date, timedelta

@router.get("/")
def get_stock_ledger(
    transaction_type: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    search: str | None = None
):
    conditions = []
    params = []

    if transaction_type:
        conditions.append('s."TransactionType" = %s')
        params.append(transaction_type.upper())

    if start_date:
        conditions.append('s."LogDate" >= %s')
        params.append(start_date)

    if end_date:
        conditions.append('s."LogDate" < %s')
        params.append(end_date + timedelta(days=1))

    if search:
        conditions.append("""
            (
                i."Item_Name" ILIKE %s
                OR i."SKU" ILIKE %s
                OR w."Warehouse_Name" ILIKE %s
                OR tw."Warehouse_Name" ILIKE %s
                OR s."ReferenceNo" ILIKE %s
                OR s."Remarks" ILIKE %s
                OR lu."Username" ILIKE %s
                OR au."Username" ILIKE %s
            )
        """)
        search_value = f"%{search.strip()}%"
        params.extend([search_value] * 8)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            s."LogID" AS log_id,
            s."IM_ID" AS im_id,
            i."SKU" AS sku,
            i."Item_Name" AS item_name,
            s."WH_ID" AS wh_id,
            w."Warehouse_Name" AS warehouse_name,
            s."Target_WH_ID" AS target_wh_id,
            tw."Warehouse_Name" AS target_warehouse_name,
            s."TransactionType" AS transaction_type,
            s."Quantity" AS quantity,
            s."ActualQuantity" AS actual_quantity,
            s."ReferenceNo" AS reference_no,
            lu."Username" AS logged_by,
            au."Username" AS approved_by,
            s."LogDate" AS log_date,
            s."Remarks" AS remarks
        FROM public."STOCK_LEDGER" AS s
        INNER JOIN public."ITEM_MASTER" AS i
            ON s."IM_ID" = i."IM_ID"
        INNER JOIN public."WAREHOUSE" AS w
            ON s."WH_ID" = w."WH_ID"
        LEFT JOIN public."WAREHOUSE" AS tw
            ON s."Target_WH_ID" = tw."WH_ID"
        LEFT JOIN public."User" AS lu
            ON s."LoggedBy" = lu."UserID"
        LEFT JOIN public."User" AS au
            ON s."ApprovedBy" = au."UserID"
        {where_clause}
        ORDER BY s."LogDate" DESC
    """

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

@router.get("/summary")
def get_stock_ledger_summary(
    start_date: date | None = None,
    end_date: date | None = None
):
    conditions = []
    params = []

    if start_date:
        conditions.append('"LogDate" >= %s')
        params.append(start_date)

    if end_date:
        conditions.append('"LogDate" < %s')
        params.append(end_date + timedelta(days=1))

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            COUNT(*) AS total_transactions,

            COALESCE(SUM(
                CASE WHEN "TransactionType" = 'STOCK_IN'
                THEN ABS(COALESCE("ActualQuantity", "Quantity"))
                ELSE 0 END
            ), 0) AS total_stock_in,

            COALESCE(SUM(
                CASE WHEN "TransactionType" = 'STOCK_OUT'
                THEN ABS(COALESCE("ActualQuantity", "Quantity"))
                ELSE 0 END
            ), 0) AS total_stock_out,

            COALESCE(SUM(
                CASE WHEN "TransactionType" = 'STOCK_ADJUSTMENT'
                THEN ABS(COALESCE("ActualQuantity", "Quantity"))
                ELSE 0 END
            ), 0) AS total_adjustments,

            COUNT(*) FILTER (
                WHERE "TransactionType" IN ('TRANSFER_IN', 'TRANSFER_OUT')
            ) AS total_transfers

        FROM public."STOCK_LEDGER"
        {where_clause}
    """

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchone()

