import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import ConfigModal from "./components/ConfigModal";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Factures from "./pages/Factures";
import ClientsSection from "./pages/ClientsSection";
import AffairesSection from "./pages/AffairesSection";
import WorkflowPage from "./pages/WorkflowPage.jsx";
import AgendaPage from "./pages/AgendaPage";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";

function App() {
  const { t } = useTranslation();
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem("token"));
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const isStaff = localStorage.getItem("is_staff") === "true";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("is_staff");
    localStorage.removeItem("username");
    setIsLogged(false);
  };

  if (!isLogged) {
    if (showPasswordReset) {
      return <PasswordReset onBackToLogin={() => setShowPasswordReset(false)} />;
    }
    return <Login onLogin={() => setIsLogged(true)} onShowPasswordReset={() => setShowPasswordReset(true)} />;
  }

  // Si connecté mais pas staff, affiche le message d'erreur
  if (!isStaff) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        }}
      >
        <div
          style={{
            background: "#222",
            padding: 32,
            borderRadius: 12,
            boxShadow: "0 4px 32px #0008",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "red", marginBottom: 16 }}>
            {t("Accès refusé")}
          </h2>
          <p style={{ color: "#fff", marginBottom: 24 }}>
            {t(
              "Cette interface est réservée à l'avocat ou à l'administrateur.",
            )}
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              border: "none",
              background: "linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("Se déconnecter")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'expanded' : 'compact'}`}
      style={{
        minHeight: "100vh",
        background: "var(--light-gray)",
        color: "var(--text-dark)",
      }}
    >
      <Header unreadCount={0} />
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <Sidebar onLogout={handleLogout} onOpenConfig={() => setShowConfig(true)} isOpen={sidebarOpen} isCompact={sidebarCompact} />
        <div style={{ flex: 1 }}>
          <main
            style={{
              width: "100%",
              minHeight: "calc(100vh - 70px)",
              margin: 0,
              padding: "2rem 0",
              background: "var(--light-gray)",
              paddingLeft: 'var(--sidebar-offset)'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<ClientsSection />} />
              <Route path="/affaires" element={<AffairesSection />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/factures" element={<Factures />} />
              <Route path="/workflow/:affaireId" element={<WorkflowPage />} />
              <Route path="*" element={<Navigate to="/Dashboard" />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
