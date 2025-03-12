from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from src.utils.database import get_db
from src.utils.models import FileData
from src.utils.schema import FileDataBulkCreate, FileDataResponse

router = APIRouter(
    prefix="/api",
    tags=["Données de fichier"]
)

@router.post("/file-data/", response_model=List[FileDataResponse])
def create_file_data(data_items: FileDataBulkCreate, db: Session = Depends(get_db)):
    """
    Créer plusieurs entrées de données de fichier en une seule requête
    """
    db_items = []
    for item in data_items.data:
        db_item = FileData(
            reference=item.reference,
            id_lin=item.id_lin,
            id_ccu=item.id_ccu,
            etat=item.etat,
            creation=item.creation,
            mise_a_jour=item.mise_a_jour,
            idrh=item.idrh,
            device_id=item.device_id,
            retour_metier=item.retour_metier,
            commentaires_cloture=item.commentaires_cloture,
            nom_bureau_poste=item.nom_bureau_poste,
            regate=item.regate,
            source=item.source,
            solution_scan=item.solution_scan,
            rg=item.rg,
            ruo=item.ruo,
            file_name=item.file_name,
            import_date=datetime.now()
        )
        db.add(db_item)
        db_items.append(db_item)
    
    db.commit()
    for item in db_items:
        db.refresh(item)
    
    return db_items

@router.get("/file-data/", response_model=List[FileDataResponse])
def read_file_data(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    file_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Récupérer les données avec filtrage optionnel
    """
    query = db.query(FileData)
    
    if search:
        query = query.filter(
            or_(
                FileData.reference.ilike(f"%{search}%"),
                FileData.id_lin.ilike(f"%{search}%"),
                FileData.id_ccu.ilike(f"%{search}%")
            )
        )
    
    if file_name:
        query = query.filter(FileData.file_name == file_name)
    
    return query.offset(skip).limit(limit).all()

@router.get("/file-data/files", response_model=List[str])
def get_unique_files(db: Session = Depends(get_db)):
    """
    Récupérer la liste des noms de fichiers uniques dans la base
    """
    result = db.query(FileData.file_name).distinct().all()
    return [r[0] for r in result]

@router.delete("/file-data/{file_name}")
def delete_file_data(file_name: str, db: Session = Depends(get_db)):
    """
    Supprimer toutes les données associées à un fichier
    """
    items = db.query(FileData).filter(FileData.file_name == file_name).all()
    if not items:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    for item in items:
        db.delete(item)
    db.commit()
    
    return {"message": f"Données du fichier {file_name} supprimées avec succès"}