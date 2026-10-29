<<<<<<< HEAD
from fastapi import FastAPI, HTTPException
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
=======
from fastapi import FastAPI
from routers import users

app = FastAPI()
app.include_router(users.router)

@app.get("/")
def home():
    return {"status": "Online"}
>>>>>>> d0a6245d65133ca0dde84e90c1d7a6df80f05527
