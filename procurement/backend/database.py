import os
import psycopg
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    # Creates an active connection string to your live Supabase DB
    return psycopg.connect(DATABASE_URL)
