from datetime import time
from pydantic import BaseModel, EmailStr, constr, validator, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# Base Models
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

class FileDataCreate(FileDataBase):
    file_name: str

class FileDataResponse(FileDataBase):
    id: int
    file_name: str
    import_date: datetime
    
    class Config:
        orm_mode = True

class FileDataBulkCreate(BaseModel):
    data: List[FileDataCreate]
    
class FileDataQuery(BaseModel):
    reference: Optional[str] = None
    id_lin: Optional[str] = None
    id_ccu: Optional[str] = None
    file_name: Optional[str] = None
