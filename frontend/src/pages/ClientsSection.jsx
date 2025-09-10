import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import ErrorMessage from "../components/ErrorMessage";
import { useTranslation } from "react-i18next";

export default function ClientsSection() {
  const { t, i18n } = useTranslation();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [nom, setNom] = useState("");
  const [lastCreatedPassword, setLastCreatedPassword] = useState("");
  const [lastCreatedClientId, setLastCreatedClientId] = useState(null);
  const [adresse, setAdresse] = useState("");
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [contrat, setContrat] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [editingClientId, setEditingClientId] = useState(null);
  const [editNom, setEditNom] = useState("");
  const [editAdresse, setEditAdresse] = useState("");
  const [editType, setEditType] = useState("");
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [contratFile, setContratFile] = useState(null); //fichier de contrat
  const [prenom, setPrenom] = useState("");
  const [roleClient, setRoleClient] = useState(""); // demandeur ou opposant
  const [showAddForm, setShowAddForm] = useState(false);
  const addFormFirstInputRef = useRef(null);

  const [nomFiltre, setNomFiltre] = useState("");
  const [adresse1, setAdresse1] = useState("");
  const [adresse2, setAdresse2] = useState("");
  const [numtel1, setNumtel1] = useState("");
  const [numtel2, setNumtel2] = useState("");
  const [email, setEmail] = useState("");

  const [editPrenom, setEditPrenom] = useState("");
  const [editAdresse1, setEditAdresse1] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNumtel1, setEditNumtel1] = useState("");

  const fileInputRef = useRef(null);
  // Rendu strictement identique du formulaire d'origine
  const renderAddClientForm = () => (
    <form
      onSubmit={AddClient}
      autoComplete="off"
      style={{
        width: "100%",
        maxWidth: 600,
        background: "#f5f6fa",
        padding: 16,
        borderRadius: 8,
        minWidth: 200,
        margin: "16px auto",
      }}
    >
      <h3 style={{ color: "#1a237e", marginBottom: 16 }}>
        {t("Ajouter un client")}
      </h3>
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        required
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
      >
        <option value="">{t("Sélectionner un type de client")}</option>
        {types.map((typeItem) => (
          <option key={typeItem.idtypeclient} value={typeItem.idtypeclient}>
            {t(typeItem.libelletypeclient.toLowerCase())}
          </option>
        ))}
      </select>
      <input
        placeholder={t("Nom")}
        value={nom}
        onChange={(e) => {
          setNom(e.target.value);
          setNomFiltre(e.target.value);
        }}
        required
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Prénom")}
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Adresse 1")}
        value={adresse1}
        onChange={(e) => setAdresse1(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Adresse 2")}
        value={adresse2}
        onChange={(e) => setAdresse2(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Numéro de téléphone 1")}
        value={numtel1}
        onChange={(e) => setNumtel1(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Numéro de téléphone 2")}
        value={numtel2}
        onChange={(e) => setNumtel2(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      <input
        placeholder={t("Mot de passe (pour accès mobile)")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          fontSize: 16,
          marginBottom: 8,
          padding: 12,
          background: "#fff",
          color: "#333",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
        }}
        autoComplete="off"
      />
      {selectedTypeLabel === "societe" && (
        <div
          style={{
            marginTop: 16,
            background: "#f0f4f8",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <h4 style={{ margin: 0, marginBottom: 8 }}>{t("Contrat")}</h4>
          {detailClient?.contrat && false}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ flex: 1 }}
            />
            {contratFile && (
              <button
                type="button"
                onClick={() => {
                  setContratFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{
                  background: "#e53935",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  fontWeight: "bold",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={t("Annuler le fichier")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <div
          style={{
            color: "#e74c3c",
            marginBottom: 16,
            padding: "8px 12px",
            background: "#f5f6fa",
            borderRadius: 4,
            border: "1px solid #e74c3c",
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          fontSize: 16,
          padding: 14,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          fontWeight: "bold",
        }}
      >
        {t("Ajouter")}
      </button>
    </form>
  );

  const selectedTypeLabel = types
    .find((t) => String(t.idtypeclient) === String(selectedType))
    ?.libelletypeclient?.toLowerCase();

  const handleFileChange = (e) => {
    setContratFile(e.target.files[0]);
  };

  function isValidMoroccanPhone(phone) {
    //  0 ou +212 +9
    return /^(0|\+212)[5-7][0-9]{8}$/.test(phone);
  }

  const fetchClients = () => {
    api
      .get("/api/clients/")
      .then((res) => {
        console.log("Clients récupérés:", res.data);
        setClients(res.data);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    fetchClients();
    api
      .get("/api/typeclients/")
      .then((res) => {
        console.log("Types récupérés:", res.data);
        setTypes(res.data);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (showAddForm && addFormFirstInputRef.current) {
      addFormFirstInputRef.current.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const onEsc = (e) => {
      if (e.key === "Escape") setShowAddForm(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [showAddForm]);

  // Forcer le render quand la langue change
  useEffect(() => {}, [i18n.language]);

  const AddClient = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation téléphone
    if (!isValidMoroccanPhone(numtel1)) {
      setError(
        t("Le numéro de téléphone 1 n'est pas valide (format marocain) !"),
      );
      setLoading(false);
      return;
    }
    if (numtel2 && !isValidMoroccanPhone(numtel2)) {
      setError(
        t("Le numéro de téléphone 2 n'est pas valide (format marocain) !"),
      );
      setLoading(false);
      return;
    }

    const username = nom.replace(/\s+/g, "").toLowerCase();
    const selectedTypeObj = types.find((t) => t.idtypeclient == selectedType);
    const selectedTypeLabel = types
      .find((t) => String(t.idtypeclient) === String(selectedType))
      ?.libelletypeclient?.toLowerCase();

    try {
      const typeClientId =
        typeof selectedType === "object"
          ? selectedType.idtypeclient
          : Number(selectedType);

      //  FormData pour l'envoi de fichier
      const formData = new FormData();
      formData.append("nomclient", nom);
      formData.append("adresseclient", adresse);
      formData.append("idtypeclient", typeClientId);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("is_societe", selectedTypeLabel === "societe");
      formData.append("adresse1", adresse1);
      formData.append("adresse2", adresse2);
      formData.append("numtel1", numtel1);
      formData.append("numtel2", numtel2);
      formData.append("email", email);
      formData.append("prenomclient", prenom);

      if (selectedTypeLabel === "societe") {
        if (contratFile) {
          formData.append("fichier", contratFile);
        }
      }

      const res = await api.post("/api/create-client/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLastCreatedPassword(password); // stockage du password
      setLastCreatedClientId(res.data.client.idclient); // stockage de l'ID du client créé
      setNom("");
      setAdresse("");
      setSelectedType("");
      setContrat({});
      setContratFile(null); // Réinitialise le fichier sélectionné
      setPassword("");
      setAdresse1("");
      setAdresse2("");
      setNumtel1("");
      setNumtel2("");
      setEmail("");
      setPrenom("");
      fetchClients();
      setSuccess(t("Client ajouté avec succès !"));
      setTimeout(() => setSuccess(""), 3000);
      setNomFiltre("");
    } catch (err) {
      console.log("Erreur complète:", err.response?.data);
      setError(
        "Erreur détaillée: " +
          (err.response?.data?.error ||
            JSON.stringify(err.response?.data) ||
            err.message),
      );
    }
    setLoading(false);
  };

  // recuperer le libellé du type d'un client
  const getTypeLabel = (client) => {
    // Si le backend renvoie déjà le libellé type_client
    if (client.type_client) return client.type_client;

    // Sinon on cherche dans la liste des types
    const clientTypeId =
      typeof client.idtypeclient === "object"
        ? client.idtypeclient.idtypeclient
        : client.idtypeclient;
    const typeObj = types.find((t) => t.idtypeclient === clientTypeId);
    const typeLabel = typeObj ? typeObj.libelletypeclient : clientTypeId;

    const translatedLabel = t(typeLabel.toLowerCase());

    // Debug vérifier si la traduction fonctionne
    console.log(
      `🔍 Traduction de "${typeLabel.toLowerCase()}" → "${translatedLabel}" (langue: ${i18n.language})`,
    );

    return translatedLabel !== typeLabel.toLowerCase()
      ? translatedLabel
      : typeLabel;
  };

  // Filtrage par nom et par type de client
  const filteredClients = (() => {
    console.log(
      "Recalcul du filtrage - filterType:",
      filterType,
      "clients:",
      clients.length,
    );
    let filtered = clients;

    // Filtrage par nom
    if (nomFiltre) {
      filtered = filtered.filter((c) =>
        c.nomclient.toLowerCase().includes(nomFiltre.toLowerCase()),
      );
    }
    if (search) {
      filtered = filtered.filter((c) =>
        c.nomclient.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filtrage par type
    if (filterType) {
      console.log("Filtrage par type:", filterType);
      filtered = filtered.filter((c) => {
        const clientTypeLabel = getTypeLabel(c);
        const clientType = clientTypeLabel ? clientTypeLabel.toLowerCase() : "";
        console.log(
          "Type du client:",
          clientType,
          "pour client:",
          c.nomclient,
          "label original:",
          clientTypeLabel,
        );
        return clientType === filterType;
      });
      console.log("Clients filtrés par type:", filtered.length);
    }

    return filtered;
  })();

  // modification de client
  const startEdit = (client) => {
    setEditingClientId(client.idclient);
    setEditNom(client.nomclient);
    setEditPrenom(client.prenomclient || "");
    setEditAdresse1(client.adresse1 || "");
    setEditEmail(client.email || "");
    setEditNumtel1(client.numtel1 || "");
    // S'assurer que editType est l'id
    setEditType(
      typeof client.idtypeclient === "object"
        ? client.idtypeclient.idtypeclient
        : client.idtypeclient,
    );
  };

  // annuler l'édition
  const cancelEdit = () => {
    setEditingClientId(null);
    setEditNom("");
    setEditPrenom("");
    setEditAdresse1("");
    setEditEmail("");
    setEditNumtel1("");
    setEditType("");
  };

  // valider la modification
  const saveEdit = async (id) => {
    try {
      // S'assurer que editType est  un nombre
      const typeClientId =
        typeof editType === "object" ? editType.idtypeclient : Number(editType);

      await api.patch(`/clients/${id}/`, {
        nomclient: editNom,
        adresseclient: editAdresse,
        idtypeclient: typeClientId,
      });
      cancelEdit();
      fetchClients();
    } catch (err) {
      setError(
        err.response?.data ? JSON.stringify(err.response.data) : err.message,
      );
    }
  };

  //  supprimer un client
  const deleteClient = async (id) => {
    if (
      !window.confirm(
        t(
          "Voulez-vous vraiment supprimer ce client ? Cette action supprimera également tous les contrats, factures et affaires associés.",
        ),
      )
    )
      return;
    try {
      const response = await api.delete(`/api/clients/${id}/`);
      fetchClients();
      setSuccess(t("Client supprimé avec succès !"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.log("Erreur de suppression:", err.response?.data);
      setError(
        t("Erreur lors de la suppression: ") +
          (err.response?.data?.error ||
            JSON.stringify(err.response?.data) ||
            err.message),
      );
    }
  };

  return (
    <div
      className="clients-page"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 32px #e0e0e0",
        padding: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ color: "#1a237e", margin: 0 }}>{t("Clients")}</h2>
        <button
          className="btn-primary"
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          style={{ padding: "10px 14px" }}
        >
          {showAddForm ? t("Fermer le formulaire") : t("Ajouter un client")}
        </button>
      </div>
      {error && <ErrorMessage error={error} />}
      {success && (
        <div style={{ color: "#43a047", fontWeight: "bold", marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div
        className={`collapsible ${showAddForm ? "open" : ""}`}
        style={{
          overflow: "hidden",
          transition: "max-height .25s ease",
          maxWidth: 700,
          margin: "0 auto 16px auto",
        }}
      >
        {showAddForm && renderAddClientForm()}
      </div>

      {/* Barre de recherche et filtres */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder={t("Rechercher par nom...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 4,
            border: "1px solid #e0e0e0",
            background: "#f5f6fa",
            color: "#333",
            fontSize: 15,
            width: 220,
          }}
        />
        {/*         menu de filtrage */}
        <select
          value={filterType}
          onChange={(e) => {
            console.log("Filtrage changé:", e.target.value);
            setFilterType(e.target.value);
          }}
          style={{
            height: 35,
            padding: "4px 8px",
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
            minWidth: 120,
          }}
        >
          <option value="">{t("Tous les types")}</option>
          {types.map((typeItem) => (
            <option
              key={typeItem.idtypeclient}
              value={typeItem.libelletypeclient.toLowerCase()}
            >
              {t(typeItem.libelletypeclient.toLowerCase())}
            </option>
          ))}
        </select>
      </div>
      {/* Tableau des clients */}
      <table
        border="0"
        cellPadding="8"
        cellSpacing="0"
        style={{
          width: "100%",
          marginBottom: 16,
          background: "#f5f6fa",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f4f8" }}>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Nom")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Prénom")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Adresse")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Email")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Téléphone")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Type")}
            </th>
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Actions")}
            </th>
          </tr>
        </thead>
        {/*         edit */}
        <tbody>
          {filteredClients.map((c) =>
            editingClientId === c.idclient ? (
              <tr
                key={c.idclient}
                style={{
                  background: "#e3f2fd",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                }}
              >
                {/* <td style={{ padding: "8px", color: "#333" }}>{c.idclient}</td> */}
                <td>
                  <input
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={editPrenom || ""}
                    onChange={(e) => setEditPrenom(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={editAdresse1 || ""}
                    onChange={(e) => setEditAdresse1(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={editEmail || ""}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={editNumtel1 || ""}
                    onChange={(e) => setEditNumtel1(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      background: "#fff",
                      color: "#333",
                      padding: "8px",
                      fontSize: 16,
                      outline: "none",
                    }}
                  >
                    <option value="">{t("Sélectionner un type")}</option>
                    {types.map((typeItem) => (
                      <option
                        key={typeItem.idtypeclient}
                        value={typeItem.idtypeclient}
                      >
                        {t(typeItem.libelletypeclient.toLowerCase())}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px",
                  }}
                >
                  <button
                    onClick={() => saveEdit(c.idclient)}
                    style={{
                      background: "#fff",
                      color: "#43a047",
                      border: "2px solid #43a047",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "18px",
                      marginRight: "8px",
                      cursor: "pointer",
                    }}
                    title={t("Enregistrer")}
                  >
                    💾
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "#fff",
                      color: "#e53935",
                      border: "2px solid #e53935",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                    title={t("Annuler")}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ) : (
              <tr
                key={c.idclient}
                style={{
                  background: "#f5f6fa",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                {/* <td style={{ padding: "8px", color: "#333" }}>{c.idclient}</td> */}
                <td style={{ padding: "8px", color: "#333" }}>{c.nomclient}</td>
                <td style={{ padding: "8px", color: "#333" }}>
                  {c.prenomclient}
                </td>
                <td style={{ padding: "8px", color: "#333" }}>{c.adresse1}</td>
                <td style={{ padding: "8px", color: "#333" }}>{c.email}</td>
                <td style={{ padding: "8px", color: "#333" }}>{c.numtel1}</td>
                <td style={{ padding: "8px", color: "#333" }}>
                  {getTypeLabel(c)}
                </td>
                <td
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px",
                  }}
                >
                  <button
                    onClick={() => startEdit(c)}
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      border: "1px solid #1976d2",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    title={t("Modifier")}
                  >
                    ✏️
                  </button>
                  {/*                   suppression */}
                  <button
                    onClick={() => deleteClient(c.idclient)}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#d32f2f")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#e53935")
                    }
                    title={t("Supprimer")}
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => setDetailClient(c)}
                    style={{
                      background: "#607d8b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    title={t("Voir")}
                  >
                    🔍
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      {/* Fiche détaillée */}
      {detailClient && (
        <div
          style={{
            background: "#f5f6fa",
            color: "#1a237e",
            borderRadius: 8,
            padding: 24,
            margin: "24px auto",
            maxWidth: 500,
            boxShadow: "0 2px 16px #e0e0e0",
            position: "relative",
          }}
        >
          <button
            onClick={() => setDetailClient(null)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#e53935",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("X")}
          </button>
          <h3 style={{ marginTop: 0, color: "#1976d2" }}>
            {t("Fiche détaillée du client")}
          </h3>
          {/*           <div><b>ID :</b> {detailClient.idclient}</div> */}
          <div>
            <b>{t("Nom")}:</b> {detailClient.nomclient}
          </div>
          <div>
            <b>{t("Prénom")}:</b> {detailClient.prenomclient}
          </div>
          <div>
            <b>{t("Email")}:</b> {detailClient.email}
          </div>
          <div>
            <b>{t("Numéro de téléphone 1")}:</b> {detailClient.numtel1}
          </div>
          <div>
            <b>{t("Numéro de téléphone 2")}:</b> {detailClient.numtel2}
          </div>
          <div>
            <b>{t("Adresse 1")}:</b> {detailClient.adresse1}
          </div>
          <div>
            <b>{t("Adresse 2")}:</b> {detailClient.adresse2}
          </div>

          <div>
            <b>{t("Type")}:</b> {getTypeLabel(detailClient)}
          </div>
          {/* Affichage du contrat si société */}
          {getTypeLabel(detailClient).toLowerCase() === "societe" &&
            detailClient.contrat && (
              <div
                style={{
                  marginTop: 16,
                  background: "#f0f4f8",
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                <h4 style={{ margin: 0, marginBottom: 8 }}>{t("Contrat")}</h4>
                {/*               <div><b>ID contrat :</b> {detailClient.contrat.idcontrat}</div> */}
                {detailClient.contrat && detailClient.contrat.fichier && (
                  <a
                    href={`http://localhost:8000${detailClient.contrat.fichier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1976d2", textDecoration: "underline" }}
                  >
                    {t("Télécharger le contrat")}
                  </a>
                )}
              </div>
            )}
        </div>
      )}

      <div
        className={`collapsible ${showAddForm ? "open" : ""}`}
        style={{ display: "none" }}
      >
        <form
          onSubmit={AddClient}
          autoComplete="off"
          style={{
            width: "100%",
            maxWidth: 600,
            background: "#f5f6fa",
            padding: 16,
            borderRadius: 8,
            minWidth: 200,
            margin: showAddForm ? "16px 0 24px 0" : "0 auto",
          }}
        >
          <h3 style={{ color: "#1a237e", marginBottom: 16 }}>
            {t("Ajouter un client")}
          </h3>
          {/* Si ouvert via le bouton du haut, placer le focus sur le premier champ */}
          {showAddForm && (
            <input
              style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
              ref={addFormFirstInputRef}
              aria-hidden
            />
          )}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            required
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
          >
            <option value="">{t("Sélectionner un type de client")}</option>
            {types.map((typeItem) => (
              <option key={typeItem.idtypeclient} value={typeItem.idtypeclient}>
                {t(typeItem.libelletypeclient.toLowerCase())}
              </option>
            ))}
          </select>
          <input
            placeholder={t("Nom")}
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              setNomFiltre(e.target.value);
            }}
            required
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Prénom")}
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Adresse 1")}
            value={adresse1}
            onChange={(e) => setAdresse1(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Adresse 2")}
            value={adresse2}
            onChange={(e) => setAdresse2(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Numéro de téléphone 1")}
            value={numtel1}
            onChange={(e) => setNumtel1(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Numéro de téléphone 2")}
            value={numtel2}
            onChange={(e) => setNumtel2(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />
          <input
            placeholder={t("Email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="off"
          />

          <input
            placeholder={t("Mot de passe (pour accès mobile)")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
            autoComplete="new-password"
          />
          {selectedTypeLabel === "societe" && (
            <div
              style={{
                background: "#f0f4f8",
                padding: 16,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <h4 style={{ color: "#1a237e", marginBottom: 12 }}>
                {t("Contrat")}
              </h4>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  style={{ flex: 1 }}
                />
                {contratFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setContratFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      fontWeight: "bold",
                      fontSize: 18,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={t("Annuler le fichier")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {error && (
            <div
              style={{
                color: "#e74c3c",
                marginBottom: 16,
                padding: "8px 12px",
                background: "#f5f6fa",
                borderRadius: 4,
                border: "1px solid #e74c3c",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              fontSize: 16,
              padding: 14,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontWeight: "bold",
            }}
          >
            {t("Ajouter")}
          </button>
        </form>
      </div>
    </div>
  );
}
