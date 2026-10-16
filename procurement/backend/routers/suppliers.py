from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

class SupplierIn(BaseModel):
    supplier_name: str
    contact: str | None = None
    email: str | None = None

@router.get("/")
def list_suppliers():
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute('SELECT "SupplierID", "SupplierName", "Contact", "Email" FROM public."Supplier" ORDER BY "SupplierID"')
            return cur.fetchall()

@router.get("/{supplier_id}")
def get_supplier(supplier_id: int):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                'SELECT "SupplierID", "SupplierName", "Contact", "Email" FROM public."Supplier" WHERE "SupplierID" = %s',
                (supplier_id,),
            )
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return row

@router.post("/", status_code=201)
def create_supplier(s: SupplierIn):
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO public."Supplier" ("SupplierName", "Contact", "Email")
                VALUES (%s, %s, %s)
                RETURNING "SupplierID", "SupplierName", "Contact", "Email"
                """,
                (s.supplier_name, s.contact, s.email),
            )
            return cur.fetchone()
            conn.commit() 
            return new_supplier         