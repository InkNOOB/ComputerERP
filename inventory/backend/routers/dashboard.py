
from fastapi import APIRouter
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary():

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # 1. Inventory summary
            cur.execute("""
                SELECT
                    COUNT(*) AS total_items,
                    COUNT(*) FILTER (
                        WHERE "ItemType" = 'Raw'
                    ) AS raw_materials,
                    COUNT(*) FILTER (
                        WHERE "ItemType" = 'Finished'
                    ) AS finished_goods
                FROM public."ITEM_MASTER"
            """)

            item_summary = cur.fetchone()

            # 2. Total stock quantity
            cur.execute("""
                SELECT
                    COALESCE(SUM(quantity_on_hand), 0)
                    AS total_stock
                FROM public."STOCK"
            """)

            stock_summary = cur.fetchone()

            # 3. Warehouse count
            cur.execute("""
                SELECT COUNT(*) AS total_warehouses
                FROM public."WAREHOUSE"
            """)

            warehouse_summary = cur.fetchone()

            # 4. Low-stock count
            cur.execute("""
                SELECT COUNT(*) AS low_stock_count
                FROM public."STOCK"
                WHERE quantity_on_hand <= reorder_level
            """)

            low_stock_summary = cur.fetchone()

            # 5. Low-stock item details
            cur.execute("""
                SELECT
                    s."STOCK_ID",
                    s."IM_ID",
                    i."SKU",
                    i."Item_Name",
                    i."ItemType",
                    s."WH_ID",
                    w."Warehouse_Name",
                    s.quantity_on_hand,
                    s.reorder_level
                FROM public."STOCK" AS s
                INNER JOIN public."ITEM_MASTER" AS i
                    ON s."IM_ID" = i."IM_ID"
                INNER JOIN public."WAREHOUSE" AS w
                    ON s."WH_ID" = w."WH_ID"
                WHERE s.quantity_on_hand <= s.reorder_level
                ORDER BY s.quantity_on_hand ASC
                LIMIT 10
            """)

            low_stock_items = cur.fetchall()

            # 6. Recent stock activities
            cur.execute("""
                SELECT
                    sl."LogID",
                    sl."IM_ID",
                    i."SKU",
                    i."Item_Name",
                    sl."WH_ID",
                    w."Warehouse_Name",
                    sl."Target_WH_ID",
                    tw."Warehouse_Name" AS "Target_Warehouse_Name",
                    sl."TransactionType",
                    sl."Quantity",
                    sl."ActualQuantity",
                    sl."ReferenceNo",
                    sl."LoggedBy",
                    sl."ApprovedBy",
                    sl."LogDate",
                    sl."Remarks"
                FROM public."STOCK_LEDGER" AS sl
                LEFT JOIN public."ITEM_MASTER" AS i
                    ON sl."IM_ID" = i."IM_ID"
                LEFT JOIN public."WAREHOUSE" AS w
                    ON sl."WH_ID" = w."WH_ID"
                LEFT JOIN public."WAREHOUSE" AS tw
                    ON sl."Target_WH_ID" = tw."WH_ID"
                ORDER BY sl."LogDate" DESC
                LIMIT 10
            """)

            recent_activities = cur.fetchall()

                    
            # 7. Stock distribution by item type
            cur.execute("""
                SELECT
                    item_types.item_type,
                    COALESCE(SUM(s.quantity_on_hand), 0) AS total_quantity
                FROM (
                    VALUES ('Raw'), ('Finished')
                ) AS item_types(item_type)
                LEFT JOIN public."ITEM_MASTER" AS i
                    ON i."ItemType" = item_types.item_type
                LEFT JOIN public."STOCK" AS s
                    ON s."IM_ID" = i."IM_ID"
                GROUP BY item_types.item_type
                ORDER BY item_types.item_type
            """)

            stock_distribution = cur.fetchall()

            # 8. Stock movement during the last 7 days
            cur.execute("""
                SELECT
                    "LogDate"::date AS movement_date,
                    "TransactionType" AS transaction_type,
                    SUM(
                        COALESCE("ActualQuantity", "Quantity", 0)
                    ) AS total_quantity
                FROM public."STOCK_LEDGER"
                WHERE "LogDate" >= CURRENT_DATE - INTERVAL '6 days'
                GROUP BY
                    "LogDate"::date,
                    "TransactionType"
                ORDER BY
                    movement_date ASC,
                    transaction_type ASC
            """)

            stock_movement = cur.fetchall()


    return {
        "summary": {
            **item_summary,
            **stock_summary,
            **warehouse_summary,
            **low_stock_summary
        },
        "low_stock_items": low_stock_items,
        "recent_activities": recent_activities,
        "stock_distribution": stock_distribution,
        "stock_movement": stock_movement
    }