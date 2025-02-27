from datetime import time
from pydantic import BaseModel, EmailStr, constr, validator, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# Base Models
class EnregistrementBase(BaseModel):
    reference: str
    id_lin: str
    id_ccu: str
    etat: str
    creation: datetime
    mise_a_jour: datetime
    idrh: str
    device_id: str
    retour_metier: Optional[str] = None
    commentaires_cloture: Optional[str] = None
    nom_bureau_poste: str
    regate: str
    source: str
    solution_scan: str
    rg: str
    ruo: str


# Response Models
class Enregistrement(EnregistrementBase):
    id: int
    imported_at: datetime

    class Config:
        orm_mode = True
