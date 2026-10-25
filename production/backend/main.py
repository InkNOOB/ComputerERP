from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from database import get_db_connection

app = FastAPI()

# 1. ROOT PATH - Fixes the "Not Found" error on the homepage
@app.get("/")
def home():
    return {
        "status": "Online", 
        "message": "ERP Server Active! Head to /test-user to view Jhonver's profile."
    }

# 2. TEST USER PATH - Fetches your exact test user record
@app.get("/test-user")
def test_specific_user():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Querying using your exact schema structure and table names
                cur.execute(
                    """
                    SELECT "UserID", "Username", "email", "DeptID", "RoleID"
                    FROM public."User"
                    WHERE "UserID" = '001';
                    """
                )
                row = cur.fetchone()
                
                if not row:
                    return {"status": "Connected", "message": "Database connected, but UserID 001 not found."}
                
                user_profile = {
                    "user_id": row[0],
                    "username": row[1],
                    "email": row[2],
                    "department_id": row[3], # Will safely render as null for Super Admin
                    "role_id": row[4]
                }
        return {"status": "Success", "data": user_profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
    
# PRODUCTION PLANNING - Defines and validates production order input
class ProductionOrderInput(BaseModel):
    PM_ID: int # FK to the Product Master (Production 'my department')
    WH_ID: int # FK to the Warehouse (Inventory)
    QuantityRequired: int = Field(gt=0) # Target Production quantity; positive integers only

# - Create a new production order
@app.post("/production-orders")
def create_production_order(order: ProductionOrderInput):
    try:
        with get_db_connection() as database_connection:
            with database_connection.cursor() as sql_cursor:
                sql_cursor.execute(
                    """
                    INSERT INTO public."PRODUCTION"
                    (
                        "PM_ID",
                        "WH_ID",
                        "QuantityRequired",
                        "QuantityProduced",
                        "StartDate",
                        "Deadline",
                        "status"
                    )
                    VALUES (%s, %s, %s, 0, NULL, NULL, %s)
                    RETURNING "Production_ID";
                    """,
                    (
                        order.PM_ID,
                        order.WH_ID,
                        order.QuantityRequired,
                        "Pending"
                    )
                )

                new_order = sql_cursor.fetchone()

        return {
            "status": "Success",
            "message": "Production order created.",
            "Production_ID": new_order[0]
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create production order: {str(error)}"
        )
    finally:
        # Ensure the database connection is closed
        if 'database_connection' in locals():
            database_connection.close()
