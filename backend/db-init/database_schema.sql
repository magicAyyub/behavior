-- S'assurer que l'encodage est bien en UTF-8
SET client_encoding = 'UTF8';

-- Supprime la table si elle existe déjà (utile pour les re-déploiements)
DROP TABLE IF EXISTS enregistrements;

-- Création de la table avec les types adaptés
CREATE TABLE enregistrements (
    reference SERIAL PRIMARY KEY,
    id_lin UUID NOT NULL,
    id_ccu BIGINT NOT NULL,
    etat VARCHAR(20) NOT NULL,
    creation TIMESTAMP NOT NULL,
    mise_a_jour TIMESTAMP NOT NULL,
    idrh VARCHAR(50),
    device_id VARCHAR(100),
    retour_metier VARCHAR(255),
    commentaires_cloture TEXT,
    nom_bureau_poste VARCHAR(100),
    regate VARCHAR(20),
    source VARCHAR(50),
    solution_scan VARCHAR(50),
    rg VARCHAR(50),
    ruo VARCHAR(100)
);

-- Ajout d'un index sur la colonne `id_lin` pour optimiser les requêtes
CREATE INDEX idx_enregistrements_id_lin ON enregistrements (id_lin);

-- Ajout d'un index sur `creation` et `mise_a_jour` pour améliorer les performances de tri
CREATE INDEX idx_enregistrements_dates ON enregistrements (creation, mise_a_jour);