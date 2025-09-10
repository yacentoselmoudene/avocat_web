# pour envoyer des notifications push via Firebase Cloud Messaging (FCM) ur les téléphones et navigateurs

import os
import json
import time
from typing import List, Dict, Any, Optional

import requests


def _get_project_id_from_sa(sa: Dict[str, Any]) -> Optional[str]:
    # Récupère l'ID du projet Firebase depuis le fichier de service account
    return sa.get("project_id")


def _get_access_token(creds_path: str) -> Optional[str]:
    # Obtient un token d'accès OAuth2 à partir du fichier de service account pour authentifier les requêtes vers l'API Firebase

    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request
    except Exception:
        return None

    # Définit les permissions nécessaires : envoi de messages FCM
    scopes = ["https://www.googleapis.com/auth/firebase.messaging"]
    
    # Charge les credentials depuis le fichier JSON
    credentials = service_account.Credentials.from_service_account_file(
        creds_path, scopes=scopes
    )
    
    # refresh du token pour s'assurer qu il est valide
    credentials.refresh(Request())
    return credentials.token


def _stringify_data_values(data: Optional[Dict[str, Any]]) -> Dict[str, str]:
    # Convertit toutes les valeurs en chaînes de caractères , pas en objets ou nombres , exigé par fcm
    if not data:
        return {}
    
    string_data: Dict[str, str] = {}
    for k, v in data.items():
        try:
            # Si c'est déjà une chaîne, on la garde , si un objet ou liste on le convertit en JSON,sinon en chaîne
            string_data[str(k)] = v if isinstance(v, str) else json.dumps(v) if isinstance(v, (dict, list)) else str(v)
        except Exception:
            # En cas d'erreur, on convertit en chaîne
            string_data[str(k)] = str(v)
    return string_data


def send_push(tokens: List[str], title: str, body: str, data: Optional[Dict[str, Any]] = None) -> int:

    # Envoie des notifications push via FCM HTTP v1 (une requête par token).
    
    # params :
    # - tokens: Liste des identifiants des appareils qui recevront la notification
    # - title: Titre de la notification
    # - body: Contenu de la notification
    # - data: Données personnalisées
    #
    # Prérequis dans dossier  .env:
    #   - FIREBASE_CREDENTIALS= path/service_account.json
    #   - FIREBASE_PROJECT_ID

    # Retourne le nombre de notifications envoyées avec succès (approx.).

    # Recupere le chemin vers le fichier de credentials depuis .env
    sa_path = os.getenv("FIREBASE_CREDENTIALS")
    if not sa_path or not os.path.exists(sa_path):
        return 0

    # Charge le fichier de service account pour recuperer l'ID du projet
    try:
        with open(sa_path, "r", encoding="utf-8") as f:
            sa = json.load(f)
    except Exception:
        return 0

    # Récupère l'ID du projet Firebase depuis .env ou  le fichier de credentials
    project_id = os.getenv("FIREBASE_PROJECT_ID") or _get_project_id_from_sa(sa)
    if not project_id:
        return 0

    # Obtient un token d'accès valide pour l'API Firebase
    access_token = _get_access_token(sa_path)
    if not access_token:
        return 0

    # Construit l'URL de l'API FCM avec l'ID du projet
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    
    # Crée une session HTTP pour réutiliser la connexion

    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
    })

    success = 0  # Compteur de notifications envoyées avec succès
    
    # Convertit les données  en chaînes ,requis par FCM
    payload_data = _stringify_data_values(data)
    
    # Envoie une notification à chaque appareil
    for token in tokens:
        # Construit le message selon le format FCM
        message = {
            "message": {
                "token": token,  # Identifiant de l'appareil
                "notification": {
                    "title": title,  # Titre affiché au user
                    "body": body,    # Contenu affiché au user
                },
                "data": payload_data,  # data personnalisée invisible pour user
                "android": {"priority": "high"},  # priorité haute pour Android
            }
        }

        retried = False  # Flag pour éviter les boucles infinies de retry
        
        # Boucle de retry en cas d'erreur
        while True:
            try:
                # Envoie la requête à l'API FCM
                resp = session.post(url, json=message, timeout=10)
                status = resp.status_code
                
                # si succes on sort de la boucle
                if status in (200, 201):
                    success += 1
                    break
                
                # si Token expiré on rafraîchit et on retente une fois
                if status == 401 and not retried:
                    new_token = _get_access_token(sa_path)
                    if not new_token:
                        break
                    access_token = new_token
                    session.headers.update({"Authorization": f"Bearer {access_token}"})
                    retried = True
                    continue
                
                # Erreur serveur on attend  et on retente
                if status in (429, 500, 502, 503, 504) and not retried:
                    time.sleep(0.5)  # 0.5 seconde
                    retried = True
                    continue
                

                break
                
            except Exception:
                # En cas d'erreur réseau, on ignore pour ne pas casser la logique métier
                break

    return success


