from fastapi import FastAPI
from routers import suppliers


app = FastAPI()
app.include_router(suppliers.router)

@app.get("/")
def home():
    return {"status": "Online"}