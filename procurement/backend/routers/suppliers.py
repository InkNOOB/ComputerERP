from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from psycopg import errors
from psycopg.rows import dict_row
from database import get_db_connection

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

class SupplierIn(BaseModel):
    supplier_name: str = Field(min_length=1, max_length=255)
    contact: str | None = None
    email: EmailStr | None = None

class SupplierUpdate(BaseModel):
    supplier_name: str | None = Field(default=None, min_length=1, max_length=255)
    contact: str | None = None
    email: EmailStr | None = None

COLUMNS = {"supplier_name": "SupplierName", "contact": "Contact", "email": "Email"}

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

@router.patch("/{supplier_id}")
def update_supplier(supplier_id: int, s: SupplierUpdate):
    fields = s.model_dump(exclude_unset=True)
    if not fields or fields.get("supplier_name", "x") is None:
        raise HTTPException(status_code=400, detail="Nothing valid to update")

    # column names come from the fixed COLUMNS map, never from user input
    set_clause = ", ".join(f'"{COLUMNS[k]}" = %s' for k in fields)
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f'''UPDATE public."Supplier" SET {set_clause}
                    WHERE "SupplierID" = %s
                    RETURNING "SupplierID", "SupplierName", "Contact", "Email"''',
                (*fields.values(), supplier_id),
            )
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return row

@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM public."Supplier" WHERE "SupplierID" = %s', (supplier_id,))
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Supplier not found")
    except errors.ForeignKeyViolation:
        raise HTTPException(status_code=409, detail="This supplier has quotations and can't be deleted")