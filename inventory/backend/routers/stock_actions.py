
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Literal
from psycopg.rows import dict_row
from database import get_db_connection
from auth import require_inventory, require_admin


router = APIRouter(
    prefix="/stock_actions",
    tags=["Stock Actions"]
)


# ==========================================
# REQUEST MODELS
# ==========================================

class StockInRequest(BaseModel):
    im_id: int = Field(gt=0)
    wh_id: int = Field(gt=0)
    actual_quantity: int = Field(gt=0)
    reorder_level: int | None = Field(default=None, ge=0)
    reference_no: str | None = None
    remarks: str | None = None


class StockOutRequest(BaseModel):
    im_id: int = Field(gt=0)
    wh_id: int = Field(gt=0)
    actual_quantity: int = Field(gt=0)
    release_purpose: Literal["Sales", "Production", "Other"]
    reference_no: str | None = None
    remarks: str | None = None


class StockAdjustmentRequest(BaseModel):
    im_id: int = Field(gt=0)
    wh_id: int = Field(gt=0)
    physical_count: int = Field(ge=0)
    reason: str = Field(min_length=1)
    reference_no: str | None = None
    remarks: str | None = None


class StockTransferRequest(BaseModel):
    im_id: int = Field(gt=0)
    source_wh_id: int = Field(gt=0)
    destination_wh_id: int = Field(gt=0)
    transfer_quantity: int = Field(gt=0)
    reference_no: str | None = None
    remarks: str | None = None


# ==========================================
# STOCK IN
# ADMIN AND STAFF
# ==========================================

