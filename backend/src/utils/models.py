from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, TIMESTAMP, ForeignKey, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class FileData(Base):
    __tablename__ = "file_data"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, index=True, nullable=True)
    id_lin = Column(String, nullable=True)
    id_ccu = Column(String, nullable=True)
    etat = Column(String, nullable=True)
    creation = Column(String, nullable=True)  # Stocké comme string pour préserver le format
    mise_a_jour = Column(String, nullable=True)
    idrh = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    retour_metier = Column(String, nullable=True)
    commentaires_cloture = Column(String, nullable=True)
    nom_bureau_poste = Column(String, nullable=True)
    regate = Column(String, nullable=True)
    source = Column(String, nullable=True)
    solution_scan = Column(String, nullable=True)
    rg = Column(String, nullable=True)
    ruo = Column(String, nullable=True)
    file_name = Column(String, index=True)
    import_date = Column(DateTime, default=datetime.utcnow)  # Ajout d'une valeur par défaut