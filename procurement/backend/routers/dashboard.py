from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# The four numbers on the cards at the top of the page
@router.get("/summary")
def summary():
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""
                SELECT
                    (SELECT COUNT(*) FROM public."PurchaseRequest" pr
                        JOIN public."RestockRequest" rr ON rr."RR_ID" = pr."RestockRequestID"
                        JOIN public."ITEM_MASTER" im ON im."IM_ID" = rr."IM_ID" AND im."ItemType" = 'Raw') AS purchase_requests,
                    (SELECT COUNT(*) FROM public."PurchaseRequest" pr
                        JOIN public."RestockRequest" rr ON rr."RR_ID" = pr."RestockRequestID"
                        JOIN public."ITEM_MASTER" im ON im."IM_ID" = rr."IM_ID" AND im."ItemType" = 'Raw'
                        WHERE pr."Status" = 'Open') AS open_requests,
                  (SELECT COUNT(*) FROM public."PurchaseOrder")                         AS purchase_orders,
                  (SELECT COUNT(*) FROM public."GoodsReceived")                         AS goods_received,
                  (SELECT COUNT(*) FROM public."PurchaseInvoice")                       AS purchase_invoices
            """)
            return cur.fetchone()


# Total order value for the chart.
# week = last 7 days (one bar per day), month = last 30 days (one bar per day),
# year = last 12 months (one bar per month). Empty days/months still get a bar (value 0).
DAILY_SQL = """
    WITH days AS (
        SELECT d::date AS d
        FROM generate_series((current_date - %s::int + 1)::timestamp,
                             current_date::timestamp, interval '1 day') AS d
    )
    SELECT to_char(days.d, %s) AS label,
           to_char(days.d, 'Dy, Mon DD') AS full,
           COALESCE(SUM(po."Total_Amount"), 0) AS total,
           COUNT(po."PO_ID") AS orders
    FROM days
    LEFT JOIN public."PurchaseOrder" po ON po."OrderDate"::date = days.d
    GROUP BY days.d
    ORDER BY days.d
"""

MONTHLY_SQL = """
    WITH months AS (
        SELECT m
        FROM generate_series((date_trunc('month', current_date) - interval '11 months')::timestamp,
                             date_trunc('month', current_date)::timestamp, interval '1 month') AS m
    )
    SELECT to_char(months.m, 'Mon') AS label,
           to_char(months.m, 'Mon YYYY') AS full,
           COALESCE(SUM(po."Total_Amount"), 0) AS total,
           COUNT(po."PO_ID") AS orders
    FROM months
    LEFT JOIN public."PurchaseOrder" po ON date_trunc('month', po."OrderDate") = months.m
    GROUP BY months.m
    ORDER BY months.m
"""


@router.get("/order-value")
def order_value(period: str = "month"):
    if period not in ("week", "month", "year"):
        raise HTTPException(status_code=400, detail="period must be week, month or year")

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            if period == "year":
                cur.execute(MONTHLY_SQL)
            elif period == "week":
                cur.execute(DAILY_SQL, (7, "Dy DD"))
            else:
                cur.execute(DAILY_SQL, (30, "Mon DD"))
            series = cur.fetchall()

    return {
        "period": period,
        "total": sum(p["total"] for p in series),
        "orders": sum(p["orders"] for p in series),
        "series": series,
    }