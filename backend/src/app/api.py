"""
This module contains the FastAPI application and its configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import inspect
from src.utils.database import engine, get_db
import src.utils.models as models
from src.app.routes import enregistrement
from src.utils.settings import ORIGINS


# models.Base.metadata.create_all(bind=engine) 
enregistrement_router = enregistrement.router

def create_tables_if_not_exist():
    """
    Create database tables only if they do not already exist.
    
    This method checks each table in the models before creating it,
    preventing errors from attempting to recreate existing tables.
    """
    inspector = inspect(engine)

    # List of all model classes
    model_classes = [
        models.Enregistrement,
    ]
    for model_class in model_classes:
        # Check if table already exists
        if not inspector.has_table(model_class.__tablename__):
            # Create only if table doesn't exist
            model_class.__table__.create(engine)

# Create tables only if they don't exist
create_tables_if_not_exist()

app = FastAPI(
    title = "API jointure Excel et CSV",
    description = "API pour accéder et enregistrer des données de la jointure entre les fichiers et Excel et csv",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include all routes
app.include_router(enregistrement_router)


# Root endpoint to verify API connection
@app.get("/")
async def root() -> dict:
    return {"message": "Bienvenu sur l'API jointure Excel csv"}