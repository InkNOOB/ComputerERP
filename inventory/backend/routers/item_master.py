from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from psycopg.rows import dict_row
from database import get_db_connection
from typing import Literal

router = APIRouter(prefix="/item_master", tags=["Item Master"])

class ItemMasterIn(BaseModel):
    sku: str = Field(min_length=1)
    item_name: str = Field(min_length=1)
    description: str | None = None
    category: str | None = None
    brand: str | None = None
    item_type: Literal["Raw", "Finished"] | None = None
    unit_of_measure: str | None = None
    price: float | None = Field(default=None, ge=0)
    status: str | None = None

class ItemMasterUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1)
    item_name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category: str | None = None
    brand: str | None = None
    item_type: Literal["Raw", "Finished"] | None = None
    unit_of_measure: str | None = None
    price: float | None = Field(default=None, ge=0)
    status: str | None = None

COLUMNS = {
    "sku": "SKU",
    "item_name": "Item_Name",
    "description": "Description",
    "category": "Category",
    "brand": "Brand",
    "item_type": "ItemType",
    "unit_of_measure": "unit_of_measure",
    "price": "Price",
    "status": "status",
}

SELECT = '''
    SELECT "IM_ID", "SKU", "Item_Name", "Description",
           "Category", "Brand", "ItemType", unit_of_measure,
           "Price", status
    FROM public."ITEM_MASTER"
'''

@router.get("/")
def list_items(search: str | None = None):
    query = SELECT
    params: tuple = ()

    if search:
        query += '''
            WHERE "SKU" ILIKE %s
               OR "Item_Name" ILIKE %s
               OR "Category" ILIKE %s
               OR "Brand" ILIKE %s
        '''
        search_value = f"%{search}%"
        params = (search_value, search_value, search_value, search_value)

    query += ' ORDER BY "IM_ID"'

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

@router.get("/{im_id}")
def get_item(im_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                SELECT + ' WHERE "IM_ID" = %s',
                (im_id,)
            )
            item = cur.fetchone()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return item

@router.post("/", status_code=201)
def create_item(item: ItemMasterIn):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                '''
                INSERT INTO public."ITEM_MASTER" (
                    "SKU",
                    "Item_Name",
                    "Description",
                    "Category",
                    "Brand",
                    "ItemType",
                    unit_of_measure,
                    "Price",
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING "IM_ID", "SKU", "Item_Name", "Description",
                          "Category", "Brand", "ItemType",
                          unit_of_measure, "Price", status
                ''',
                (
                    item.sku,
                    item.item_name,
                    item.description,
                    item.category,
                    item.brand,
                    item.item_type,
                    item.unit_of_measure,
                    item.price,
                    item.status,
                ),
            )
            return cur.fetchone()
        
@router.patch("/{im_id}")
def update_item(im_id: int, item: ItemMasterUpdate):
    fields = item.model_dump(exclude_unset=True)

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    if fields.get("sku") is None or fields.get("item_name") is None:
        raise HTTPException(
            status_code=400,
            detail="SKU and Item Name cannot be NULL"
        )

    set_clause = ", ".join(
        f'"{COLUMNS[key]}" = %s' for key in fields
    )

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f'''
                UPDATE public."ITEM_MASTER"
                SET {set_clause}
                WHERE "IM_ID" = %s
                RETURNING "IM_ID", "SKU", "Item_Name", "Description",
                          "Category", "Brand", "ItemType",
                          unit_of_measure, "Price", status
                ''',
                (*fields.values(), im_id)
            )

            updated_item = cur.fetchone()

    if not updated_item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return updated_item
@router.delete("/{im_id}", status_code=204)
def delete_item(im_id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'DELETE FROM public."ITEM_MASTER" WHERE "IM_ID" = %s',
                (im_id,)
            )

            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Item not found"
                )