@router.post("/stock-in", status_code=201)
def stock_in(
    data: StockInRequest,
    user: dict = Depends(require_inventory)
):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # 1. Check if the item exists
            cur.execute(
                '''
                SELECT "IM_ID"
                FROM public."ITEM_MASTER"
                WHERE "IM_ID" = %s
                ''',
                (data.im_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Item not found"
                )

            # 2. Check if the warehouse exists
            cur.execute(
                '''
                SELECT "WH_ID"
                FROM public."WAREHOUSE"
                WHERE "WH_ID" = %s
                ''',
                (data.wh_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Warehouse not found"
                )

            # 3. Check if stock already exists
            cur.execute(
                '''
                SELECT "STOCK_ID", quantity_on_hand, reorder_level
                FROM public."STOCK"
                WHERE "IM_ID" = %s AND "WH_ID" = %s
                FOR UPDATE
                ''',
                (data.im_id, data.wh_id)
            )

            existing_stock = cur.fetchone()

            # 4. Update existing stock
            if existing_stock:

                # Only Admin can update an existing reorder level
                if (
                    data.reorder_level is not None
                    and user.get("role") != "Admin"
                ):
                    raise HTTPException(
                        status_code=403,
                        detail="Only Admin can update the reorder level."
                    )

                if data.reorder_level is not None:
                    cur.execute(
                        '''
                        UPDATE public."STOCK"
                        SET quantity_on_hand = quantity_on_hand + %s,
                            reorder_level = %s
                        WHERE "STOCK_ID" = %s
                        RETURNING "STOCK_ID", "IM_ID", "WH_ID",
                                  quantity_on_hand, reorder_level
                        ''',
                        (
                            data.actual_quantity,
                            data.reorder_level,
                            existing_stock["STOCK_ID"]
                        )
                    )
                else:
                    cur.execute(
                        '''
                        UPDATE public."STOCK"
                        SET quantity_on_hand = quantity_on_hand + %s
                        WHERE "STOCK_ID" = %s
                        RETURNING "STOCK_ID", "IM_ID", "WH_ID",
                                  quantity_on_hand, reorder_level
                        ''',
                        (
                            data.actual_quantity,
                            existing_stock["STOCK_ID"]
                        )
                    )

                stock = cur.fetchone()

            # 5. Create new stock record
            else:
                if data.reorder_level is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Please provide a reorder level for this new stock record."
                    )

                # Initial reorder level is allowed when creating a new record.
                cur.execute(
                    '''
                    INSERT INTO public."STOCK" (
                        "IM_ID",
                        "WH_ID",
                        quantity_on_hand,
                        reorder_level
                    )
                    VALUES (%s, %s, %s, %s)
                    RETURNING "STOCK_ID", "IM_ID", "WH_ID",
                              quantity_on_hand, reorder_level
                    ''',
                    (
                        data.im_id,
                        data.wh_id,
                        data.actual_quantity,
                        data.reorder_level
                    )
                )

                stock = cur.fetchone()

            # 6. Record Stock In in Stock Ledger
            cur.execute(
                '''
                INSERT INTO public."STOCK_LEDGER" (
                    "IM_ID",
                    "WH_ID",
                    "TransactionType",
                    "Quantity",
                    "ActualQuantity",
                    "ReferenceNo",
                    "LoggedBy",
                    "LogDate",
                    "Remarks"
                )
                VALUES (
                    %s, %s, 'STOCK_IN',
                    %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, %s
                )
                RETURNING "LogID"
                ''',
                (
                    data.im_id,
                    data.wh_id,
                    data.actual_quantity,
                    stock["quantity_on_hand"],
                    data.reference_no,
                    user["sub"],
                    data.remarks
                )
            )

            ledger = cur.fetchone()

            return {
                "message": "Stock In recorded successfully",
                "stock": stock,
                "ledger_id": ledger["LogID"]
            }


# ==========================================
# STOCK OUT
# ADMIN AND STAFF
# ==========================================

@router.post("/stock-out", status_code=201)
def stock_out(
    data: StockOutRequest,
    user: dict = Depends(require_inventory)
):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # 1. Check if item exists
            cur.execute(
                '''
                SELECT "IM_ID"
                FROM public."ITEM_MASTER"
                WHERE "IM_ID" = %s
                ''',
                (data.im_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Item not found"
                )

            # 2. Check if warehouse exists
            cur.execute(
                '''
                SELECT "WH_ID"
                FROM public."WAREHOUSE"
                WHERE "WH_ID" = %s
                ''',
                (data.wh_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Warehouse not found"
                )

            # 3. Check available stock
            cur.execute(
                '''
                SELECT "STOCK_ID", quantity_on_hand
                FROM public."STOCK"
                WHERE "IM_ID" = %s AND "WH_ID" = %s
                FOR UPDATE
                ''',
                (data.im_id, data.wh_id)
            )

            stock = cur.fetchone()

            if not stock:
                raise HTTPException(
                    status_code=400,
                    detail="No stock record found"
                )

            if stock["quantity_on_hand"] < data.actual_quantity:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient stock"
                )

            # 4. Deduct stock
            cur.execute(
                '''
                UPDATE public."STOCK"
                SET quantity_on_hand = quantity_on_hand - %s
                WHERE "STOCK_ID" = %s
                RETURNING "STOCK_ID", "IM_ID", "WH_ID",
                          quantity_on_hand, reorder_level
                ''',
                (data.actual_quantity, stock["STOCK_ID"])
            )

            updated_stock = cur.fetchone()

            # 5. Record Stock Out in Stock Ledger
            cur.execute(
                '''
                INSERT INTO public."STOCK_LEDGER"
                    (
                        "IM_ID",
                        "WH_ID",
                        "TransactionType",
                        "Quantity",
                        "ActualQuantity",
                        "ReferenceNo",
                        "LoggedBy",
                        "LogDate",
                        "Remarks"
                    )
                VALUES (%s, %s, 'STOCK_OUT', %s, %s, %s, %s,
                        CURRENT_TIMESTAMP, %s)
                RETURNING "LogID"
                ''',
                (
                    data.im_id,
                    data.wh_id,
                    -data.actual_quantity,
                    updated_stock["quantity_on_hand"],
                    data.reference_no,
                    user["sub"],
                    f"Purpose: {data.release_purpose}. {data.remarks or ''}".strip()
                )
            )

            ledger = cur.fetchone()

            return {
                "message": "Stock Out recorded successfully",
                "stock": updated_stock,
                "ledger_id": ledger["LogID"]
            }


# ==========================================
# STOCK ADJUSTMENT
# ADMIN ONLY
# ==========================================

@router.post("/adjustment", status_code=201)
def stock_adjustment(
    data: StockAdjustmentRequest,
    user: dict = Depends(require_admin)
):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # 1. Check if item exists
            cur.execute(
                '''
                SELECT "IM_ID"
                FROM public."ITEM_MASTER"
                WHERE "IM_ID" = %s
                ''',
                (data.im_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Item not found"
                )

            # 2. Check if warehouse exists
            cur.execute(
                '''
                SELECT "WH_ID"
                FROM public."WAREHOUSE"
                WHERE "WH_ID" = %s
                ''',
                (data.wh_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Warehouse not found"
                )

            # 3. Get current stock and lock the row
            cur.execute(
                '''
                SELECT "STOCK_ID", quantity_on_hand
                FROM public."STOCK"
                WHERE "IM_ID" = %s
                  AND "WH_ID" = %s
                FOR UPDATE
                ''',
                (data.im_id, data.wh_id)
            )

            stock = cur.fetchone()

            if not stock:
                raise HTTPException(
                    status_code=404,
                    detail="No stock record found for this item in this warehouse"
                )

            current_quantity = stock["quantity_on_hand"]

            # 4. Calculate adjustment
            adjustment_quantity = (
                data.physical_count - current_quantity
            )

            if adjustment_quantity == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Physical count matches current stock. No adjustment needed."
                )

            # 5. Update stock
            cur.execute(
                '''
                UPDATE public."STOCK"
                SET quantity_on_hand = %s
                WHERE "STOCK_ID" = %s
                RETURNING quantity_on_hand
                ''',
                (data.physical_count, stock["STOCK_ID"])
            )

            updated_stock = cur.fetchone()

            # 6. Record adjustment in Stock Ledger
            cur.execute(
                '''
                INSERT INTO public."STOCK_LEDGER" (
                    "IM_ID",
                    "WH_ID",
                    "TransactionType",
                    "Quantity",
                    "ActualQuantity",
                    "ReferenceNo",
                    "LoggedBy",
                    "LogDate",
                    "Remarks"
                )
                VALUES (
                    %s, %s, 'STOCK_ADJUSTMENT',
                    %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, %s
                )
                RETURNING "LogID"
                ''',
                (
                    data.im_id,
                    data.wh_id,
                    adjustment_quantity,
                    updated_stock["quantity_on_hand"],
                    data.reference_no,
                    user["sub"],
                    f"Reason: {data.reason}. {data.remarks or ''}".strip()
                )
            )

            ledger = cur.fetchone()

            return {
                "message": "Stock adjusted successfully",
                "previous_stock": current_quantity,
                "adjustment_quantity": adjustment_quantity,
                "new_stock": updated_stock["quantity_on_hand"],
                "ledger_id": ledger["LogID"]
            }


# ==========================================
# STOCK TRANSFER
# ADMIN AND STAFF
# ==========================================

@router.post("/transfer", status_code=201)
def stock_transfer(
    data: StockTransferRequest,
    user: dict = Depends(require_inventory)
):

    # 1. Source and destination must be different
    if data.source_wh_id == data.destination_wh_id:
        raise HTTPException(
            status_code=400,
            detail="Source and destination warehouses must be different"
        )

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # Validate transfer quantity
            if data.transfer_quantity <= 0:
                raise HTTPException(
                status_code=400,
                detail="Transfer quantity must be greater than zero"
            )

            # 2. Check if item exists
            cur.execute(
                '''
                SELECT "IM_ID"
                FROM public."ITEM_MASTER"
                WHERE "IM_ID" = %s
                ''',
                (data.im_id,)
            )

            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Item not found"
                )

            # 3. Check if both warehouses exist
            cur.execute(
                '''
                SELECT "WH_ID"
                FROM public."WAREHOUSE"
                WHERE "WH_ID" IN (%s, %s)
                ''',
                (data.source_wh_id, data.destination_wh_id)
            )

            warehouses = cur.fetchall()

            if len(warehouses) != 2:
                raise HTTPException(
                    status_code=404,
                    detail="One or both warehouses were not found"
                )

            # 4. Get and lock source stock
            cur.execute(
                '''
                SELECT
                    "STOCK_ID",
                    quantity_on_hand,
                    reorder_level
                FROM public."STOCK"
                WHERE "IM_ID" = %s
                  AND "WH_ID" = %s
                FOR UPDATE
                ''',
                (data.im_id, data.source_wh_id)
            )

            source_stock = cur.fetchone()

            if not source_stock:
                raise HTTPException(
                    status_code=404,
                    detail="No stock record found in the source warehouse"
                )

            if source_stock["quantity_on_hand"] < data.transfer_quantity:
                raise HTTPException(
                status_code=400,
                detail="Insufficient stock in the source warehouse"
            )

            # 6. Deduct stock from source warehouse
            cur.execute(
                '''
                UPDATE public."STOCK"
                SET quantity_on_hand = quantity_on_hand - %s
                WHERE "STOCK_ID" = %s
                RETURNING quantity_on_hand
                ''',
                (data.transfer_quantity, source_stock["STOCK_ID"])
            )

            updated_source = cur.fetchone()

            # 7. Add stock to destination warehouse
            cur.execute(
                '''
                INSERT INTO public."STOCK" (
                    "IM_ID",
                    "WH_ID",
                    quantity_on_hand,
                    reorder_level
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT ("IM_ID", "WH_ID")
                DO UPDATE SET
                    quantity_on_hand =
                        public."STOCK".quantity_on_hand
                        + EXCLUDED.quantity_on_hand
                RETURNING quantity_on_hand
                ''',
                (
                    data.im_id,
                    data.destination_wh_id,
                    data.transfer_quantity,
                    source_stock["reorder_level"]
                )
            )

            updated_destination = cur.fetchone()

            # 8. Record TRANSFER_OUT in Stock Ledger
            cur.execute(
                '''
                INSERT INTO public."STOCK_LEDGER" (
                    "IM_ID",
                    "WH_ID",
                    "Target_WH_ID",
                    "TransactionType",
                    "Quantity",
                    "ActualQuantity",
                    "ReferenceNo",
                    "LoggedBy",
                    "LogDate",
                    "Remarks"
                )
                VALUES (
                    %s, %s, %s, 'TRANSFER_OUT',
                    %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, %s
                )
                RETURNING "LogID"
                ''',
                (
                    data.im_id,
                    data.source_wh_id,
                    data.destination_wh_id,
                    -data.transfer_quantity,
                    updated_source["quantity_on_hand"],
                    data.reference_no,
                    user["sub"],
                    data.remarks
                )
            )

            transfer_out = cur.fetchone()

            # 9. Record TRANSFER_IN in Stock Ledger
            cur.execute(
                '''
                INSERT INTO public."STOCK_LEDGER" (
                    "IM_ID",
                    "WH_ID",
                    "Target_WH_ID",
                    "TransactionType",
                    "Quantity",
                    "ActualQuantity",
                    "ReferenceNo",
                    "LoggedBy",
                    "LogDate",
                    "Remarks"
                )
                VALUES (
                    %s, %s, %s, 'TRANSFER_IN',
                    %s, %s, %s, %s,
                    CURRENT_TIMESTAMP, %s
                )
                RETURNING "LogID"
                ''',
                (
                    data.im_id,
                    data.destination_wh_id,
                    data.source_wh_id,
                    data.transfer_quantity,
                    updated_destination["quantity_on_hand"],
                    data.reference_no,
                    user["sub"],
                    data.remarks
                )
            )

            transfer_in = cur.fetchone()

            return {
                "message": "Stock transferred successfully",
                "transferred_quantity": data.transfer_quantity,
                "source_warehouse": {
                    "warehouse_id": data.source_wh_id,
                    "remaining_stock": updated_source["quantity_on_hand"]
                },
                "destination_warehouse": {
                    "warehouse_id": data.destination_wh_id,
                    "updated_stock": updated_destination["quantity_on_hand"]
                },
                "ledger_ids": {
                    "transfer_out": transfer_out["LogID"],
                    "transfer_in": transfer_in["LogID"]
                }
            }
            