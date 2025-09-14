import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import RendezVousCard from "../components/RendezVousCard";
import RendezVousModal from "../components/RendezVousModal";

const AgendaPage = () => {
  const { t } = useTranslation();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    statut: "",
    dateDebut: "",
    dateFin: "",
    search: "",
  });
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRendezVous, setEditingRendezVous] = useState(null);
  const [selectedAffaire, setSelectedAffaire] = useState(null);

  useEffect(() => {
    loadRendezVous();

    // Vérification les paramètres d'URL pour scroll vers un RDV spécifique
    const urlParams = new URLSearchParams(window.location.search);
    const rdvId = urlParams.get("rdv_id");
    const affaireId = urlParams.get("affaire_id");
    const action = urlParams.get("action");

    if (rdvId) {
      // Scroll vers le RDV spécifique après le chargement
      setTimeout(() => {
        const rdvElement = document.getElementById(`rdv-${rdvId}`);
        if (rdvElement) {
          rdvElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Ajouter un effet visuel temporaire
          rdvElement.style.boxShadow = "0 0 20px rgba(25, 118, 210, 0.5)";
          setTimeout(() => {
            rdvElement.style.boxShadow = "";
          }, 3000);
        }
      }, 500);
    }

    if (affaireId) {
      // Pré-remplir le modal avec l'affaire sélectionnée
      setSelectedAffaire({ idaffaire: affaireId });
      setModalOpen(true);
    }


    if (action === "create") {
      // Ouvrir automatiquement le modal de création
      setModalOpen(true);


      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const loadRendezVous = async () => {
    try {
      setLoading(true);
      const response = await api.get("audiences/", {
        params: {
          future_only: true,
        },
      });
      setRendezVous(response.data);
    } catch (err) {
      setError(t("Erreur lors du chargement des rendez-vous"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRendezVous = async (rendezVous) => {
    try {
      // Charger l'affaire associée
      if (rendezVous.idaffaire) {
        const affaireResponse = await api.get(
          `/api/affaires/${rendezVous.idaffaire}/`,
        );
        setSelectedAffaire(affaireResponse.data);
      } else {
        setSelectedAffaire(null);
      }
      setEditingRendezVous(rendezVous);
      setModalOpen(true);
    } catch (error) {
      console.error("Erreur lors du chargement de l'affaire:", error);
      setSelectedAffaire(null);
      setEditingRendezVous(rendezVous);
      setModalOpen(true);
    }
  };

  const handleDeleteRendezVous = async (rendezVous) => {
    if (
      !window.confirm(t("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?"))
    ) {
      return;
    }

    try {
      await api.delete(`/api/audiences/${rendezVous.idaudience}/`);
      await loadRendezVous();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(t("Erreur lors de la suppression du rendez-vous"));
    }
  };

  const handleConfirmRendezVous = async (rendezVous) => {
    try {
      await api.patch(`/api/audiences/${rendezVous.idaudience}/`, {
        statut: "CONFIRME",
      });
      await loadRendezVous();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      alert(t("Erreur lors de la confirmation du rendez-vous"));
    }
  };

  const handleCancelRendezVous = async (rendezVous) => {
    try {
      await api.patch(`/api/audiences/${rendezVous.idaudience}/`, {
        statut: "ANNULE",
      });
      await loadRendezVous();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      alert(t("Erreur lors de l'annulation du rendez-vous"));
    }
  };

  const handleModalSave = async (savedRendezVous) => {
    await loadRendezVous();
    setModalOpen(false);
    setEditingRendezVous(null);
    setSelectedAffaire(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingRendezVous(null);
    setSelectedAffaire(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const filteredRendezVous = rendezVous.filter((rdv) => {
    // Filtre par type
    if (filters.type && rdv.type_rendez_vous !== filters.type) {
      return false;
    }

    // Filtre par statut
    if (filters.statut && rdv.statut !== filters.statut) {
      return false;
    }

    // Filtre par date début
    if (
      filters.dateDebut &&
      new Date(rdv.dateaudience) < new Date(filters.dateDebut)
    ) {
      return false;
    }

    // Filtre par date fin
    if (
      filters.dateFin &&
      new Date(rdv.dateaudience) > new Date(filters.dateFin)
    ) {
      return false;
    }

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchFields = [
        rdv.titre,
        rdv.description,
        rdv.lieu,
        rdv.idaffaire?.numero_dossier,
        rdv.idtribunal?.nomtribunal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchFields.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const getTypeStats = () => {
    const labelMap = {
      AUDIENCE: t("Audience judiciaire"),
      CONSULTATION: t("Consultation avocat-client"),
      REUNION: t("Réunion de préparation"),
      SIGNATURE: t("Signature de documents"),
      AUTRE: t("Autre"),
    };
    const stats = {};
    rendezVous.forEach((rdv) => {
      // Utiliser la même logique que getTypeLabel() dans RendezVousCard
      let code = "AUTRE";
      
      // 1) priorité au display envoyé par l'API
      if (rdv.type_rendez_vous_display && typeof rdv.type_rendez_vous_display === "string" && rdv.type_rendez_vous_display.trim().length > 0) {
        code = rdv.type_rendez_vous_display.trim().toUpperCase();
      }
      // 2) fallback au code
      else if (rdv.type_rendez_vous && typeof rdv.type_rendez_vous === "string" && rdv.type_rendez_vous.trim().length > 0) {
        code = rdv.type_rendez_vous.trim().toUpperCase();
      }
      
      // Vérifier si le code est reconnu
      const label = labelMap[code];
      if (!label) {
        // Si le type n'est pas reconnu, l'ajouter comme "Autre"
        code = "AUTRE";
      }
      
      stats[code] = (stats[code] || 0) + 1;
    });
    return stats;
  };

  const typeStats = getTypeStats();

  const toggleExpand = (rdv) => {
    setExpandedId((prev) => (prev === rdv.idaudience ? null : rdv.idaudience));
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div>⏳ {t("Chargement de l'agenda...")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>📅 {t("Agenda des Rendez-vous")}</h1>
      </div>

      {error && <div style={errorStyle}>❌ {error}</div>}

      {/* Aperçu  */}
      <div style={statsContainerStyle}>
        <div style={statsTitleStyle}>{t("Aperçu des rendez-vous")}</div>
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statNumberStyle}>{rendezVous.length}</div>
            <div style={statLabelStyle}>{t("Total")}</div>
          </div>
          {Object.entries(typeStats)
            .filter(([type]) =>
              ["AUDIENCE", "CONSULTATION", "REUNION", "SIGNATURE", "AUTRE"].includes(
                type,
              ),
            )
            .map(([type, count]) => (
              <div key={type} style={statCardStyle}>
                <div style={statNumberStyle}>{count}</div>
                <div style={statLabelStyle}>
                  {t(
                    type === "AUDIENCE"
                      ? "Audience judiciaire"
                      : type === "CONSULTATION"
                        ? "Consultation avocat-client"
                        : type === "REUNION"
                          ? "Réunion de préparation"
                          : type === "SIGNATURE"
                            ? "Signature de documents"
                            : "Autre",
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Filtres */}
      <div style={filtersContainerStyle}>
        <div style={filtersTitleStyle}>{t("Filtres")}</div>
        <div style={filtersGridStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>{t("Recherche:")}</label>
            <input
              type="text"
              placeholder={t("Titre, lieu, affaire...")}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>{t("Type:")}</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">{t("Tous les types")}</option>
              <option value="AUDIENCE">{t("Audience judiciaire")}</option>
              <option value="CONSULTATION">
                {t("Consultation avocat-client")}
              </option>
              <option value="REUNION">{t("Réunion de préparation")}</option>
              <option value="SIGNATURE">{t("Signature de documents")}</option>
              <option value="AUTRE">{t("Autre")}</option>
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>{t("Statut:")}</label>
            <select
              value={filters.statut}
              onChange={(e) => handleFilterChange("statut", e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">{t("Tous les statuts")}</option>
              <option value="PLANIFIE">{t("Planifié")}</option>
              <option value="CONFIRME">{t("Confirmé")}</option>
              <option value="ANNULE">{t("Annulé")}</option>
              <option value="TERMINE">{t("Terminé")}</option>
              <option value="REPORTE">{t("Reporté")}</option>
            </select>
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>{t("Date début:")}</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) =>
                    handleFilterChange("dateDebut", e.target.value)
                  }
                  style={filterInputStyle}
                />
              </div>
              <div style={filterGroupStyle}>
                <label style={filterLabelStyle}>{t("Date fin:")}</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) =>
                    handleFilterChange("dateFin", e.target.value)
                  }
                  style={filterInputStyle}
                />
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() =>
                  setFilters({
                    type: "",
                    statut: "",
                    dateDebut: "",
                    dateFin: "",
                    search: "",
                  })
                }
                style={{ ...clearFiltersButtonStyle, marginTop: 0 }}
              >
                🗑️ {t("Effacer les filtres")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div style={contentStyle}>
        <div style={resultsHeaderStyle}>
          <h3 style={resultsTitleStyle}>
            📋 {t("Rendez-vous")} ({filteredRendezVous.length})
          </h3>
          <button onClick={loadRendezVous} style={refreshButtonStyle}>
            🔄 {t("Actualiser")}
          </button>
        </div>

        {filteredRendezVous.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📅</div>
            <div style={emptyTitleStyle}>{t("Aucun rendez-vous trouvé")}</div>
            <div style={emptyTextStyle}>
              {filters.search ||
              filters.type ||
              filters.statut ||
              filters.dateDebut ||
              filters.dateFin
                ? t("Essayez de modifier vos filtres")
                : t("Créez votre premier rendez-vous")}
            </div>
          </div>
        ) : (
          <div style={rendezVousGridStyle}>
            {filteredRendezVous.map((rdv) => (
              <div key={rdv.idaudience} id={`rdv-${rdv.idaudience}`}>
                <RendezVousCard
                  rendezVous={rdv}
                  expanded={expandedId === rdv.idaudience}
                  onToggle={() => toggleExpand(rdv)}
                  onAction={async (action, item) => {
                    try {
                      if (action === "EDIT") {
                        await handleEditRendezVous(item);
                      } else if (action === "DELETE") {
                        await handleDeleteRendezVous(item);
                      } else if (action === "CONFIRME") {
                        await handleConfirmRendezVous(item);
                      } else if (action === "ANNULE") {
                        await handleCancelRendezVous(item);
                      }
                    } catch (e) {
                      console.error("Erreur action RDV", e);
                      alert("Erreur lors de l'action sur le rendez-vous");
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'édition/création de rendez-vous */}
      <RendezVousModal
        isOpen={modalOpen}
        affaire={selectedAffaire}
        rendezVous={editingRendezVous}
        isEdit={!!editingRendezVous}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </div>
  );
};

// Styles
const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "2rem",
  background: "#f5f6fa",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
};

const titleStyle = {
  color: "#1a237e",
  margin: 0,
  fontSize: "2rem",
};

const createButtonStyle = {
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 24px",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const loadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "200px",
  fontSize: "1.2rem",
  color: "#666",
};

const errorStyle = {
  background: "#ffebee",
  color: "#c62828",
  padding: "12px 16px",
  borderRadius: "8px",
  marginBottom: "1rem",
  border: "1px solid #ffcdd2",
};

const statsContainerStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "2rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const statsTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: "600",
  color: "#1a237e",
  marginBottom: "1rem",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "1rem",
};

const statCardStyle = {
  background: "#f8f9fa",
  padding: "1rem",
  borderRadius: "8px",
  textAlign: "center",
  border: "1px solid #e9ecef",
};

const statNumberStyle = {
  fontSize: "2rem",
  fontWeight: "bold",
  color: "#1a237e",
  marginBottom: "0.5rem",
};

const statLabelStyle = {
  fontSize: "0.9rem",
  color: "#666",
};

const filtersContainerStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "2rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const filtersTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: "600",
  color: "#1a237e",
  marginBottom: "1rem",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
};

//  toolbar combinée
const toolbarStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "1rem 1.25rem",
  marginBottom: "1rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};
const toolbarLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};
const toolbarRightStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.75rem",
  alignItems: "end",
};
const toolbarStatStyle = {
  background: "#f5f6fa",
  border: "1px solid #e9ecef",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "0.9rem",
};
const toolbarStatBadge = {
  background: "#eef3ff",
  border: "1px solid #d6e4ff",
  padding: "6px 10px",
  borderRadius: "8px",
  fontSize: "0.85rem",
};

const filterGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const filterLabelStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#333",
};

const filterInputStyle = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "0.9rem",
};

const filterSelectStyle = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "0.9rem",
  background: "white",
};

const clearFiltersButtonStyle = {
  background: "#f44336",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 16px",
  fontSize: "0.9rem",
  cursor: "pointer",
  marginTop: "1.5rem",
};

const contentStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const resultsHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
};

const resultsTitleStyle = {
  color: "#1a237e",
  margin: 0,
};

const refreshButtonStyle = {
  background: "#2196F3",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 16px",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "3rem 1rem",
};

const emptyIconStyle = {
  fontSize: "4rem",
  marginBottom: "1rem",
};

const emptyTitleStyle = {
  fontSize: "1.5rem",
  fontWeight: "600",
  color: "#1a237e",
  marginBottom: "0.5rem",
};

const emptyTextStyle = {
  color: "#666",
  marginBottom: "2rem",
};

const createFirstButtonStyle = {
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 24px",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
};

const rendezVousGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "1.5rem",
};

export default AgendaPage;
