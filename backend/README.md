
# Behavior Backend

Bienvenue dans la partie backend, elle utilise **FastAPI**, **Docker**, et **Poetry** pour une gestion simplifiée des dépendances et de l'environnement. Le script `setup` est conçu pour automatiser la configuration initiale.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

- **Python 3.10+** : [Télécharger ici](https://www.python.org/downloads/)
- **Poetry** : [Documentation officielle](https://python-poetry.org/docs/#installation)
- **Docker** et **Docker Compose** : [Télécharger Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Installation et Configuration

Le projet est conçu pour être configuré facilement grâce au script `setup`. Voici les étapes à suivre :

1. **Clonez le dépôt :**

```bash
git clone https://github.com/Murielle1/get-your-trip.git
cd backend
```

2. **Exécutez le script de configuration :**

   Le script `setup` se charge des étapes suivantes :
   - Création du fichier `.env` avec des valeurs par défaut.
   - Installation des dépendances via Poetry.
   - Construction des conteneurs Docker.

   Lancez simplement la commande suivante :

```bash
poetry install
poetry run setup
```

> NB: Vérifiez de docker-desktop est bien en cours d'exécution sur votre machine avant d'exécuter le script `setup`.

3. **Vérifiez que tout est prêt :**

   Une fois le script exécuté, vous devriez voir les conteneurs Docker démarrés et l'application prête à être utilisée.

---

## Exécution de l'Application

### Avec Docker

Si vous avez exécuté le script `setup`, les conteneurs Docker sont déjà construits et lancés. Vous n'avez rien d'autre à faire. L'application sera accessible à l'adresse suivante :

```
http://localhost:8000
```

Si vous souhaitez relancer les conteneurs manuellement, utilisez :

```bash
poetry run stop
poetry run docker
```

Si vous souhaitez réinitialiser les conteneurs, utilisez :

```bash
poetry run reset
```


### Localement (sans Docker)

1. Activez l'environnement virtuel Poetry :

```bash
poetry shell
```

2. Lancez l'application :

```bash
poetry run startapp
```

L'application et la base de données MongoDB seront accessibles aux mêmes adresses que ci-dessus.

---

## Structure du Projet

Voici un aperçu de la structure du projet :

```
backend/
├── pyproject.toml      # Configuration de Poetry
├── src/                # Code source principal
│   ├── main.py         # Point d'entrée de l'application FastAPI
│   ├── app/            # Modules FastAPI (routes, modèles, etc.)
│   ├── utils/          # Utilitaires (connexion Postgres, gestion .env)
│   └── setup_docker.py # Script de configuration automatique
│   └── .env            # Fichier contenant les variables d'environnement (généré automatiquement)
├── Dockerfile          # Instructions pour construire l'image Docker
├── docker-compose.yml  # Configuration des services Docker
```

---

## Variables d'Environnement

Le fichier `.env` est généré automatiquement par le script `setup`. Voici un exemple des variables qu'il contient :

```
DB_USER=admin
DB_PASSWORD=mypassword
DB_HOST=db
DB_PORT=5432
DB_NAME=data
```

Vous pouvez modifier ces valeurs si nécessaire.

---

## Contribution

Si vous souhaitez contribuer au projet, suivez ces étapes :

1. Créez une branche pour vos modifications :
```bash
git checkout -b feature/nouvelle-fonctionnalite
```

2. Effectuez vos modifications et ajoutez-les au contrôle de version :
```bash
git add .
git commit -m "Ajout d'une nouvelle fonctionnalité"
```

3. Poussez vos modifications vers le dépôt distant :
```bash
git push origin feature/nouvelle-fonctionnalite
```

4. Créez une pull request sur GitHub.

---

## Support
En cas de problème, les logs des conteneurs Docker peuvent vous aider à identifier la source du problème. Pour les consulter, utilisez la commande suivante :

```bash
poetry run logs
```

Si le problème persiste, veuillez contacter [magicAyyub](https://github.com/magicAyyub)ou ouvrir une issue sur le dépôt GitHub.

