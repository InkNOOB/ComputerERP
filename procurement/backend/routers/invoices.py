from fastapi import APIRouter, HTTPException
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Invoice -> order -> winning bid -> supplier / item, plus Finance's payment info if it exists yet
INVOICE_SELECT = """
    SELECT inv."PI_ID", inv."PO_ID", inv."InvoiceDate", inv."TaxAmount", inv."TotalDue",
           po."Total_Amount" AS order_total,
           s."SupplierName", im."Item_Name",
           ap."apInvoiceID", ap."status" AS payment_status,
           ap."totalPaid", ap."remainingBalance", ap."dueDate"
    FROM public."PurchaseInvoice" inv
    JOIN public."PurchaseOrder" po     ON po."PO_ID" = inv."PO_ID"
    JOIN public."RequestQuotation" rq  ON rq."RFQ_ID" = po."RFQ_ID"
    JOIN public."Supplier" s           ON s."SupplierID" = rq."SupplierID"
    JOIN public."PurchaseRequest" pr   ON pr."PR_ID" = rq."PR_ID"
    JOIN public."RestockRequest" rr    ON rr."RR_ID" = pr."RestockRequestID"
    JOIN public."ITEM_MASTER" im       ON im."IM_ID" = rr."IM_ID"
    LEFT JOIN public."APInvoice" ap    ON ap."piID" = inv."PI_ID"
"""

@router.get("/")
def list_invoices():
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(INVOICE_SELECT + ' ORDER BY inv."PI_ID" DESC')
            return cur.fetchall()

@router.get("/{pi_id}")
def get_invoice(pi_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(INVOICE_SELECT + ' WHERE inv."PI_ID" = %s', (pi_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return row