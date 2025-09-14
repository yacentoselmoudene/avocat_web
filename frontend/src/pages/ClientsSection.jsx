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
  const [nomFr, setNomFr] = useState("");
  const [nomAr, setNomAr] = useState("");
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
  const [editNomFr, setEditNomFr] = useState("");
  const [editNomAr, setEditNomAr] = useState("");
  const [editAdresse, setEditAdresse] = useState("");
  const [editAdresse1Fr, setEditAdresse1Fr] = useState("");
  const [editAdresse1Ar, setEditAdresse1Ar] = useState("");
  const [editAdresse2Fr, setEditAdresse2Fr] = useState("");
  const [editAdresse2Ar, setEditAdresse2Ar] = useState("");
  const [editType, setEditType] = useState("");
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [contratFile, setContratFile] = useState(null); //fichier de contrat
  const [prenom, setPrenom] = useState("");
  const [prenomFr, setPrenomFr] = useState("");
  const [prenomAr, setPrenomAr] = useState("");
  const [roleClient, setRoleClient] = useState(""); // demandeur ou opposant
  const [showAddForm, setShowAddForm] = useState(false);
  const addFormFirstInputRef = useRef(null);

  const [adresse1, setAdresse1] = useState("");
  const [adresse1Fr, setAdresse1Fr] = useState("");
  const [adresse1Ar, setAdresse1Ar] = useState("");
  const [adresse2, setAdresse2] = useState("");
  const [adresse2Fr, setAdresse2Fr] = useState("");
  const [adresse2Ar, setAdresse2Ar] = useState("");
  const [numtel1, setNumtel1] = useState("");
  const [numtel2, setNumtel2] = useState("");
  const [email, setEmail] = useState("");

  const [editPrenom, setEditPrenom] = useState("");
  const [editPrenomFr, setEditPrenomFr] = useState("");
  const [editPrenomAr, setEditPrenomAr] = useState("");
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
            {t((typeItem?.libelletypeclient ?? '').toLowerCase())}
          </option>
        ))}
      </select>
      {/* Nom - Français et Arabe */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t("Nom (Français)")}
          value={nomFr}
          onChange={(e) => setNomFr(e.target.value)}
          required
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
          }}
          autoComplete="off"
        />
        <input
          placeholder="النسب"
          value={nomAr}
          onChange={(e) => setNomAr(e.target.value)}
          required
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            direction: "rtl",
            textAlign: "right",
          }}
          autoComplete="off"
        />
      </div>
      {/* Prénom - Français et Arabe */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t("Prénom (Français)")}
          value={prenomFr}
          onChange={(e) => setPrenomFr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
          }}
          autoComplete="off"
        />
        <input
          placeholder="الاسم"
          value={prenomAr}
          onChange={(e) => setPrenomAr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            direction: "rtl",
            textAlign: "right",
          }}
          autoComplete="off"
        />
      </div>
      {/* Adresse 1 - Français et Arabe */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t("Adresse 1 (Français)")}
          value={adresse1Fr}
          onChange={(e) => setAdresse1Fr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
          }}
          autoComplete="off"
        />
        <input
          placeholder={t("العنوان 1 (العربية)")}
          value={adresse1Ar}
          onChange={(e) => setAdresse1Ar(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            direction: "rtl",
            textAlign: "right",
          }}
          autoComplete="off"
        />
      </div>
      {/* Adresse 2 - Français et Arabe */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t("Adresse 2 (Français)")}
          value={adresse2Fr}
          onChange={(e) => setAdresse2Fr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
          }}
          autoComplete="off"
        />
        <input
          placeholder={t("العنوان 2 (العربية)")}
          value={adresse2Ar}
          onChange={(e) => setAdresse2Ar(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            direction: "rtl",
            textAlign: "right",
          }}
          autoComplete="off"
        />
      </div>
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
      {isSociete && (
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

  const selectedTypeLabel = (
    types.find((t) => String(t.idtypeclient) === String(selectedType))
      ?.libelletypeclient ?? ''
  ).toLowerCase();
  
  // Vérifier si c'est une société par ID
  const isSociete = selectedType && types.find((t) => String(t.idtypeclient) === String(selectedType))?.libelletypeclient_fr?.toLowerCase() === 'société';
  

  const handleFileChange = (e) => {
    setContratFile(e.target.files[0]);
  };

  function isValidMoroccanPhone(phone) {
    //  0 ou +212 +9
    return /^(0|\+212)[5-7][0-9]{8}$/.test(phone);
  }

  const fetchClients = (searchTerm = "", typeFilter = "") => {
    let url = "/api/clients/";
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    if (typeFilter) {
      params.append('type', typeFilter);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    api
      .get(url)
      .then((res) => {
        console.log("Clients récupérés:", res.data);
        setClients(res.data);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    fetchClients();
    api
      .get("typeclients/")
      .then((res) => {
        console.log("Types récupérés:", res.data);
        setTypes(res.data);
      })
      .catch(() => {});
  }, []);

  // Effet pour déclencher la recherche avec un délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients(search, filterType);
    }, 300); // Délai de 300ms pour éviter trop de requêtes

    return () => clearTimeout(timeoutId);
  }, [search, filterType]);
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

    const username = (nomFr || nomAr || nom).replace(/\s+/g, "").toLowerCase();
    
    // Validation du username
    if (!username) {
      setError(t("Le nom est requis pour générer un nom d'utilisateur"));
      setLoading(false);
      return;
    }
    
    const selectedTypeObj = types.find((t) => t.idtypeclient == selectedType);
    const selectedTypeLabel = (
      types.find((t) => String(t.idtypeclient) === String(selectedType))
        ?.libelletypeclient ?? ''
    ).toLowerCase();
    
    // Vérifier si c'est une société par ID (plus fiable que par libellé)
    const isSociete = selectedType && types.find((t) => String(t.idtypeclient) === String(selectedType))?.libelletypeclient_fr?.toLowerCase() === 'société';

    try {
      const typeClientId =
        typeof selectedType === "object"
          ? selectedType.idtypeclient
          : Number(selectedType);

      //  FormData pour l'envoi de fichier
      const formData = new FormData();
      formData.append("nomclient_fr", nomFr);
      formData.append("nomclient_ar", nomAr);
      formData.append("adresseclient", adresse);
      formData.append("adresse1_fr", adresse1Fr);
      formData.append("adresse1_ar", adresse1Ar);
      formData.append("adresse2_fr", adresse2Fr);
      formData.append("adresse2_ar", adresse2Ar);
      formData.append("idtypeclient", typeClientId);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("is_societe", isSociete);
      formData.append("adresse1", adresse1);
      formData.append("adresse2", adresse2);
      formData.append("numtel1", numtel1);
      formData.append("numtel2", numtel2);
      formData.append("email", email);
      formData.append("prenomclient_fr", prenomFr);
      formData.append("prenomclient_ar", prenomAr);

      if (isSociete) {
        if (contratFile) {
          formData.append("fichier", contratFile);
        }
      }

      const res = await api.post("create-client/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLastCreatedPassword(password); // stockage du password
      setLastCreatedClientId(res.data.client.idclient); // stockage de l'ID du client créé
      setNom("");
      setNomFr("");
      setNomAr("");
      setAdresse("");
      setSelectedType("");
      setContrat({});
      setContratFile(null); // Réinitialise le fichier sélectionné
      setPassword("");
      setAdresse1("");
      setAdresse1Fr("");
      setAdresse1Ar("");
      setAdresse2("");
      setAdresse2Fr("");
      setAdresse2Ar("");
      setNumtel1("");
      setNumtel2("");
      setEmail("");
      setPrenom("");
      setPrenomFr("");
      setPrenomAr("");
      fetchClients();
      setSuccess(t("Client ajouté avec succès !"));
      setTimeout(() => setSuccess(""), 3000);
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
    if (client.type_client) {
      // Si c'est un objet avec les champs fr et ar
      if (typeof client.type_client === 'object') {
        return i18n.language === 'ar' ? 
          (client.type_client.libelletypeclient_ar || client.type_client.libelletypeclient_fr || '') :
          (client.type_client.libelletypeclient_fr || client.type_client.libelletypeclient_ar || '');
      }
      // Si c'est une chaîne simple, on la traduit
      const lower = String(client.type_client || "").toLowerCase();
      return t(lower);
    }

    // Sinon on cherche dans la liste des types
    const clientTypeId =
      typeof client.idtypeclient === "object"
        ? client.idtypeclient.idtypeclient
        : client.idtypeclient;
    const typeObj = types.find((t) => t.idtypeclient === clientTypeId);
    
    if (typeObj) {
      // Si l'objet type a les champs fr et ar
      if (typeObj.libelletypeclient_fr || typeObj.libelletypeclient_ar) {
        return i18n.language === 'ar' ? 
          (typeObj.libelletypeclient_ar || typeObj.libelletypeclient_fr || '') :
          (typeObj.libelletypeclient_fr || typeObj.libelletypeclient_ar || '');
      }
      // Sinon on utilise le libellé générique et on le traduit
      const typeLabel = typeObj.libelletypeclient ?? "";
      const lower = String(typeLabel || "").toLowerCase();
      return t(lower);
    }
    
    return clientTypeId ?? "";
  };

  //  filtrés par l'API
  const filteredClients = clients;

  // modification de client
  const startEdit = (client) => {
    setEditingClientId(client.idclient);
    setEditNom(client.nomclient_fr || client.nomclient_ar || client.nomclient || "");
    setEditNomFr(client.nomclient_fr || "");
    setEditNomAr(client.nomclient_ar || "");
    setEditPrenom(client.prenomclient_fr || client.prenomclient_ar || "");
    setEditPrenomFr(client.prenomclient_fr || "");
    setEditPrenomAr(client.prenomclient_ar || "");
    setEditAdresse1(client.adresse1 || "");
    setEditAdresse1Fr(client.adresse1_fr || "");
    setEditAdresse1Ar(client.adresse1_ar || "");
    setEditAdresse2Fr(client.adresse2_fr || "");
    setEditAdresse2Ar(client.adresse2_ar || "");
    setEditEmail(client.email || "");
    setEditNumtel1(client.numtel1 || "");
    //   editType est l'id
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
    setEditNomFr("");
    setEditNomAr("");
    setEditPrenom("");
    setEditPrenomFr("");
    setEditPrenomAr("");
    setEditAdresse1("");
    setEditAdresse1Fr("");
    setEditAdresse1Ar("");
    setEditAdresse2Fr("");
    setEditAdresse2Ar("");
    setEditEmail("");
    setEditNumtel1("");
    setEditType("");
  };

  // valider la modification
  const saveEdit = async (id) => {
    try {
      // editType est  un nombre
      const typeClientId =
        typeof editType === "object" ? editType.idtypeclient : Number(editType);

      await api.patch(`/clients/${id}/`, {
        nomclient_fr: editNomFr,
        nomclient_ar: editNomAr,
        prenomclient_fr: editPrenomFr,
        prenomclient_ar: editPrenomAr,
        adresseclient: editAdresse,
        adresse1_fr: editAdresse1Fr,
        adresse1_ar: editAdresse1Ar,
        adresse2_fr: editAdresse2Fr,
        adresse2_ar: editAdresse2Ar,
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
          {types.map((typeItem) => {
            const typeFr = (typeItem?.libelletypeclient_fr ?? '').toLowerCase();
            const typeAr = (typeItem?.libelletypeclient_ar ?? '').toLowerCase();
            return (
              <option
                key={typeItem.idtypeclient}
                value={typeFr}
              >
                {i18n.language === 'ar' ? 
                  (typeItem?.libelletypeclient_ar || typeItem?.libelletypeclient_fr || '') :
                  (typeItem?.libelletypeclient_fr || typeItem?.libelletypeclient_ar || '')
                }
              </option>
            );
          })}
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                textAlign: i18n.language === 'ar' ? "right" : "left",
                direction: i18n.language === 'ar' ? "rtl" : "ltr",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <input
                      placeholder={t("Nom (Français)")}
                      value={editNomFr || ""}
                      onChange={(e) => setEditNomFr(e.target.value)}
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
                    <input
                      placeholder="النسب"
                      value={editNomAr || ""}
                      onChange={(e) => setEditNomAr(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 4,
                        border: "2px solid #e0e0e0",
                        background: "#fff",
                        color: "#333",
                        padding: "8px",
                        fontSize: 16,
                        outline: "none",
                        direction: "rtl",
                        textAlign: "right",
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <input
                      placeholder={t("Prénom (Français)")}
                      value={editPrenomFr || ""}
                      onChange={(e) => setEditPrenomFr(e.target.value)}
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
                    <input
                      placeholder="الاسم"
                      value={editPrenomAr || ""}
                      onChange={(e) => setEditPrenomAr(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 4,
                        border: "2px solid #e0e0e0",
                        background: "#fff",
                        color: "#333",
                        padding: "8px",
                        fontSize: 16,
                        outline: "none",
                        direction: "rtl",
                        textAlign: "right",
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <input
                      placeholder={t("Adresse 1 (Français)")}
                      value={editAdresse1Fr || ""}
                      onChange={(e) => setEditAdresse1Fr(e.target.value)}
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
                    <input
                      placeholder={t("العنوان 1 (العربية)")}
                      value={editAdresse1Ar || ""}
                      onChange={(e) => setEditAdresse1Ar(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 4,
                        border: "2px solid #e0e0e0",
                        background: "#fff",
                        color: "#333",
                        padding: "8px",
                        fontSize: 16,
                        outline: "none",
                        direction: "rtl",
                        textAlign: "right",
                      }}
                    />
                  </div>
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
                        {t((typeItem?.libelletypeclient ?? '').toLowerCase())}
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
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
                  {i18n.language === 'ar' ? (c.nomclient_ar || c.nomclient_fr || c.nomclient) : (c.nomclient_fr || c.nomclient_ar || c.nomclient)}
                </td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
                  {i18n.language === 'ar' ? (c.prenomclient_ar || c.prenomclient_fr) : (c.prenomclient_fr || c.prenomclient_ar)}
                </td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
                  {i18n.language === 'ar' ? (c.adresse1_ar || c.adresse1_fr || c.adresse1) : (c.adresse1_fr || c.adresse1_ar || c.adresse1)}
                </td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>{c.email}</td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>{c.numtel1}</td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
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
            <b>{t("Nom")}:</b> {i18n.language === 'ar' ? (detailClient.nomclient_ar || detailClient.nomclient_fr || detailClient.nomclient) : (detailClient.nomclient_fr || detailClient.nomclient_ar || detailClient.nomclient)}
          </div>
          <div>
            <b>{t("Prénom")}:</b> {i18n.language === 'ar' ? (detailClient.prenomclient_ar || detailClient.prenomclient_fr) : (detailClient.prenomclient_fr || detailClient.prenomclient_ar)}
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
            <b>{t("Adresse 1")}:</b> {i18n.language === 'ar' ? (detailClient.adresse1_ar || detailClient.adresse1_fr || detailClient.adresse1) : (detailClient.adresse1_fr || detailClient.adresse1_ar || detailClient.adresse1)}
          </div>
          <div>
            <b>{t("Adresse 2")}:</b> {i18n.language === 'ar' ? (detailClient.adresse2_ar || detailClient.adresse2_fr || detailClient.adresse2) : (detailClient.adresse2_fr || detailClient.adresse2_ar || detailClient.adresse2)}
          </div>

          <div>
            <b>{t("Type")}:</b> {getTypeLabel(detailClient)}
          </div>
          
          {/* Affichage du contrat */}
          {detailClient.contrat && (
            <div>
              <b>{t("Contrat")}:</b> 
              {detailClient.contrat.url ? (
                <a
                  href={detailClient.contrat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline", marginLeft: 8 }}
                >
                  {t("Télécharger")}
                </a>
              ) : detailClient.contrat.fichier ? (
                <a
                  href={detailClient.contrat.fichier}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline", marginLeft: 8 }}
                >
                  {t("Télécharger")}
                </a>
              ) : (
                <span style={{ color: "#666", marginLeft: 8 }}>
                  {t("Non disponible")}
                </span>
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
                {t((typeItem?.libelletypeclient ?? '').toLowerCase())}
              </option>
            ))}
          </select>
          {/* Nom - Français et Arabe */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Nom (Français)")}
              value={nomFr}
              onChange={(e) => setNomFr(e.target.value)}
              required
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder="النسب"
              value={nomAr}
              onChange={(e) => setNomAr(e.target.value)}
              required
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                direction: "rtl",
                textAlign: "right",
              }}
              autoComplete="off"
            />
          </div>
          {/* Prénom - Français et Arabe */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Prénom (Français)")}
              value={prenomFr}
              onChange={(e) => setPrenomFr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder="الاسم"
              value={prenomAr}
              onChange={(e) => setPrenomAr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                direction: "rtl",
                textAlign: "right",
              }}
              autoComplete="off"
            />
          </div>
          {/* Adresse 1 - Français et Arabe */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Adresse 1 (Français)")}
              value={adresse1Fr}
              onChange={(e) => setAdresse1Fr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder={t("العنوان 1 (العربية)")}
              value={adresse1Ar}
              onChange={(e) => setAdresse1Ar(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                direction: "rtl",
                textAlign: "right",
              }}
              autoComplete="off"
            />
          </div>
          {/* Adresse 2 - Français et Arabe */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Adresse 2 (Français)")}
              value={adresse2Fr}
              onChange={(e) => setAdresse2Fr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder={t("العنوان 2 (العربية)")}
              value={adresse2Ar}
              onChange={(e) => setAdresse2Ar(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                direction: "rtl",
                textAlign: "right",
              }}
              autoComplete="off"
            />
          </div>
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
          {isSociete && (
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
