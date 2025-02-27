from sqlalchemy import (
    Column, Integer, String, Text, TIMESTAMP, ForeignKey, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# Table des enregistrements (fichiers CSV importés)
class Enregistrement(Base):
    __tablename__ = "enregistrements"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, nullable=False)
    id_lin = Column(String, nullable=False)
    id_ccu = Column(String, nullable=False)
    etat = Column(String, nullable=False)
    creation = Column(DateTime, nullable=False)
    mise_a_jour = Column(DateTime, nullable=False)
    idrh = Column(String, nullable=False)
    device_id = Column(String, nullable=False)
    retour_metier = Column(Text, nullable=True)
    commentaires_cloture = Column(Text, nullable=True)
    nom_bureau_poste = Column(String, nullable=False)
    regate = Column(String, nullable=False)
    source = Column(String, nullable=False)
    solution_scan = Column(String, nullable=False)
    rg = Column(String, nullable=False)
    ruo = Column(String, nullable=False)
    imported_at = Column(TIMESTAMP, server_default=func.current_timestamp())