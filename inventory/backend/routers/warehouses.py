from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from psycopg import errors
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

class WarehouseIn(BaseModel):
    warehouse_name: str = Field(min_length=1, max_length=255)
    location: str | None = None

class WarehouseUpdate(BaseModel):
    warehouse_name: str | None = Field(default=None, min_length=1, max_length=255)
    location: str | None = None

COLUMNS = {"warehouse_name": "Warehouse_Name", "location": "Location"}
SELECT = 'SELECT "WH_ID", "Warehouse_Name", "Location" FROM public."WAREHOUSE"'

@router.get("/")
def list_warehouses(search: str | None = None):
    query = SELECT
    params: tuple = ()
    if search:  # matches name or location, e.g. /warehouses/?search=main
        query += ' WHERE "Warehouse_Name" ILIKE %s OR "Location" ILIKE %s'
        params = (f"%{search}%", f"%{search}%")
    query += ' ORDER BY "WH_ID"'

    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            return cur.fetchall()

@router.get("/{wh_id}")
def get_warehouse(wh_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(SELECT + ' WHERE "WH_ID" = %s', (wh_id,))
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return row

@router.post("/", status_code=201)
def create_warehouse(w: WarehouseIn):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                '''INSERT INTO public."WAREHOUSE" ("Warehouse_Name", "Location")
                   VALUES (%s, %s)
                   RETURNING "WH_ID", "Warehouse_Name", "Location"''',
                (w.warehouse_name, w.location),
            )
            return cur.fetchone()

@router.patch("/{wh_id}")
def update_warehouse(wh_id: int, w: WarehouseUpdate):
    fields = w.model_dump(exclude_unset=True)
    if not fields or fields.get("warehouse_name", "x") is None:
        raise HTTPException(status_code=400, detail="Nothing valid to update")

    # column names come from the fixed COLUMNS map, never from user input
    set_clause = ", ".join(f'"{COLUMNS[k]}" = %s' for k in fields)
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f'''UPDATE public."WAREHOUSE" SET {set_clause}
                    WHERE "WH_ID" = %s
                    RETURNING "WH_ID", "Warehouse_Name", "Location"''',
                (*fields.values(), wh_id),
            )
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return row

@router.delete("/{wh_id}", status_code=204)
def delete_warehouse(wh_id: int):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM public."WAREHOUSE" WHERE "WH_ID" = %s', (wh_id,))
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Warehouse not found")
    except errors.ForeignKeyViolation:
        # STOCK, RestockRequest, STOCK_LEDGER, PRODUCTION and delivery all point at warehouses
        raise HTTPException(status_code=409, detail="This warehouse is in use and can't be deleted")