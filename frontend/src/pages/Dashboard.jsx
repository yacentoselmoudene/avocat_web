import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const [nbClients, setNbClients] = useState(0);
  const [nbAffaires, setNbAffaires] = useState(0);
  const [nbContrats, setNbContrats] = useState(0);

  useEffect(() => {
    //nombre de clients
    api.get("clients/")
      .then(res => setNbClients(res.data.length))
      .catch(() => {});
    // nombre d'affaires
    api.get("affairejudiciaires/")
      .then(res => setNbAffaires(res.data.length))
      .catch(() => {});
    // nombre de contrats
    api.get("contrats/")
      .then(res => setNbContrats(res.data.length))
      .catch(() => {});
  }, []);

  // Fonction pour gérer la création d'une nouvelle affaire
  const handleNouvelleAffaire = () => {
    // Rediriger vers la page des affaires avec un modal d'ouverture
    window.location.href = '/affaires?action=create';
  };

  // Fonction pour gérer la création d'un nouveau rendez-vous
  const handleNouveauRendezVous = () => {
    // Rediriger vers la page agenda avec un modal d'ouverture
    window.location.href = '/agenda?action=create';
  };

  const services = [
    {
      id: "clients",
      title: t('Gestion des Clients'),
      description: t('Gérez vos clients, leurs informations et leurs contrats'),
      icon: "👥",
      color: "var(--primary-blue)",
      link: "/clients"
    },
    {
      id: "affaires",
      title: t('Affaires Judiciaires'),
      description: t('Suivez vos dossiers et affaires en cours'),
      icon: "⚖️",
      color: "var(--dark-blue)",
      link: "/affaires"
    },
    {
      id: "contrats",
      title: t('Contrats et Documents'),
      description: t('Consultez et gérez les contrats de vos clients'),
      icon: "📄",
      color: "var(--light-blue)",
      link: "/documents"
    },
    {
      id: "factures",
      title: t('Factures'),
      description: t('Consultez et suivez les factures émises et impayées'),
      icon: "💳",
      color: "var(--gold)",
      link: "/factures"
    },
    {
      id: "statistiques",
      title: t('Statistiques'),
      description: t('Visualisez les statistiques de votre cabinet'),
      icon: "📊",
      color: "var(--gold)",
      link: "#"
    }
  ];

  return (
    <div className="container">
      {/* Hero Section  */}
      <div className="text-center mb-6">
        <h1 style={{
          fontSize: "3rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, var(--gold) 0%, var(--light-gold) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          {t('Cabinet d\'Avocat')}
        </h1>
        <h2 style={{
          fontSize: "2rem",
          color: "var(--primary-blue)",
          marginBottom: "1rem",
          position: "relative"
        }}>
          {t('Système de Gestion')}
          <div style={{
            width: "100px",
            height: "3px",
            background: "var(--primary-blue)",
            margin: "1rem auto 0",
            borderRadius: "2px"
          }}></div>
        </h2>
        <p style={{
          fontSize: "1.1rem",
          color: "var(--text-light)",
          maxWidth: "600px",
          margin: "0 auto",
          lineHeight: "1.6"
        }}>
          {t('Plateforme de gestion complète pour votre cabinet d\'avocat. Gérez vos clients, suivez vos affaires et optimisez votre pratique juridique.')}
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="card mb-6" style={{
        background: "var(--white)",
        maxWidth: "600px",
        margin: "0 auto 2rem"
      }}>
        <div style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center"
        }}>
          <input
            type="text"
            placeholder={t('Recherche de cas similaires...')}
            style={{
              flex: 1,
              fontSize: "1rem"
            }}
          />
          <button className="btn-gold">
            🔍 {t('Rechercher')}
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="mt-6" style={{ marginBottom: 48 }}>
        <h3 style={{
          color: "var(--primary-blue)",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          {t('Aperçu rapide')}
        </h3>

        <div className="grid grid-3 gap-4">
          <div className="card text-center">
            <div style={{
              fontSize: "2rem",
              color: "var(--primary-blue)",
              marginBottom: "0.5rem"
            }}>
              📈
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--dark-blue)" }}>
              {t('Clients actifs')}
            </h4>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--gold)", margin: 0 }}>
              {nbClients}
            </p>
          </div>

          <div className="card text-center">
            <div style={{
              fontSize: "2rem",
              color: "var(--primary-blue)",
              marginBottom: "0.5rem"
            }}>
              ⚖️
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--dark-blue)" }}>
              {t('Affaires en cours')}
            </h4>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--gold)", margin: 0 }}>
              {nbAffaires}
            </p>
          </div>

          <div className="card text-center">
            <div style={{
              fontSize: "2rem",
              color: "var(--primary-blue)",
              marginBottom: "0.5rem"
            }}>
              📄
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--dark-blue)" }}>
              {t('Contrats actifs')}
            </h4>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--gold)", margin: 0 }}>
              {nbContrats}
            </p>
          </div>
        </div>
      </div>

      {/* Actions rapides - Section pour les actions les plus fréquentes */}
      <div className="mt-6" style={{ marginBottom: 48 }}>
        <h3 style={{
          color: "var(--primary-blue)",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          {t('Actions rapides')}
        </h3>

        <div className="grid grid-3 gap-4">
          {/* Bouton Nouvelle affaire */}
          <div className="card text-center" style={{
            cursor: "pointer",
            transition: "transform 0.2s ease-in-out",
            border: "2px solid var(--primary-blue)"
          }}
          onClick={handleNouvelleAffaire}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            <div style={{
              fontSize: "2.5rem",
              color: "var(--primary-blue)",
              marginBottom: "1rem"
            }}>
              ⚖️
            </div>
            <h4 style={{ 
              margin: "0 0 0.5rem 0", 
              color: "var(--dark-blue)",
              fontSize: "1.1rem"
            }}>
              {t('Nouvelle affaire')}
            </h4>
            <p style={{ 
              fontSize: "0.9rem", 
              color: "var(--text-light)", 
              margin: 0,
              lineHeight: "1.4"
            }}>
              {t('Créer un nouveau dossier judiciaire')}
            </p>
          </div>

          {/* Bouton Nouveau rendez-vous */}
          <div className="card text-center" style={{
            cursor: "pointer",
            transition: "transform 0.2s ease-in-out",
            border: "2px solid var(--dark-blue)"
          }}
          onClick={handleNouveauRendezVous}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            <div style={{
              fontSize: "2.5rem",
              color: "var(--dark-blue)",
              marginBottom: "1rem"
            }}>
              📅
            </div>
            <h4 style={{ 
              margin: "0 0 0.5rem 0", 
              color: "var(--dark-blue)",
              fontSize: "1.1rem"
            }}>
              {t('Nouveau rendez-vous')}
            </h4>
            <p style={{ 
              fontSize: "0.9rem", 
              color: "var(--text-light)", 
              margin: 0,
              lineHeight: "1.4"
            }}>
              {t('Planifier une audience ou consultation')}
            </p>
          </div>

          {/* Bouton Voir agenda complet */}
          <Link to="/agenda" style={{ textDecoration: "none" }}>
            <div className="card text-center" style={{
              cursor: "pointer",
              transition: "transform 0.2s ease-in-out",
              border: "2px solid var(--gold)"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <div style={{
                fontSize: "2.5rem",
                color: "var(--gold)",
                marginBottom: "1rem"
              }}>
                📋
              </div>
              <h4 style={{ 
                margin: "0 0 0.5rem 0", 
                color: "var(--dark-blue)",
                fontSize: "1.1rem"
              }}>
                {t('Voir agenda complet')}
              </h4>
              <p style={{ 
                fontSize: "0.9rem", 
                color: "var(--text-light)", 
                margin: 0,
                lineHeight: "1.4"
              }}>
                {t('Consulter tous les rendez-vous')}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Cartes de services  */}
      <div className="grid grid-4 gap-6">
        {services.map((service) => (
          <Link
            key={service.id}
            to={service.link}
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{
              textAlign: "center",
              cursor: "pointer",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{
                  fontSize: "3rem",
                  marginBottom: "1rem"
                }}>
                  {service.icon}
                </div>
                <h3 style={{
                  color: service.color,
                  marginBottom: "0.5rem",
                  fontSize: "1.25rem"
                }}>
                  {service.title}
                </h3>
                <p style={{
                  color: "var(--text-light)",
                  fontSize: "0.9rem",
                  lineHeight: "1.4"
                }}>
                  {service.description}
                </p>
              </div>

              <button
                className="btn-primary"
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                {t('Accéder au service')} ←
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
