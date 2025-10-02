import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

// menu de configuration
const TABLES = [
  {
    key: "fonctionclients",
    labelKey: "Fonctions du client",
    field: "libellefonction",
  },
  {
    key: "typeaffaires",
    labelKey: "categories d'affaire",
    field: "libelletypeaffaire",
  },
  { key: "typeclients", labelKey: "Types de client", field: "libelletypeclient" },
  // {
  //   key: "statutaffaires",
  //   labelKey: "Statuts d'affaire",
  //   field: "libellestatutaffaire",
  // },
 
  { key: "tribunals", labelKey: "Tribunaux", field: "nomtribunal" },
  {
    key: "typetribunals",
    labelKey: "Types de tribunal",
    field: "libelletypetribunal",
  },
  {
    key: "typeavertissements",
    labelKey: "Types d'avertissement",
    field: "libelle",
  },
  { key: "typedemandes", labelKey: "Types de demande", field: "libelle" },
  {
    key: "typeinterventions",
    labelKey: "Types d'intervention",
    field: "libelletypeintervention",
  },
  {
    key: "typesocietes",
    labelKey: "Types de société",
    field: "libelletypesociete",
  },

  {
    key: "avocats",
    labelKey: "Avocats",
    field: "nom_complet",
  },
];

export default function ConfigModal({ onClose, initialTableKey, openAvocatForm }) {
  const { t, i18n } = useTranslation();
  const isArabic = (i18n.language || "").startsWith("ar");
  const [selectedTable, setSelectedTable] = useState(TABLES[0]);
  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  // Edition  pour Avocats (nom/prénom selon la langue)
  const [editAvocat, setEditAvocat] = useState({ nom: "", prenom: "" });
  const [error, setError] = useState("");

  // États spécifiques pour les tribunaux
  const [showTribunalForm, setShowTribunalForm] = useState(false);
  const [tribunalForm, setTribunalForm] = useState({
    idtribunal: '',
    nomtribunal_fr: '',
    nomtribunal_ar: '',
    adressetribunal_fr: '',
    adressetribunal_ar: '',
    villetribunal_fr: '',
    villetribunal_ar: '',
    telephonetribunal: '',
    idtypetribunal: null
  });
  const [typeTribunaux, setTypeTribunaux] = useState([]);
  const [tribunalIdManuallyEdited, setTribunalIdManuallyEdited] = useState(false);
  //avocats
  const [showAvocatForm, setShowAvocatForm] = useState(false);
  const [avocatForm, setAvocatForm] = useState({
  idavocat: '',
  nomavocat_fr: '',
  nomavocat_ar: '',
  prenom_fr: '',
  prenom_ar: '',
  telephone: '',
  email: '',
  adresse_fr: '',
  adresse_ar: '',
  ville_fr: '',
  ville_ar: '',
  barreau: '',
  specialisation: ''
});

// ar/fr: champs avec fallback
  const getLocalizedValue = (obj, baseField) => {
    if (!obj) return "";
    const isArabicLang = (i18n.language || "").startsWith("ar");
    if (isArabicLang) {
      const ar = obj[`${baseField}_ar`];
      if (ar !== undefined && ar !== null && String(ar).trim() !== "") return ar;
      const fr = obj[`${baseField}_fr`];
      if (fr !== undefined && fr !== null && String(fr).trim() !== "") return fr;
      return obj[baseField] || "";
    }
    const fr = obj[`${baseField}_fr`];
    if (fr !== undefined && fr !== null && String(fr).trim() !== "") return fr;
    const ar = obj[`${baseField}_ar`];
    if (ar !== undefined && ar !== null && String(ar).trim() !== "") return ar;
    return obj[baseField] || "";
  };

  // Libellé affiché pour les avocats selon la langue (ar/fr)
  const getAvocatLabel = (avocat) => {
    if (!avocat) return "";
    if (isArabic) {
      const ar = `${avocat.prenom_ar || ''} ${avocat.nomavocat_ar || ''}`.trim();
      if (ar) return ar;
    }
    const fr = `${avocat.prenom_fr || ''} ${avocat.nomavocat_fr || ''}`.trim();
    return fr;
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get(`${selectedTable.key}/`);
        setItems(response.data);
      } catch (error) {
        console.error(t("Erreur lors du chargement:"), error);
      }
    };
    fetchItems();
    setEditIndex(null);
    setError("");
    

    if (selectedTable.key === "tribunals") {
      const fetchTypeTribunaux = async () => {
        try {
          const response = await api.get("typetribunals/");
          setTypeTribunaux(response.data);
        } catch (error) {
          console.error("Erreur lors du chargement des types de tribunaux:", error);
        }
      };
      fetchTypeTribunaux();
    }
  }, [selectedTable]);

  // autoriser l'ouverture sur une table
  useEffect(() => {
    if (!initialTableKey) return;
    const tbl = TABLES.find((t) => t.key === initialTableKey);
    if (tbl) setSelectedTable(tbl);
  }, [initialTableKey]);

  //  ouvre directement le form d'avocats
  useEffect(() => {
    if (selectedTable.key === "avocats" && openAvocatForm) {
      setShowAvocatForm(true);
    }
  }, [selectedTable, openAvocatForm]);

  // 3 lettres de ville pour id tribunal
  const normalizeCityCode = (value) => {
    if (!value) return '';
    const withoutAccents = value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    const lettersOnly = withoutAccents.replace(/[^A-Za-z]/g, '');
    return lettersOnly.slice(0, 3).toUpperCase();
  };

  //  idtribunal selon type et ville
  useEffect(() => {
    if (selectedTable.key !== 'tribunals') return;
    if (tribunalIdManuallyEdited) return;

    try {
      const selectedType = typeTribunaux.find(
        (t) => t.idtypetribunal === tribunalForm.idtypetribunal,
      );
      const typeCode = selectedType?.code_type || 'TRIB';
      const cityCode = normalizeCityCode(tribunalForm.villetribunal_fr);
      const suggestion = cityCode ? `${typeCode}-${cityCode}` : `${typeCode}`;
      setTribunalForm((prev) => ({ ...prev, idtribunal: suggestion }));
    } catch (e) {

    }
  }, [selectedTable, tribunalForm.idtypetribunal, tribunalForm.villetribunal_fr, typeTribunaux, tribunalIdManuallyEdited]);

  const handleAdd = async () => {
    //  formulaire
    if (selectedTable.key === "tribunals") {
      setShowTribunalForm(true);
      return;
    }

    if (!newValue.trim()) return;

    // // Vérification d'existence pour les statuts d'affaire (désactivé)
    // if (selectedTable.key === "statutaffaires") {
    //   const exists = items.some(
    //     (item) =>
    //       item.libellestatutaffaire.trim().toLowerCase() ===
    //       newValue.trim().toLowerCase(),
    //   );
    //   if (exists) {
    //     setError(t("Ce statut existe déjà !"));
    //     return;
    //   }
    // }

    // Vérification d'existence pour les types d'intervention
    if (selectedTable.key === "typeinterventions") {
      const exists = items.some(
        (item) =>
          item.libelletypeintervention.trim().toLowerCase() ===
          newValue.trim().toLowerCase(),
      );
      if (exists) {
        setError(t("Ce type d'intervention existe déjà !"));
        return;
      }
    }

    try {
      let dataToSend = { [selectedTable.field]: newValue };

      if (selectedTable.key && ["fonctionclients","typeaffaires","typeclients","statutaffaires","etapejudiciaires","tribunals","typetribunals","typeinterventions","typesocietes"].includes(selectedTable.key)) {
        dataToSend[`${selectedTable.field}_fr`] = newValue;
        dataToSend[`${selectedTable.field}_ar`] = newValue;
      }

      // Gestion spéciale pour TypeDemande
      if (selectedTable.key === "typedemandes") {
        dataToSend = {
          libelle: newValue,
          libelle_ar: newValue,
          categorie: "CIVIL",
          delai_legal: 0,
          actif: true,
          notification_automatique: false,
          description: "",
          documents_requis: "",
        };
      }

      // Gestion pour TypeAvertissement
      if (selectedTable.key === "typeavertissements") {
        dataToSend = {
          libelle: newValue,
          libelle_ar: newValue,
          categorie: "CIVIL",
          delai_legal: 0,
          obligatoire: true,
          actif: true,
          notification_automatique: false,
          description: "",
        };
      }
      if (selectedTable.key === "avocats") {
        setShowAvocatForm(true);
        return;
      }





      console.log("Données envoyées:", dataToSend);
      await api.post(`${selectedTable.key}/`, dataToSend);
      setNewValue("");
      const res = await api.get(`${selectedTable.key}/`);
      setItems(res.data);
      setError("");
    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data);
      setError(
        t("Erreur lors de l'ajout: ") +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }

  };

  const handleEdit = async (item, index) => {
    try {
      console.log("Modification de l'élément:", item);
      console.log("Nouvelle valeur:", editValue);

      //  récupérer l'ID selon la table
      let itemId;
      if (selectedTable.key === "fonctionclients") {
        itemId = item.idfonction;
      } else if (selectedTable.key === "typeaffaires") {
        itemId = item.idtypeaffaire;
      } else if (selectedTable.key === "typeclients") {
        itemId = item.idtypeclient;
      // } else if (selectedTable.key === "statutaffaires") {
      //   itemId = item.idstatutaffaire;
      } else if (selectedTable.key === "tribunals") {
        itemId = item.idtribunal;
      } else if (selectedTable.key === "typetribunals") {
        itemId = item.idtypetribunal;
      } else if (selectedTable.key === "typeavertissements") {
        itemId = item.idtypeavertissement;
      } else if (selectedTable.key === "typedemandes") {
        itemId = item.idtypedemande;
      } else if (selectedTable.key === "typeinterventions") {
        itemId = item.idtypeintervention;
      }
        else if (selectedTable.key === "avocats") {
        itemId = item.idavocat;
        }
        else {
        itemId = item.id || item[`id${selectedTable.key.slice(0, -1)}`];
      }

      console.log("ID de l'élément:", itemId);
      console.log("URL:", `${selectedTable.key}/${itemId}/`);

      let payload = { [selectedTable.field]: editValue };
      // Cas spécial pour les avocats: éditer prénom/nom selon la langue
      if (selectedTable.key === "avocats") {
        payload = isArabic
          ? { prenom_ar: editAvocat.prenom, nomavocat_ar: editAvocat.nom }
          : { prenom_fr: editAvocat.prenom, nomavocat_fr: editAvocat.nom };
      } else {
        if (isArabic && item.hasOwnProperty(`${selectedTable.field}_ar`)) {
          payload[`${selectedTable.field}_ar`] = editValue;
        } else if (!isArabic && item.hasOwnProperty(`${selectedTable.field}_fr`)) {
          payload[`${selectedTable.field}_fr`] = editValue;
        } else {
           payload[selectedTable.field] = editValue;
        }
      }

      await api.patch(`${selectedTable.key}/${itemId}/`, payload);
      setEditIndex(null);
      setEditAvocat({ nom: "", prenom: "" });
      const res = await api.get(`${selectedTable.key}/`);
      setItems(res.data);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(
        t("Erreur lors de la modification: ") +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t("Confirmer la suppression ?"))) return;
    try {
      //  l'ID selon la table
      let itemId;
      if (selectedTable.key === "fonctionclients") {
        itemId = item.idfonction;
      } else if (selectedTable.key === "typeaffaires") {
        itemId = item.idtypeaffaire;
      } else if (selectedTable.key === "typeclients") {
        itemId = item.idtypeclient;
      // } else if (selectedTable.key === "statutaffaires") {
      //   itemId = item.idstatutaffaire;
      } else if (selectedTable.key === "tribunals") {
        itemId = item.idtribunal;
      } else if (selectedTable.key === "typetribunals") {
        itemId = item.idtypetribunal;
      }
        else if (selectedTable.key === "avocats") {
            itemId = item.idavocat;
       }
        else {
        itemId = item.id || item[`id${selectedTable.key.slice(0, -1)}`];
      }

      await api.delete(`${selectedTable.key}/${itemId}/`);
      const res = await api.get(`${selectedTable.key}/`);
      setItems(res.data);
    } catch (err) {
      setError(
        t("Erreur lors de la suppression: ") +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message),
      );
    }
  };

  // Fonctions pour le formulaire de tribunal
  const handleTribunalFormChange = (field, value) => {
    setTribunalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTribunalSubmit = async () => {
    // Validation des champs obligatoires
    if (!tribunalForm.nomtribunal_fr.trim() && !tribunalForm.nomtribunal_ar.trim()) {
      setError(t("Le nom du tribunal est obligatoire (au moins en français ou en arabe)"));
      return;
    }
    if (!tribunalForm.idtribunal || !String(tribunalForm.idtribunal).trim()) {
      setError(t("Le code du tribunal est obligatoire"));
      return;
    }

    try {
      // les données à envoyer
      const dataToSend = {
        idtribunal: tribunalForm.idtribunal.trim(),
        nomtribunal_fr: tribunalForm.nomtribunal_fr.trim() || tribunalForm.nomtribunal_ar.trim(),
        nomtribunal_ar: tribunalForm.nomtribunal_ar.trim() || tribunalForm.nomtribunal_fr.trim(),
        adressetribunal_fr: tribunalForm.adressetribunal_fr.trim() || null,
        adressetribunal_ar: tribunalForm.adressetribunal_ar.trim() || null,
        villetribunal_fr: tribunalForm.villetribunal_fr.trim() || null,
        villetribunal_ar: tribunalForm.villetribunal_ar.trim() || null,
        telephonetribunal: tribunalForm.telephonetribunal.trim() || null,
        idtypetribunal: tribunalForm.idtypetribunal
      };

      console.log("Données du tribunal à envoyer:", dataToSend);
      
      await api.post("tribunals/", dataToSend);
      
      // Réinitialiser le formulaire
      setTribunalForm({
        idtribunal: '',
        nomtribunal_fr: '',
        nomtribunal_ar: '',
        adressetribunal_fr: '',
        adressetribunal_ar: '',
        villetribunal_fr: '',
        villetribunal_ar: '',
        telephonetribunal: '',
        idtypetribunal: null
      });
      setTribunalIdManuallyEdited(false);
      

      setShowTribunalForm(false);
      const res = await api.get("tribunals/");
      setItems(res.data);
      setError("");
    } catch (err) {
      console.error("Erreur lors de l'ajout du tribunal:", err.response?.data);
      setError(
        t("Erreur lors de l'ajout du tribunal: ") +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : err.message)
      );
    }
  };

  const handleTribunalCancel = () => {
    setShowTribunalForm(false);
    setTribunalForm({
      nomtribunal_fr: '',
      nomtribunal_ar: '',
      adressetribunal_fr: '',
      adressetribunal_ar: '',
      villetribunal_fr: '',
      villetribunal_ar: '',
      telephonetribunal: '',
      idtypetribunal: null
    });
    setError("");
  };

  // // Filtrage des doublons pour les statuts d'affaire (désactivé)
  let itemsToDisplay = items;
  // if (selectedTable.key === "statutaffaires") {
  //   itemsToDisplay = items.filter(
  //     (s, idx, arr) =>
  //       arr.findIndex(
  //         (x) =>
  //           (x.libellestatutaffaire || "").trim().toLowerCase() ===
  //           (s.libellestatutaffaire || "").trim().toLowerCase(),
  //       ) === idx,
  //   );
  // }




  // sauvegarder un avocat
