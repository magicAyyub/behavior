from sqlalchemy import (
    Column, Integer, String, Text, TIMESTAMP, ForeignKey, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class FileData(Base):
    __tablename__ = "file_data"
    
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, index=True)
    id_lin = Column(String)
    id_ccu = Column(String)
    etat = Column(String)
    creation = Column(String)
    mise_a_jour = Column(String)
    idrh = Column(String)
    device_id = Column(String)
    retour_metier = Column(Text)
    commentaires_cloture = Column(Text)
    nom_bureau_poste = Column(String)
    regate = Column(String)
    source = Column(String)
    solution_scan = Column(String)
    rg = Column(String)
    ruo = Column(String)
    file_name = Column(String)  # Pour tracer l'origine des données
    import_date = Column(DateTime)  # Date d'importation