import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorMessage from "../components/ErrorMessage";
import UnifiedEtapeButton from "../components/UnifiedEtapeButton";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import WorkflowPage from "../pages/WorkflowPage";
import RendezVousModal from "../components/RendezVousModal";
import Select from "react-select";

export default function AffairesSection() {
  const { t, i18n } = useTranslation();
  const [affaires, setAffaires] = useState([]);
  const [error, setError] = useState("");
  const [dateOuverture, setDateOuverture] = useState("");
  const [dateCloture, setDateCloture] = useState("");
  const [idclient, setIdclient] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editAffaire, setEditAffaire] = useState({});
  const [detailAffaire, setDetailAffaire] = useState(null);
  // const [statuts, setStatuts] = useState([]);
  // const [filterStatut, setFilterStatut] = useState("");
  const [typesClient, setTypesClient] = useState([]);
  const [filterTypeClient, setFilterTypeClient] = useState("");
  const [typesAffaire, setTypesAffaire] = useState([]);
  const [statutEditId, setStatutEditId] = useState(null);
  const [newStatut, setNewStatut] = useState("");
  const [roleClient, setRoleClient] = useState("demandeur");
  const [fonctions, setFonctions] = useState([]);
  const [numeroDossier, setNumeroDossier] = useState("");
  const [codeDossier, setCodeDossier] = useState("");
  const [anneeDossier, setAnneeDossier] = useState("");
  const [classification, setClassification] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [tribunaux, setTribunaux] = useState([]);
  const [villesDisponibles, setVillesDisponibles] = useState([]);
  const [villeSelectionnee, setVilleSelectionnee] = useState("");
  const [tribunalSelectionne, setTribunalSelectionne] = useState(null);
  const [addFilterTypeClient, setAddFilterTypeClient] = useState("");
  // Ajoutez ces états pour la progression
  const [workflowModal, setWorkflowModal] = useState({
    show: false,
    affaireId: null,
  });
  const [etapesActuelles, setEtapesActuelles] = useState({});
  const [progressions, setProgressions] = useState({});

  // Priorisation  des villes (Souss-Massa et régions du Sud)
  // Tokens FR/AR pour booster les villes prioritaires (Souss‑Massa + Sud)
  const preferredCityTokens = [
    // Agadir
    "agadir", "أكادير", "اكادير",
    "inzgane", "inzegane", "inezgane", "إنزكان", "انزكان",
    "ait melloul", "أيت ملول", "ايت ملول",
    "chtouka", "اشتوكة", "أشتوكة", "ait baha", "آيت باها",
    // Villes régionales
    "tiznit", "تزنيت",
    "taroudant", "تارودانت",
    "tata", "طاطا",
    // Sud
    "guelmim", "كلميم",
    "tan-tan", "tantan", "طانطان",
    "sidi ifni", "سيدي افني", "سيدي إفني",
    "laayoune", "laâyoune", "العيون",
    "dakhla", "الداخلة",
    "tarfaya", "طرافاية", "طرفاية",
  ].map((s) => String(s).toLowerCase());

  const isPreferredCity = (name) => {
    const n = String(name || "").toLowerCase().trim();
    if (!n) return false;
    return preferredCityTokens.some((tok) => n.includes(tok));
  };

  const sortCitiesByPreference = (cities) => {
    return (cities || []).slice().sort((a, b) => {
      const sa = isPreferredCity(a) ? 1 : 0;
      const sb = isPreferredCity(b) ? 1 : 0;
      if (sb - sa !== 0) return sb - sa;
      return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
    });
  };

  // États pour le modal de rendez-vous
  const [rendezVousModal, setRendezVousModal] = useState({
    show: false,
    affaire: null,
  });

  // état pour contrôler l'affichage du formulaire de création
  const [showCreateForm, setShowCreateForm] = useState(false);

  // useEffect pour détecter le paramètre ?action=create dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");

    if (action === "create") {
      // Ouvrir automatiquement le formulaire de création
      setShowCreateForm(true);

      // Nettoyer l'URL en supprimant le paramètre
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const fetchAffaires = () => {
    api
      .get("affairejudiciaires/")
      .then((res) => setAffaires(res.data))
      .catch((err) => setError(err.message));
  };
  const fetchClients = () => {
    api
      .get("clients/")
      .then((res) => setClients(res.data))
      .catch(() => {});
  };
  // const fetchStatuts = () => {
  //   api
  //     .get("statutaffaires/")
  //     .then((res) => setStatuts(res.data))
  //     .catch(() => {});
  // };
  const fetchTypesClient = () => {
    api
      .get("typeclients/")
      .then((res) => setTypesClient(res.data))
      .catch(() => {});
  };
  const fetchTypesAffaire = () => {
    api
      .get("typeaffaires/")
      .then((res) => setTypesAffaire(res.data))
      .catch(() => {});
  };
  const fetchFonctions = () => {
    api
      .get("fonctionclients/")
      .then((res) => setFonctions(res.data))
      .catch(() => {});
  };

  // classification par code
  useEffect(() => {
    if (!codeDossier) {
      // on vide si pas de code
      setClassification(null);
      setSuggestions([]);
      setTribunaux([]);
      setVillesDisponibles([]);
      setVilleSelectionnee("");
      setTribunalSelectionne(null);
      return;
    }
    //appel api
    api
      .get("classification/", { params: { code: codeDossier } })
      .then((res) => {
        const data = res.data;
        if (data.type) {
          //calissifier
          setClassification(data);
          setSuggestions([]);
          //  tribunaux suggere
          if (data.tribunaux) {
            setTribunaux(data.tribunaux);
            const villes = [
              ...new Set(data.tribunaux.map((t) => t.ville).filter(Boolean)),
            ];
            setVillesDisponibles(sortCitiesByPreference(villes));
            setVilleSelectionnee("");
            setTribunalSelectionne(null);
          }
        } else if (data.suggestions) {
          //code partiel
          setClassification(null);
          setSuggestions(data.suggestions);
          setTribunaux([]);
          setVillesDisponibles([]);
          setVilleSelectionnee("");
          setTribunalSelectionne(null);
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la classification:", error);
        setClassification(null);
        setSuggestions([]);
        setTribunaux([]);
      });
  }, [codeDossier]); //se declanche à chaque chargement du code

  useEffect(() => {
    fetchAffaires();
    fetchClients();
    // fetchStatuts();
    fetchTypesClient();
    fetchTypesAffaire();
    fetchFonctions();
  }, []);

  // Détecte le mode appel et pré-remplit le formulaire
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const source = urlParams.get("source");
    const clientId = urlParams.get("client_id");
    const fonctionId = urlParams.get("fonction_id");

    console.log("Paramètres reçus:", { mode, source, clientId, fonctionId });

    if (mode === "ajout" && source === "appel") {
      if (clientId) setIdclient(clientId);
      if (fonctionId && fonctions.length > 0) {
        const fonction = fonctions.find(
          (f) => f.idfonctionclient == fonctionId,
        );
        if (fonction) {
          // Déterminer si c'est demandeur ou opposant selon la fonction
          const fonctionLibelle = (fonction.libellefonction_fr || fonction.libellefonction_ar || '').toLowerCase();
          if (
            fonctionLibelle.includes("opposant") ||
            fonctionLibelle.includes("مدعى عليه")
          ) {
            setRoleClient("opposant");
          } else {
            setRoleClient("demandeur");
          }
        }
      }
    }
  }, [fonctions]);

  // charger les données de progression
  useEffect(() => {
    affaires.forEach((affaire) => {
      getEtapeActuelle(affaire.idaffaire);
      getProgression(affaire.idaffaire);
    });
  }, [affaires]);

  useEffect(() => {
    const handleReloadAffaires = () => {
      console.log("🔄 Rechargement des affaires demandé...");
      fetchAffaires();
      // Recharger  les étapes actuelles et progressions
      setTimeout(() => {
        affaires.forEach((affaire) => {
          getEtapeActuelle(affaire.idaffaire);
          getProgression(affaire.idaffaire);
        });
      }, 1000);
    };

    window.addEventListener("reloadAffaires", handleReloadAffaires);

    return () => {
      window.removeEventListener("reloadAffaires", handleReloadAffaires);
    };
  }, [affaires]);

  // Recherche et filtres
  const filteredAffaires = affaires.filter((a) => {
    const client = clients.find(
      (c) => String(c.idclient) === String(a.idclient),
    );
    const statut = a.statut_courant || "";
    const typeClient = client
      ? client.type_client
        ? (client.type_client.libelletypeclient_fr || client.type_client.libelletypeclient_ar || '').toLowerCase().replace('é', 'e')
        : (typesClient.find((t) => t.idtypeclient === client.idtypeclient)?.libelletypeclient_fr || typesClient.find((t) => t.idtypeclient === client.idtypeclient)?.libelletypeclient_ar || '').toLowerCase().replace('é', 'e') || ''
      : "";
    
    // Debug temporaire
    if (filterTypeClient && filterTypeClient !== "") {
      console.log('Debug filtrage:', {
        affaireId: a.idaffaire,
        clientId: client?.idclient,
        typeClient,
        filterTypeClient,
        match: typeClient === filterTypeClient,
        clientTypeClient: client?.type_client
      });
    }
    const matchSearch =
      search === "" ||
      (a.idaffaire &&
        String(a.idaffaire).toLowerCase().includes((search || '').toLowerCase())) ||
      (client &&
         ((client.nomclient_fr && String(client.nomclient_fr).toLowerCase().includes((search || '').toLowerCase())) ||
         (client.nomclient_ar && String(client.nomclient_ar).toLowerCase().includes((search || '').toLowerCase())) ||
         (client.prenomclient_fr && String(client.prenomclient_fr).toLowerCase().includes((search || '').toLowerCase())) ||
         (client.prenomclient_ar && String(client.prenomclient_ar).toLowerCase().includes((search || '').toLowerCase()))));
    const matchTypeClient =
      filterTypeClient === "" || typeClient === filterTypeClient;

    // Filtrage par type d'affaire basé sur le code du dossier
    const matchType =
      filterType === "" ||
      (() => {
        if (!a.code_dossier) return false;
        const code = a.code_dossier;
        let typeFromCode = "";
        if (code.startsWith("1") || code.startsWith("6")) {
          typeFromCode = "مدني";
        } else if (
          code.startsWith("2") ||
          code.startsWith("3") ||
          code.startsWith("4")
        ) {
          typeFromCode = "جنائي";
        } else if (code.startsWith("7")) {
          typeFromCode = "إدارية";
        } else if (code.startsWith("8")) {
          typeFromCode = "تجاري";
        }
        return typeFromCode === filterType;
      })();

  // const matchStatut = filterStatut === "" || statut === filterStatut;
  return matchSearch && matchTypeClient && matchType; // && matchStatut;
  });

  //   le filtrage des clients dans le formulaire d'ajout
  const normalizeFr = (s) => {
    const str = (s || '').toString().toLowerCase();
    try {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (_e) {
      // Fallback
      return str.replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/à/g, 'a').replace(/î/g, 'i').replace(/ï/g, 'i').replace(/ô/g, 'o').replace(/û/g, 'u');
    }
  };
  const getTypeClientFr = (client) => {
    if (!client) return '';
    if (client.type_client) {
      const fr = client.type_client.libelletypeclient_fr || client.type_client.libelletypeclient_ar || '';
      return normalizeFr(fr);
    }
    const typeObj = typesClient.find(t => t.idtypeclient === (typeof client.idtypeclient === 'object' ? client.idtypeclient?.idtypeclient : client.idtypeclient));
    const fr = typeObj?.libelletypeclient_fr || typeObj?.libelletypeclient_ar || '';
    return normalizeFr(fr);
  };
  const filteredClientsForAdd = (clients || []).filter(c => !addFilterTypeClient || getTypeClientFr(c) === addFilterTypeClient);

  // Affichage du nom client selon type (personne vs société) et langue
  const isSocieteClient = (client) => {
    const typeFr = getTypeClientFr(client);
    return typeFr === 'societe';
  };
  const getClientDisplayLabel = (client) => {
    if (!client) return '';
    if (isSocieteClient(client)) {
      const rsAr = client.raison_sociale_ar || '';
      const rsFr = client.raison_sociale_fr || '';
      return (i18n.language === 'ar' ? (rsAr || rsFr) : (rsFr || rsAr)) || (client.nomclient_fr || client.nomclient_ar || client.nomclient || '');
    }
    const fullAr = `${client.nomclient_ar || client.nomclient_fr || client.nomclient || ''} ${client.prenomclient_ar || client.prenomclient_fr || ''}`.trim();
    const fullFr = `${client.nomclient_fr || client.nomclient_ar || client.nomclient || ''} ${client.prenomclient_fr || client.prenomclient_ar || ''}`.trim();
    const chosen = i18n.language === 'ar' ? fullAr : fullFr;
    if (chosen) return chosen;
    // Fallback: si particulier avec noms vides mais raison sociale présente (données incohérentes)
    const rsFallback = i18n.language === 'ar'
      ? (client.raison_sociale_ar || client.raison_sociale_fr || '')
      : (client.raison_sociale_fr || client.raison_sociale_ar || '');
    return rsFallback || (i18n.language === 'ar' ? 'عميل بدون اسم' : 'Client sans nom');
  };

  // Récupérer le label d'affichage du client pour une affaire (tableau)
  const getAffaireClientDisplayName = (affaire) => {
    const client = clients.find(
      (c) => String(c.idclient) === String(affaire.idclient),
    );
    if (client) return getClientDisplayLabel(client);
    // Fallback sur champs sérialisés
    const ar = typeof affaire.client_nom === 'object' ? affaire.client_nom.ar : undefined;
    const fr = typeof affaire.client_nom === 'object' ? affaire.client_nom.fr : undefined;
    const ser = typeof affaire.client_nom === 'string' ? affaire.client_nom : undefined;
    const byLang = i18n.language === 'ar' ? (ar || fr || ser) : (fr || ar || ser);
    return byLang || t('Non assigné');
  };

  // Affichage du type d'affaire basé sur le code
  const getTypeAffaireLabel = (affaire) => {
    // Utiliser le type d'affaire du sérialiseur
    if (affaire.type_affaire_libelle) {
      return affaire.type_affaire_libelle;
    }

    // Sinon, utiliser la classification basée sur le code
    if (!affaire.code_dossier) return "-";

    const code = affaire.code_dossier;
    if (code.startsWith("1") || code.startsWith("6")) {
      return "مدني";
    } else if (
      code.startsWith("2") ||
      code.startsWith("3") ||
      code.startsWith("4")
    ) {
      return "جنائي";
    } else if (code.startsWith("7")) {
      return "إدارية";
    } else if (code.startsWith("8")) {
      return "تجاري";
    }

    return "-";
  };

  // Affichage du statut
  const getStatut = (affaire) => {
    return affaire && affaire.statut_courant
      ? affaire.statut_courant
      : "Non défini";
  };

  //   le type d'affaire basé sur la classification
  const getTypeAffaireFromClassification = (classification) => {
    if (!classification || !classification.type_principale) return null;

    // type de la première table (TypeAffairePrincipale) cat1
    return classification.type_principale;
  };

  //  fonction du client dans l'affaire
  const getOrCreateFonctionId = async (role) => {
    const res = await api.get("fonctionclients/");
    const existing = res.data.find(
      (f) => (f.libellefonction_fr || '').toLowerCase() === (role || '').toLowerCase() ||
             (f.libellefonction_ar || '').toLowerCase() === (role || '').toLowerCase(),
    );
    if (existing) return existing.idfonction;
    const createRes = await api.post("fonctionclients/", {
      libellefonction_fr: role,
      libellefonction_ar: role,
    });
    return createRes.data.idfonction;
  };

  //ajout d'une affaire
  const AddAffaire = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      //  Fonction dynamique
      const idfonctionclient = await getOrCreateFonctionId(roleClient);
      // Création de l'opposant si selectioné
      let idopposant = null;
      if (roleClient === "opposant") {
        const client = clients.find(
          (c) => String(c.idclient) === String(idclient),
        );
        if (client) {
          //  si l'opposant existe deja : meme nom et email)
          const oppRes = await api.get("opposants/", {
            params: {
              nomopposant_fr: client.nomclient_fr,
              nomopposant_ar: client.nomclient_ar,
              email: client.email,
            },
          });
          if (oppRes.data.length > 0) {
            // Opposant déjà existant, on prend le premier trouvé
            idopposant = oppRes.data[0].idopposant;
          } else {
            // Sinon, on le crée
            const newOppRes = await api.post("opposants/", {
              nomopposant_fr: client.nomclient_fr,
              nomopposant_ar: client.nomclient_ar,
              adresse1_fr: client.adresse1_fr,
              adresse1_ar: client.adresse1_ar,
              adresse2_fr: client.adresse2_fr,
              adresse2_ar: client.adresse2_ar,
              numtel1: client.numtel1,
              numtel2: client.numtel2,
              email: client.email,
            });
            idopposant = newOppRes.data.idopposant;
          }
        }
      }
      //  Création de l'affaire
      const typeAffaire = getTypeAffaireFromClassification(classification);

      //  le type d'affaire
      let idtypeaffaire = null;
      if (typeAffaire) {
        try {
          //  si le type d'affaire existe
          const typeRes = await api.get("typeaffaires/", {
            params: { libelletypeaffaire: typeAffaire },
          });

          if (typeRes.data.length > 0) {
            // Type existant, on prend le premier
            idtypeaffaire = typeRes.data[0].idtypeaffaire;
          } else {
            // Créer le nouveau type d'affaire
            const newTypeRes = await api.post("typeaffaires/", {
              libelletypeaffaire: typeAffaire,
            });
            idtypeaffaire = newTypeRes.data.idtypeaffaire;
          }
        } catch (typeErr) {
          console.warn("Erreur lors de la gestion du type d'affaire:", typeErr);
        }
      }

      // Vérifier si c'est une affaire d'appel
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get("mode");
      const source = urlParams.get("source");
      const isAppel = mode === "ajout" && source === "appel";

      // Récupérer l'ID de l'affaire parent si c'est un appel
      let affaireParentId = null;
      if (isAppel) {
        // Récupérer l'ID de l'affaire parent depuis les paramètres URL
        const affaireParentParam = urlParams.get("affaire_parent");
        if (affaireParentParam) {
          affaireParentId = parseInt(affaireParentParam);
          console.log("Affaire parent détectée:", affaireParentId);
        }
      }

      const affaireRes = await api.post("affairejudiciaires/", {
        numero_dossier: numeroDossier,
        code_dossier: codeDossier,
        annee_dossier: anneeDossier,
        dateouverture: dateOuverture,
        datecloture: null,
        idclient: idclient,
        idfonctionclient,
        roleClient: roleClient,
        idopposant: idopposant,
        idtypeaffaire: idtypeaffaire,
        affaire_parent: affaireParentId, // Relation reflexive pour l'appel
      });
      const idaffaire = affaireRes.data.idaffaire;

      //  Ajout du tribunal sélectionné
      if (tribunalSelectionne) {
        console.log("Tribunal sélectionné:", tribunalSelectionne);
        console.log(
          "Structure complète du tribunal:",
          JSON.stringify(tribunalSelectionne, null, 2),
        );
        console.log(
          "ID du tribunal:",
          tribunalSelectionne.idtribunal || tribunalSelectionne.id,
        );
        console.log("ID de l'affaire:", idaffaire);

        try {
          // Table de liaison avec les bons champs
          const tribunalData = {
            idaffaire: idaffaire,
            idtribunal:
              tribunalSelectionne.idtribunal || tribunalSelectionne.id,
            datesaisine: new Date().toISOString().slice(0, 10),
            datejugement: null,
          };
          console.log("Données à envoyer:", tribunalData);

          await api.post("affairetribunaux/", tribunalData);
          console.log("Tribunal ajouté avec succès:", tribunalSelectionne.nom);
        } catch (tribunalErr) {
          console.error("Erreur lors de l'ajout du tribunal:", tribunalErr);
          console.error("Détails:", tribunalErr.response?.data);
        }
      } else {
        console.log("Aucun tribunal sélectionné");
      }

      // Ajout du statut 'Enregistrée' par défaut
      await api.post("statutaffaires/", {
        idaffaire: idaffaire,
        libellestatutaffaire: "Enregistrée",
        datedebut: new Date().toISOString().slice(0, 10),
      });

      // Reset des champs
      setNumeroDossier("");
      setCodeDossier("");
      setAnneeDossier("");
      setDateOuverture("");
      setIdclient("");
      setClassification(null);
      setTribunaux([]);
      setVillesDisponibles([]);
      setVilleSelectionnee("");
      setTribunalSelectionne(null);

      fetchAffaires();
      // fetchStatuts();
    } catch (err) {
      setError(
        err.response?.data ? JSON.stringify(err.response.data) : err.message,
      );
    }
    setLoading(false);
  };

  const handleAddStatut = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("statutaffaires/", {
        idaffaire: statutEditId,
        libellestatutaffaire: newStatut,
        datedebut: new Date().toISOString().slice(0, 10),
      });
      setStatutEditId(null);
      setNewStatut("");
      fetchStatuts();
      fetchAffaires();
    } catch (err) {
      setError(
        err.response?.data ? JSON.stringify(err.response.data) : err.message,
      );
    }
  };

  // Fonctions pour la progression
  const getEtapeActuelle = async (affaireId) => {
    try {
      const response = await api.get(
        `affaires/${affaireId}/etape-actuelle/`,
      );
      console.log("getEtapeActuelle - response:", response.data);
      setEtapesActuelles((prev) => ({
        ...prev,
        [affaireId]: response.data,
      }));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'étape actuelle:",
        error,
      );
    }
  };

  const getProgression = async (affaireId) => {
    try {
      const response = await api.get(`affaires/${affaireId}/progression/`);
      setProgressions((prev) => ({
        ...prev,
        [affaireId]: response.data,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération de la progression:", error);
    }
  };

  const avancerEtape = async (affaireId) => {
    try {
      const response = await api.post(
        `affaires/${affaireId}/avancer-etape/`,
      );
      getEtapeActuelle(affaireId);
      getProgression(affaireId);
      alert(response.data.message);
    } catch (error) {
      console.error("Erreur lors de l'avancement d'étape:", error);
    }
  };

  const terminerEtape = async (affaireId) => {
    try {
      const response = await api.post(
        `affaires/${affaireId}/terminer-etape/`,
      );
      getEtapeActuelle(affaireId);
      getProgression(affaireId);
      alert(response.data.message);
    } catch (error) {
      console.error("Erreur lors de la terminaison d'étape:", error);
    }
  };

  // Composant pour afficher le statut progression
  const WorkflowStatus = ({ affaireId }) => {
    const navigate = useNavigate();
    return (
      <div className="workflow-status">
        <button
          onClick={() => navigate(`/workflow/${affaireId}`)}
          className="workflow-btn"
          title="Voir progression"
        >
          📋
        </button>
      </div>
    );
  };

  // Composant Badge Étape actuelle
  const EtapeActuelleBadge = ({ affaire }) => {
    const { t, i18n } = useTranslation();

    //  les données des étapes actuelles mises à jour
    const etapeActuelle = etapesActuelles[affaire.idaffaire];
    const etape = etapeActuelle?.etape_actuelle || affaire?.etape_actuelle;


    let label = "-";
    if (etape) {
      if (i18n.language === "ar") {
        label =
          etape.libelle_ar || etape.libelle || etape.id || "مرحلة غير محددة";
      } else {
        label =
          etape.libelle_fr || etape.libelle || etape.id || "Étape non définie";
      }
    }

    // Debug
    console.log(
      "EtapeActuelleBadge - affaire:",
      affaire.idaffaire,
      "etape:",
      etape,
      "label:",
      label,
    );

    return (
      <div
        style={{
          background: etape ? "#4CAF50" : "#bbb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "6px 12px",
          fontWeight: "bold",
          fontSize: 12,
          maxWidth: 200,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
        }}
        title={etape ? `${t("Étape actuelle")}: ${label}` : t("Étape actuelle")}
      >
        {label}
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 32px #e0e0e0",
        padding: 32,
      }}
    >
      <h2 style={{ color: "#1a237e", marginBottom: 24 }}>
        {t("Affaires judiciaires")}
      </h2>
      {error && <ErrorMessage error={error} />}

      {/* Bouton pour afficher/masquer le formulaire de création */}
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
          aria-expanded={showCreateForm}
          style={{ padding: "10px 14px", margin: "0 auto" }}
        >
          {showCreateForm ? t("Fermer le formulaire") : t("Nouvelle affaire")}
        </button>
      </div>
      {/* Formulaire de création d'affaire  */}
      {showCreateForm && (
        <form
          onSubmit={AddAffaire}
          style={{
            width: "100%",
            maxWidth: "1200px",
            background: "#f5f6fa",
            padding: 24,
            borderRadius: 10,
            margin: "32px auto 0 auto",
          }}
        >
          <h3 style={{ color: "#1a237e", marginBottom: 20, fontSize: 24 }}>
            {t("Ajouter une affaire")}
          </h3>

          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
            }}
          >
            {/* Colonne gauche - Champs de saisie */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 14,
                  background: "#fff",
                  borderRadius: 10,
                  border: "1.5px solid #e0e0e0",
                  padding: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 120 }}>
                  <input
                    placeholder="السنة "
                    value={anneeDossier}
                    onChange={(e) => setAnneeDossier(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "10px 14px",
                      fontSize: 18,
                      borderRadius: 6,
                      border: "1.5px solid #e0e0e0",
                      marginBottom: 0,
                      direction: "rtl",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <input
                    placeholder="رمز الملف "
                    value={codeDossier}
                    onChange={(e) => setCodeDossier(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "10px 14px",
                      fontSize: 18,
                      borderRadius: 6,
                      border: "1.5px solid #e0e0e0",
                      marginBottom: 0,
                      direction: "rtl",
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 120 }}>
                  <input
                    placeholder="رقم الملف "
                    value={numeroDossier}
                    onChange={(e) => setNumeroDossier(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "10px 14px",
                      fontSize: 18,
                      borderRadius: 6,
                      border: "1.5px solid #e0e0e0",
                      marginBottom: 0,
                      direction: "rtl",
                    }}
                  />
                </div>
              </div>
              <input
                type="date"
                placeholder={t("Date ouverradture")}
                value={dateOuverture}
                onChange={(e) => setDateOuverture(e.target.value)}
                required
                style={{
                  width: "100%",
                  marginBottom: 14,
                  height: 44,
                  padding: "10px 14px",
                  background: "#fff",
                  color: "#333",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: 6,
                  fontSize: 18,
                }}
              />
              {/*         <input type="date" placeholder="Date clôture" value={dateCloture} onChange={e => setDateCloture(e.target.value)} style={{ width: "100%", marginBottom: 14, height: 44, padding: "10px 14px", background: "#fff", color: "#333", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 18 }} /> */}
              {/* Filtre par type de client (recherche) */}
              <div style={{ marginBottom: 10 }}>
                <Select
                  value={(typesClient || []).map(tc => ({
                    value: normalizeFr(tc.libelletypeclient_fr || tc.libelletypeclient_ar || ''),
                    label: i18n.language === 'ar' ? (tc.libelletypeclient_ar || tc.libelletypeclient_fr || '') : (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '')
                  })).find(opt => opt.value === addFilterTypeClient) || null}
                  onChange={(selected) => setAddFilterTypeClient(selected?.value || '')}
                  options={(typesClient || []).map(tc => ({
                    value: normalizeFr(tc.libelletypeclient_fr || tc.libelletypeclient_ar || ''),
                    label: i18n.language === 'ar' ? (tc.libelletypeclient_ar || tc.libelletypeclient_fr || '') : (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '')
                  }))}
                  placeholder={t("Filtrer par type de client")}
                  isSearchable={true}
                  isClearable={true}
                  styles={{
                    control: (p,s) => ({...p, minHeight: 44, border: '1.5px solid #e0e0e0', boxShadow: 'none'}),
                    indicatorSeparator: () => ({ display: 'none' })
                  }}
                />
              </div>
              {/* Sélection du client (recherche) */}
              <Select
                value={filteredClientsForAdd.map(c => ({
                  value: String(c.idclient),
                  label: getClientDisplayLabel(c)
                })).find(opt => opt.value === String(idclient)) || null}
                onChange={(selected) => setIdclient(selected?.value || '')}
                options={filteredClientsForAdd.map(c => ({
                  value: String(c.idclient),
                  label: getClientDisplayLabel(c)
                }))}
                placeholder={t("Sélectionner un client")}
                isSearchable={true}
                isClearable={true}
                styles={{
                  control: (p,s) => ({...p, minHeight: 44, border: '1.5px solid #e0e0e0', boxShadow: 'none'}),
                  indicatorSeparator: () => ({ display: 'none' })
                }}
              />
              {/* Boutons radio */}
              <div
                style={{
                  marginBottom: 18,
                  display: "flex",
                  gap: 32,
                  alignItems: "center",
                }}
              >
                <label style={{ fontSize: 17 }}>
                  <input
                    type="radio"
                    name="roleClient"
                    value="demandeur"
                    checked={roleClient === "demandeur"}
                    onChange={(e) => setRoleClient(e.target.value)}
                    style={{ marginRight: 8, width: 18, height: 18 }}
                  />
                  {t("Demandeur")}
                </label>
                <label style={{ fontSize: 17 }}>
                  <input
                    type="radio"
                    name="roleClient"
                    value="opposant"
                    checked={roleClient === "opposant"}
                    onChange={(e) => setRoleClient(e.target.value)}
                    style={{ marginRight: 8, width: 18, height: 18 }}
                  />
                  {t("Opposant")}
                </label>
              </div>
            </div>

            {/* Colonne droite Affichage dynamique */}
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  color: "#1a237e",
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {t("Classification de l'affaire")}
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {/* Type */}
                <input
                  type="text"
                  disabled
                  value={classification ? classification.type : ""}
                  placeholder={t("Type d'affaire")}
                  style={{
                    background: classification ? "green" : "#f5f6fa",
                    color: classification ? "white" : "#333",
                    fontWeight: "bold",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontSize: 18,
                    marginBottom: 0,
                    textAlign: "right",
                  }}
                />
                {/* Catégorie */}
                <input
                  type="text"
                  disabled
                  value={classification ? classification.categorie : ""}
                  placeholder={t("Catégorie")}
                  style={{
                    background: classification ? "#f5f5dc" : "#f5f6fa",
                    color: "#333",
                    fontWeight: "bold",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontSize: 18,
                    marginBottom: 0,
                    textAlign: "right",
                  }}
                />
                {/* Détail */}
                <input
                  type="text"
                  disabled
                  value={classification ? classification.detail : ""}
                  placeholder={t("Détail")}
                  style={{
                    background: classification ? "yellow" : "#f5f6fa",
                    color: "#333",
                    fontWeight: "bold",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontSize: 18,
                    marginBottom: 0,
                    textAlign: "right",
                  }}
                />
                {/* Tribunal sélectionné */}
                <input
                  type="text"
                  disabled
                  value={tribunalSelectionne ? tribunalSelectionne.nom : ""}
                  placeholder={t("Tribunal sélectionné")}
                  style={{
                    background: tribunalSelectionne ? "#e3f2fd" : "#f5f6fa",
                    color: tribunalSelectionne ? "#1976d2" : "#333",
                    fontWeight: "bold",
                    border: "1.5px solid #e0e0e0",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontSize: 18,
                    marginBottom: 0,
                    textAlign: "right",
                  }}
                />
              </div>
              {/* Suggestions */}
              {Array.isArray(suggestions) && suggestions.length > 0 && (
                <ul
                  style={{
                    border: "1px solid #ccc",
                    padding: 0,
                    marginTop: 10,
                  }}
                >
                  {suggestions.map((s) => (
                    <li
                      key={s.code + s.libelle}
                      onClick={() => setCodeDossier(s.code)}
                      style={{
                        cursor: "pointer",
                        padding: 5,
                        listStyle: "none",
                      }}
                    >
                      <b>{s.code}</b> - {s.libelle}{" "}
                      <span style={{ color: "#888" }}>
                        ({s.categorie} / {s.type})
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Section Tribunaux Suggérés */}
              {classification && tribunaux.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h5
                    style={{
                      color: "#1a237e",
                      marginBottom: 12,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {t("Tribunaux suggérés pour cette affaire")}
                  </h5>

                  {/* Statistiques */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 16,
                      padding: "8px 12px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#666" }}>
                      {t("Tribunaux trouvés")} {tribunaux.length}
                    </span>
                    {villeSelectionnee && (
                      <span style={{ color: "#1976d2" }}>
                        Filtré par : {villeSelectionnee}
                      </span>
                    )}
                  </div>

                  {/* Sélection de ville */}
                  {villesDisponibles.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 8,
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {t("Filtrer par ville")} :
                      </label>
                      <Select
                        value={villesDisponibles
                          .map((v) => ({ value: v, label: v }))
                          .find((opt) => opt.value === villeSelectionnee) || null}
                        onChange={(selected) => setVilleSelectionnee(selected?.value || "")}
                        options={villesDisponibles.map((v) => ({ value: v, label: v }))}
                        placeholder={`${t("Toutes les villes")} (${villesDisponibles.length})`}
                        isSearchable={true}
                        isClearable={true}
                        styles={{
                          control: (p, s) => ({
                            ...p,
                            minHeight: 44,
                            border: "1.5px solid #e0e0e0",
                            boxShadow: "none",
                          }),
                          indicatorSeparator: () => ({ display: "none" }),
                          menu: (p) => ({ ...p, zIndex: 5 }),
                        }}
                        noOptionsMessage={() => "Aucune ville"}
                      />
                    </div>
                  )}

                  {/* Liste des tribunaux */}
                  <div
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      border: "1px solid #e0e0e0",
                      borderRadius: 8,
                      backgroundColor: "#fff",
                    }}
                  >
                    {tribunaux
                      .filter(
                        (tribunal) =>
                          !villeSelectionnee ||
                          tribunal.ville === villeSelectionnee,
                      )
                      .sort((a, b) => {
                        const sa = isPreferredCity(a.ville) ? 1 : 0;
                        const sb = isPreferredCity(b.ville) ? 1 : 0;
                        if (sb - sa !== 0) return sb - sa;
                        return String(a.nom || "").localeCompare(String(b.nom || ""), undefined, { sensitivity: "base" });
                      })
                      .map((tribunal, index) => (
                        <div
                          key={tribunal.id}
                          onClick={() => setTribunalSelectionne(tribunal)}
                          style={{
                            padding: "12px 16px",
                            borderBottom:
                              index < tribunaux.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                            cursor: "pointer",
                            backgroundColor:
                              tribunalSelectionne?.id === tribunal.id
                                ? "#e3f2fd"
                                : "#fff",
                            transition: "all 0.2s ease",
                            borderLeft:
                              tribunalSelectionne?.id === tribunal.id
                                ? "4px solid #1976d2"
                                : "4px solid transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (tribunalSelectionne?.id !== tribunal.id) {
                              e.target.style.backgroundColor = "#f5f5f5";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (tribunalSelectionne?.id !== tribunal.id) {
                              e.target.style.backgroundColor = "#fff";
                            }
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 14,
                                  color: "#1a237e",
                                  marginBottom: 4,
                                }}
                              >
                                {tribunal.nom}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#666",
                                  marginBottom: 4,
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: "#e8f5e8",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 10,
                                  }}
                                >
                                  {tribunal.type}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: "#fff3e0",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 10,
                                  }}
                                >
                                  {tribunal.ville}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: "#f3e5f5",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 10,
                                  }}
                                >
                                  {tribunal.niveau}
                                </span>
                              </div>
                              {tribunal.adresse && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#888",
                                    marginTop: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  {tribunal.adresse}
                                </div>
                              )}
                              {tribunal.telephone && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#888",
                                    marginTop: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  {tribunal.telephone}
                                </div>
                              )}
                            </div>
                            {tribunalSelectionne?.id === tribunal.id && (
                              <div
                                style={{
                                  color: "#4caf50",
                                  fontSize: 20,
                                  marginLeft: 8,
                                }}
                              >
                                ✅
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Tribunal sélectionné */}
                  {tribunalSelectionne && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "16px",
                        backgroundColor: "#e8f5e8",
                        border: "2px solid #4caf50",
                        borderRadius: 8,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          left: 16,
                          backgroundColor: "#4caf50",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        TRIBUNAL SÉLECTIONNÉ
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#2e7d32",
                            marginBottom: 6,
                          }}
                        >
                          {tribunalSelectionne.nom}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#666",
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <span> {tribunalSelectionne.ville}</span>
                          <span> {tribunalSelectionne.type}</span>
                          <span> {tribunalSelectionne.niveau}</span>
                        </div>
                        {tribunalSelectionne.adresse && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginTop: 8,
                            }}
                          >
                            <strong>Adresse :</strong>{" "}
                            {tribunalSelectionne.adresse}
                          </div>
                        )}
                        {tribunalSelectionne.telephone && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginTop: 4,
                            }}
                          >
                            <strong>Téléphone :</strong>{" "}
                            {tribunalSelectionne.telephone}
                          </div>
                        )}
                        <div style={{ marginTop: 12 }}>
                          <button
                            type="button"
                            onClick={() => setTribunalSelectionne(null)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f44336",
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            ❌ Changer de tribunal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "200px",
                height: 40,
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Ajouter
            </button>
          </div>
        </form>
      )}
      <div style={{ height: 20 }} />
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
          placeholder={t("Rechercher par numéro, client...")}
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
        <div style={{ minWidth: 240 }}>
          <Select
            value={(typesClient || []).map(tc => ({
              value: (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '').toLowerCase().replace('é','e'),
              label: i18n.language === 'ar' ? (tc.libelletypeclient_ar || tc.libelletypeclient_fr || '') : (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '')
            })).find(opt => opt.value === filterTypeClient) || null}
            onChange={(selected) => setFilterTypeClient(selected?.value || '')}
            options={(typesClient || []).map(tc => ({
              value: (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '').toLowerCase().replace('é','e'),
              label: i18n.language === 'ar' ? (tc.libelletypeclient_ar || tc.libelletypeclient_fr || '') : (tc.libelletypeclient_fr || tc.libelletypeclient_ar || '')
            }))}
            placeholder={t("Tous les types de client")}
            isSearchable={true}
            isClearable={true}
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: '35px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                boxShadow: 'none',
                '&:hover': { border: '1px solid #e0e0e0' },
                ...(state.isFocused && { border: '1px solid #e0e0e0', boxShadow: 'none' }),
              }),
              placeholder: (p) => ({ ...p, color: '#999' }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: (p) => ({ ...p, color: '#999' }),
              menu: (p) => ({ ...p, zIndex: 5 })
            }}
          />
        </div>
        <div style={{ minWidth: 240 }}>
          <Select
            value={[
              { value: '', label: t("Tous les types d'affaire") },
              { value: 'مدني', label: 'مدني (Civil)' },
              { value: 'جنائي', label: 'جنائي (Pénal)' },
              { value: 'إدارية', label: 'إدارية (Administratif)' },
              { value: 'تجاري', label: 'تجاري (Commercial)' },
            ].find(opt => opt.value === filterType) || null}
            onChange={(selected) => setFilterType(selected?.value || '')}
            options={[
              { value: 'مدني', label: 'مدني (Civil)' },
              { value: 'جنائي', label: 'جنائي (Pénal)' },
              { value: 'إدارية', label: 'إدارية (Administratif)' },
              { value: 'تجاري', label: 'تجاري (Commercial)' },
            ]}
            placeholder={t("Tous les types d'affaire")}
            isSearchable={true}
            isClearable={true}
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: '35px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                boxShadow: 'none',
                '&:hover': { border: '1px solid #e0e0e0' },
                ...(state.isFocused && { border: '1px solid #e0e0e0', boxShadow: 'none' }),
              }),
              placeholder: (p) => ({ ...p, color: '#999' }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: (p) => ({ ...p, color: '#999' }),
              menu: (p) => ({ ...p, zIndex: 5 })
            }}
          />
        </div>
        {/* Filtre statut  */}
        {false && (
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            style={{
              height: 35,
              padding: "4px 8px",
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            <option value="">{t("Tous les statuts")}</option>
            {[...new Set(statuts.map((s) => s.libellestatutaffaire))].map(
              (st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ),
            )}
          </select>
        )}
      </div>
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
              {t("Dossier complet")}
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
              {t("Date ouverture")}
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
              {t("Client")}
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
              {t("Type d'affaire")}
            </th>
            {/* Statut  */}
            {false && (
              <th
                style={{
                  padding: "12px 8px",
                  color: "#1a237e",
                  fontWeight: "bold",
                  textAlign: "left",
                  borderBottom: "2px solid #1976d2",
                }}
              >
                {t("Statut")}
              </th>
            )}
            <th
              style={{
                padding: "12px 8px",
                color: "#1a237e",
                fontWeight: "bold",
                textAlign: "left",
                borderBottom: "2px solid #1976d2",
              }}
            >
              {t("Progression")}
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
              {t("Rendez-vous")}
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
        <tbody>
          {filteredAffaires.map((a) =>
            editingId === a.idaffaire ? (
              <tr
                key={a.idaffaire}
                style={{
                  background: "#e3f2fd",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                }}
              >
                <td>
                  <input
                    type="text"
                    value={editAffaire.dossier_complet || ""}
                    disabled
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      fontSize: 16,
                      background: "#f5f6fa",
                      color: "#333",
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={editAffaire.dateouverture || ""}
                    onChange={(e) =>
                      setEditAffaire({
                        ...editAffaire,
                        dateouverture: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      fontSize: 16,
                      background: "#fff",
                      color: "#333",
                      outline: "none",
                    }}
                  />
                </td>
                <td>
                  <select
                    value={editAffaire.idclient || ""}
                    onChange={(e) =>
                      setEditAffaire({
                        ...editAffaire,
                        idclient: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      fontSize: 16,
                      background: "#fff",
                      color: "#333",
                      outline: "none",
                    }}
                  >
                    <option value="">{t("Sélectionner un client")}</option>
                    {clients.map((c) => (
                      <option key={c.idclient} value={c.idclient}>
                        {getClientDisplayLabel(c)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={editAffaire.idtypeaffaire || ""}
                    onChange={(e) =>
                      setEditAffaire({
                        ...editAffaire,
                        idtypeaffaire: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 4,
                      border: "2px solid #e0e0e0",
                      fontSize: 16,
                      background: "#fff",
                      color: "#333",
                      outline: "none",
                    }}
                  >
                    <option value="">
                      {t("Sélectionner un type d'affaire")}
                    </option>
                    {typesAffaire.map((t) => (
                      <option key={t.idtypeaffaire} value={t.idtypeaffaire}>
                        {t.libelletypeaffaire}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Statut  */}
                {false && (
                  <td style={{ padding: "8px", color: "#1a237e" }}>
                    {a.statut_courant || "-"}
                  </td>
                )}
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  <WorkflowStatus affaireId={a.idaffaire} />
                </td>
                {/* Colonne Rendez-vous */}
                <td style={{ padding: "10px 8px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        lineHeight: 1.1,
                        minWidth: 48,
                      }}
                    >
                      {(() => {
                        const dateRaw =
                          a?.prochaine_audience?.date ||
                          a?.next_rdv_date ||
                          a?.rdv_date ||
                          null;
                        const timeRaw =
                          a?.prochaine_audience?.heure ||
                          a?.next_rdv_time ||
                          a?.rdv_time ||
                          null;
                        if (!dateRaw && !timeRaw)
                          return <span style={{ color: "#94a3b8" }}>—</span>;
                        let ddmm = null,
                          hhmi = null;
                        try {
                          if (dateRaw) {
                            const d = new Date(dateRaw);
                            ddmm = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                          }
                          if (timeRaw) {
                            const [h, m] = String(timeRaw).split(":");
                            hhmi = `${String(h || "00").padStart(2, "0")}:${String(m || "00").padStart(2, "0")}`;
                          }
                        } catch (_e) {
                          ddmm = dateRaw || null;
                          hhmi = timeRaw || null;
                        }
                        return (
                          <>
                            {ddmm && (
                              <span
                                style={{ color: "#1a237e", fontWeight: 700 }}
                              >
                                {ddmm}
                              </span>
                            )}
                            {hhmi && (
                              <span
                                style={{ color: "#64748b", fontWeight: 600 }}
                              >
                                {hhmi}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() =>
                        setRendezVousModal({ show: true, affaire: a })
                      }
                      style={{
                        background: "#1e88e5",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        width: 36,
                        height: 32,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                        cursor: "pointer",
                      }}
                      title={t("Planifier un rendez-vous")}
                    >
                      📅
                    </button>
                  </div>
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
                    onClick={async () => {
                      try {
                        await api.patch(
                          `/affairejudiciaires/${a.idaffaire}/`,
                          editAffaire,
                        );
                        setEditingId(null);
                        setEditAffaire({});
                        fetchAffaires();
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
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
                    onClick={() => {
                      setEditingId(null);
                      setEditAffaire({});
                    }}
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
                key={a.idaffaire}
                style={{
                  background: "#f5f6fa",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  {a.dossier_complet}
                </td>
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  {a.dateouverture}
                </td>
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  {getAffaireClientDisplayName(a)}
                </td>
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  {getTypeAffaireLabel(a)}
                </td>
                {/* Statut  */}
                {false && (
                  <td style={{ padding: "8px", color: "#1a237e" }}>
                    {a.statut_courant || "-"}
                  </td>
                )}
                <td style={{ padding: "8px", color: "#1a237e" }}>
                  <WorkflowStatus affaireId={a.idaffaire} />
                </td>
                {/* Colonne Rendez-vous */}
                <td style={{ padding: "10px 8px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        lineHeight: 1.1,
                        minWidth: 48,
                      }}
                    >
                      {(() => {
                        const dateRaw =
                          a?.prochaine_audience?.date ||
                          a?.next_rdv_date ||
                          a?.rdv_date ||
                          null;
                        const timeRaw =
                          a?.prochaine_audience?.heure ||
                          a?.next_rdv_time ||
                          a?.rdv_time ||
                          null;
                        if (!dateRaw && !timeRaw)
                          return <span style={{ color: "#94a3b8" }}>—</span>;
                        let ddmm = null,
                          hhmi = null;
                        try {
                          if (dateRaw) {
                            const d = new Date(dateRaw);
                            ddmm = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                          }
                          if (timeRaw) {
                            const [h, m] = String(timeRaw).split(":");
                            hhmi = `${String(h || "00").padStart(2, "0")}:${String(m || "00").padStart(2, "0")}`;
                          }
                        } catch (_e) {
                          ddmm = dateRaw || null;
                          hhmi = timeRaw || null;
                        }
                        return (
                          <>
                            {ddmm && (
                              <span
                                style={{ color: "#1a237e", fontWeight: 700 }}
                              >
                                {ddmm}
                              </span>
                            )}
                            {hhmi && (
                              <span
                                style={{ color: "#64748b", fontWeight: 600 }}
                              >
                                {hhmi}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() =>
                        setRendezVousModal({ show: true, affaire: a })
                      }
                      style={{
                        background: "#1e88e5",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        width: 36,
                        height: 32,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                        cursor: "pointer",
                      }}
                      title={t("Planifier un rendez-vous")}
                    >
                      📅
                    </button>
                  </div>
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
                    onClick={() => {
                      setEditingId(a.idaffaire);
                      setEditAffaire({
                        dateouverture: a.dateouverture,
                        idclient: a.idclient,
                        idtypeaffaire: a.idtypeaffaire,
                      });
                    }}
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      border: "1px solid #1976d2",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                    title={t("Modifier")}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          t("Voulez-vous vraiment supprimer cette affaire ?"),
                        )
                      )
                        return;
                      try {
                        await api.delete(
                          `affairejudiciaires/${a.idaffaire}/`,
                        );
                        fetchAffaires();
                      } catch (err) {
                        console.log(
                          "Erreur de suppression:",
                          err.response?.data,
                        );
                        setError(
                          t("Erreur lors de la suppression: ") +
                            (err.response?.data?.error ||
                              JSON.stringify(err.response?.data) ||
                              err.message),
                        );
                      }
                    }}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                    title={t("Supprimer")}
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => setDetailAffaire(a)}
                    style={{
                      background: "#607d8b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                    title={t("Voir")}
                  >
                    🔍
                  </button>

                  {/* Bouton pour planifier un rendez-vous  */}
                  <button
                    onClick={() =>
                      setRendezVousModal({ show: true, affaire: a })
                    }
                    style={{
                      background: "#4CAF50",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontWeight: "bold",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                    title={t("Planifier un rendez-vous")}
                  >
                    📅
                  </button>

                  <EtapeActuelleBadge affaire={a} />
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      {/* Formulaire de changement de statut */}
      {statutEditId && (
        <div
          id="statut-change-section"
          style={{
            background: "#f5f6fa",
            color: "#1a237e",
            borderRadius: 8,
            padding: 16,
            margin: "16px auto",
            maxWidth: 400,
            boxShadow: "0 2px 8px #e0e0e0",
            position: "relative",
          }}
        >
          <button
            onClick={() => setStatutEditId(null)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#e53935",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            X
          </button>
          <h4>
            Changer le statut de l'affaire{" "}
            {(() => {
              const affaire = affaires.find(
                (a) => a.idaffaire === statutEditId,
              );
              return affaire ? affaire.dossier_complet : statutEditId;
            })()}
          </h4>
          <form onSubmit={handleAddStatut}>
            <select
              value={newStatut}
              onChange={(e) => setNewStatut(e.target.value)}
              required
              style={{
                width: "100%",
                marginBottom: 12,
                height: 32,
                padding: "4px 8px",
                background: "#fff",
                color: "#333",
                border: "1px solid #e0e0e0",
                borderRadius: 4,
              }}
            >
              <option value="">Sélectionner un statut</option>
              <option value="Enregistrée">Enregistrée</option>
              <option value="En cours d'instruction">
                En cours d'instruction
              </option>
              <option value="En instance">{t("En instance")}</option>
              <option value="Jugée">{t("Jugée")}</option>
              <option value="En appel">{t("En appel")}</option>
              <option value="En cassation">{t("En cassation")}</option>
              <option value="Classée sans suite">{t("Classée sans suite")}</option>
              <option value="Suspendue">{t("Suspendue")}</option>
            </select>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <button
              type="submit"
              style={{
                background: "#43a047",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "8px 18px",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              Valider
            </button>
          </form>
        </div>
      )}
      {/* Fiche détaillée */}
      {detailAffaire && (
        <div
          style={{
            background: "#f5f6fa",
            color: "#1a237e",
            borderRadius: 8,
            padding: 24,
            margin: "24px auto",
            maxWidth: 600,
            boxShadow: "0 2px 16px #e0e0e0",
            position: "relative",
          }}
        >
          <button
            onClick={() => setDetailAffaire(null)}
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
            X
          </button>
          <h3 style={{ marginTop: 0, color: "#1976d2" }}>
            Fiche détaillée de l'affaire
          </h3>
          <div>
            <b>Numéro d'affaire :</b> {detailAffaire.dossier_complet}
          </div>
          <div>
            <b>Date ouverture :</b> {detailAffaire.dateouverture}
          </div>
          <div>
            <b>Type d'affaire :</b> {detailAffaire.type_affaire_libelle || "-"}
          </div>
          <div>
            <b>Statut :</b>{" "}
            {detailAffaire.statut_courant || detailAffaire.statut}
          </div>
          <div>
            <b>Rôle du client :</b> {detailAffaire.role_client_libelle || "-"}
          </div>
          {/* Infos du client */}
          {(() => {
            const client = clients.find(
              (c) => String(c.idclient) === String(detailAffaire.idclient),
            );
            if (!client)
              return <div style={{ color: "#e53935" }}>Client non trouvé</div>;
            return (
              <>
                <div
                  style={{
                    marginTop: 12,
                    marginBottom: 4,
                    fontWeight: "bold",
                    color: "#1976d2",
                  }}
                >
                  Informations du client
                </div>
                <div>
                  <b>Nom :</b> {i18n.language === 'ar' ? (client.nomclient_ar || client.nomclient_fr || client.nomclient) : (client.nomclient_fr || client.nomclient_ar || client.nomclient)}
                </div>
                <div>
                  <b>Prénom :</b> {i18n.language === 'ar' ? (client.prenomclient_ar || client.prenomclient_fr) : (client.prenomclient_fr || client.prenomclient_ar)}
                </div>
                <div>
                  <b>Email :</b> {client.email}
                </div>
                <div>
                  <b>Téléphone 1 :</b> {client.numtel1}
                </div>
                <div>
                  <b>Téléphone 2 :</b> {client.numtel2}
                </div>
                <div>
                  <b>Adresse 1 :</b> {client.adresse1}
                </div>
                <div>
                  <b>Adresse 2 :</b> {client.adresse2}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal Progression */}
      {workflowModal.show && (
        <WorkflowModal
          affaireId={workflowModal.affaireId}
          etapeActuelle={etapesActuelles[workflowModal.affaireId]}
          progression={progressions[workflowModal.affaireId]}
          onClose={() => setWorkflowModal({ show: false, affaireId: null })}
          onAvancerEtape={avancerEtape}
          onTerminerEtape={terminerEtape}
        />
      )}

      {/* Modal Rendez-vous */}
      {rendezVousModal.show && (
        <RendezVousModal
          affaire={rendezVousModal.affaire}
          isOpen={rendezVousModal.show}
          onClose={() => setRendezVousModal({ show: false, affaire: null })}
          onSave={() => {
            fetchAffaires();
            setRendezVousModal({ show: false, affaire: null });
          }}
        />
      )}
    </div>
  );
}
