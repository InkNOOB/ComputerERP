from decimal import Decimal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from psycopg import errors
from psycopg.rows import dict_row
from database import get_db_connection

# The bids belong to a purchase request, so the URL is nested under it
router = APIRouter(prefix="/purchase-requests/{pr_id}/quotations", tags=["Quotations"])

class QuotationIn(BaseModel):
    supplier_id: int
    quoted_amount: Decimal = Field(gt=0)   # unit price per piece
    delivery_terms: str | None = None

# total_amount = unit price x requested quantity. is_winner is true when a PurchaseOrder uses this bid.
QUOTATION_SELECT = """
    SELECT rq."RFQ_ID", rq."PR_ID", rq."SupplierID", s."SupplierName",
           rq."QuotedAmount", rq."DeliveryTerms",
           rq."QuotedAmount" * rr."Quantity" AS total_amount,
           po."PO_ID",
           (po."PO_ID" IS NOT NULL) AS is_winner
    FROM public."RequestQuotation" rq
    JOIN public."Supplier" s         ON s."SupplierID" = rq."SupplierID"
    JOIN public."PurchaseRequest" pr ON pr."PR_ID" = rq."PR_ID"
    JOIN public."RestockRequest" rr  ON rr."RR_ID" = pr."RestockRequestID"
    LEFT JOIN public."PurchaseOrder" po ON po."RFQ_ID" = rq."RFQ_ID"
"""

def get_request_status(cur, pr_id: int, lock: bool = False) -> str:
    """Return the request's status, or raise 404. lock=True blocks other changes until we commit."""
    sql = 'SELECT "Status" FROM public."PurchaseRequest" WHERE "PR_ID" = %s'
    if lock:
        sql += " FOR UPDATE"
    cur.execute(sql, (pr_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return row["Status"]

@router.get("/")
def list_quotations(pr_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            get_request_status(cur, pr_id)
            cur.execute(
                QUOTATION_SELECT + ' WHERE rq."PR_ID" = %s ORDER BY rq."QuotedAmount" ASC',
                (pr_id,),
            )
            return cur.fetchall()   # cheapest first

@router.post("/", status_code=201)
def add_quotation(pr_id: int, body: QuotationIn):
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                status = get_request_status(cur, pr_id, lock=True)
                if status != "Open":
                    raise HTTPException(
                        status_code=409,
                        detail=f"This request is {status}, so it no longer accepts bids",
                    )

                cur.execute(
                    'SELECT 1 FROM public."RequestQuotation" WHERE "PR_ID" = %s AND "SupplierID" = %s',
                    (pr_id, body.supplier_id),
                )
                if cur.fetchone():
                    raise HTTPException(status_code=409, detail="This supplier already has a bid on this request")

                cur.execute(
                    '''INSERT INTO public."RequestQuotation" ("PR_ID", "SupplierID", "QuotedAmount", "DeliveryTerms")
                       VALUES (%s, %s, %s, %s) RETURNING "RFQ_ID"''',
                    (pr_id, body.supplier_id, body.quoted_amount, body.delivery_terms),
                )
                rfq_id = cur.fetchone()["RFQ_ID"]
    except errors.ForeignKeyViolation:
        raise HTTPException(status_code=404, detail="Supplier not found")

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(QUOTATION_SELECT + ' WHERE rq."RFQ_ID" = %s', (rfq_id,))
            return cur.fetchone()

@router.post("/{rfq_id}/select", status_code=201)
def select_winner(pr_id: int, rfq_id: int):
    # Everything below is ONE transaction: the order is created and the request closed together, or neither
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            status = get_request_status(cur, pr_id, lock=True)
            if status != "Open":
                raise HTTPException(
                    status_code=409,
                    detail=f"This request is {status}, so a winner can't be selected",
                )

            cur.execute(
                '''SELECT rq."QuotedAmount", rr."Quantity"
                   FROM public."RequestQuotation" rq
                   JOIN public."PurchaseRequest" pr ON pr."PR_ID" = rq."PR_ID"
                   JOIN public."RestockRequest" rr  ON rr."RR_ID" = pr."RestockRequestID"
                   WHERE rq."RFQ_ID" = %s AND rq."PR_ID" = %s''',
                (rfq_id, pr_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Quotation not found for this request")
            if row["QuotedAmount"] is None:
                raise HTTPException(status_code=409, detail="This quotation has no price")

            total = row["QuotedAmount"] * row["Quantity"]   # unit price x requested quantity

            cur.execute(
                '''INSERT INTO public."PurchaseOrder" ("RFQ_ID", "Total_Amount")
                   VALUES (%s, %s) RETURNING "PO_ID"''',
                (rfq_id, total),
            )
            po_id = cur.fetchone()["PO_ID"]

            cur.execute(
                '''UPDATE public."PurchaseRequest" SET "Status" = 'Closed' WHERE "PR_ID" = %s''',
                (pr_id,),
            )

    return {"PO_ID": po_id, "RFQ_ID": rfq_id, "PR_ID": pr_id, "Total_Amount": total, "Status": "Closed"}