const handleSaveAvocat = async () => {
  try {
    // Validation des champs obligatoires et UX messages détaillés
    const errors = [];
    if (!avocatForm.nomavocat_fr) {
      errors.push(t("Le nom (français) est obligatoire"));
    }
    if (!avocatForm.nomavocat_ar) {
      errors.push(t("Le nom (arabe) est obligatoire"));
    }
    if (!avocatForm.prenom_ar) {
      errors.push(t("Le prénom (arabe) est obligatoire"));
    }

    // Validation email simple
    if (avocatForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(avocatForm.email)) {
      errors.push(t("Email invalide (ex: nom@domaine.com)"));
    }

   // Validation téléphone (Maroc) : accepte +2126..., 06..., 07...,
const phoneDigits = (avocatForm.telephone || '').replace(/\D/g, '');
if (avocatForm.telephone && !(/^(?:\+212|0)[5-7]\d{8}$/.test(phoneDigits))) {
  errors.push(t("Téléphone invalide (format marocain)"));
}

    if (errors.length) {
      setError(errors.join(' • '));
      return;
    }

    // Préparer les données avec les noms de champs attendus par l'API
    const dataToSend = {
      nomavocat_fr: avocatForm.nomavocat_fr || '',
      prenom_fr: avocatForm.prenom_fr || '',
      nomavocat_ar: avocatForm.nomavocat_ar || '',
      prenom_ar: avocatForm.prenom_ar || '',
      telephone: avocatForm.telephone || '',
      email: avocatForm.email || '',
      adresse_fr: avocatForm.adresse_fr || '',
      adresse_ar: avocatForm.adresse_ar || '',
      ville_fr: avocatForm.ville_fr || '',
      ville_ar: avocatForm.ville_ar || '',
      barreau: avocatForm.barreau || '',
      specialisation: avocatForm.specialisation || ''
    };

    // Envoyer les données à l'API
    let response;
    if (avocatForm.idavocat) {
      // Mise à jour
      response = await api.put(`avocats/${avocatForm.idavocat}/`, dataToSend);
    } else {
      // Création
      response = await api.post('avocats/', dataToSend);
    }

    // Rafraîchir la liste
    const updatedList = await api.get('avocats/');
    setItems(updatedList.data);

    // Fermer le formulaire et réinitialiser
    setShowAvocatForm(false);
    setAvocatForm({
      idavocat: '',
      nomavocat_fr: '',
      nomavocat_ar: '',
      prenom_fr: '',
      prenom_ar: '',
      telephone: '',
      email: '',
      adresse_fr: '',
      adresse_ar: '',
      ville_fr: '',
      ville_ar: '',
      barreau: '',
      specialisation: ''
    });
    setError("");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'avocat:", error);
    setError(
      t("Erreur lors de l'enregistrement: ") +
        (error.response?.data ? JSON.stringify(error.response.data) : error.message)
    );
  }
};
//   annuler l'édition d'un avocat
const handleAvocatCancel = () => {
  setShowAvocatForm(false);
  setAvocatForm({
    nomavocat_fr: '',
    nomavocat_ar: '',
    prenom_fr: '',
    prenom_ar: '',
    telephone: '',
    email: '',
    adresse_fr: '',
    adresse_ar: '',
    ville_fr: '',
    ville_ar: '',
    barreau: '',
    specialisation: ''
  });
  setError("");
};

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 800,
          width: "90%",
          maxHeight: "80vh",
          boxShadow: "0 8px 32px #0002",
          position: "relative",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: isArabic ? "auto" : 16,
            left: isArabic ? 16 : "auto",
            background: "#e53935",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 18,
            padding: "4px 12px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          X
        </button>
        <div style={{ display: "flex", height: "70vh", flexDirection: isArabic ? "row-reverse" : "row" }}>
          {/* Sidebar */}
          <div
            style={{
              minWidth: 180,
              borderRight: "1px solid #e0e0e0",
              padding: 16,
              overflowY: "auto",
            }}
          >
            {TABLES.map((tItem) => (
              <div
                key={tItem.key}
                onClick={() => setSelectedTable(tItem)}
                style={{
                  padding: "10px 8px",
                  cursor: "pointer",
                  background:
                    selectedTable.key === tItem.key ? "#1976d2" : "transparent",
                  color: selectedTable.key === tItem.key ? "#fff" : "#1a237e",
                  borderRadius: 6,
                  marginBottom: 6,
                  fontWeight: "bold",
                }}
              >
                {t(tItem.labelKey)}
              </div>
            ))}
          </div>
          {/* Zone centrale */}
          <div
            style={{
              flex: 1,
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ color: "#1976d2", marginTop: 0, marginBottom: 16, textAlign: "center" }}>
              {t(selectedTable.labelKey)}
            </h3>
            {error && (
              <div style={{ color: "#e53935", marginBottom: 8 }}>{error}</div>
            )}

            {/* scroll pour la liste */}
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              <table
                style={{
                  width: "100%",
                  background: "#f5f6fa",
                  borderRadius: 8,
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f5f6fa",
                    zIndex: 5,
                  }}
                >
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>
                      {selectedTable.key === "avocats" ? t("Nom complet") : t("Libellé")}
                    </th>
                    <th style={{ textAlign: isArabic ? "center" : "left", padding: 8 }}>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8 }}>
                        {editIndex === idx ? (
                          selectedTable.key === "avocats" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <input
                                value={editAvocat.prenom}
                                onChange={(e) => setEditAvocat({ ...editAvocat, prenom: e.target.value })}
                                placeholder={t(isArabic ? "Prénom (arabe)" : "Prénom (français)")}
                                dir={isArabic ? "rtl" : "ltr"}
                                style={{ width: "100%", padding: "6px 8px", fontSize: 14, borderRadius: 4, border: "1px solid #e0e0e0" }}
                                onKeyPress={(e) => { if (e.key === "Enter") { handleEdit(item, idx); } }}
                              />
                              <input
                                value={editAvocat.nom}
                                onChange={(e) => setEditAvocat({ ...editAvocat, nom: e.target.value })}
                                placeholder={t(isArabic ? "Nom (arabe)" : "Nom (français)")}
                                dir={isArabic ? "rtl" : "ltr"}
                                style={{ width: "100%", padding: "6px 8px", fontSize: 14, borderRadius: 4, border: "1px solid #e0e0e0" }}
                                onKeyPress={(e) => { if (e.key === "Enter") { handleEdit(item, idx); } }}
                              />
                            </div>
                          ) : (
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 14,
                                borderRadius: 4,
                                border: "1px solid #e0e0e0",
                                outline: "none",
                              }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleEdit(item, idx);
                                }
                              }}
                            />
                          )
                        ) : (
                          selectedTable.key === "avocats" ? getAvocatLabel(item) : getLocalizedValue(item, selectedTable.field)
                        )}
                      </td>
                      <td style={{ padding: 8, textAlign: isArabic ? "center" : "left" }}>
                        {editIndex === idx ? (
                          <>
                            <button
                              onClick={() => handleEdit(item, idx)}
                              style={{
                                marginRight: 8,
                                color: "#1976d2",
                                background: "#fff",
                                border: "1px solid #1976d2",
                                borderRadius: 4,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              {t("Valider")}
                            </button>
                            <button
                              onClick={() => setEditIndex(null)}
                              style={{
                                background: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 4,
                                padding: "4px 8px",
                                cursor: "pointer",
                              }}
                            >
                              {t("Annuler")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditIndex(idx);
                                if (selectedTable.key === "avocats") {
                                  setEditAvocat({
                                    prenom: isArabic ? (item.prenom_ar || "") : (item.prenom_fr || ""),
                                    nom: isArabic ? (item.nomavocat_ar || "") : (item.nomavocat_fr || ""),
                                  });
                                } else {
                                  setEditValue(getLocalizedValue(item, selectedTable.field));
                                }
                              }}
                              style={{
                                marginRight: 8,
                                color: "#1976d2",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                              }}
                              title={t("Modifier")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              style={{
                                color: "#e53935",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                              }}
                              title={t("Supprimer")}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formulaire pour les tribunaux */}
            {selectedTable.key === "tribunals" && showTribunalForm && (
              <div
                style={{
                  borderTop: "2px solid #e0e0e0",
                  padding: "20px",
                  background: "#f8f9fa",
                  borderRadius: "0 0 8px 8px",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
                  {t("Ajouter un nouveau tribunal")}
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  {/* Code tribunal (ID) */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Code du tribunal *")}
                    </label>
                    <input
                      type="text"
                      value={tribunalForm.idtribunal}
                      onChange={(e) => {
                        setTribunalIdManuallyEdited(true);
                        handleTribunalFormChange("idtribunal", e.target.value.toUpperCase());
                      }}
                      placeholder={t("Ex: TRIB_COM-RB")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                        letterSpacing: '0.5px'
                      }}
                    />
                  </div>

                  {/* Nom français */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Nom du tribunal (Français)")} *
                    </label>
                    <input
                      type="text"
                      value={tribunalForm.nomtribunal_fr}
                      onChange={(e) => handleTribunalFormChange("nomtribunal_fr", e.target.value)}
                      placeholder={t("Ex: Tribunal de première instance")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Nom arabe */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Nom du tribunal (Arabe)")} *
                    </label>
                    <input
                      type="text"
                      value={tribunalForm.nomtribunal_ar}
                      onChange={(e) => handleTribunalFormChange("nomtribunal_ar", e.target.value)}
                      placeholder={t("Ex: محكمة ابتدائية")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Ville française */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Ville (Français)")}
                    </label>
                    <input
                      type="text"
                      value={tribunalForm.villetribunal_fr}
                      onChange={(e) => handleTribunalFormChange("villetribunal_fr", e.target.value)}
                      placeholder={t("Ex: Casablanca")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Ville arabe */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Ville (Arabe)")}
                    </label>
                    <input
                      type="text"
                      value={tribunalForm.villetribunal_ar}
                      onChange={(e) => handleTribunalFormChange("villetribunal_ar", e.target.value)}
                      placeholder={t("Ex: الدار البيضاء")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Type de tribunal */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Type de tribunal")}
                    </label>
                    <select
                      value={tribunalForm.idtypetribunal || ""}
                      onChange={(e) => handleTribunalFormChange("idtypetribunal", e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    >
                      <option value="">{t("Sélectionner un type")}</option>
                      {typeTribunaux.map((type) => (
                        <option key={type.idtypetribunal} value={type.idtypetribunal}>
                          {getLocalizedValue(type, "libelletypetribunal")} - {type.niveau}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Téléphone")}
                    </label>
                    <input
                      type="tel"
                      value={tribunalForm.telephonetribunal}
                      onChange={(e) => handleTribunalFormChange("telephonetribunal", e.target.value)}
                      placeholder={t("Ex: +212 5XX-XXXXXX")}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Adresses */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Adresse (Français)")}
                    </label>
                    <textarea
                      value={tribunalForm.adressetribunal_fr}
                      onChange={(e) => handleTribunalFormChange("adressetribunal_fr", e.target.value)}
                      placeholder={t("Ex: Avenue Mohammed V, Quartier Centre")}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                      {t("Adresse (Arabe)")}
                    </label>
                    <textarea
                      value={tribunalForm.adressetribunal_ar}
                      onChange={(e) => handleTribunalFormChange("adressetribunal_ar", e.target.value)}
                      placeholder={t("Ex: شارع محمد الخامس، حي الوسط")}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                {/* Boutons d'action  */}
                <div style={{ 
                  display: "flex", 
                  gap: "12px", 
                  justifyContent: "flex-end",
                  paddingTop: "16px",
                  borderTop: "1px solid #e0e0e0",
                  marginTop: "20px",
                  position: "sticky",
                  bottom: 0,
                  background: "#f8f9fa",
                  paddingBottom: "10px"
                }}>
                  <button
                    onClick={handleTribunalCancel}
                    style={{
                      padding: "12px 24px",
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                      color: "#666",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#f5f5f5";
                      e.target.style.borderColor = "#bbb";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#fff";
                      e.target.style.borderColor = "#ddd";
                    }}
                  >
                    {t("Annuler")}
                  </button>
                  <button
                    onClick={handleTribunalSubmit}
                    style={{
                      padding: "12px 24px",
                      borderRadius: 6,
                      border: "none",
                      background: "#43a047",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "bold",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 4px rgba(67, 160, 71, 0.3)",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#388e3c";
                      e.target.style.boxShadow = "0 4px 8px rgba(67, 160, 71, 0.4)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#43a047";
                      e.target.style.boxShadow = "0 2px 4px rgba(67, 160, 71, 0.3)";
                    }}
                  >
                    {t("Ajouter le tribunal")}
                  </button>
                </div>
              </div>
            )}

            {/* Zone d'ajout normale pour les autres tables sauf tribunaux et avocats */}
            {selectedTable.key !== "tribunals" && selectedTable.key !== "avocats" && (
            <div
              style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: 16,
                background: "#fff",
                borderRadius: "0 0 8px 8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={`${t("Ajouter")} ${t(selectedTable.labelKey)}`}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontSize: 15,
                    borderRadius: 6,
                    border: "1px solid #e0e0e0",
                    outline: "none",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAdd();
                    }
                  }}
                />
                <button
                  onClick={handleAdd}
                  style={{
                    color: "#fff",
                    background: "#43a047",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {t("Ajouter")}
                </button>
              </div>
            </div>
            )}

            {/* Zone d'ajout pour les tribunaux */}
            {selectedTable.key === "tribunals" && !showTribunalForm && (
              <div
                style={{
                  borderTop: "2px solid #e0e0e0",
                  paddingTop: 16,
                  background: "#fff",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button
                    onClick={handleAdd}
                    style={{
                      color: "#fff",
                      background: "#43a047",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {t("Ajouter")}
                  </button>
                </div>
              </div>
            )}

            {/* Zone d'ajout pour les avocats  */}
            {selectedTable.key === "avocats" && (
              <div
                style={{
                  borderTop: "2px solid #e0e0e0",
                  paddingTop: 16,
                  background: "#fff",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button
                    onClick={() => setShowAvocatForm(true)}
                    style={{
                      color: "#fff",
                      background: "#43a047",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {t("Ajouter")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Formulaire des avocats */}
{showAvocatForm && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        width: "90%",
        maxWidth: 800,
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#1976d2", textAlign: "center" }}>
        {avocatForm.idavocat ? t("Modifier l'avocat") : t("Ajouter un avocat")}
      </h3>

      {error && <div style={{
        color: "#e53935",
        marginBottom: 16,
        padding: "8px",
        background: "#ffebee",
        borderRadius: "4px",
        textAlign: "center"
      }}>{error}</div>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16
      }}>
        {/* Section Informations Personnelles */}
        <div style={{
          gridColumn: "1 / -1",
          padding: "12px",
          background: "#f5f6fa",
          borderRadius: "6px",
          marginBottom: "8px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1976d2" }}>{t("Informations Personnelles")}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Nom (français)")} *</label>
              <input
                value={avocatForm.nomavocat_fr || ''}
                onChange={(e) => setAvocatForm({...avocatForm, nomavocat_fr: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("Entrez le nom en français")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Prénom (français)")} *</label>
              <input
                value={avocatForm.prenom_fr || ''}
                onChange={(e) => setAvocatForm({...avocatForm, prenom_fr: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("Entrez le prénom en français")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Nom (arabe)*")}</label>
              <input
                dir="rtl"
                value={avocatForm.nomavocat_ar || ''}
                onChange={(e) => setAvocatForm({...avocatForm, nomavocat_ar: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px",
                  textAlign: "right"
                }}
                placeholder={t("الاسم العائلي بالعربية")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Prénom (arabe)*")}</label>
              <input
                dir="rtl"
                value={avocatForm.prenom_ar || ''}
                onChange={(e) => setAvocatForm({...avocatForm, prenom_ar: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px",
                  textAlign: "right"
                }}
                placeholder={t("الاسم الشخصي بالعربية")}
              />
            </div>
          </div>
        </div>

        {/* Section Coordonnées */}
        <div style={{
          gridColumn: "1 / -1",
          padding: "12px",
          background: "#f5f6fa",
          borderRadius: "6px",
          marginBottom: "8px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1976d2" }}>{t("Coordonnées")}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Téléphone")} *</label>
              <input
                type="tel"
                value={avocatForm.telephone || ''}
                onChange={(e) => setAvocatForm({...avocatForm, telephone: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder="+212 600 000000"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Email")}</label>
              <input
                type="email"
                value={avocatForm.email || ''}
                onChange={(e) => setAvocatForm({...avocatForm, email: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder="exemple@domaine.com"
              />
            </div>
          </div>
        </div>

        {/* Section Adresse */}
        <div style={{
          gridColumn: "1 / -1",
          padding: "12px",
          background: "#f5f6fa",
          borderRadius: "6px",
          marginBottom: "8px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1976d2" }}>{t("Adresse")}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Adresse (français)")}</label>
              <input
                value={avocatForm.adresse_fr || ''}
                onChange={(e) => setAvocatForm({...avocatForm, adresse_fr: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("N° Rue, Quartier")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Adresse (arabe)")}</label>
              <input
                dir="rtl"
                value={avocatForm.adresse_ar || ''}
                onChange={(e) => setAvocatForm({...avocatForm, adresse_ar: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px",
                  textAlign: "right"
                }}
                placeholder={t("الشارع، الحي")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Ville (français)")}</label>
              <input
                value={avocatForm.ville_fr || ''}
                onChange={(e) => setAvocatForm({...avocatForm, ville_fr: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("Nom de la ville")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Ville (arabe)")}</label>
              <input
                dir="rtl"
                value={avocatForm.ville_ar || ''}
                onChange={(e) => setAvocatForm({...avocatForm, ville_ar: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px",
                  textAlign: "right"
                }}
                placeholder={t("اسم المدينة")}
              />
            </div>
          </div>
        </div>

        {/* Section Informations Professionnelles */}
        <div style={{
          gridColumn: "1 / -1",
          padding: "12px",
          background: "#f5f6fa",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1976d2" }}>{t("Informations Professionnelles")}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Barreau d'affiliation")}</label>
              <input
                value={avocatForm.barreau || ''}
                onChange={(e) => setAvocatForm({...avocatForm, barreau: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("Ex: Barreau de Casablanca")}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Spécialisation")}</label>
              <input
                value={avocatForm.specialisation || ''}
                onChange={(e) => setAvocatForm({...avocatForm, specialisation: e.target.value})}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: "14px"
                }}
                placeholder={t("Ex: Droit des affaires, Droit pénal, etc.")}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
        paddingTop: 16,
        borderTop: "1px solid #eee"
      }}>
        <button
          onClick={() => {
            setShowAvocatForm(false);
            setAvocatForm({
              idavocat: '',
              nomavocat_fr: '',
              nomavocat_ar: '',
              prenom_fr: '',
              prenom_ar: '',
              telephone: '',
              email: '',
              adresse_fr: '',
              adresse_ar: '',
              ville_fr: '',
              ville_ar: '',
              barreau: '',
              specialisation: ''
            });
            setError("");
          }}
          style={{
            padding: "8px 20px",
            border: "1px solid #ccc",
            background: "#fff",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#f5f5f5"}
          onMouseOut={(e) => e.target.style.background = "#fff"}
        >
          {t("Annuler")}
        </button>
        <button
          onClick={handleSaveAvocat}
          style={{
            padding: "8px 20px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#1565c0"}
          onMouseOut={(e) => e.target.style.background = "#1976d2"}
        >
          {t("Enregistrer")}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
