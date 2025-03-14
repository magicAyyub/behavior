from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date, text
from datetime import datetime, timedelta
import re

from src.utils.database import get_db
from src.utils.models import FileData
from src.utils.schema import (
    FileDataCreate, 
    FileDataResponse, 
    FileDataBulkCreate,
    AggregatedDataPoint,
    DistributionDataPoint,
    PaginatedResponse
)

router = APIRouter()


@router.post("/", response_model=List[FileDataResponse])
def create_file_data(
    file_data: FileDataBulkCreate,
    db: Session = Depends(get_db)
):
    """Créer plusieurs entrées de données de fichier"""
    db_items = []
    for item in file_data.data:
        db_item = FileData(**item.dict())
        db.add(db_item)
        db_items.append(db_item)
    
    db.commit()
    for item in db_items:
        db.refresh(item)
    
    return db_items


@router.get("/", response_model=PaginatedResponse)
def read_file_data(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    file_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Récupérer les données de fichier avec filtrage optionnel et pagination"""
    # Construire la requête de base
    query = db.query(FileData)
    
    # Appliquer les filtres
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (FileData.reference.ilike(search_term)) |
            (FileData.id_lin.ilike(search_term)) |
            (FileData.id_ccu.ilike(search_term)) |
            (FileData.etat.ilike(search_term)) |
            (FileData.source.ilike(search_term))
        )
    
    if file_name and file_name != "all":
        query = query.filter(FileData.file_name == file_name)
    
    # Appliquer les filtres de date
    if date_from:
        query = query.filter(apply_date_filter(FileData.creation, ">=", date_from))
    
    if date_to:
        query = query.filter(apply_date_filter(FileData.creation, "<=", date_to))
    
    # Compter le nombre total d'enregistrements (pour la pagination)
    total = query.count()
    
    # Appliquer la pagination
    items = query.offset(skip).limit(limit).all()
    
    # Retourner les résultats paginés
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }


@router.get("/files", response_model=List[str])
def get_unique_files(db: Session = Depends(get_db)):
    """Récupérer la liste des noms de fichiers uniques"""
    files = db.query(FileData.file_name).distinct().all()
    return [file[0] for file in files]


@router.delete("/{file_name}", response_model=dict)
def delete_file_data(
    file_name: str,
    db: Session = Depends(get_db)
):
    """Supprimer toutes les données d'un fichier spécifique"""
    deleted = db.query(FileData).filter(FileData.file_name == file_name).delete()
    db.commit()
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Aucune donnée trouvée pour le fichier {file_name}")
    
    return {"message": f"Données du fichier {file_name} supprimées avec succès"}


# Fonction utilitaire pour appliquer les filtres de date
def apply_date_filter(column, operator, date_value):
    """
    Applique un filtre de date sur une colonne en tenant compte des différents formats de date
    """
    if not date_value:
        return True  # Ne pas filtrer si aucune date n'est fournie
    
    # Vérifier si la date est au format ISO (YYYY-MM-DD...)
    iso_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}')
    if iso_pattern.match(date_value):
        # Pour les dates ISO, on peut les comparer directement
        if operator == ">=":
            return text(f"CASE WHEN creation LIKE '%/%/%' THEN "
                       f"to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD') >= to_date('{date_value}', 'YYYY-MM-DD') "
                       f"ELSE to_date(substring(creation, 1, 10), 'YYYY-MM-DD') >= to_date('{date_value}', 'YYYY-MM-DD') END")
        else:  # operator == "<="
            return text(f"CASE WHEN creation LIKE '%/%/%' THEN "
                       f"to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD') <= to_date('{date_value}', 'YYYY-MM-DD') "
                       f"ELSE to_date(substring(creation, 1, 10), 'YYYY-MM-DD') <= to_date('{date_value}', 'YYYY-MM-DD') END")
    
    # Si ce n'est pas une date ISO, on suppose que c'est déjà au format DD/MM/YYYY
    return column.op(operator)(date_value)


# Endpoints optimisés pour l'analyse

