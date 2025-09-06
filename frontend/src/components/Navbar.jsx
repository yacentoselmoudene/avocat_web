import React, { useState } from "react";
import { Link } from "react-router-dom";
import ConfigModal from "./ConfigModal";
import { useTranslation } from "react-i18next";

export default function Navbar({ onLogout }) {
  const [showConfig, setShowConfig] = useState(false);
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Changer la direction du texte pour l'arabe
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };
  return (
    <nav
      style={{
        background: "var(--primary-blue)",
        padding: "1rem 2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <Link
            to="/"
            style={{
              color: "var(--white)",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
          >
            {t("Dashboard")}
          </Link>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              color: "var(--white)",
              background: "none",
              border: "none",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
          >
            {t("Configurations")} ⚙️
          </button>
          <Link
            to="/clients"
            style={{
              color: "var(--white)",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
          >
            {t("Clients")}
          </Link>
          <Link
            to="/affaires"
            style={{
              color: "var(--white)",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
          >
            {t("Affaires")}
          </Link>
          <Link
            to="/agenda"
            style={{
              color: "var(--white)",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
          >
            {t("Agenda")}
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "2px solid #fff",
              background: "#fff",
              color: "#1a237e",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.opacity = "0.8")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          >
            {t("Déconnexion")}
          </button>
        </div>
        {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
      </div>
    </nav>
  );
}
