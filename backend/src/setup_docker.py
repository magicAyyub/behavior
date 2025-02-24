import os
import sys
from pathlib import Path
import subprocess

def get_user_input(prompt, default=None, required=True):
    """
    Récupère une entrée utilisateur avec un message personnalisé, 
    un défaut facultatif, et vérifie si la valeur est requise.
    """
    while True:
        user_input = input(f"{prompt} ({'Default: ' + default if default else 'Required'}): ").strip()
        if user_input:
            return user_input
        elif default is not None:
            return default
        elif required:
            print("❌ This field is required. Please provide a value.")
        else:
            return ""

def create_env_file(env_path):
    """
    Crée un fichier .env basé sur les entrées de l'utilisateur.
    """
    print("\n--- Configuration des variables d'environnement ---")
    mongo_user = get_user_input("Database user", default="admin")
    mongo_password = get_user_input("Database password", required=True)
    mongo_host = get_user_input("Database host", default="db")
    mongo_port = get_user_input("Database port", default="5432")

    env_content = (
        f"DB_USER={mongo_user}\n"
        f"DB_PASSWORD={mongo_password}\n"
        f"DB_HOST={mongo_host}\n"
        f"DB_PORT={mongo_port}\n"
        "DB_NAME=data\n"
    )

    with open(env_path, "w") as env_file:
        env_file.write(env_content)
    print(f"✅ Fichier .env créé avec succès à : {env_path}")

def check_docker_compose():
    """
    Vérifie si Docker et Docker Compose sont installés.
    """
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        print("✅ Docker et Docker Compose sont installés.")
    except FileNotFoundError:
        print("❌ Docker ou Docker Compose n'est pas installé. Veuillez l'installer avant de continuer.")
        exit(1)

def build_and_run_docker():
    """
    Lance la construction et l'exécution avec docker-compose.
    """
    try:
        print("\n--- Lancement de Docker Compose ---")
        print("⚠️  Cela peut prendre un certain temps pour la première")
        subprocess.run(["docker-compose", "up", "--build", "-d"], check=True)
        print("✅ Docker Compose a été lancé avec succès.")
    except subprocess.CalledProcessError:
        print("❌ Une erreur est survenue lors de l'exécution de Docker Compose. Assurez-vous que Docker-desktop est en cours d'exécution.")
        exit(1)

def stop_docker():
    """
    Arrête les conteneurs Docker.
    """
    try:
        print("\n--- Arrêt de Docker Compose ---")
        subprocess.run(["docker-compose", "down"], check=True)
        print("✅ Docker Compose a été arrêté avec succès.")
    except subprocess.CalledProcessError:
        print("❌ Une erreur est survenue lors de l'arrêt de Docker Compose.")
        exit(1)

def remove_docker_volumes():
    """
    Supprime les volumes Docker.
    """
    try:
        print("\n--- Suppression des volumes Docker ---")
        subprocess.run(["docker-compose", "down", "-v"], check=True)
        print("✅ Les volumes Docker ont été supprimés avec succès.")
    except subprocess.CalledProcessError:
        print("❌ Une erreur est survenue lors de la suppression des volumes Docker.")
        exit(1)
def show_docker_logs():
    """
    Affiche les logs des conteneurs Docker.
    """
    try:
        print("\n--- Affichage des logs Docker ---")
        subprocess.run(["docker-compose", "logs"], check=True)
    except subprocess.CalledProcessError:
        print("❌ Une erreur est survenue lors de l'affichage des logs Docker.")
        exit(1)

def reset_docker():
    """
    Réinitialise les conteneurs Docker.
    """
    stop_docker()
    remove_docker_volumes()
    build_and_run_docker()
        

def setup():
    """
    Point d'entrée principal du script.
    """
    print("⚙️  Initialisation de la configuration Docker et du fichier .env")
    root_path = Path(__file__).parent.parent
    env_path = root_path / ".env"

    # Création du fichier .env
    create_env_file(env_path)

    # Lancement de docker-compose
    build_and_run_docker()
