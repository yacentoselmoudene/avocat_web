import React, { useState } from "react";
import api from "../api/axios";

export default function PasswordReset({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: demande username, 2: nouveau mot de passe
  const [resetData, setResetData] = useState(null); // uid et token

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/api/password-reset-request/", {
        username: username,
      });

      if (response.data.reset_link) {
        // Extraire uid et token du lien
        const linkParts = response.data.reset_link.split("/");
        const uid = linkParts[linkParts.length - 2];
        const token = linkParts[linkParts.length - 1];

        setResetData({ uid, token });
        setStep(2);
        setSuccess(
          "Nom d'utilisateur validé. Saisissez votre nouveau mot de passe.",
        );
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Utilisateur non trouvé");
      } else {
        setError("Erreur lors de la validation du nom d'utilisateur");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validation côté client
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/api/password-reset-confirm/", {
        uid: resetData.uid,
        token: resetData.token,
        new_password: newPassword,
      });

      if (response.data.success) {
        setSuccess(
          "Mot de passe changé avec succès ! Redirection vers la connexion...",
        );
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors de la réinitialisation du mot de passe");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setResetData(null);
    setError("");
    setSuccess("");
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
      {/*  Branding */}
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
          {step === 1 ? "🔐 Réinitialisation" : "🔑 Nouveau mot de passe"}
        </div>
        <p
          style={{
            maxWidth: 400,
            textAlign: "center",
            fontSize: 16,
            color: "#e2e8f0",
          }}
        >
          {step === 1
            ? "Réinitialisez votre mot de passe pour accéder à votre espace sécurisé."
            : "Choisissez un nouveau mot de passe sécurisé pour votre compte."}
        </p>
      </div>

      {/*  Formulaire */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <form
          onSubmit={step === 1 ? handleRequestReset : handleConfirmReset}
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
            {step === 1 ? "Mot de passe oublié" : "Nouveau mot de passe"}
          </h2>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>
            {step === 1
              ? "Saisissez votre nom d'utilisateur pour commencer"
              : "Saisissez votre nouveau mot de passe"}
          </p>

          {/*  Nom d'utilisateur */}
          {step === 1 && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}
              >
                Nom d'utilisateur
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
          )}

          {/*  Nouveau mot de passe */}
          {step === 2 && (
            <>
              {/* Nouveau mot de passe */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}
                >
                  Nouveau mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Votre nouveau mot de passe"
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

              {/* Confirmation du mot de passe */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}
                >
                  Confirmer le mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre nouveau mot de passe"
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
                    onClick={() => setShowConfirmPassword((v) => !v)}
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
                    {showConfirmPassword ? "⃠" : "👁"}
                  </button>
                </div>
              </div>
            </>
          )}

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

          {/* Succès */}
          {success && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                color: "#166534",
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={
              loading ||
              (step === 1 && !username) ||
              (step === 2 && (!newPassword || !confirmPassword))
            }
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
            {loading
              ? step === 1
                ? "Validation..."
                : "Réinitialisation..."
              : step === 1
                ? "Valider l'utilisateur"
                : "Réinitialiser le mot de passe"}
          </button>

          {/* Boutons de navigation */}
          <div style={{ marginTop: 14, textAlign: "center" }}>
            {step === 2 && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  textDecoration: "none",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  marginRight: 20,
                }}
              >
                ← Retour
              </button>
            )}
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                fontSize: 13,
                color: "#2563eb",
                textDecoration: "none",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
