import React, { useEffect, useState } from "react";
import api from "../api/axios";

// menu de configuration
const TABLES = [
  {
    key: "fonctionclients",
    label: "Fonctions du client",
    field: "libellefonction",
  },
  {
    key: "typeaffaires",
    label: "categories d'affaire",
    field: "libelletypeaffaire",
  },
  { key: "typeclients", label: "Types de client", field: "libelletypeclient" },
  {
    key: "statutaffaires",
    label: "Statuts d'affaire",
    field: "libellestatutaffaire",
  },
  {
    key: "etapejudiciaires",
    label: "Étapes judiciaires",
    field: "libelletypeetape",
  },
  { key: "tribunals", label: "Tribunaux", field: "nomtribunal" },
  {
    key: "typetribunals",
    label: "Types de tribunal",
    field: "libelletypetribunal",
  },
  {
    key: "typeavertissements",
    label: "Types d'avertissement",
    field: "libelle",
  },
  { key: "typedemandes", label: "Types de demande", field: "libelle" },
  {
    key: "typeinterventions",
    label: "Types d'intervention",
    field: "libelletypeintervention",
  },
];

export default function ConfigModal({ onClose }) {
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);
  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get(`/api/${selectedTable.key}/`);
        setItems(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      }
    };
    fetchItems();
    setEditIndex(null);
    setError("");
  }, [selectedTable]);

  const handleAdd = async () => {
    if (!newValue.trim()) return;

    // Vérification d'existence pour les statuts d'affaire
    if (selectedTable.key === "statutaffaires") {
      const exists = items.some(
        (item) =>
          item.libellestatutaffaire.trim().toLowerCase() ===
          newValue.trim().toLowerCase(),
      );
      if (exists) {
        setError("Ce statut existe déjà !");
        return;
      }
    }

    // Vérification d'existence pour les types d'intervention
    if (selectedTable.key === "typeinterventions") {
      const exists = items.some(
        (item) =>
          item.libelletypeintervention.trim().toLowerCase() ===
          newValue.trim().toLowerCase(),
      );
      if (exists) {
        setError("Ce type d'intervention existe déjà !");
        return;
      }
    }

    try {
      let dataToSend = { [selectedTable.field]: newValue };

      // Gestion spéciale pour TypeDemande
      if (selectedTable.key === "typedemandes") {
        dataToSend = {
          libelle: newValue,
          libelle_ar: newValue, // Même valeur que libelle
          categorie: "CIVIL",
          delai_legal: 0,
          actif: true,
          notification_automatique: false,
          description: "",
          documents_requis: "",
        };
      }

      // Gestion spéciale pour TypeAvertissement
      if (selectedTable.key === "typeavertissements") {
        dataToSend = {
          libelle: newValue,
          libelle_ar: newValue, // Même valeur que libelle
          categorie: "CIVIL",
          delai_legal: 0,
          obligatoire: true,
          actif: true,
          notification_automatique: false,
          description: "",
        };
      }

      console.log("Données envoyées:", dataToSend);
      await api.post(`/api/${selectedTable.key}/`, dataToSend);
      setNewValue("");
      const res = await api.get(`/api/${selectedTable.key}/`);
      setItems(res.data);
      setError(""); // Effacer les erreurs précédentes
    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data);
      setError(
        "Erreur lors de l'ajout: " +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }
  };

  const handleEdit = async (item, index) => {
    try {
      console.log("Modification de l'élément:", item);
      console.log("Nouvelle valeur:", editValue);

      //  récupérer l'ID selon la table
      let itemId;
      if (selectedTable.key === "fonctionclients") {
        itemId = item.idfonction;
      } else if (selectedTable.key === "typeaffaires") {
        itemId = item.idtypeaffaire;
      } else if (selectedTable.key === "typeclients") {
        itemId = item.idtypeclient;
      } else if (selectedTable.key === "statutaffaires") {
        itemId = item.idstatutaffaire;
      } else if (selectedTable.key === "tribunals") {
        itemId = item.idtribunal;
      } else if (selectedTable.key === "typetribunals") {
        itemId = item.idtypetribunal;
      } else if (selectedTable.key === "typeavertissements") {
        itemId = item.idtypeavertissement;
      } else if (selectedTable.key === "typedemandes") {
        itemId = item.idtypedemande;
      } else if (selectedTable.key === "typeinterventions") {
        itemId = item.idtypeintervention;
      } else {
        itemId = item.id || item[`id${selectedTable.key.slice(0, -1)}`];
      }

      console.log("ID de l'élément:", itemId);
      console.log("URL:", `/api/${selectedTable.key}/${itemId}/`);

      await api.patch(`/api/${selectedTable.key}/${itemId}/`, {
        [selectedTable.field]: editValue,
      });
      setEditIndex(null);
      const res = await api.get(`/api/${selectedTable.key}/`);
      setItems(res.data);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(
        "Erreur lors de la modification: " +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      //  l'ID selon la table
      let itemId;
      if (selectedTable.key === "fonctionclients") {
        itemId = item.idfonction;
      } else if (selectedTable.key === "typeaffaires") {
        itemId = item.idtypeaffaire;
      } else if (selectedTable.key === "typeclients") {
        itemId = item.idtypeclient;
      } else if (selectedTable.key === "statutaffaires") {
        itemId = item.idstatutaffaire;
      } else if (selectedTable.key === "tribunals") {
        itemId = item.idtribunal;
      } else if (selectedTable.key === "typetribunals") {
        itemId = item.idtypetribunal;
      } else {
        itemId = item.id || item[`id${selectedTable.key.slice(0, -1)}`];
      }

      await api.delete(`/api/${selectedTable.key}/${itemId}/`);
      const res = await api.get(`/api/${selectedTable.key}/`);
      setItems(res.data);
    } catch (err) {
      setError(
        "Erreur lors de la suppression: " +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }
  };

  // Filtrage des doublons pour les statuts d'affaire
  let itemsToDisplay = items;
  if (selectedTable.key === "statutaffaires") {
    itemsToDisplay = items.filter(
      (s, idx, arr) =>
        arr.findIndex(
          (x) =>
            (x.libellestatutaffaire || "").trim().toLowerCase() ===
            (s.libellestatutaffaire || "").trim().toLowerCase(),
        ) === idx,
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 800,
          width: "90%",
          maxHeight: "80vh",
          boxShadow: "0 8px 32px #0002",
          position: "relative",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#e53935",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 18,
            padding: "4px 12px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          X
        </button>
        <div style={{ display: "flex", height: "70vh" }}>
          {/* Sidebar */}
          <div
            style={{
              minWidth: 180,
              borderRight: "1px solid #e0e0e0",
              padding: 16,
              overflowY: "auto",
            }}
          >
            {TABLES.map((t) => (
              <div
                key={t.key}
                onClick={() => setSelectedTable(t)}
                style={{
                  padding: "10px 8px",
                  cursor: "pointer",
                  background:
                    selectedTable.key === t.key ? "#1976d2" : "transparent",
                  color: selectedTable.key === t.key ? "#fff" : "#1a237e",
                  borderRadius: 6,
                  marginBottom: 6,
                  fontWeight: "bold",
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
          {/* Zone centrale */}
          <div
            style={{
              flex: 1,
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ color: "#1976d2", marginTop: 0, marginBottom: 16 }}>
              {selectedTable.label}
            </h3>
            {error && (
              <div style={{ color: "#e53935", marginBottom: 8 }}>{error}</div>
            )}

            {/* scroll pour la liste */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              <table
                style={{
                  width: "100%",
                  background: "#f5f6fa",
                  borderRadius: 8,
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f5f6fa",
                    zIndex: 5,
                  }}
                >
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>Libellé</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8 }}>
                        {editIndex === idx ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: 14,
                              borderRadius: 4,
                              border: "1px solid #e0e0e0",
                              outline: "none",
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleEdit(item, idx);
                              }
                            }}
                          />
                        ) : (
                          item[selectedTable.field]
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        {editIndex === idx ? (
                          <>
                            <button
                              onClick={() => handleEdit(item, idx)}
                              style={{
                                marginRight: 8,
                                color: "#1976d2",
                                background: "#fff",
                                border: "1px solid #1976d2",
                                borderRadius: 4,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => setEditIndex(null)}
                              style={{
                                background: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 4,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditIndex(idx);
                                setEditValue(item[selectedTable.field]);
                              }}
                              style={{
                                marginRight: 8,
                                color: "#1976d2",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                              }}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              style={{
                                color: "#e53935",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                              }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zone d'ajout  */}
            <div
              style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: 16,
                background: "#fff",
                borderRadius: "0 0 8px 8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`Ajouter ${selectedTable.label.toLowerCase()}`}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontSize: 15,
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
                    outline: "none",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAdd();
                    }
                  }}
                />
                <button
                  onClick={handleAdd}
                  style={{
                    color: "#fff",
                    background: "#43a047",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
