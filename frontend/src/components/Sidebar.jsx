import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Sidebar({
  onLogout,
  onOpenConfig,
  unreadCount = 0,
  isOpen = true,
  isCompact = false,
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const NavItem = ({ to, label, emoji }) => (
    <Link to={to} className={`sb-item ${isActive(to) ? "active" : ""}`}>
      <span className="sb-ico" aria-hidden>
        {emoji}
      </span>
      <span className="sb-label">{t(label)}</span>
    </Link>
  );

  return (
    <aside
      className={`sidebar ${isOpen ? "" : "closed"} ${isCompact ? "compact" : ""}`}
    >
      <div className="sb-header">
        <div className="sb-controls">
          <button
            className="icon-btn"
            aria-label={t("Notifications")}
            title={t("Notifications")}
          >
            <span className="emoji" aria-hidden>
              🔔
            </span>
            {unreadCount > 0 && (
              <span className="icon-badge" aria-hidden>
                {unreadCount}
              </span>
            )}
          </button>
          <select
            className="lang-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
      <nav className="sb-nav">
        <NavItem to="/" label="Dashboard" emoji="🏠" />
        <NavItem to="/clients" label="Clients" emoji="👥" />
        <NavItem to="/affaires" label="Affaires" emoji="⚖️" />
        <NavItem to="/documents" label="Contrats et Documents" emoji="📄" />
        <NavItem to="/factures" label="Factures" emoji="💳" />
        <NavItem to="/agenda" label="Agenda" emoji="📅" />
        <NavItem to="/workflow" label="Statistiques" emoji="📊" />
        <button className="sb-item sb-btn" onClick={onOpenConfig}>
          <span className="sb-ico" aria-hidden>
            ⚙️
          </span>
          <span className="sb-label">{t("Configurations")}</span>
        </button>
      </nav>
      <div className="sb-footer">
        <button
          className="sb-item sb-btn danger"
          onClick={onLogout}
          title={t("Déconnexion")}
          aria-label={t("Déconnexion")}
        >
          <span className="sb-ico" aria-hidden>
            ⏻
          </span>
          <span className="sb-label">{t("Déconnexion")}</span>
        </button>
      </div>
    </aside>
  );
}
