"""
This module contains the FastAPI application and its configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from src.utils.database import engine
import src.utils.models as models
from src.app.routes import enregistrement
from src.utils.settings import ORIGINS


# models.Base.metadata.create_all(bind=engine) 

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include all routes
app.include_router(enregistrement.router)


# Root endpoint to verify API connection
@app.get("/")
async def root() -> RedirectResponse:
    """Redirect to /docs"""
    return RedirectResponse(url="/docs")