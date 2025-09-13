import React from "react";
import { useTranslation } from "react-i18next";

const RendezVousCard = ({
  rendezVous,
  expanded = false,
  onToggle,
  onAction,
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || '').startsWith('ar');

  const getTypeIcon = (type) => {
    const icons = {
      AUDIENCE: "⚖️",
      CONSULTATION: "👥",
      REUNION: "🤝",
      SIGNATURE: "✍️",
      AUTRE: "📅",
    };
    return icons[type] || "📅";
  };

  const getTypeLabel = (type, display) => {
    // 1) priorité au display envoyé par l'API
    if (display && typeof display === "string" && display.trim().length > 0)
      return display;
    // 2) fallback au code
    if (type && typeof type === "string" && type.trim().length > 0) {
      const code = type.trim().toUpperCase();
      const map = {
        AUDIENCE: t("Audience judiciaire"),
        CONSULTATION: t("Consultation avocat-client"),
        REUNION: t("Réunion de préparation"),
        SIGNATURE: t("Signature de documents"),
        AUTRE: t("Autre rendez-vous"),
      };
      if (map[code]) return map[code];
      // Essayer de mettre en forme proprement des valeurs libres
      return code.charAt(0) + code.slice(1).toLowerCase();
    }
    return t("Autre rendez-vous");
  };

  const getTypeColor = (type) => {
    const colors = {
      AUDIENCE: "#1976d2",
      CONSULTATION: "#4CAF50",
      REUNION: "#FF9800",
      SIGNATURE: "#9C27B0",
      AUTRE: "#607D8B",
    };
    return colors[type] || "#607D8B";
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const isToday = (dateString) => {
    const d = parseDate(dateString);
    if (!d) return false;
    return isSameDay(d, new Date());
  };
  const isTomorrow = (dateString) => {
    const d = parseDate(dateString);
    if (!d) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(d, tomorrow);
  };
  const isPast = (dateString) => {
    const d = parseDate(dateString);
    if (!d) return false;
    const now = new Date();
    return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const getStatutColor = (statut) => {
    const colors = {
      PLANIFIE: "#2196F3",
      CONFIRME: "#4CAF50",
      ANNULE: "#f44336",
      TERMINE: "#9E9E9E",
      REPORTE: "#FF9800",
    };
    return colors[statut] || "#9E9E9E";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isArabic ? "ar-EG" : "fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  const parseDate = (value) => {
    if (!value) return null;
    const iso =
      typeof value === "string" && !value.includes("T")
        ? value.replace(" ", "T")
        : value;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  return (
    <div
      style={{
        ...cardContainerStyle,
        borderLeft: `4px solid ${getTypeColor(rendezVous.type_rendez_vous)}`,
      }}
    >
      <div style={headerRowStyle}>
        <div
          style={{
            ...typeTitleStyle,
            color: getTypeColor(rendezVous.type_rendez_vous),
          }}
        >
          <span>
            {(
              rendezVous.titre && String(rendezVous.titre).trim().length > 0
                ? rendezVous.titre
                : getTypeLabel(
                    rendezVous.type_rendez_vous,
                    rendezVous.type_rendez_vous_display,
                  )
            )}
          </span>
        </div>
        <div style={scheduleBoxStyle}>
          {isToday(rendezVous.dateaudience) && (
            <span
              style={{
                ...urgencyChipStyle,
                background: "#e8f5e9",
                color: "#2e7d32",
              }}
            >
              {t("Aujourd'hui")}
            </span>
          )}
          {isTomorrow(rendezVous.dateaudience) && (
            <span
              style={{
                ...urgencyChipStyle,
                background: "#fff8e1",
                color: "#f57f17",
              }}
            >
              {t("Demain")}
            </span>
          )}
          {isPast(rendezVous.dateaudience) && (
            <span
              style={{
                ...urgencyChipStyle,
                background: "#ffebee",
                color: "#c62828",
              }}
            >
              {t("En retard")}
            </span>
          )}
          <span style={datePillStyle}>
            {formatDate(rendezVous.dateaudience)}
          </span>
          {rendezVous.heureaudience && (
            <span style={timePillStyle}>
              {formatTime(rendezVous.heureaudience)}
            </span>
          )}
          <span
            style={{
              ...statutBadgeStyle,
              backgroundColor: getStatutColor(rendezVous.statut),
            }}
          >
            {t(rendezVous.statut_display || rendezVous.statut)}
          </span>
        </div>
      </div>

      <div style={briefRowStyle}>
        <div style={briefLeftStyle}>
          {(() => {
            const typeLabel = getTypeLabel(
              rendezVous.type_rendez_vous,
              rendezVous.type_rendez_vous_display,
            );
            const hasCustomTitle =
              rendezVous.titre &&
              rendezVous.titre.trim().length > 0 &&
              rendezVous.titre.trim() !== typeLabel.trim();

            return (
              <>
                <div
                  style={{
                    ...briefTitleStyle,
                    color: getTypeColor(rendezVous.type_rendez_vous),
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{typeLabel}</span>
                </div>
                {hasCustomTitle && (
                  <div style={subtitleStyle}>{rendezVous.titre}</div>
                )}
              </>
            );
          })()}
          <div style={briefMetaStyle}>
            {rendezVous.client_nom && (
              <span style={miniChipStyle}>
                {t("Client")}: {typeof rendezVous.client_nom === 'object' 
                  ? (isArabic ? rendezVous.client_nom.ar : rendezVous.client_nom.fr)
                  : rendezVous.client_nom}
              </span>
            )}
            {rendezVous.affaire_numero && (
              <span style={miniChipStyle}>
                {t("Dossier")}: {rendezVous.affaire_numero}
              </span>
            )}
            {rendezVous.lieu && (
              <span style={miniChipStyle}>{t("Lieu")}: {rendezVous.lieu}</span>
            )}
            {rendezVous.tribunal_nom && (
              <span style={miniChipStyle}>
                {t("Tribunal")}: {rendezVous.tribunal_nom}
              </span>
            )}
          </div>
        </div>
        <div style={actionsRowStyle}>
          <button
            onClick={onToggle}
            style={expandButtonStyle}
            title={expanded ? t("Réduire") : t("Détails")}
          >
            {expanded ? t("Moins") : t("Plus")}
          </button>
          <button
            style={{ ...actionButtonStyle, color: "#4CAF50" }}
            onClick={() => onAction && onAction("CONFIRME", rendezVous)}
            title={t("Confirmer")}
          >
            {t("Confirmer")}
          </button>
          <button
            style={{ ...actionButtonStyle, color: "#f44336" }}
            onClick={() => onAction && onAction("ANNULE", rendezVous)}
            title={t("Annuler")}
          >
            {t("Annuler")}
          </button>
          <button
            style={{ ...actionButtonStyle, color: "#1976d2" }}
            onClick={() => onAction && onAction("EDIT", rendezVous)}
            title={t("Modifier")}
          >
            {t("Modifier")}
          </button>
          <button
            style={{ ...actionButtonStyle, color: "#d32f2f" }}
            onClick={() => onAction && onAction("DELETE", rendezVous)}
            title={t("Supprimer")}
          >
            {t("Supprimer")}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={detailsBoxStyle}>
          {rendezVous.client_nom && (
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>{t("Client")}</span>
              <span style={infoValueStyle}>
                {typeof rendezVous.client_nom === 'object' 
                  ? (isArabic ? rendezVous.client_nom.ar : rendezVous.client_nom.fr)
                  : rendezVous.client_nom}
                {rendezVous.client_tel ? ` • ${rendezVous.client_tel}` : ""}
              </span>
            </div>
          )}
          {rendezVous.affaire_numero && (
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>{t("Dossier")}</span>
              <span style={infoValueStyle}>{rendezVous.affaire_numero}</span>
            </div>
          )}
          {rendezVous.idtribunal && (
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>{t("Tribunal")}</span>
              <span style={infoValueStyle}>
                {rendezVous.tribunal_nom || rendezVous.idtribunal.nomtribunal}
              </span>
            </div>
          )}
          {rendezVous.description && (
            <div style={descriptionStyle}>
              <span style={infoLabelStyle}>{t("Description")}</span>
              <p style={descriptionTextStyle}>{rendezVous.description}</p>
            </div>
          )}
          {rendezVous.remarques && (
            <div style={descriptionStyle}>
              <span style={infoLabelStyle}>{t("Remarques")}</span>
              <p style={descriptionTextStyle}>{rendezVous.remarques}</p>
            </div>
          )}
          <div style={footerStyle}>
            <div style={notificationsStyle}>
              {rendezVous.rappel_24h && (
                <span style={notificationBadgeStyle}>{t("Rappel 24h avant")}</span>
              )}
              {rendezVous.rappel_1h && (
                <span style={notificationBadgeStyle}>{t("Rappel 1h avant")}</span>
              )}
            </div>
            <div style={dateCreationStyle}>
              {(() => {
                const d = parseDate(rendezVous.date_creation);
                return d
                  ? `${t("Créé le")} ${d.toLocaleDateString(isArabic ? "ar-EG" : "fr-FR")} ${t("à")} ${d.toLocaleTimeString(isArabic ? "ar-EG" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : "";
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles minimalistes et professionnels
const cardContainerStyle = {
  background: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  marginBottom: "16px",
  transition: "box-shadow 0.2s ease",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  background: "#fafafa",
  borderBottom: "1px solid #e5e7eb",
};

const briefRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "20px",
  gap: "16px",
};

const briefLeftStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  overflow: "hidden",
  flex: 1,
};

const briefTitleStyle = {
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "#111827",
  lineHeight: "1.4",
};

const subtitleStyle = {
  fontSize: "0.95rem",
  color: "#6b7280",
  fontWeight: 500,
  lineHeight: "1.4",
};

const briefMetaStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginTop: "4px",
};

const expandButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#374151",
  transition: "all 0.2s ease",
};

const actionButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  borderRadius: "6px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 500,
  transition: "all 0.2s ease",
};

const detailsBoxStyle = {
  padding: "20px",
  borderTop: "1px solid #e5e7eb",
  background: "#fafafa",
};

const actionsRowStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const typeTitleStyle = {
  fontSize: "1rem",
  fontWeight: 600,
  letterSpacing: "-0.025em",
};

const statutBadgeStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const scheduleBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const urgencyChipStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const datePillStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.8rem",
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 500,
  border: "1px solid #d1d5db",
};

const timePillStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.8rem",
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 500,
  border: "1px solid #d1d5db",
};

const miniChipStyle = {
  fontSize: "0.85rem",
  color: "#4b5563",
  fontWeight: 400,
  lineHeight: "1.4",
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "16px",
  marginBottom: "12px",
  fontSize: "0.9rem",
  alignItems: "start",
};

const infoLabelStyle = {
  fontWeight: 600,
  color: "#374151",
  fontSize: "0.85rem",
};

const infoValueStyle = {
  color: "#1f2937",
  fontWeight: 400,
  lineHeight: "1.5",
};

const descriptionStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: "16px",
  marginBottom: "16px",
};

const descriptionTextStyle = {
  margin: "0",
  color: "#4b5563",
  fontSize: "0.9rem",
  lineHeight: "1.6",
  fontWeight: 400,
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "16px",
  marginTop: "16px",
  borderTop: "1px solid #e5e7eb",
};

const notificationsStyle = {
  display: "flex",
  gap: "8px",
};

const notificationBadgeStyle = {
  padding: "4px 8px",
  background: "#f59e0b",
  color: "#ffffff",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const dateCreationStyle = {
  fontSize: "0.75rem",
  color: "#9ca3af",
  fontWeight: 400,
};

export default RendezVousCard;
