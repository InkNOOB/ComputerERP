from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db_connection
from psycopg.rows import dict_row

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

class GoodsReceivedInspection(BaseModel):
    quantity_received: int = Field(..., ge=0)
    item_condition: str
    remarks: Optional[str] = None

class GoodsReceivedStockIn(BaseModel):
    logged_by: str
    reorder_level: Optional[int] = Field(default=None, ge=0)

    
@router.get("/incoming-requests")
def get_incoming_requests():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                rr."RR_ID",
                rr."IM_ID",
                im."Item_Name",
                im."SKU",
                im."ItemType",
                rr."Quantity",
                rr."WH_ID",
                w."Warehouse_Name",
                rr."issued",
                rr."approved_by",
                rr."approved_date",
                rr."status"
            FROM "RestockRequest" rr
            JOIN "ITEM_MASTER" im
                ON rr."IM_ID" = im."IM_ID"
            JOIN "WAREHOUSE" w
                ON rr."WH_ID" = w."WH_ID"
            WHERE rr."status" = 'Approved'
            ORDER BY rr."issued" DESC
        """)

        rows = cur.fetchall()

        columns = [desc[0] for desc in cur.description]

        results = [
            dict(zip(columns, row))
            for row in rows
        ]

        cur.close()
        conn.close()

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/purchase-requests")
def get_purchase_requests():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                pr."PR_ID",
                pr."Status",
                pr."DateIssued",
                pr."RestockRequestID",
                rr."IM_ID",
                im."Item_Name",
                im."SKU",
                im."ItemType",
                rr."Quantity",
                rr."WH_ID",
                w."Warehouse_Name"
            FROM "PurchaseRequest" pr
            LEFT JOIN "RestockRequest" rr
                ON pr."RestockRequestID" = rr."RR_ID"
            LEFT JOIN "ITEM_MASTER" im
                ON rr."IM_ID" = im."IM_ID"
            LEFT JOIN "WAREHOUSE" w
                ON rr."WH_ID" = w."WH_ID"
            ORDER BY pr."DateIssued" DESC
        """)

        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]

        results = [
            dict(zip(columns, row))
            for row in rows
        ]

        cur.close()
        conn.close()

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/purchase-orders")
def get_purchase_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                po."PO_ID",
                po."RFQ_ID",
                rq."PR_ID",
                rq."SupplierID",
                s."SupplierName",
                rq."QuotedAmount",
                rq."DeliveryTerms",
                po."Total_Amount",
                po."OrderDate"
            FROM "PurchaseOrder" po
            JOIN "RequestQuotation" rq
                ON po."RFQ_ID" = rq."RFQ_ID"
            JOIN "Supplier" s
                ON rq."SupplierID" = s."SupplierID"
            ORDER BY po."OrderDate" DESC
        """)

        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]

        results = [
            dict(zip(columns, row))
            for row in rows
        ]

        cur.close()
        conn.close()

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@router.get("/goods-received")
def get_goods_received():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                gr."GR_ID",
                gr."PO_ID",
                po."RFQ_ID",
                rq."PR_ID",
                s."SupplierName",
                gr."ReceivedBy",
                gr."ReceivedDate",
                gr."ItemCondition",
                gr."QuantityReceived",
                gr."Remarks"
            FROM "GoodsReceived" gr
            JOIN "PurchaseOrder" po
                ON gr."PO_ID" = po."PO_ID"
            JOIN "RequestQuotation" rq
                ON po."RFQ_ID" = rq."RFQ_ID"
            JOIN "Supplier" s
                ON rq."SupplierID" = s."SupplierID"
            ORDER BY gr."ReceivedDate" DESC
        """)

        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]

        results = [
            dict(zip(columns, row))
            for row in rows
        ]

        cur.close()
        conn.close()

        return results

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.put("/goods-received/{gr_id}/confirm-count")
def confirm_goods_received(
    gr_id: int,
    inspection: GoodsReceivedInspection
):
    conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE "GoodsReceived"
                SET
                    "QuantityReceived" = %s,
                    "ItemCondition" = %s,
                    "Remarks" = %s
                WHERE "GR_ID" = %s
                RETURNING
                    "GR_ID",
                    "PO_ID",
                    "QuantityReceived",
                    "ItemCondition",
                    "Remarks"
            """, (
                inspection.quantity_received,
                inspection.item_condition,
                inspection.remarks,
                gr_id
            ))

            result = cur.fetchone()

            if result is None:
                raise HTTPException(
                    status_code=404,
                    detail="Goods Received record not found."
                )

            conn.commit()

            return {
                "message": "Inspection count confirmed successfully.",
                "GR_ID": result[0],
                "PO_ID": result[1],
                "QuantityReceived": result[2],
                "ItemCondition": result[3],
                "Remarks": result[4]
            }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        conn.close()