from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg import errors
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/purchase-requests", tags=["Purchase Requests"])

class PurchaseRequestIn(BaseModel):
    restock_request_id: int

# One query that joins in the item, quantity and warehouse, plus how many bids it has
BASE_SELECT = """
    SELECT pr."PR_ID", pr."Status", pr."DateIssued", pr."RestockRequestID",
           im."Item_Name", im."SKU", rr."Quantity", w."Warehouse_Name",
           (SELECT COUNT(*) FROM public."RequestQuotation" rq
             WHERE rq."PR_ID" = pr."PR_ID") AS bid_count
    FROM public."PurchaseRequest" pr
    JOIN public."RestockRequest" rr ON rr."RR_ID" = pr."RestockRequestID"
    JOIN public."ITEM_MASTER" im    ON im."IM_ID" = rr."IM_ID"
    JOIN public."WAREHOUSE" w       ON w."WH_ID" = rr."WH_ID"
"""

@router.get("/")
def list_purchase_requests(status: Literal["Open", "Closed", "Cancelled"] | None = None):
    query = BASE_SELECT
    params: tuple = ()
    if status:
        query += ' WHERE pr."Status" = %s'
        params = (status,)
    query += ' ORDER BY pr."PR_ID" DESC'

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

@router.get("/{pr_id}")
def get_purchase_request(pr_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(BASE_SELECT + ' WHERE pr."PR_ID" = %s', (pr_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return row

@router.post("/", status_code=201)
def create_purchase_request(body: PurchaseRequestIn):
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    'SELECT "approved_by" FROM public."RestockRequest" WHERE "RR_ID" = %s',
                    (body.restock_request_id,),
                )
                rr = cur.fetchone()
                if not rr:
                    raise HTTPException(status_code=404, detail="Restock request not found")
                if rr["approved_by"] is None:
                    raise HTTPException(status_code=409, detail="Restock request is not approved yet")

                cur.execute(
                    '''INSERT INTO public."PurchaseRequest" ("Status", "DateIssued", "RestockRequestID")
                       VALUES ('Open', now(), %s) RETURNING "PR_ID"''',
                    (body.restock_request_id,),
                )
                pr_id = cur.fetchone()["PR_ID"]
    except errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="This restock request already has a purchase request")

    return get_purchase_request(pr_id)

@router.patch("/{pr_id}/cancel")
def cancel_purchase_request(pr_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            # Only an Open request can be cancelled
            cur.execute(
                '''UPDATE public."PurchaseRequest" SET "Status" = 'Cancelled'
                   WHERE "PR_ID" = %s AND "Status" = 'Open' RETURNING "PR_ID"''',
                (pr_id,),
            )
            if cur.fetchone() is None:
                cur.execute('SELECT "Status" FROM public."PurchaseRequest" WHERE "PR_ID" = %s', (pr_id,))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Purchase request not found")
                raise HTTPException(
                    status_code=409,
                    detail=f"Only open requests can be cancelled (this one is {row['Status']})",
                )
    return get_purchase_request(pr_id)