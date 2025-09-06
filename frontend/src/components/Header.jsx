import React from "react";
import { useTranslation } from "react-i18next";

export default function Header({ unreadCount = 0 }) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };
  return (
    <header
      style={{
        background: "#073763",
        color: "#fff",
        padding: "0",
        margin: "0",
        fontFamily: "inherit",
      }}
    >
      <div
        className="header-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          paddingLeft: "var(--sidebar-offset)",
          height: 70,
          background: "#fff",
        }}
      >
        <h1
          style={{
            color: "#073763",
            fontWeight: "bold",
            fontSize: 28,
            margin: 0,
            letterSpacing: 1,
            paddingInlineStart: 12,
          }}
        >
          {t("Mon Cabinet")}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="icon-btn"
            aria-label={t("Notifications")}
            title={t("Notifications")}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            <span className="emoji" aria-hidden>
              🔔
            </span>
            {unreadCount > 0 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: -4,
                  right: -6,
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 11,
                  padding: "0 6px",
                  lineHeight: "16px",
                  height: 16,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <select
            className="lang-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>
    </header>
  );
}