@router.get("/aggregate", response_model=List[AggregatedDataPoint])
def get_aggregated_data(
    group_by: str = Query("jour", description="Options: jour, semaine, mois, annee"),
    search: Optional[str] = None,
    file_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Récupérer les données agrégées par période (jour, semaine, mois, année)
    Utilise des requêtes SQL optimisées pour éviter de charger toutes les données
    """
    # Déterminer le format de date en fonction du groupe
    date_format = ""
    if group_by == "jour":
        date_format = "%Y-%m-%d"
    elif group_by == "semaine":
        # Pour la semaine, nous utiliserons une approche différente
        date_format = "%Y-%m-%d"
    elif group_by == "mois":
        date_format = "%Y-%m"
    elif group_by == "annee":
        date_format = "%Y"
    else:
        date_format = "%Y-%m-%d"
    
    # Construire la requête SQL pour l'agrégation
    # Cette approche utilise des sous-requêtes pour éviter l'utilisation de FILTER avec window functions
    sql_query = """
    WITH filtered_data AS (
        SELECT 
            id, reference, etat, creation, file_name
        FROM 
            file_data
        WHERE 
            creation IS NOT NULL
    """
    
    # Paramètres pour la requête
    params = {}
    
    # Ajouter les conditions de filtrage
    if search:
        sql_query += """
            AND (
                reference ILIKE :search OR
                id_lin ILIKE :search OR
                id_ccu ILIKE :search OR
                etat ILIKE :search OR
                source ILIKE :search
            )
        """
        params["search"] = f"%{search}%"
    
    if file_name and file_name != "all":
        sql_query += " AND file_name = :file_name"
        params["file_name"] = file_name
    
    # Ajouter les filtres de date
    if date_from:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) >= to_date(:date_from, 'YYYY-MM-DD')
        """
        params["date_from"] = date_from[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    if date_to:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) <= to_date(:date_to, 'YYYY-MM-DD')
        """
        params["date_to"] = date_to[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    sql_query += """
    ),
    """
    
    # Ajouter la partie pour extraire la période en fonction du format de date
    if group_by == "semaine":
        sql_query += """
        period_data AS (
            SELECT 
                id, reference, etat, creation, file_name,
                CASE 
                    WHEN creation LIKE '%/%/%' THEN 
                        -- Format DD/MM/YYYY
                        CAST(
                            date_trunc('week', 
                                to_date(
                                    substring(creation, 7, 4) || '-' || 
                                    substring(creation, 4, 2) || '-' || 
                                    substring(creation, 1, 2), 
                                    'YYYY-MM-DD'
                                )
                            ) AS TEXT
                        )
                    ELSE 
                        -- Format ISO
                        CAST(date_trunc('week', to_date(substring(creation, 1, 10), 'YYYY-MM-DD')) AS TEXT)
                END AS period
            FROM 
                filtered_data
        ),
        """
    else:
        sql_query += """
        period_data AS (
            SELECT 
                id, reference, etat, creation, file_name,
                CASE 
                    WHEN creation LIKE '%/%/%' THEN 
                        -- Format DD/MM/YYYY
                        to_char(
                            to_date(
                                substring(creation, 7, 4) || '-' || 
                                substring(creation, 4, 2) || '-' || 
                                substring(creation, 1, 2), 
                                'YYYY-MM-DD'
                            ),
                            :date_format
                        )
                    ELSE 
                        -- Format ISO
                        to_char(to_date(substring(creation, 1, 10), 'YYYY-MM-DD'), :date_format)
                END AS period
            FROM 
                filtered_data
        ),
        """
        params["date_format"] = date_format
    
    # Ajouter la partie pour limiter à 5 éléments par période
    sql_query += """
    ranked_data AS (
        SELECT 
            id, reference, etat, creation, file_name, period,
            row_number() OVER (PARTITION BY period ORDER BY id) AS rn
        FROM 
            period_data
    ),
    limited_data AS (
        SELECT 
            id, reference, etat, creation, file_name, period
        FROM 
            ranked_data
        WHERE 
            rn <= 5
    ),
    counts AS (
        SELECT 
            period, COUNT(*) AS count
        FROM 
            period_data
        GROUP BY 
            period
    )
    SELECT 
        c.period,
        c.count,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', ld.id,
                        'reference', ld.reference,
                        'etat', ld.etat,
                        'creation', ld.creation,
                        'file_name', ld.file_name
                    )
                )
                FROM limited_data ld
                WHERE ld.period = c.period
            ),
            '[]'::json
        ) AS data
    FROM 
        counts c
    ORDER BY 
        c.period
    """
    
    # Exécuter la requête SQL
    result = db.execute(text(sql_query), params).fetchall()
    
    # Convertir les résultats en objets AggregatedDataPoint
    aggregated_data = []
    for row in result:
        period = row[0]
        count = row[1]
        data_json = row[2] if row[2] else []
        
        aggregated_data.append(AggregatedDataPoint(
            period=period,
            count=count,
            data=data_json
        ))
    
    return aggregated_data


@router.get("/distribution", response_model=List[DistributionDataPoint])
def get_distribution_data(
    field: str = Query(..., description="Champ pour la distribution: etat, source, file_name, etc."),
    search: Optional[str] = None,
    file_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Récupérer la distribution des données par champ spécifié
    Utilise des requêtes SQL optimisées pour éviter de charger toutes les données
    """
    # Vérifier que le champ existe dans le modèle
    if not hasattr(FileData, field):
        raise HTTPException(status_code=400, detail=f"Le champ {field} n'existe pas dans le modèle")
    
    # Construire la requête SQL directe pour la distribution
    sql_query = f"""
    WITH filtered_data AS (
        SELECT 
            {field}
        FROM 
            file_data
        WHERE 
            1=1
    """
    
    # Paramètres pour la requête
    params = {}
    
    # Ajouter les conditions de filtrage
    if search:
        sql_query += """
            AND (
                reference ILIKE :search OR
                id_lin ILIKE :search OR
                id_ccu ILIKE :search OR
                etat ILIKE :search OR
                source ILIKE :search
            )
        """
        params["search"] = f"%{search}%"
    
    if file_name and file_name != "all":
        sql_query += " AND file_name = :file_name"
        params["file_name"] = file_name
    
    # Ajouter les filtres de date
    if date_from:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) >= to_date(:date_from, 'YYYY-MM-DD')
        """
        params["date_from"] = date_from[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    if date_to:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) <= to_date(:date_to, 'YYYY-MM-DD')
        """
        params["date_to"] = date_to[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    sql_query += """
    ),
    total AS (
        SELECT COUNT(*) AS total_count FROM filtered_data
    )
    SELECT 
        COALESCE({field}, 'Non défini') AS label,
        COUNT(*) AS count,
        (COUNT(*) * 100.0 / NULLIF((SELECT total_count FROM total), 0)) AS percentage
    FROM 
        filtered_data
    GROUP BY 
        label
    ORDER BY 
        count DESC
    """
    
    # Exécuter la requête SQL
    result = db.execute(text(sql_query), params).fetchall()
    
    # Convertir les résultats en objets DistributionDataPoint
    distribution_data = []
    for row in result:
        label = row[0]
        count = row[1]
        percentage = row[2] if row[2] is not None else 0.0
        
        distribution_data.append(DistributionDataPoint(
            label=str(label),
            count=count,
            percentage=percentage
        ))
    
    return distribution_data


@router.get("/stats", response_model=Dict[str, Any])
def get_stats(
    search: Optional[str] = None,
    file_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Récupérer des statistiques générales sur les données
    Utilise des requêtes SQL optimisées pour éviter de charger toutes les données
    """
    # Construire la requête SQL directe pour les statistiques
    sql_query = """
    WITH filtered_data AS (
        SELECT 
            id, file_name, source, creation, import_date
        FROM 
            file_data
        WHERE 
            1=1
    """
    
    # Paramètres pour la requête
    params = {}
    
    # Ajouter les conditions de filtrage
    if search:
        sql_query += """
            AND (
                reference ILIKE :search OR
                id_lin ILIKE :search OR
                id_ccu ILIKE :search OR
                etat ILIKE :search OR
                source ILIKE :search
            )
        """
        params["search"] = f"%{search}%"
    
    if file_name and file_name != "all":
        sql_query += " AND file_name = :file_name"
        params["file_name"] = file_name
    
    # Ajouter les filtres de date
    if date_from:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) >= to_date(:date_from, 'YYYY-MM-DD')
        """
        params["date_from"] = date_from[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    if date_to:
        sql_query += """
            AND (
                CASE WHEN creation LIKE '%/%/%' THEN 
                    to_date(substring(creation, 7, 4) || '-' || substring(creation, 4, 2) || '-' || substring(creation, 1, 2), 'YYYY-MM-DD')
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
                END
            ) <= to_date(:date_to, 'YYYY-MM-DD')
        """
        params["date_to"] = date_to[:10]  # Prendre seulement la partie date (YYYY-MM-DD)
    
    sql_query += """
    )
    SELECT 
        (SELECT COUNT(*) FROM filtered_data) AS total_entries,
        (SELECT COUNT(DISTINCT file_name) FROM filtered_data) AS unique_files,
        (SELECT creation FROM filtered_data ORDER BY 
            CASE 
                WHEN creation LIKE '%/%/%' THEN 
                    to_date(
                        substring(creation, 7, 4) || '-' || 
                        substring(creation, 4, 2) || '-' || 
                        substring(creation, 1, 2), 
                        'YYYY-MM-DD'
                    )
                ELSE 
                    to_date(substring(creation, 1, 10), 'YYYY-MM-DD')
            END DESC LIMIT 1) AS latest_entry,
        (SELECT COUNT(DISTINCT source) FROM filtered_data WHERE source IS NOT NULL) AS unique_sources
    """
    
    # Exécuter la requête SQL
    result = db.execute(text(sql_query), params).fetchone()
    
    # Convertir les résultats en dictionnaire
    if result:
        return {
            "total_entries": result[0],
            "unique_files": result[1],
            "latest_entry": result[2],
            "unique_sources": result[3]
        }
    else:
        return {
            "total_entries": 0,
            "unique_files": 0,
            "latest_entry": None,
            "unique_sources": 0
        }
