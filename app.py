from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI(title="Dongtan Data Labs API")

# Enable CORS so our frontend can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_FILE = os.path.join(os.path.dirname(__file__), "dongtan_dummy_transactions.csv")

@app.get("/")
def read_root():
    return {"message": "Welcome to Dongtan Data Labs API"}

@app.get("/api/realestate/transactions")
def get_transactions():
    """
    Returns the real estate transaction data from the dummy CSV file.
    """
    try:
        if not os.path.exists(CSV_FILE):
             return {"error": "Mock data file not found."}
             
        df = pd.read_csv(CSV_FILE)
        
        # We need to sort by date and convert to a dictionary format suitable for JSON
        df = df.sort_values(by="거래일자")
        records = df.to_dict(orient="records")
        return {
            "status": "success",
            "count": len(records),
            "data": records
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/realestate/summary")
def get_summary():
    """
    Provides aggregated data for the dashboard KPIs
    """
    try:
        if not os.path.exists(CSV_FILE):
             return {"error": "Mock data file not found."}
             
        df = pd.read_csv(CSV_FILE)
        
        # Calculate some summary stats from dummy data
        avg_price = int(df["거래금액(만원)"].mean())
        max_price = int(df["거래금액(만원)"].max())
        total_transactions = len(df)
        
        return {
            "status": "success",
            "summary": {
                "avg_price_krw": avg_price,
                "max_price_krw": max_price,
                "total_transactions": total_transactions,
                "index_score": 114.2 # hardcoded for MVP
            }
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting Dongtan Data Labs Backend Server...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
