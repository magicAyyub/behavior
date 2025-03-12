from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FileDataBase(BaseModel):
    reference: Optional[str] = None
    id_lin: Optional[str] = None
    id_ccu: Optional[str] = None
    etat: Optional[str] = None
    creation: Optional[str] = None
    mise_a_jour: Optional[str] = None
    idrh: Optional[str] = None
    device_id: Optional[str] = None
    retour_metier: Optional[str] = None
    commentaires_cloture: Optional[str] = None
    nom_bureau_poste: Optional[str] = None
    regate: Optional[str] = None
    source: Optional[str] = None
    solution_scan: Optional[str] = None
    rg: Optional[str] = None
    ruo: Optional[str] = None
    file_name: str


class FileDataCreate(FileDataBase):
    pass


class FileDataResponse(FileDataBase):
    id: int
    import_date: Optional[datetime] = None

    class Config:
        orm_mode = True


class FileDataBulkCreate(BaseModel):
    data: List[FileDataCreate]


class FileDataQuery(BaseModel):
    skip: int = 0
    limit: int = 100
    search: Optional[str] = None
    file_name: Optional[str] = None


# Nouveaux schémas pour l'analyse

class AnalysisFilterParams(BaseModel):
    search: Optional[str] = None
    file_name: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    group_by: Optional[str] = Field(None, description="Options: jour, semaine, mois, annee")
    field: Optional[str] = None


class AggregatedDataPoint(BaseModel):
    period: str
    count: int
    data: List[Dict[str, Any]] = []


class DistributionDataPoint(BaseModel):
    label: str
    count: int
    percentage: float


# Schéma pour la pagination
class PaginatedResponse(BaseModel):
    items: List[FileDataResponse]
    total: int
    page: int
    pages: int