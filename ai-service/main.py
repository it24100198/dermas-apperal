"""
AI Microservice — Dermas Apparel Manufacturing ERP
Runs on port 8000. Called by Node.js backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predictions, suggestions, alerts

app = FastAPI(title="Dermas AI Production Intelligence", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router, prefix="/predict", tags=["predictions"])
app.include_router(suggestions.router, prefix="/suggestions", tags=["suggestions"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Dermas AI Microservice"}


@app.get("/")
def root():
    return {"message": "Dermas Apparel AI Production Intelligence Service"}
