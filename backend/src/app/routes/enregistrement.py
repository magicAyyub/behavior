from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
import io
import pandas as pd
from sqlalchemy.orm import Session
from src.utils.database import get_db
from src.utils import schema, models
from typing import List, Optional
from datetime import time


router = APIRouter(
    prefix="/api/enregistrement",
    tags=["Enregistrement"]
)

# Colonnes attendues
EXPECTED_COLUMNS = [
    "Référence", "ID LIN", "ID CCU", "Etat", "Création", "Mise à jour", "IDRH",
    "Device Id", "Retour métier", "Commentaires cloture", "Nom bureau de poste",
    "Regate", "Source", "Solution scan", "RG", "RUO"
]

@router.post("/create", response_model=schema.Enregistrement)
async def create_enregistrement(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Lire le fichier CSV
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")), sep=";")
    # Vérifier les colonnes
    if not all([col in df.columns for col in EXPECTED_COLUMNS]):
        raise HTTPException(status_code=400, detail="Colonnes manquantes dans le fichier CSV.")
    # Créer un enregistrement
    enregistrement = schema.EnregistrementBase(
        reference = df["Référence"].iloc[0],
        id_lin = df["ID LIN"].iloc[0],
        id_ccu = df["ID CCU"].iloc[0],
        etat = df["Etat"].iloc[0],
        creation = df["Création"].iloc[0],
        mise_a_jour = df["Mise à jour"].iloc[0],
        idrh = df["IDRH"].iloc[0],
        device_id = df["Device Id"].iloc[0],
        retour_metier = df["Retour métier"].iloc[0],
        commentaires_cloture = df["Commentaires cloture"].iloc[0],
        nom_bureau_poste = df["Nom bureau de poste"].iloc[0],
        regate = df["Regate"].iloc[0],
        source = df["Source"].iloc[0],
        solution_scan = df["Solution scan"].iloc[0],
        rg = df["RG"].iloc[0],
        ruo = df["RUO"].iloc[0]
    )
    # Enregistrer dans la base de données
    db_enregistrement = models.Enregistrement(**enregistrement.dict())
    db.add(db_enregistrement)
    try:
        db.commit()
        db.refresh(db_enregistrement)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_enregistrement
