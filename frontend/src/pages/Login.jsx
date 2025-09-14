import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

export default function Login({ onLogin, onShowPasswordReset }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const response = await api.post("token/", { username, password });
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("is_staff", response.data.is_staff);
      localStorage.setItem("username", response.data.username);
      if (onLogin) onLogin();
    } catch (err) {
      setError(t("Identifiants invalides"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#f9fafb",
      }}
    >
      {/* Côté gauche - Branding */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e293b,#0f172a)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: "bold",
            fontFamily: "serif",
            marginBottom: 20,
          }}
        >
          ⚖️ {t("Cabinet d'Avocat")}
        </div>
        <p
          style={{
            maxWidth: 400,
            textAlign: "center",
            fontSize: 16,
            color: "#e2e8f0",
          }}
        >
          {t("Plateforme de gestion complète pour votre cabinet d'avocat. Gérez vos clients, suivez vos affaires et optimisez votre pratique juridique.")}
        </p>
      </div>

      {/* Côté droit - Formulaire */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          style={{
            background: "#ffffff",
            padding: 36,
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            width: 380,
            maxWidth: "92vw",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: "700",
              color: "#0f172a",
              fontFamily: "serif",
            }}
          >
            {t("Connexion")}
          </h2>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>
            {t("Accédez à votre espace avocat")}
          </p>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
              {t("Nom d'utilisateur")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
              {t("Mot de passe")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Votre mot de passe")}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#475569",
                }}
              >
                {showPassword ? "⃠" : "👁"}
              </button>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "none",
              background: loading
                ? "#93c5fd"
                : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "white",
              fontWeight: "600",
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
              transition: "0.3s",
            }}
          >
            {loading ? t("Connexion...") : t("Se connecter")}
          </button>

          {/* Lien mot de passe oublié */}
          <div style={{ marginTop: 14, textAlign: "right" }}>
            <button
              type="button"
              onClick={onShowPasswordReset}
              style={{
                fontSize: 13,
                color: "#2563eb",
                textDecoration: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("Mot de passe oublié ?")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
