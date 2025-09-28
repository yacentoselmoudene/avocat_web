import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import ErrorMessage from "../components/ErrorMessage";
import { useTranslation } from "react-i18next";
import Select from "react-select";

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
  const [typesSociete, setTypesSociete] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedTypeSociete, setSelectedTypeSociete] = useState("");
  const [referenceClient, setReferenceClient] = useState("");
  const [raisonSocialeFr, setRaisonSocialeFr] = useState("");
  const [raisonSocialeAr, setRaisonSocialeAr] = useState("");
  const [contrat, setContrat] = useState({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
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
  const [referenceError, setReferenceError] = useState("");

  const [editPrenom, setEditPrenom] = useState("");
  const [editPrenomFr, setEditPrenomFr] = useState("");
  const [editPrenomAr, setEditPrenomAr] = useState("");
  const [editAdresse1, setEditAdresse1] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNumtel1, setEditNumtel1] = useState("");
  const [editRaisonSocialeFr, setEditRaisonSocialeFr] = useState("");
  const [editRaisonSocialeAr, setEditRaisonSocialeAr] = useState("");
  const [editTypeSociete, setEditTypeSociete] = useState("");

  const fileInputRef = useRef(null);
// verfie la dup de reference
    const checkDuplicateReference = async (reference) => {
    if (!reference.trim()) return false;

    try {

        const response = await api.get(`/clients/check-reference/${reference}/`);
        console.log("Reference check response:", response);
        return response.data.exists === true;
    } catch (err) {
        console.error("Reference check error:", err.response || err);

        return false;
    }
};
  // Fonction de validation
  const validateForm = () => {
    const errors = {};
    
    // Vérifier si c'est une société
    const isSociete = selectedType && types.find((t) => String(t.idtypeclient) === String(selectedType))?.libelletypeclient_fr?.toLowerCase() === 'société';
    
    // Référence client est obligatoire
    if (!referenceClient.trim()) {
      errors.reference = t('La référence client est requise');
    }
    
    //  nom et prénom sont obligatoires (AR + FR) pour les particuliers
    if (!isSociete) {
      if (!nomFr.trim() && !nomAr.trim()) {
        errors.nom = 'Au moins un nom (FR ou AR) est requis';
      }
      if (!prenomFr.trim() && !prenomAr.trim()) {
        errors.prenom = 'Au moins un prénom (FR ou AR) est requis';
      }
    } else {
      // Pour les sociétés, raison sociale est obligatoire
      if (!raisonSocialeFr.trim() && !raisonSocialeAr.trim()) {
        errors.raisonSociale = t('Au moins une raison sociale (FR ou AR) est requise');
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Options pour react-select
  const typeOptions = types.map(type => ({
    value: type.idtypeclient,
    label: i18n.language === 'ar' ? 
      (type.libelletypeclient_ar || type.libelletypeclient_fr || '') :
      (type.libelletypeclient_fr || type.libelletypeclient_ar || '')
  }));

  const typeSocieteOptions = (typesSociete || []).map(ts => ({
    value: ts.idtypesociete,
    label: i18n.language === 'ar' ? (ts.libelletypesociete_ar || ts.libelletypesociete_fr || '') : (ts.libelletypesociete_fr || ts.libelletypesociete_ar || '')
  }));

  //  formulaire
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
      <div style={{ marginBottom: 8 }}>
        <Select
          value={typeOptions.find(option => option.value === selectedType)}
          onChange={(selected) => setSelectedType(selected?.value || '')}
          options={typeOptions}
          placeholder={t("Sélectionner un type de client")}
          isSearchable={true}
          isClearable={true}
          styles={{
            control: (provided, state) => ({
              ...provided,
              fontSize: 16,
              minHeight: '48px',
              border: 'none',
              borderRadius: '4px',
              boxShadow: 'none',
              '&:hover': {
                border: 'none',
              },
              ...(state.isFocused && {
                border: 'none',
                boxShadow: 'none',
              }),
            }),
            placeholder: (provided) => ({
              ...provided,
              color: '#999',
            }),
            indicatorSeparator: () => ({
              display: 'none',
            }),
            dropdownIndicator: (provided) => ({
              ...provided,
              color: '#999',
            }),
          }}
        />
      </div>
      {/* Référence client */}
        <input
  placeholder={i18n.language === 'ar' ? "المرجع" : t("Référence")}
  value={referenceClient}
  onChange={(e) => {
    setReferenceClient(e.target.value);
    setReferenceError(""); // Clear error when user types
  }}
  style={{
    width: "100%",
    fontSize: 16,
    marginBottom: referenceError ? 0 : 8,
    padding: 12,
    background: "#fff",
    color: "#333",
    border: referenceError ? "2px solid #e74c3c" : "none",
    borderRadius: 4,
  }}
  autoComplete="off"
/>
{referenceError && (
  <div style={{
    color: "#e74c3c",
    fontSize: "14px",
    marginTop: "4px",
    marginBottom: "8px",
    padding: "0 4px",
  }}>
    {referenceError}
  </div>
)}

      {/* Si société: nom société + type société; sinon: nom/prénom */}
      {!isSociete && (
        <>
      {/* Nom - Français et Arabe */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder={t("Nom (Français)")}
          value={nomFr}
          onChange={(e) => setNomFr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "none",
            borderRadius: 4,
          }}
          autoComplete="off"
        />
        <input
          placeholder="النسب"
          value={nomAr}
          onChange={(e) => setNomAr(e.target.value)}
          style={{
            flex: 1,
            fontSize: 16,
            padding: 12,
            background: "#fff",
            color: "#333",
            border: "none",
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
            border: "none",
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
            border: "none",
            borderRadius: 4,
            direction: "rtl",
            textAlign: "right",
          }}
          autoComplete="off"
        />
      </div>
        </>
      )}

      {isSociete && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Raison sociale (Français)")}
              value={raisonSocialeFr}
              onChange={(e) => setRaisonSocialeFr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: validationErrors.raisonSociale ? "2px solid #e74c3c" : "none",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder={"الاسم التجاري"}
              value={raisonSocialeAr}
              onChange={(e) => setRaisonSocialeAr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: validationErrors.raisonSociale ? "2px solid #e74c3c" : "none",
                borderRadius: 4,
                direction: "rtl",
                textAlign: "right",
              }}
              autoComplete="off"
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <Select
              value={typeSocieteOptions.find(option => option.value === selectedTypeSociete) || null}
              onChange={(selected) => setSelectedTypeSociete(selected?.value || '')}
              options={typeSocieteOptions}
              placeholder={t("Type de société (SARL, SA, ...)")}
              isSearchable={true}
              isClearable={true}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  fontSize: 16,
                  minHeight: '48px',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  '&:hover': { border: 'none' },
                  ...(state.isFocused && { border: 'none', boxShadow: 'none' }),
                }),
                placeholder: (provided) => ({ ...provided, color: '#999' }),
                indicatorSeparator: () => ({ display: 'none' }),
                dropdownIndicator: (provided) => ({ ...provided, color: '#999' }),
              }}
            />
          </div>
        </>
      )}
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
            border: "none",
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
            border: "none",
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
            border: "none",
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
            border: "none",
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
      {/* Messages d'erreur de validation */}
      {Object.keys(validationErrors).length > 0 && (
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
          {Object.values(validationErrors).map((error, index) => (
            <div key={index}>{error}</div>
          ))}
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

  const isTypeIdSociete = (typeId) => {
    const id = typeof typeId === "object" ? typeId?.idtypeclient : Number(typeId);
    const typeObj = types.find((t) => t.idtypeclient === id);
    const label = (
      typeObj?.libelletypeclient_fr || typeObj?.libelletypeclient || ""
    )
      .toString()
      .toLowerCase();
    return label === "société";
  };

  // Détermine si la ligne en édition est une société, en se basant sur la valeur sélectionnée (editType) ou sur le client.

  const isSocieteForEdit = (client) => {
    if (editType !== undefined && editType !== null && String(editType) !== "") {
      return isTypeIdSociete(editType);
    }
    return getTypeLabel(client).toLowerCase() === 'société';
  };

  function isValidMoroccanPhone(phone) {
    //  0 ou +212 +9
    return /^(0|\+212)[5-7][0-9]{8}$/.test(phone);
  }

  const fetchClients = (searchTerm = "", typeFilter = "") => {
    let url = "clients/";
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
    api
      .get("typesocietes/")
      .then((res) => setTypesSociete(res.data))
      .catch(() => {});
  }, []);

  // Effet pour déclencher la recherche avec un délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients(search, filterType);
    }, 300); // Délai de 300ms

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
  setReferenceError("");
  setValidationErrors({});
  setLoading(true);

  try {
    // Validation du formulaire
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Vérification des numéros de téléphone
    if (numtel1 && !isValidMoroccanPhone(numtel1)) {
      setError(t("Le numéro de téléphone 1 n'est pas valide (format marocain) !"));
      setLoading(false);
      return;
    }
    if (numtel2 && !isValidMoroccanPhone(numtel2)) {
      setError(t("Le numéro de téléphone 2 n'est pas valide (format marocain) !"));
      setLoading(false);
      return;
    }

    // Vérification de la référence dupliquée
    if (referenceClient.trim()) {
            const isDuplicate = await checkDuplicateReference(referenceClient);
            console.log("Reference check result:", isDuplicate);
            if (isDuplicate) {
                setReferenceError(t("Cette référence client existe déjà"));
                setLoading(false);
                return;
            }
        }
    // Préparation des données
    const isSociete = selectedType && types.find((t) => String(t.idtypeclient) === String(selectedType))?.libelletypeclient_fr?.toLowerCase() === 'société';

    const usernameBase = isSociete ? (raisonSocialeFr || raisonSocialeAr) : (nomFr || nomAr || nom);
    const username = (usernameBase || '').replace(/\s+/g, "").toLowerCase();

    if (!username) {
      setError(t("Le nom est requis pour générer un nom d'utilisateur"));
      setLoading(false);
      return;
    }

    const typeClientId = typeof selectedType === "object" ? selectedType.idtypeclient : Number(selectedType);

    // Création du FormData
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
    formData.append("prenomclient_fr", isSociete ? '' : prenomFr);
    formData.append("prenomclient_ar", isSociete ? '' : prenomAr);
    formData.append("reference_client", referenceClient);
    formData.append("raison_sociale_fr", isSociete ? raisonSocialeFr : '');
    formData.append("raison_sociale_ar", isSociete ? raisonSocialeAr : '');
    formData.append("idtypesociete", isSociete ? selectedTypeSociete : '');

    if (isSociete && contratFile) {
      formData.append("fichier", contratFile);
    }

    // Envoi des données
    const response = await api.post('create-client/', formData);
        console.log("Create client response:", response);


        if (response.status === 201) {
            setSuccess(response.data.message || t("Client créé avec succès"));
            fetchClients();
            // Reset form
            setShowAddForm(false);
        } else {
            setError(response.data.message || t("Une erreur s'est produite"));
        }
    } catch (err) {
        console.error("Error in AddClient:", err);
        setError(err.response?.data?.message || t("Une erreur s'est produite"));
    }
    setLoading(false);
};
  // recuperer le libellé du type d'un client
  const getTypeLabel = (client) => {
    //  backend :  libellé type_client
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

    // Sinon  cherche dans la liste des types
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

  // Détection  société (indépendante de la langue)
  const isSocieteClientRow = (client) => {
    const typeId =
      typeof client.idtypeclient === 'object'
        ? client.idtypeclient?.idtypeclient
        : client.idtypeclient;
    if (typeId !== undefined && typeId !== null && types.length > 0) {
      return isTypeIdSociete(typeId);
    }
    // Fallback si pas d'ID: inspecter l'objet type_client côté backend
    if (client.type_client && typeof client.type_client === 'object') {
      const fr = String(client.type_client.libelletypeclient_fr || '').toLowerCase();
      const ar = String(client.type_client.libelletypeclient_ar || '');
      return fr === 'société' || fr === 'societe' || ar === 'شركة';
    }
    const raw = String(client.type_client || '').toLowerCase();
    return raw === 'société' || raw === 'societe';
  };

  // Fonction pour afficher le nom/raison sociale selon le type de client
  const getDisplayName = (client) => {
    const isSociete = isSocieteClientRow(client);
    
    if (isSociete) {
      // Pour les sociétés : afficher raison sociale
      const raisonSociale = i18n.language === 'ar' ? 
        (client.raison_sociale_ar || client.raison_sociale_fr || '') :
        (client.raison_sociale_fr || client.raison_sociale_ar || '');
      
      // Ajouter le type de société si disponible : données du backend
      if (client.type_societe) {
        const typeLabel = i18n.language === 'ar' ? 
          (client.type_societe.libelletypesociete_ar || client.type_societe.libelletypesociete_fr || '') :
          (client.type_societe.libelletypesociete_fr || client.type_societe.libelletypesociete_ar || '');
        return `${raisonSociale} (${typeLabel})`;
      }
      
      // Fallback : chercher dans la liste locale
      if (client.idtypesociete && typesSociete.length > 0) {
        const typeSociete = typesSociete.find(ts => ts.idtypesociete === client.idtypesociete);
        if (typeSociete) {
          const typeLabel = i18n.language === 'ar' ? 
            (typeSociete.libelletypesociete_ar || typeSociete.libelletypesociete_fr || '') :
            (typeSociete.libelletypesociete_fr || typeSociete.libelletypesociete_ar || '');
          return `${raisonSociale} (${typeLabel})`;
        }
      }
      
      return raisonSociale || t('Société sans nom');
    } else {
      // Pour les particuliers : afficher nom + prénom
      const nom = i18n.language === 'ar' ? 
        (client.nomclient_ar || client.nomclient_fr || '') :
        (client.nomclient_fr || client.nomclient_ar || '');
      const prenom = i18n.language === 'ar' ? 
        (client.prenomclient_ar || client.prenomclient_fr || '') :
        (client.prenomclient_fr || client.prenomclient_ar || '');
      
      const full = `${nom} ${prenom}`.trim();
      if (full) return full;
      // Si nom/prénom vides mais raison sociale existe , l'utiliser
      const rsFallback = i18n.language === 'ar'
        ? (client.raison_sociale_ar || client.raison_sociale_fr || '')
        : (client.raison_sociale_fr || client.raison_sociale_ar || '');
      return rsFallback || t('Client sans nom');
    }
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
    setEditRaisonSocialeFr(client.raison_sociale_fr || "");
    setEditRaisonSocialeAr(client.raison_sociale_ar || "");
    setEditTypeSociete(
      client.idtypesociete || client.type_societe?.idtypesociete || ""
    );
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
    setEditRaisonSocialeFr("");
    setEditRaisonSocialeAr("");
    setEditTypeSociete("");
  };

  // valider la modification
  const saveEdit = async (id) => {
    try {
      // editType est  un nombre
      const typeClientId =
        typeof editType === "object" ? editType.idtypeclient : Number(editType);

      const updateData = {
        adresseclient: editAdresse,
        adresse1_fr: editAdresse1Fr,
        adresse1_ar: editAdresse1Ar,
        adresse2_fr: editAdresse2Fr,
        adresse2_ar: editAdresse2Ar,
        idtypeclient: typeClientId,
        email: editEmail,
        numtel1: editNumtel1,
      };

      if (isTypeIdSociete(typeClientId)) {
        updateData["raison_sociale_fr"] = editRaisonSocialeFr;
        updateData["raison_sociale_ar"] = editRaisonSocialeAr;
        updateData["idtypesociete"] = editTypeSociete || null;

        updateData["nomclient_fr"] = "";
        updateData["nomclient_ar"] = "";
        updateData["prenomclient_fr"] = "";
        updateData["prenomclient_ar"] = "";
      } else {
        updateData["nomclient_fr"] = editNomFr;
        updateData["nomclient_ar"] = editNomAr;
        updateData["prenomclient_fr"] = editPrenomFr;
        updateData["prenomclient_ar"] = editPrenomAr;

        updateData["raison_sociale_fr"] = "";
        updateData["raison_sociale_ar"] = "";
        updateData["idtypesociete"] = null;
      }

      await api.patch(`/clients/${id}/`, updateData);
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
      const response = await api.delete(`clients/${id}/`);
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
            border: "none",
            background: "#f5f6fa",
            color: "#333",
            fontSize: 15,
            width: 220,
          }}
        />
        {/* Filtre par type (react-select avec recherche) */}
        <div style={{ minWidth: 220 }}>
          <Select
            value={(types || []).map(typeItem => ({
              value: (typeItem?.libelletypeclient_fr ?? '').toLowerCase(),
              label: i18n.language === 'ar' ? 
                (typeItem?.libelletypeclient_ar || typeItem?.libelletypeclient_fr || '') :
                (typeItem?.libelletypeclient_fr || typeItem?.libelletypeclient_ar || '')
            })).find(opt => opt.value === filterType) || null}
            onChange={(selected) => {
              const v = selected?.value || '';
              console.log('Filtrage changé:', v);
              setFilterType(v);
            }}
            options={(types || []).map(typeItem => ({
              value: (typeItem?.libelletypeclient_fr ?? '').toLowerCase(),
              label: i18n.language === 'ar' ? 
                (typeItem?.libelletypeclient_ar || typeItem?.libelletypeclient_fr || '') :
                (typeItem?.libelletypeclient_fr || typeItem?.libelletypeclient_ar || '')
            }))}
            placeholder={t("Tous les types")}
            isSearchable={true}
            isClearable={true}
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: '35px',
                border: 'none',
                borderRadius: '4px',
                boxShadow: 'none',
                '&:hover': { border: 'none' },
                ...(state.isFocused && { border: 'none', boxShadow: 'none' }),
              }),
              placeholder: (provided) => ({ ...provided, color: '#999' }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: (provided) => ({ ...provided, color: '#999' }),
              menu: (provided) => ({ ...provided, zIndex: 5 })
            }}
          />
        </div>
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
              {t("Identité")}
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
                  {isSocieteForEdit(c) ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        placeholder={t("Raison sociale (Français)")}
                        value={editRaisonSocialeFr || ""}
                        onChange={(e) => setEditRaisonSocialeFr(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 160,
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
                        placeholder="الاسم التجاري"
                        value={editRaisonSocialeAr || ""}
                        onChange={(e) => setEditRaisonSocialeAr(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 160,
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
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        placeholder={t("Nom (Français)")}
                        value={editNomFr || ""}
                        onChange={(e) => setEditNomFr(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 160,
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
                          flex: 1,
                          minWidth: 160,
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
                      <input
                        placeholder={t("Prénom (Français)")}
                        value={editPrenomFr || ""}
                        onChange={(e) => setEditPrenomFr(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 160,
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
                          flex: 1,
                          minWidth: 160,
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
                  )}
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
                  {isSocieteForEdit(c) && (
                    <select
                      value={editTypeSociete}
                      onChange={(e) => setEditTypeSociete(e.target.value)}
                      style={{
                        marginTop: 8,
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
                      <option value="">{t("Type de société")}</option>
                      {typesSociete.map((ts) => (
                        <option key={ts.idtypesociete} value={ts.idtypesociete}>
                          {i18n.language === 'ar' ? (ts.libelletypesociete_ar || ts.libelletypesociete_fr || '') : (ts.libelletypesociete_fr || ts.libelletypesociete_ar || '')}
                        </option>
                      ))}
                    </select>
                  )}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getDisplayName(c)}
                    </div>
                    {getTypeLabel(c).toLowerCase() === 'société' && (
                      <div style={{ color: '#666', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(c.type_societe
                          ? (i18n.language === 'ar'
                              ? (c.type_societe.libelletypesociete_ar || c.type_societe.libelletypesociete_fr || '')
                              : (c.type_societe.libelletypesociete_fr || c.type_societe.libelletypesociete_ar || ''))
                          : (() => {
                              if (c.idtypesociete && typesSociete.length > 0) {
                                const ts = typesSociete.find(x => x.idtypesociete === c.idtypesociete);
                                if (ts) {
                                  return i18n.language === 'ar'
                                    ? (ts.libelletypesociete_ar || ts.libelletypesociete_fr || '')
                                    : (ts.libelletypesociete_fr || ts.libelletypesociete_ar || '');
                                }
                              }
                              return '';
                            })()
                        )}
                        {c.reference_client ? ` • ${i18n.language === 'ar' ? 'مرجع' : 'Réf'}: ${c.reference_client}` : ''}
                      </div>
                    )}
                    {getTypeLabel(c).toLowerCase() !== 'société' && c.reference_client && (
                      <div style={{ color: '#666', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {`${i18n.language === 'ar' ? 'مرجع' : 'Réf'}: ${c.reference_client}`}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
                  {i18n.language === 'ar'
                    ? (c.adresse1_ar || c.adresse1_fr || c.adresse1 || '—')
                    : (c.adresse1_fr || c.adresse1_ar || c.adresse1 || '—')}
                </td>
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>
                  {c.email || '—'}
                </td>
                
                <td style={{ 
                  padding: "8px", 
                  color: "#333",
                  textAlign: i18n.language === 'ar' ? "right" : "left",
                  direction: i18n.language === 'ar' ? "rtl" : "ltr"
                }}>{c.numtel1 || '—'}</td>
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
          <div>
            <b>{t("Référence")}:</b> {detailClient.reference_client || '—'}
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
          <div style={{ marginBottom: 8 }}>
            <Select
              value={typeOptions.find(option => option.value === selectedType)}
              onChange={(selected) => setSelectedType(selected?.value || '')}
              options={typeOptions}
              placeholder={t("Sélectionner un type de client")}
              isSearchable={true}
              isClearable={true}
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  fontSize: 16,
                  minHeight: '48px',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: 'none',
                  '&:hover': {
                    border: 'none',
                  },
                  ...(state.isFocused && {
                    border: 'none',
                    boxShadow: 'none',
                  }),
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: '#999',
                }),
                indicatorSeparator: () => ({
                  display: 'none',
                }),
                dropdownIndicator: (provided) => ({
                  ...provided,
                  color: '#999',
                }),
              }}
            />
          </div>
          {/* Nom - Français et Arabe */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              placeholder={t("Nom (Français)")}
              value={nomFr}
              onChange={(e) => setNomFr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "none",
                borderRadius: 4,
              }}
              autoComplete="off"
            />
            <input
              placeholder="النسب"
              value={nomAr}
              onChange={(e) => setNomAr(e.target.value)}
              style={{
                flex: 1,
                fontSize: 16,
                padding: 12,
                background: "#fff",
                color: "#333",
                border: "none",
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
                border: "none",
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
                border: "none",
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
                border: "none",
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
                border: "none",
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
                border: "none",
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
                border: "none",
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
              border: "none",
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
              border: "none",
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
              border: "none",
              borderRadius: 4,
            }}
            autoComplete="off"
          />

          <input
            placeholder={t("Mot de passe (pour accès mobile)")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              fontSize: 16,
              marginBottom: 8,
              padding: 12,
              background: "#fff",
              color: "#333",
              border: "none",
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
          {/* Messages d'erreur de validation */}
          {Object.keys(validationErrors).length > 0 && (
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
              {Object.values(validationErrors).map((error, index) => (
                <div key={index}>{error}</div>
              ))}
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
