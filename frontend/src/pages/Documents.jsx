import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchTousDocuments } from "../api/documents";

export default function Documents() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [searchClient, setSearchClient] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchTousDocuments()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError(t("Erreur lors du chargement des fichiers")))
      .finally(() => setLoading(false));
  }, [t]);

  // Couleur discrète par type pour un badge lisible
  const getTypeStyles = (type) => {
    const base = {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
    };
    switch (type) {
      case "CONTRAT":
        return { ...base, background: "#DBEAFE", color: "#1E3A8A" };
      case "JUGEMENT":
        return { ...base, background: "#E0E7FF", color: "#3730A3" };
      case "FACTURE":
        return { ...base, background: "#FEF3C7", color: "#92400E" };
      case "PIECE_PROCEDURE":
        return { ...base, background: "#DCFCE7", color: "#065F46" };
      default:
        return { ...base, background: "#F3F4F6", color: "#374151" };
    }
  };

  const grouped = useMemo(() => {
    const groups = {};
    for (const doc of items) {
      const key = doc.type_fichier || "AUTRE";
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [items]);

  // Types disponibles pour le filtre (basé sur doc_type ou type_fichier)
  const allTypes = useMemo(() => {
    const s = new Set();
    for (const d of items) {
      s.add(d.type_fichier || d.doc_type || "AUTRE");
    }
    return ["ALL", ...Array.from(s).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const byType =
      filterType === "ALL"
        ? items
        : items.filter(
            (d) => (d.type_fichier || d.doc_type || "AUTRE") === filterType,
          );
    const term = searchClient.trim().toLowerCase();
    if (!term) return byType;
    return byType.filter((d) =>
      (d.client_nom || "").toLowerCase().includes(term),
    );
  }, [items, filterType, searchClient]);

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <h3 style={{ margin: "0 0 12px 0", color: "var(--primary-blue)" }}>
        {t("Contrats et Documents")}
      </h3>

      {loading && <div className="card">{t("Chargement...")}</div>}
      {error && (
        <div className="card" style={{ color: "crimson" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {/* Barre de filtre */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "10px 12px",
              borderBottom: "1px solid var(--border-color)",
              background: "#FAFBFC",
            }}
          >
            <label htmlFor="docType" style={{ fontWeight: 600 }}>
              {t("Type de document")}:
            </label>
            <select
              id="docType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {allTypes.map((tp) => (
                <option key={tp} value={tp}>
                  {tp === "ALL" ? t("Tous") : tp}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t("Rechercher par client...")}
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              style={{ flex: 1, maxWidth: 320 }}
            />
            <span style={{ color: "var(--text-light)", marginLeft: "auto" }}>
              {t("Total")}: {filteredItems.length}
            </span>
          </div>
          <table
            style={{
              width: "100%",
              minWidth: 960,
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  background: "#f8fafc",
                  borderBottom: "1px solid var(--border-color)",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                }}
              >
                <th style={{ padding: "12px" }}>
                  {t("Dossier (N°/Code/Année)")}
                </th>
                <th style={{ padding: "12px" }}>{t("Client")}</th>
                <th style={{ padding: "12px" }}>{t("Type")}</th>
                <th style={{ padding: "12px" }}>{t("Nom du fichier")}</th>
                <th style={{ padding: "12px", textAlign: "right" }}>
                  {t("Télécharger")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems
                .slice()
                .sort((a, b) =>
                  (b.date_upload || "").localeCompare(a.date_upload || ""),
                )
                .map((d, idx) => (
                  <tr
                    key={d.id}
                    style={{
                      borderTop: "1px solid var(--border-color)",
                      background: idx % 2 ? "#FBFDFF" : "#FFFFFF",
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      {(d.affaire_numero_dossier || "-") +
                        "/" +
                        (d.affaire_code_dossier || "-") +
                        "/" +
                        (d.affaire_annee_dossier || "-")}
                    </td>
                    <td style={{ padding: "12px" }}>{d.client_nom || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={getTypeStyles(
                          d.type_fichier || d.doc_type || "AUTRE",
                        )}
                      >
                        {d.type_fichier || d.doc_type || "AUTRE"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", maxWidth: 420 }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={d.nom_fichier}
                        >
                          {d.nom_fichier}
                        </strong>
                        {d.description && (
                          <span
                            style={{
                              color: "var(--text-light)",
                              fontSize: 12,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={d.description}
                          >
                            {d.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {d.url ? (
                        <a
                          className="btn-secondary"
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: "6px 10px" }}
                        >
                          📥
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
