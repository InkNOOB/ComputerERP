from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/orders", tags=["Orders"])

# One query joins the whole chain: order -> winning bid -> supplier -> request -> item and warehouse.
# The two LEFT JOINs add delivery and invoice info if those rows exist yet.
ORDER_SELECT = """
    SELECT po."PO_ID", po."OrderDate", po."Total_Amount",
           rq."RFQ_ID", rq."QuotedAmount" AS unit_price, rq."DeliveryTerms",
           s."SupplierID", s."SupplierName",
           pr."PR_ID", rr."Quantity",
           im."Item_Name", im."SKU", w."Warehouse_Name",
           (gr."GR_ID" IS NOT NULL) AS goods_received,
           gr."ReceivedDate", gr."ItemCondition", gr."QuantityReceived", gr."Remarks",
           (inv."PI_ID" IS NOT NULL) AS invoiced,
           inv."InvoiceDate", inv."TaxAmount", inv."TotalDue"
    FROM public."PurchaseOrder" po
    JOIN public."RequestQuotation" rq ON rq."RFQ_ID" = po."RFQ_ID"
    JOIN public."Supplier" s          ON s."SupplierID" = rq."SupplierID"
    JOIN public."PurchaseRequest" pr  ON pr."PR_ID" = rq."PR_ID"
    JOIN public."RestockRequest" rr   ON rr."RR_ID" = pr."RestockRequestID"
    JOIN public."ITEM_MASTER" im      ON im."IM_ID" = rr."IM_ID"
    JOIN public."WAREHOUSE" w         ON w."WH_ID" = rr."WH_ID"
    LEFT JOIN public."GoodsReceived" gr    ON gr."PO_ID" = po."PO_ID"
    LEFT JOIN public."PurchaseInvoice" inv ON inv."PO_ID" = po."PO_ID"
"""

@router.get("/")
def list_orders():
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(ORDER_SELECT + ' ORDER BY po."PO_ID" DESC')
            return cur.fetchall()

@router.get("/{po_id}")
def get_order(po_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(ORDER_SELECT + ' WHERE po."PO_ID" = %s', (po_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    return row