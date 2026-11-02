from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "HR backend is running"}
