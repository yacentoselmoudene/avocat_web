import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import UnifiedEtapeButton from "../components/UnifiedEtapeButton";

// gestion de procedure et etapes d'une affairen

const WorkflowPage = () => {
  const { t } = useTranslation();
  const { affaireId } = useParams();
  const navigate = useNavigate();

  // états principaux

  const [phase, setPhase] = useState("INITIALE");
  const [roleClient, setRoleClient] = useState("demandeur");
  const [affaireData, setAffaireData] = useState(null);
  const [isAffairePenale, setIsAffairePenale] = useState(false);
  const [user, setUser] = useState(null); // Utilisateur connecté

  // étapes

  const [etapesPhase, setEtapesPhase] = useState([]);
  const [etapesCompletes, setEtapesCompletes] = useState([]);
  const [etapesTerminees, setEtapesTerminees] = useState([]);
  const [etapesOptionnelles, setEtapesOptionnelles] = useState([]);
  const [strategie, setStrategie] = useState("AUTOMATIQUE"); // selon l'affaire
  const [fichiersEtapes, setFichiersEtapes] = useState({});

  // notifs

  const [typesAvertissement, setTypesAvertissement] = useState([]);
  const [typesDemande, setTypesDemande] = useState([]);
  const [selectedHuissier, setSelectedHuissier] = useState(null);
  const [selectedOpposant, setSelectedOpposant] = useState(null);
  const [huissiers, setHuissiers] = useState([]);
  const [opposants, setOpposants] = useState([]);
  const [showNotificationFields, setShowNotificationFields] = useState(false);

  //  états auto

  const [searchHuissier, setSearchHuissier] = useState("");
  const [searchOpposant, setSearchOpposant] = useState("");
  const [showHuissierDropdown, setShowHuissierDropdown] = useState(false);
  const [showOpposantDropdown, setShowOpposantDropdown] = useState(false);
  const [filteredHuissiers, setFilteredHuissiers] = useState([]);
  const [filteredOpposants, setFilteredOpposants] = useState([]);

  // états pour la phase d'appel
  const [dateJugement, setDateJugement] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tribunauxAppel, setTribunauxAppel] = useState([]);
  const [villesAppel, setVillesAppel] = useState([]);
  const [villeAppelSelectionnee, setVilleAppelSelectionnee] = useState("");
  const [tribunalAppelSelectionne, setTribunalAppelSelectionne] =
    useState(null);
  const [showNouvelleAffaireModal, setShowNouvelleAffaireModal] =
    useState(false);

  // états pour l'audience (étape استدعاء للمثول)
  const [tribunaux, setTribunaux] = useState([]);
  const [tribunalSelectionne, setTribunalSelectionne] = useState(null);
  const [dateAudience, setDateAudience] = useState("");
  const [heureAudience, setHeureAudience] = useState("");
  const [villesDisponibles, setVillesDisponibles] = useState([]);
  const [villeSelectionnee, setVilleSelectionnee] = useState("");

  //ÉTATS pour les étapes pénales opposant
  const [autoriteEmettrice, setAutoriteEmettrice] = useState("");
  const [typeActionPenale, setTypeActionPenale] = useState("");
  const [dateConvocationArrestation, setDateConvocationArrestation] =
    useState("");
  const [auditionPoliceFaite, setAuditionPoliceFaite] = useState(false);
  const [observationsPenales, setObservationsPenales] = useState("");
  const [documentsDefense, setDocumentsDefense] = useState(null);
  const [observationsDefense, setObservationsDefense] = useState("");
  const [jugement, setJugement] = useState("");

  // États pour les étapes pénales EXECUTION
  const [executionFaite, setExecutionFaite] = useState(false);
  const [dateExecution, setDateExecution] = useState("");
  const [detailsExecution, setDetailsExecution] = useState("");
  const [documentExecution, setDocumentExecution] = useState(null);
  const [observationsExecution, setObservationsExecution] = useState("");
  const [motifNonExecution, setMotifNonExecution] = useState("");
  const [typeExecution, setTypeExecution] = useState("");

  // Constantes pour les choix pénaux
  const AUTORITES_EMETTRICES = [
    {
      value: "POLICE_JUDICIAIRE",
      label: "Police judiciaire",
      label_ar: "الشرطة القضائية",
    },
    { value: "GENDARMERIE", label: "Gendarmerie", label_ar: "الدرك الوطني" },
    { value: "PARQUET", label: "Parquet", label_ar: "النيابة العامة" },
    {
      value: "JUGES_INSTRUCTION",
      label: "Juges d'instruction",
      label_ar: "قضاة التحقيق",
    },
    { value: "TRIBUNAL", label: "Tribunal", label_ar: "المحكمة" },
    { value: "AUTRE", label: "Autre autorité", label_ar: "سلطة أخرى" },
  ];

  const TYPES_ACTION_PENALE = [
    { value: "CONVOCATION", label: "Convocation", label_ar: "استدعاء" },
    { value: "ARRESTATION", label: "Arrestation", label_ar: "اعتقال" },
    { value: "GARDE_VUE", label: "Garde à vue", label_ar: "الحبس الاحتياطي" },
    { value: "AUTRE", label: "Autre mesure", label_ar: "إجراء آخر" },
  ];

  const TYPES_JUGEMENT = [
    { value: "PRISON", label: "Prison", label_ar: "سجن" },
    { value: "AMENDE", label: "Amende", label_ar: "غرامة" },
    { value: "SURSIS", label: "Sursis", label_ar: "إيقاف التنفيذ" },
    { value: "ACQUITTEMENT", label: "Acquittement", label_ar: "براءة" },
  ];

  // Constantes pour l'exécution
  const STATUTS_EXECUTION = [
    { value: "OUI", label: "Exécution faite", label_ar: "تم التنفيذ" },
    { value: "NON", label: "Exécution non faite", label_ar: "لم يتم التنفيذ" },
    {
      value: "PARTIELLE",
      label: "Exécution partielle",
      label_ar: "تنفيذ جزئي",
    },
  ];

  const TYPES_EXECUTION = [
    { value: "EMPRISONNEMENT", label: "Emprisonnement", label_ar: "سجن" },
    { value: "AMENDE", label: "Amende", label_ar: "غرامة" },
    {
      value: "TIG",
      label: "Travaux d'intérêt général",
      label_ar: "أشغال ذات منفعة عامة",
    },
    { value: "SURSIS", label: "Sursis", label_ar: "إيقاف التنفيذ" },
    { value: "AUTRE", label: "Autre", label_ar: "أخرى" },
  ];

  // chargelent des donnees de l'affaire

  useEffect(() => {
    // Récupérer les informations de l'utilisateur connecté
    const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userInfo);

    const chargerAffaire = async () => {
      try {
        const response = await api.get(`affairejudiciaires/${affaireId}/`);
        setAffaireData(response.data);

        // detection affaire pénale
        const codeDossier = response.data.code_dossier;
        if (
          codeDossier &&
          (codeDossier.startsWith("2") ||
            codeDossier.startsWith("3") ||
            codeDossier.startsWith("4"))
        ) {
          setIsAffairePenale(true);
        } else {
          setIsAffairePenale(false);
        }

        // rôle client
        let nouveauRole = "demandeur";
        if (response.data.role_client_libelle) {
          const fonction = response.data.role_client_libelle;

          // Détection plus robuste du rôle (insensible à la casse)
          const fonctionLower = (fonction || '').toLowerCase();
          const fonctionUpper = fonction.toUpperCase();

          if (
            fonctionLower.includes("opposant") ||
            fonctionUpper.includes("OPPOSANT") ||
            fonction === "Opposant" ||
            fonction === "OPPOSANT" ||
            fonction.includes("متهم") ||
            fonction.includes("مدعى عليه") ||
            fonctionLower.includes("accusé") ||
            fonctionLower.includes("défendeur") ||
            fonctionLower.includes("inculpé") ||
            fonctionLower.includes("defendeur") ||
            fonctionLower.includes("inculpe")
          ) {
            nouveauRole = "opposant";
          }
        }

        // VÉRIFICATION FORCÉE pour les affaires pénales
        if (
          codeDossier &&
          (codeDossier.startsWith("2") ||
            codeDossier.startsWith("3") ||
            codeDossier.startsWith("4"))
        ) {
          if (
            response.data.role_client_libelle &&
            (response.data.role_client_libelle.includes("Opposant") ||
              response.data.role_client_libelle.includes("opposant") ||
              response.data.role_client_libelle.includes("OPPOSANT"))
          ) {
            nouveauRole = "opposant";
          }
        }

        // FORCAGE FINAL pour les affaires pénales avec fonction Opposant
        if (
          codeDossier &&
          (codeDossier.startsWith("2") ||
            codeDossier.startsWith("3") ||
            codeDossier.startsWith("4")) &&
          response.data.role_client_libelle &&
          response.data.role_client_libelle.includes("Opposant")
        ) {
          nouveauRole = "opposant";
        }

        if (roleClient !== nouveauRole) {
          setRoleClient(nouveauRole);
        }

        // Gestion phase au premier chargement
        if (response.data.phase_processus && !affaireData) {
          setPhase(response.data.phase_processus);
        }
        if (!affaireData) {
          chargerEtapesPhase();
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'affaire:", error);
        if (error.response) {
          console.error(
            `Erreur ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
          );
        } else if (error.request) {
          console.error(
            "Erreur de connexion: Impossible de joindre le serveur",
          );
        } else {
          console.error("Erreur inattendue:", error.message);
        }
      }
    };
    chargerAffaire();
  }, [affaireId]);

  // chargement de donnees

  useEffect(() => {
    chargerTypesAvertissement();
    chargerTypesDemande();
    chargerHuissiers();
    chargerOpposants();
    chargerTribunaux();
  }, []);

  // FORCAGE du rôle opposant pour les affaires pénales
  useEffect(() => {
    console.log("🔍 DEBUG RÔLE CLIENT:");
    console.log("  - isAffairePenale:", isAffairePenale);
    console.log("  - affaireData:", affaireData);
    console.log("  - role_client_libelle:", affaireData?.role_client_libelle);
    console.log("  - roleClient actuel:", roleClient);

    if (isAffairePenale && affaireData && affaireData.role_client_libelle) {
      const fonction = affaireData.role_client_libelle;
      console.log("  - fonction détectée:", fonction);
      if (fonction.includes("Opposant")) {
        console.log("  - Rôle changé vers: opposant");
        setRoleClient("opposant");
      } else {
        console.log("  - Rôle reste: demandeur");
      }
    } else {
      console.log("  - Conditions non remplies pour changer le rôle");
    }
  }, [isAffairePenale, affaireData]);

  // recharge des etapes

  useEffect(() => {
    if (roleClient) {
      chargerEtapesPhase();
    }
  }, [roleClient, phase, isAffairePenale]);

  // chargement des tribunaux d'appel

  useEffect(() => {
    if (phase === "APPEL" && affaireData) {
      chargerTribunauxAppel();
    }
  }, [phase, affaireData]);

  // gestion des étapes

  //étapes selon la pahse

  const getEtapesPhase = (phaseParam, roleParam) => {
    // Gestion spéciale pour les affaires pénales
    if (
      isAffairePenale &&
      phaseParam === "INITIALE" &&
      roleParam === "demandeur"
    ) {
      return [
        {
          libelle_ar: "شكاية",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
        },
      ];
    }

    // Gestion spéciale pour les affaires pénales - Phase PROCÉDURE
    if (
      isAffairePenale &&
      phaseParam === "PROCEDURE" &&
      roleParam === "demandeur"
    ) {
      return [
        {
          libelle_ar: "التحقيق الأولي",
          delai_legal: 60,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "قرار النيابة العامة",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "جلسة المحاكمة",
          delai_legal: 45,
          terminee: false,
          optionnel: false,
        },
      ];
    }

    // Affaires pénales - Phase INITIALE pour OPPOSANT
    if (
      isAffairePenale &&
      phaseParam === "INITIALE" &&
      roleParam === "opposant"
    ) {
      return [
        {
          libelle_ar: "استدعاء أو اعتقال",
          libelle_fr: "Convocation ou arrestation",
          delai_legal: 15,
          terminee: false,
          optionnel: false,
          type_etape: "PENALE_OPPOSANT_INITIALE",
        },
      ];
    }

    //  Affaires pénales - Phase PROCÉDURE pour OPPOSANT
    if (
      isAffairePenale &&
      phaseParam === "PROCEDURE" &&
      roleParam === "opposant"
    ) {
      return [
        {
          libelle_ar: "جلسة ودفاع", // Audience et défense
          libelle_fr: "Audience et défense",
          delai_legal: 60,
          terminee: false,
          optionnel: false,
          type_etape: "PENALE_OPPOSANT_PROCEDURE",
        },
      ];
    }

    // Affaires pénales - Phase EXÉCUTION pour DEMANDEUR
    if (
      isAffairePenale &&
      phaseParam === "EXECUTION" &&
      roleParam === "demandeur"
    ) {
      return [
        {
          libelle_ar: "تنفيذ القرار", // Exécution de la décision
          libelle_fr: "Exécution de la décision",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
          type_etape: "PENALE_DEMANDEUR_EXECUTION",
        },
      ];
    }

    //  Affaires pénales - Phase EXÉCUTION pour OPPOSANT
    if (
      isAffairePenale &&
      phaseParam === "EXECUTION" &&
      roleParam === "opposant"
    ) {
      return [
        {
          libelle_ar: "تنفيذ الحكم", // Exécution du jugement
          libelle_fr: "Exécution du jugement",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
          type_etape: "PENALE_OPPOSANT_EXECUTION",
        },
      ];
    }

    if (phaseParam === "INITIALE") {
      if (roleParam === "demandeur") {
        return [
          {
            libelle_ar: "إنجاز إنذار",
            delai_legal: 15,
            terminee: false,
            optionnel: true,
          },
          {
            libelle_ar: "تقديم الشكاية",
            delai_legal: 30,
            terminee: false,
            optionnel: false,
          },
          {
            libelle_ar: "تقديم الدعوى مباشرة",
            delai_legal: 45,
            terminee: false,
            optionnel: true,
          },
        ];
      }
      return [
        {
          libelle_ar: "استلام إنذار",
          delai_legal: 15,
          terminee: false,
          optionnel: true,
        },
        {
          libelle_ar: "استلام شكاية",
          delai_legal: 45,
          terminee: false,
          optionnel: true,
        },
        {
          libelle_ar: "استدعاء للمثول",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
        },
      ];
    }
    if (phaseParam === "PROCEDURE") {
      if (roleParam === "demandeur") {
        return [
          {
            libelle_ar: " جلسة الاستماع",
            delai_legal: 60,
            terminee: false,
            optionnel: false,
          },
          {
            libelle_ar: "تبليغ الاستدعاء",
            delai_legal: 75,
            terminee: false,
            optionnel: false,
          },
          {
            libelle_ar: "جلسات",
            delai_legal: 90,
            terminee: false,
            optionnel: false,
          },
          {
            libelle_ar: "مداولة",
            delai_legal: 105,
            terminee: false,
            optionnel: false,
          },
          {
            libelle_ar: "حكم",
            delai_legal: 120,
            terminee: false,
            optionnel: false,
          },
        ];
      }
      return [
        {
          libelle_ar: "تقديم تمثيل",
          delai_legal: 60,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "رد على المقال",
          delai_legal: 75,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "مداولة",
          delai_legal: 90,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "جلسات",
          delai_legal: 105,
          terminee: false,
          optionnel: false,
        },
        {
          libelle_ar: "حكم",
          delai_legal: 120,
          terminee: false,
          optionnel: false,
        },
      ];
    }
    if (phaseParam === "EXECUTION") {
      if (roleParam === "demandeur") {
        return [
          {
            libelle_ar: "تنفيذ الحكم",
            delai_legal: 30,
            terminee: false,
            optionnel: false,
          },
        ];
      }
      return [
        {
          libelle_ar: "تنفيذ الحكم",
          delai_legal: 30,
          terminee: false,
          optionnel: false,
        },
      ];
    }
    if (phaseParam === "APPEL") {
      // Les deux rôles (demandeur et opposant) peuvent déposer un appel
      return [
        {
          libelle_ar: "تقديم استئناف",
          delai_legal: 10,
          terminee: false,
          optionnel: false,
        },
      ];
    }
    return [];
  };

  //types d'avertissement

  async function chargerTypesAvertissement() {
    try {
      const response = await api.get("types-avertissement/");
      setTypesAvertissement(response.data);
    } catch (error) {
      console.error("Erreur chargement types avertissement:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger les types d'avertissement - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger les types d'avertissement",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des types d'avertissement:",
          error.message,
        );
      }
    }
  }

  // types de demandes : ma9al
  async function chargerTypesDemande() {
    try {
      const response = await api.get("types-demande/");
      setTypesDemande(response.data);
    } catch (error) {
      console.error("Erreur chargement types demande:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger les types de demande - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger les types de demande",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des types de demande:",
          error.message,
        );
      }
    }
  }

  // huissiers

  async function chargerHuissiers() {
    try {
      const response = await api.get("huissiers-disponibles/");
      setHuissiers(response.data);
    } catch (error) {
      console.error("Erreur chargement huissiers:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger la liste des huissiers - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger la liste des huissiers",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des huissiers:",
          error.message,
        );
      }
    }
  }
  //opposants
  async function chargerOpposants() {
    try {
      const response = await api.get("opposants-disponibles/");
      setOpposants(response.data);
    } catch (error) {
      console.error("Erreur chargement opposants:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger la liste des opposants - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger la liste des opposants",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des opposants:",
          error.message,
        );
      }
    }
  }

  // Fonctions pour l'upload de fichiers
  async function uploadFichierEtape(etapeId, fichier, description = "") {
    try {
      const formData = new FormData();
      formData.append("fichier", fichier);
      formData.append("description", description);
      formData.append("type_fichier", "PIECE_PROCEDURE");

      const response = await api.post(
        `affaires/${affaireId}/etapes/${etapeId}/upload-fichier/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Fichier uploadé avec succès:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur upload fichier:", error);
      throw error;
    }
  }

  async function chargerFichiersEtape(etapeId) {
    try {
      const response = await api.get(
        `affaires/${affaireId}/etapes/${etapeId}/fichiers/`,
      );
      return response.data;
    } catch (error) {
      console.error("Erreur chargement fichiers:", error);
      return [];
    }
  }

  const handleFileUploadEtape = async (etapeId, fichier) => {
    try {
      if (!fichier) return;

      const description = `Document pour étape ${etapeId}`;
      await uploadFichierEtape(etapeId, fichier, description);

      // Recharger les fichiers de l'étape
      const fichiers = await chargerFichiersEtape(etapeId);
      setFichiersEtapes((prev) => ({
        ...prev,
        [etapeId]: fichiers,
      }));

      alert("Fichier uploadé avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du fichier");
    }
  };

  // Chargement des tribunaux pour l'audience
  async function chargerTribunaux() {
    try {
      const response = await api.get("tribunals/");
      const tribunauxData = response.data;
      console.log("Tribunaux chargés:", tribunauxData);
      setTribunaux(tribunauxData);

      // Extraire les villes disponibles
      const villes = [
        ...new Set(
          tribunauxData
            .map((tribunal) => tribunal.villetribunal)
            .filter(Boolean),
        ),
      ].sort();
      console.log("Villes disponibles:", villes);
      setVillesDisponibles(villes);
    } catch (error) {
      console.error("Erreur lors du chargement des tribunaux:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger les tribunaux",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des tribunaux:",
          error.message,
        );
      }
    }
  }

  // tribunal d'appel
  async function chargerTribunauxAppel() {
    try {
      const codeDossier = affaireData?.code_dossier;
      if (!codeDossier) {
        console.error("Code dossier non disponible");
        return;
      }

      // Déterminer le type d'affaire selon le code
      let typeAffaireCode = "مدني"; // Par défaut
      if (codeDossier.startsWith("1")) {
        typeAffaireCode = "مدني";
      } else if (codeDossier.startsWith("2")) {
        typeAffaireCode = "جنائي";
      } else if (codeDossier.startsWith("3")) {
        typeAffaireCode = "إدارية";
      } else if (codeDossier.startsWith("4")) {
        typeAffaireCode = "تجاري";
      }

      // service de suggestion de tribunaux (mode appel)
      console.log(
        "Chargement tribunaux appel avec type_affaire:",
        typeAffaireCode,
      );
      const response = await api.get("tribunaux-suggestion/", {
        params: {
          type_affaire: typeAffaireCode,
          mode_appel: "true", // Pour obtenir uniquement les cours d'appel
        },
      });

      console.log("Réponse tribunaux appel:", response.data);

      if (response.data && response.data.tribunaux) {
        console.log("Cours d'appel reçus:", response.data.tribunaux);

        // L'API retourne uniquement les cours d'appel
        setTribunauxAppel(response.data.tribunaux);

        //  les villes
        const villes = [
          ...new Set(
            response.data.tribunaux.map((t) => t.ville).filter(Boolean),
          ),
        ];
        console.log("Villes disponibles:", villes);
        setVillesAppel(villes);
      }
    } catch (error) {
      console.error("Erreur chargement tribunaux appel:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger les tribunaux d'appel - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger les tribunaux d'appel",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des tribunaux d'appel:",
          error.message,
        );
      }
    }
  }

  // fonctions de gestion de l'appel

  // verification des délai : 10 jrs

  const isDelaiAppelValide = (dateJugement) => {
    if (!dateJugement) return false;
    const dateLimite = new Date(dateJugement);
    dateLimite.setDate(dateLimite.getDate() + 10);
    const aujourdhui = new Date();
    return aujourdhui <= dateLimite;
  };

  // Calculer la date limite d'appel
  const calculerDateLimiteAppel = (dateJugement) => {
    if (!dateJugement) return null;
    const dateLimite = new Date(dateJugement);
    dateLimite.setDate(dateLimite.getDate() + 10);
    return dateLimite.toISOString().split("T")[0];
    // formate une date JavaScript au format YYYY-MM-DD , normalement "2025-08-04T15:30:00.000Z"
  };

  // Créer une nouvelle affaire d'appel
  const handleCreerNouvelleAffaire = async () => {
    try {
      // la date du jugement saisie
      const dateJugementElement = document.getElementById(
        "date-jugement-appel",
      );
      const dateJugement = dateJugementElement
        ? dateJugementElement.value
        : new Date().toISOString().split("T")[0];

      //  si le délai est valide
      const delaiValide = isDelaiAppelValide(dateJugement);

      if (!delaiValide) {
        console.error(
          "Le délai d'appel a expiré. Impossible de créer une nouvelle affaire.",
        );
        return;
      }

      // Vérifier que le tribunal d'appel est sélectionné
      if (!tribunalAppelSelectionne) {
        console.error("Veuillez sélectionner un tribunal d'appel.");
        return;
      }

      // Créer directement la nouvelle affaire d'appel via l'API
      const nouvelleAffaireData = {
        // Informations de base
        affaire_parent: affaireId,
        idclient: affaireData?.idclient,
        role_client: roleClient,
        phase_processus: "APPEL",
      };

      console.log(
        "Création de la nouvelle affaire d'appel:",
        nouvelleAffaireData,
      );

      //  l'API pour créer la nouvelle affaire d'appel
      const response = await api.post(
        "affaires/appel/",
        nouvelleAffaireData,
      );

      if (response.status === 201 || response.status === 200) {
        console.log(
          "Nouvelle affaire d'appel créée avec succès:",
          response.data,
        );
        console.log("Nouvelle affaire d'appel créée avec succès !");

        // Rediriger vers la nouvelle affaire créée
        window.location.href = `/affaires?id=${response.data.idaffaire}`;
      } else {
        throw new Error("Erreur lors de la création de l'affaire d'appel");
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'affaire d'appel:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de créer l'affaire d'appel - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de créer l'affaire d'appel",
        );
      } else {
        console.error(
          "Erreur inattendue lors de la création de l'affaire d'appel:",
          error.message,
        );
      }
    }
  };

  // gestion des etapes

  //chargement des etapes
  async function chargerEtapesPhase() {
    console.log(
      `🔍 DEBUG chargerEtapesPhase: affaireId=${affaireId}, phase=${phase}, roleClient=${roleClient}`,
    );

    try {
      console.log(`🔍 DEBUG: Appel API affaires/${affaireId}/etapes/`);
      const response = await api.get(`affaires/${affaireId}/etapes/`);
      console.log(`🔍 DEBUG: Réponse API reçue:`, response.data);

      if (response.data.etapes && response.data.etapes.length > 0) {
        console.log(
          `🔍 DEBUG: ${response.data.etapes.length} étapes trouvées en base`,
        );
        const timelineReelle = response.data.etapes.map((etape) => ({
          id: etape.id,
          libelle_ar: etape.libelle_ar || etape.libelle,
          delai_legal: etape.delai_legal || 0,
          terminee: etape.terminee || false,
          date_effective: etape.date_effective || null,
          observations: etape.observations || "",
          ordre: etape.ordre || 0,
          optionnel: etape.optionnel || false,
        }));
        console.log(`🔍 DEBUG: Timeline réelle mappée:`, timelineReelle);
        setEtapesPhase(timelineReelle);

        // Séparer les étapes terminées
        const etapesTerminees = timelineReelle.filter(
          (etape) => etape.terminee,
        );
        setEtapesTerminees(etapesTerminees);
      } else {
        console.log(`🔍 DEBUG: Aucune étape en base, utilisation du fallback`);
        const etapesLogiques = getEtapesPhase(phase, roleClient);
        console.log(`🔍 DEBUG: Étapes logiques générées:`, etapesLogiques);
        setEtapesPhase(etapesLogiques);
      }
    } catch (error) {
      console.error("❌ Erreur chargement étapes:", error);
      if (error.response) {
        console.error(
          `❌ Erreur ${error.response.status}: Impossible de charger les étapes - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "❌ Erreur de connexion: Impossible de charger les étapes",
        );
      } else {
        console.error(
          "❌ Erreur inattendue lors du chargement des étapes:",
          error.message,
        );
      }
      console.log(`🔍 DEBUG: Utilisation du fallback après erreur`);
      const fallbackEtapes = getEtapesPhase(phase, roleClient);
      console.log(`🔍 DEBUG: Étapes de fallback:`, fallbackEtapes);
      setEtapesPhase(fallbackEtapes);
    }
  }

  // fcts d'autocompélation

  // recherche opposants
  const handleOpposantSearch = (val) => {
    setSearchOpposant(val);
    if (!val.trim()) {
      setFilteredOpposants([]);
      setShowOpposantDropdown(false);
      return;
    }
    const filtered = opposants.filter((o) =>
      ((o.nomopposant_fr || o.nomopposant_ar || '') || '').toLowerCase().includes((val || '').toLowerCase()),
    );
    setFilteredOpposants(filtered);
    setShowOpposantDropdown(filtered.length > 0);
  };

  const selectOpposant = (opp) => {
    setSelectedOpposant(opp.idopposant);
    setSearchOpposant(opp.nomopposant_fr || opp.nomopposant_ar || '');
    setShowOpposantDropdown(false);
  };

  const clearOpposantSearch = () => {
    setSearchOpposant("");
    setSelectedOpposant(null);
    setFilteredOpposants([]);
    setShowOpposantDropdown(false);
  };

  // fcts de gestion de notif avec huissier

  // chargement parametres

  async function chargerParametresNotification() {
    try {
      const response = await api.get(
        `affaires/${affaireId}/notification-settings/`,
      );

      if (response.status === 200 && response.data) {
        const { huissier_id, opposant_id } = response.data;

        if (huissier_id) {
          setSelectedHuissier(huissier_id);
        }
        if (opposant_id) {
          setSelectedOpposant(opposant_id);
          const opposant = opposants.find((o) => o.idopposant == opposant_id);
          if (opposant) {
            setSearchOpposant(opposant.nomopposant_fr || opposant.nomopposant_ar || '');
          }
        }

        console.log("Paramètres de notification chargés depuis le backend");
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des paramètres de notification:",
        error,
      );
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de charger les paramètres de notification - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de charger les paramètres de notification",
        );
      } else {
        console.error(
          "Erreur inattendue lors du chargement des paramètres de notification:",
          error.message,
        );
      }
    }
  }

  async function sauvegarderParametresNotification() {
    try {
      const response = await api.post(
        `affaires/${affaireId}/notification-settings/`,
        {
          huissier_id: selectedHuissier,
          opposant_id: selectedOpposant,
        },
      );

      if (response.status === 200) {
        console.log(
          "Paramètres de notification sauvegardés avec succès en backend",
        );
        console.log("Paramètres de notification sauvegardés avec succès !");
      } else {
        throw new Error("Erreur lors de la sauvegarde des paramètres");
      }
    } catch (error) {
      console.error("Erreur sauvegarde paramètres:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de sauvegarder les paramètres - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error(
          "Erreur de connexion: Impossible de sauvegarder les paramètres",
        );
      } else {
        console.error(
          "Erreur inattendue lors de la sauvegarde des paramètres:",
          error.message,
        );
      }
    }
  }

  // fct de gestion des etapes optionnels

  //toggle

  const toggleEtapeOptionnelle = (index, checked) => {
    if (checked) {
      setEtapesOptionnelles([...etapesOptionnelles, index]);
    } else {
      setEtapesOptionnelles(etapesOptionnelles.filter((i) => i !== index));
    }
  };

  // strategie pour phase initiale selon l'affaire

  const appliquerStrategie = (strat) => {
    switch (strat) {
      case "AVEC_AVERTISSEMENT":
        setEtapesOptionnelles([0, 1, 2]);
        chargerParametresNotification();
        break;
      case "DEMANDE_DIRECTE":
        setEtapesOptionnelles([2]);
        setSelectedHuissier(null);
        setSelectedOpposant(null);
        setSearchOpposant("");
        // Ne pas charger les paramètres de notification pour la demande directe
        break;
      case "PLAINTE_DIRECTE":
        setEtapesOptionnelles([1]);
        break;
      case "AUTOMATIQUE":
      default:
        setEtapesOptionnelles([0, 1, 2]);
        chargerParametresNotification();
        break;
    }
    setStrategie(strat);
  };

  //gestion des fichiers

  // upload
  const handleFileUpload = async (index, file, typeFichier) => {
    try {
      const formData = new FormData();
      formData.append("fichier", file);
      formData.append("type_fichier", typeFichier);
      formData.append("description", `Document pour l'étape ${index + 1}`);

      const response = await api.post(
        `affaires/${affaireId}/upload-fichier/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setFichiersEtapes((prev) => ({
        ...prev,
        [index]: [...(prev[index] || []), response.data],
      }));
    } catch (error) {
      console.error("Erreur upload fichier:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible d'uploader le fichier - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error("Erreur de connexion: Impossible d'uploader le fichier");
      } else {
        console.error(
          "Erreur inattendue lors de l'upload du fichier:",
          error.message,
        );
      }
    }
  };

  const getTypeFichierForEtape = (index) => {
    return "PIECE_PROCEDURE";
  };

  // fcts de création et completion d'etapes

  // creation
  const creerEtape = async (libelle, delai, observations) => {
    try {
      const response = await api.post(
        `affaires/${affaireId}/etapes/creer/`,
        {
          libelle,
          delai_legal: delai,
          observations,
        },
      );
      if (response.status === 201) {
        await chargerEtapesPhase();
        return response.data; // Retourne l'objet étape créé
      }
      return null;
    } catch (error) {
      console.error("Erreur création étape:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de créer l'étape - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error("Erreur de connexion: Impossible de créer l'étape");
      } else {
        console.error(
          "Erreur inattendue lors de la création de l'étape:",
          error.message,
        );
      }
      return null;
    }
  };

  const completerEtape = async (etapeId, observations) => {
    try {
      console.log("=== DEBUG COMPLETER ETAPE FRONTEND ===");
      console.log("etapeId reçu:", etapeId);

      // Collecter les données des champs de type d'avertissement et délai
      const typeAvertissementElement = document.getElementById(
        `type-avertissement-${etapeId}`,
      );
      const delaiLegalElement = document.getElementById(
        `delai-legal-${etapeId}`,
      );
      const typeDemandeElement = document.getElementById(
        `type-demande-${etapeId}`,
      );

      console.log("Recherche des éléments DOM:");
      console.log("typeAvertissementElement:", typeAvertissementElement);
      console.log("delaiLegalElement:", delaiLegalElement);
      console.log("typeDemandeElement:", typeDemandeElement);

      // Vérifier les valeurs
      const typeAvertissementValue = typeAvertissementElement
        ? typeAvertissementElement.value
        : null;
      const delaiLegalValue = delaiLegalElement
        ? delaiLegalElement.value
        : null;
      const typeDemandeValue = typeDemandeElement
        ? typeDemandeElement.value
        : null;

      console.log("Valeurs récupérées:");
      console.log("typeAvertissementValue:", typeAvertissementValue);
      console.log("delaiLegalValue:", delaiLegalValue);
      console.log("typeDemandeValue:", typeDemandeValue);

      //  Collecte des données pénales pour l'opposant
      let donneesPenales = {};

      if (isAffairePenale && roleClient === "opposant") {
        donneesPenales = {
          autorite_emettrice: autoriteEmettrice,
          type_action_penale: typeActionPenale,
          date_convocation_arrestation: dateConvocationArrestation,
          audition_police_faite: auditionPoliceFaite,
          observations_penales: observationsPenales,
          // NOUVEAU : Données pour la phase PROCEDURE
          documents_defense: documentsDefense,
          observations_defense: observationsDefense,
          jugement: jugement,
          // NOUVEAU : Données pour la phase EXECUTION
          execution_faite: executionFaite,
          date_execution: dateExecution,
          details_execution: detailsExecution,
          observations_execution: observationsExecution,
          motif_non_execution: motifNonExecution,
          type_execution: typeExecution,
        };
      }

      // Récupérer les fichiers PDF si sélectionnés
      const convocationPdfElement = document.getElementById(
        "convocation-pdf-penale",
      );
      const convocationPdfFile = convocationPdfElement
        ? convocationPdfElement.files[0]
        : null;

      const documentsDefenseElement = document.getElementById(
        "documents-defense-procedure",
      );
      const documentsDefenseFile = documentsDefenseElement
        ? documentsDefenseElement.files[0]
        : null;

      const documentExecutionElement =
        document.getElementById("document-execution");
      const documentExecutionFile = documentExecutionElement
        ? documentExecutionElement.files[0]
        : null;

      const data = {
        observations,
        huissier_id: selectedHuissier,
        opposant_id: selectedOpposant,
        type_avertissement_id: typeAvertissementValue,
        delai_legal: delaiLegalValue,
        type_demande_id: typeDemandeValue,
        // Ajout des données pénales
        ...donneesPenales,
      };

      // Créer FormData si un fichier est sélectionné
      let formData = null;
      if (convocationPdfFile || documentsDefenseFile || documentExecutionFile) {
        formData = new FormData();
        // Ajouter toutes les données
        Object.keys(data).forEach((key) => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
          }
        });
        // Ajouter les fichiers
        if (convocationPdfFile) {
          formData.append("convocation_pdf", convocationPdfFile);
        }
        if (documentsDefenseFile) {
          formData.append("documents_defense", documentsDefenseFile);
        }
        if (documentExecutionFile) {
          formData.append("document_execution", documentExecutionFile);
        }
      }

      console.log("Données envoyées au backend:", data);
      console.log(
        "URL appelée:",
        `affaires/${affaireId}/etapes/${etapeId}/completer/`,
      );

      const response = await api.post(
        `affaires/${affaireId}/etapes/${etapeId}/completer/`,
        formData || data,
        formData
          ? {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          : {},
      );
      console.log("Réponse du backend:", response.data);

      await chargerEtapesPhase();

      // Forcer le rechargement des données de l'affaire dans le tableau principal
      if (window.location.pathname.includes("/affaires")) {
        // Si on est sur la page des affaires, recharger les données
        window.dispatchEvent(new CustomEvent("reloadAffaires"));
      }
    } catch (error) {
      console.error("Erreur complétion étape:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible de compléter l'étape - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error("Erreur de connexion: Impossible de compléter l'étape");
      } else {
        console.error(
          "Erreur inattendue lors de la complétion de l'étape:",
          error.message,
        );
      }
    }
  };

  // fct de gestion des champs speciaux

  // gestion deliberation
  const gererChampsDeliberation = (index, type) => {
    const champsInspection = document.getElementById(
      `champs-inspection-${index}`,
    );
    const champsExpertise = document.getElementById(
      `champs-expertise-${index}`,
    );

    if (champsInspection)
      champsInspection.style.display = type === "inspection" ? "block" : "none";
    if (champsExpertise) {
      champsExpertise.style.display = type === "expertise" ? "block" : "none";
      if (type === "expertise") {
        chargerExpertsPourEtape(index);
      }
    }
  };

  const chargerExpertsPourEtape = async (index) => {
    try {
      const response = await api.get("experts/");
      const experts = response.data;
      const expertSelect = document.getElementById(`expert-selection-${index}`);

      if (expertSelect) {
        // Garder l'option par défaut
        expertSelect.innerHTML =
          '<option value="">Sélectionner l\'expert</option>';

        // Ajouter les experts
        experts.forEach((expert) => {
          const option = document.createElement("option");
          option.value = expert.idexpert;
          option.textContent = `${expert.nomexpert} (${expert.specialisationexpert})`;
          expertSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des experts:", error);
    }
  };
  // temoins
  const gererChampsTemoins = (index, type) => {
    const sectionTemoins = document.getElementById(`section-temoins-${index}`);
    if (!sectionTemoins) return;
    sectionTemoins.style.display = type === "temoins" ? "block" : "none";
  };

  //  FONCTIONS DE GESTION DES TÉMOINS

  // suppression
  window.supprimerTemoin = (temoinId) => {
    const element = document.getElementById(temoinId);
    if (element) element.remove();
  };

  // ajout
  const ajouterTemoin = async (index) => {
    const nom = document.getElementById(`nom-temoin-${index}`)?.value;
    const role = document.getElementById(`role-temoin-${index}`)?.value;
    const adresse = document.getElementById(`adresse-temoin-${index}`)?.value;
    const telephone = document.getElementById(
      `telephone-temoin-${index}`,
    )?.value;

    if (!nom || !role) {
      console.error("Veuillez remplir au moins le nom et le rôle du témoin");
      return;
    }

    try {
      // Créer le témoin dans la base de données
      const newTemoinId = `T${Date.now()}`; // Générer un ID unique
      const temoinData = {
        idtemoin: newTemoinId,
        nomtemoin: nom,
        roletemoin: role,
        adressetemoin: adresse || "",
        telephonetemoin: telephone || "",
      };

      const temoinResponse = await api.post("temoins/", temoinData);
      const temoin = temoinResponse.data;

      //  Créer la participation du témoin à l'étape
      let etapeId = etapesPhase[index]?.idetape;

      if (!etapeId) {
        console.warn(
          "L'étape n'existe pas encore dans la base de données. La participation sera créée après la création de l'étape.",
        );
      } else {
        const participationData = {
          idetape: etapeId,
          idtemoin: temoin.idtemoin,
          dateintervention: new Date().toISOString().split("T")[0],
        };

        try {
          const participationResponse = await api.post(
            "participationtemoinetapes/",
            participationData,
          );
          console.log("Participation créée:", participationResponse.data);
        } catch (participationError) {
          console.error(
            "Erreur lors de la création de la participation:",
            participationError,
          );
        }
      }

      console.log("Témoin ajouté avec succès:", temoin);

      // Ajouter visuellement dans l'interface
      const listeTemoins = document.getElementById(`liste-temoins-${index}`);
      if (!listeTemoins) return;

      const temoinElementId = `temoin-${temoin.idtemoin}`;

      const temoinElement = document.createElement("div");
      temoinElement.id = temoinElementId;
      temoinElement.style.cssText =
        "padding: 8px 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;";

      temoinElement.innerHTML = `
                <div>
                    <strong>${nom}</strong> - ${role}
                    ${adresse ? `<br><small>📍 ${adresse}</small>` : ""}
                    ${telephone ? `<br><small>📞 ${telephone}</small>` : ""}
                </div>
                <button
                    type="button"
                    onclick="supprimerTemoin('${temoinElementId}', '${temoin.idtemoin}')"
                    style="
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 12px;
                    "
                >
                    ✕
                </button>
            `;

      listeTemoins.appendChild(temoinElement);

      //  Reset champs
      document.getElementById(`nom-temoin-${index}`).value = "";
      document.getElementById(`role-temoin-${index}`).value = "";
      document.getElementById(`adresse-temoin-${index}`).value = "";
      document.getElementById(`telephone-temoin-${index}`).value = "";

      console.log("Témoin ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout du témoin:", error);
    }
  };

  // Fonction globale pour supprimer un témoin
  window.supprimerTemoin = async (temoinElementId, temoinId) => {
    try {
      // Supprimer de la base de données
      await api.delete(`temoins/${temoinId}/`);

      // Supprimer visuellement
      const element = document.getElementById(temoinElementId);
      if (element) {
        element.remove();
      }

      console.log("Témoin supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du témoin:", error);
    }
  };

  //verification

  if (!affaireData) {
    return (
      <ModalLoading
        title={t("Workflow")}
        onClose={() => navigate("/affaires")}
      />
    );
  }

  //page
  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <ModalHeader
        title={`${t("Workflow")} - Affaire N° ${affaireData?.annee_dossier || ""}-${affaireData?.code_dossier || ""}-${affaireData?.numero_dossier || affaireId}`}
        onClose={() => navigate("/affaires")}
      />

      <PhaseSelector phase={phase} setPhase={setPhase} />

      <RoleDisplay roleClient={roleClient} affaireData={affaireData} />

      {phase === "INITIALE" &&
        roleClient === "demandeur" &&
        !isAffairePenale && (
          <ConfigurationRapide appliquerStrategie={appliquerStrategie} />
        )}

      <div style={stepsContainerStyle}>
        <h4 style={stepsTitleStyle}>
          {t("ÉTAPES")}{" "}
          {phase === "INITIALE"
            ? t("INITIALE")
            : phase === "PROCEDURE"
              ? t("PROCEDURE")
              : phase === "EXECUTION"
                ? t("EXECUTION")
                : t("APPEL")}
        </h4>

        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {etapesPhase.map((etape, index) => (
            <EtapeItem
              key={index}
              index={index}
              etape={etape}
              phase={phase}
              affaireId={affaireId}
              api={api}
              etapesOptionnelles={etapesOptionnelles}
              toggleEtapeOptionnelle={toggleEtapeOptionnelle}
              typesAvertissement={typesAvertissement}
              typesDemande={typesDemande}
              huissiers={huissiers}
              opposants={opposants}
              selectedHuissier={selectedHuissier}
              setSelectedHuissier={setSelectedHuissier}
              selectedOpposant={selectedOpposant}
              setSelectedOpposant={setSelectedOpposant}
              searchOpposant={searchOpposant}
              setSearchOpposant={setSearchOpposant}
              showOpposantDropdown={showOpposantDropdown}
              setShowOpposantDropdown={setShowOpposantDropdown}
              filteredOpposants={filteredOpposants}
              handleOpposantSearch={handleOpposantSearch}
              selectOpposant={selectOpposant}
              clearOpposantSearch={clearOpposantSearch}
              fichiersEtapes={fichiersEtapes}
              handleFileUpload={handleFileUploadEtape}
              getTypeFichierForEtape={getTypeFichierForEtape}
              creerEtape={creerEtape}
              completerEtape={completerEtape}
              // supprimerEtape={supprimerEtape}
              gererChampsDeliberation={gererChampsDeliberation}
              gererChampsTemoins={gererChampsTemoins}
              ajouterTemoin={ajouterTemoin}
              sauvegarderParametresNotification={
                sauvegarderParametresNotification
              }
              calculerDateLimiteAppel={calculerDateLimiteAppel}
              isDelaiAppelValide={isDelaiAppelValide}
              tribunauxAppel={tribunauxAppel}
              villesAppel={villesAppel}
              villeAppelSelectionnee={villeAppelSelectionnee}
              setVilleAppelSelectionnee={setVilleAppelSelectionnee}
              tribunalAppelSelectionne={tribunalAppelSelectionne}
              setTribunalAppelSelectionne={setTribunalAppelSelectionne}
              handleCreerNouvelleAffaire={handleCreerNouvelleAffaire}
              dateJugement={dateJugement}
              setDateJugement={setDateJugement}
              affaireData={affaireData}
              setEtapesTerminees={setEtapesTerminees}
              setEtapesPhase={setEtapesPhase}
              // Props pour l'audience
              tribunaux={tribunaux}
              tribunalSelectionne={tribunalSelectionne}
              setTribunalSelectionne={setTribunalSelectionne}
              dateAudience={dateAudience}
              setDateAudience={setDateAudience}
              heureAudience={heureAudience}
              setHeureAudience={setHeureAudience}
              villesDisponibles={villesDisponibles}
              villeSelectionnee={villeSelectionnee}
              setVilleSelectionnee={setVilleSelectionnee}
              user={user}
              isAffairePenale={isAffairePenale}
              gererChampsTemoinsProp={gererChampsTemoins}
              ajouterTemoinProp={ajouterTemoin}
              autoriteEmettrice={autoriteEmettrice}
              setAutoriteEmettrice={setAutoriteEmettrice}
              typeActionPenale={typeActionPenale}
              setTypeActionPenale={setTypeActionPenale}
              dateConvocationArrestation={dateConvocationArrestation}
              setDateConvocationArrestation={setDateConvocationArrestation}
              auditionPoliceFaite={auditionPoliceFaite}
              setAuditionPoliceFaite={setAuditionPoliceFaite}
              observationsPenales={observationsPenales}
              setObservationsPenales={setObservationsPenales}
              // NOUVEAU : Props pour la phase PROCEDURE
              documentsDefense={documentsDefense}
              setDocumentsDefense={setDocumentsDefense}
              observationsDefense={observationsDefense}
              setObservationsDefense={setObservationsDefense}
              jugement={jugement}
              setJugement={setJugement}
              // NOUVEAU : Props pour la phase EXECUTION
              executionFaite={executionFaite}
              setExecutionFaite={setExecutionFaite}
              dateExecution={dateExecution}
              setDateExecution={setDateExecution}
              detailsExecution={detailsExecution}
              setDetailsExecution={setDetailsExecution}
              documentExecution={documentExecution}
              setDocumentExecution={setDocumentExecution}
              observationsExecution={observationsExecution}
              setObservationsExecution={setObservationsExecution}
              motifNonExecution={motifNonExecution}
              setMotifNonExecution={setMotifNonExecution}
              typeExecution={typeExecution}
              setTypeExecution={setTypeExecution}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// COMPOSANTS AUXILIAIRES

// CHARGEMENT
const ModalLoading = ({ title, onClose }) => (
  <div style={backdropStyle}>
    <div style={smallContainerStyle}>
      <ModalHeader title={title} onClose={onClose} />
      <div style={{ textAlign: "center", padding: 40 }}>
        <p>Chargement...</p>
      </div>
    </div>
  </div>
);

// AFFAIRE PÉNALE
const ModalNotificationPenale = ({ affaireId, onClose, t }) => (
  <div style={backdropStyle}>
    <div style={smallContainerStyle}>
      <ModalHeader
        title={`Workflow - Affaire N° ${affaireId}`}
        onClose={onClose}
      />
      <div style={{ padding: 20, color: "#b71c1c" }}>
        <p>
          {t("Cette affaire est pénale. La gestion des étapes est désactivée.")}
        </p>
      </div>
    </div>
  </div>
);

// Composant pour les étapes pénales opposant
const EtapePenaleOpposant = ({
  etape,
  index,
  onCompleter,
  autoriteEmettrice,
  setAutoriteEmettrice,
  typeActionPenale,
  setTypeActionPenale,
  dateConvocationArrestation,
  setDateConvocationArrestation,
  auditionPoliceFaite,
  setAuditionPoliceFaite,
  observationsPenales,
  setObservationsPenales,
  affaireId,
}) => {
  // Constantes pour les choix pénaux
  const AUTORITES_EMETTRICES = [
    {
      value: "POLICE_JUDICIAIRE",
      label: "Police judiciaire",
      label_ar: "الشرطة القضائية",
    },
    { value: "GENDARMERIE", label: "Gendarmerie", label_ar: "الدرك الوطني" },
    { value: "PARQUET", label: "Parquet", label_ar: "النيابة العامة" },
    {
      value: "JUGES_INSTRUCTION",
      label: "Juges d'instruction",
      label_ar: "قضاة التحقيق",
    },
    { value: "TRIBUNAL", label: "Tribunal", label_ar: "المحكمة" },
    { value: "AUTRE", label: "Autre autorité", label_ar: "سلطة أخرى" },
  ];

  const TYPES_ACTION_PENALE = [
    { value: "CONVOCATION", label: "Convocation", label_ar: "استدعاء" },
    { value: "ARRESTATION", label: "Arrestation", label_ar: "اعتقال" },
    { value: "GARDE_VUE", label: "Garde à vue", label_ar: "الحبس الاحتياطي" },
    { value: "AUTRE", label: "Autre mesure", label_ar: "إجراء آخر" },
  ];

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: etape.terminee ? "#e8f5e8" : "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4
          style={{ margin: 0, color: etape.terminee ? "#2e7d32" : "#1a237e" }}
        >
          {etape.terminee ? "✅ " : ""}
          {etape.libelle_ar} {etape.libelle_fr && `(${etape.libelle_fr})`}
        </h4>
        <span
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Délai: {etape.delai_legal} jours
        </span>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "4px",
        }}
      >
        {/* Autorité émettrice */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Autorité émettrice :
          </label>
          <select
            value={autoriteEmettrice}
            onChange={(e) => setAutoriteEmettrice(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <option value="">Sélectionner une autorité</option>
            {AUTORITES_EMETTRICES.map((autorite) => (
              <option key={autorite.value} value={autorite.value}>
                {autorite.label} - {autorite.label_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Type d'action pénale */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Type d'action :
          </label>
          <select
            value={typeActionPenale}
            onChange={(e) => setTypeActionPenale(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <option value="">Sélectionner un type</option>
            {TYPES_ACTION_PENALE.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.label_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Date de convocation/arrestation */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Date de convocation/arrestation :
          </label>
          <input
            type="date"
            value={dateConvocationArrestation}
            onChange={(e) => setDateConvocationArrestation(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Case à cocher pour l'audition */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={auditionPoliceFaite}
              onChange={(e) => setAuditionPoliceFaite(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Audition par la police judiciaire effectuée
          </label>
        </div>

        {/* Document PDF */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Document PDF (convocation/arrestation) :
          </label>
          <input
            type="file"
            id="convocation-pdf-penale"
            accept=".pdf"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Copie de la convocation ou PV d'arrestation
          </small>
        </div>

        {/* Observations */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Observations de l'avocat :
          </label>
          <textarea
            value={observationsPenales}
            onChange={(e) => setObservationsPenales(e.target.value)}
            placeholder="Notes et observations..."
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minHeight: "80px",
              resize: "vertical",
            }}
          />
        </div>

        {!etape.terminee ? (
          <UnifiedEtapeButton
            etapeId={etape.id || index}
            affaireId={affaireId}
            onComplete={(etapeId) => onCompleter(etapeId, observationsPenales)}
          >
            Terminer l'étape
          </UnifiedEtapeButton>
        ) : (
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            Terminée
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour les étapes pénales execution demandeur
const EtapePenaleExecutionDemandeur = ({
  etape,
  index,
  onCompleter,
  executionFaite,
  setExecutionFaite,
  dateExecution,
  setDateExecution,
  detailsExecution,
  setDetailsExecution,
  documentExecution,
  setDocumentExecution,
  observationsExecution,
  setObservationsExecution,
  motifNonExecution,
  setMotifNonExecution,
  affaireId,
}) => {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: etape.terminee ? "#e8f5e8" : "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4
          style={{ margin: 0, color: etape.terminee ? "#2e7d32" : "#1a237e" }}
        >
          {etape.terminee ? "✅ " : ""}
          {etape.libelle_ar} {etape.libelle_fr && `(${etape.libelle_fr})`}
        </h4>
        <span
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Délai: {etape.delai_legal} jours
        </span>
      </div>

      {/* Affichage direct des détails */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "4px",
        }}
      >
        {/* Checkbox Exécution faite */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            <input
              type="checkbox"
              checked={executionFaite}
              onChange={(e) => setExecutionFaite(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Décision exécutée ?
          </label>
        </div>

        {/* Champs conditionnels si exécution faite */}
        {executionFaite ? (
          <>
            {/* Date d'exécution */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Date d'exécution :
              </label>
              <input
                type="date"
                value={dateExecution}
                onChange={(e) => setDateExecution(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Détails de l'exécution */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Détails de l'exécution :
              </label>
              <textarea
                value={detailsExecution}
                onChange={(e) => setDetailsExecution(e.target.value)}
                placeholder="Paiement de l'amende, indemnisation, restitution d'un bien..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Document PDF */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Document PDF (preuve) :
              </label>
              <input
                type="file"
                id="document-execution"
                accept=".pdf"
                onChange={(e) => setDocumentExecution(e.target.files[0])}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Preuve de paiement, PV d'exécution, certificat de remise...
              </small>
            </div>

            {/* Observations */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Observations :
              </label>
              <textarea
                value={observationsExecution}
                onChange={(e) => setObservationsExecution(e.target.value)}
                placeholder="Notes sur le déroulement de l'exécution..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>
          </>
        ) : (
          /* Motif de non-exécution */
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Motif de non-exécution :
            </label>
            <textarea
              value={motifNonExecution}
              onChange={(e) => setMotifNonExecution(e.target.value)}
              placeholder="Raison pour laquelle l'exécution n'a pas eu lieu..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Bouton unifié */}
        <UnifiedEtapeButton
          etapeId={etape.id || index}
          affaireId={affaireId}
          onComplete={(etapeId) =>
            onCompleter(
              etapeId,
              executionFaite ? observationsExecution : motifNonExecution,
            )
          }
        >
          Terminer l'étape
        </UnifiedEtapeButton>
      </div>
    </div>
  );
};

// Composant pour les étapes pénales execution opposant
const EtapePenaleExecutionOpposant = ({
  etape,
  index,
  onCompleter,
  executionFaite,
  setExecutionFaite,
  dateExecution,
  setDateExecution,
  typeExecution,
  setTypeExecution,
  documentExecution,
  setDocumentExecution,
  observationsExecution,
  setObservationsExecution,
  motifNonExecution,
  setMotifNonExecution,
  affaireId,
}) => {
  // Constantes pour les types d'exécution
  const TYPES_EXECUTION = [
    { value: "EMPRISONNEMENT", label: "Emprisonnement", label_ar: "سجن" },
    { value: "AMENDE", label: "Amende", label_ar: "غرامة" },
    {
      value: "TIG",
      label: "Travaux d'intérêt général",
      label_ar: "أشغال ذات منفعة عامة",
    },
    { value: "SURSIS", label: "Sursis", label_ar: "إيقاف التنفيذ" },
    { value: "AUTRE", label: "Autre", label_ar: "أخرى" },
  ];
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: etape.terminee ? "#e8f5e8" : "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4
          style={{ margin: 0, color: etape.terminee ? "#2e7d32" : "#1a237e" }}
        >
          {etape.terminee ? "✅ " : ""}
          {etape.libelle_ar} {etape.libelle_fr && `(${etape.libelle_fr})`}
        </h4>
        <span
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Délai: {etape.delai_legal} jours
        </span>
      </div>

      {/* Affichage direct des détails */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "4px",
        }}
      >
        {/* Checkbox Exécution faite */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
            }}
          >
            <input
              type="checkbox"
              checked={executionFaite}
              onChange={(e) => setExecutionFaite(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Jugement exécuté ?
          </label>
        </div>

        {/* Champs conditionnels si exécution faite */}
        {executionFaite ? (
          <>
            {/* Date d'exécution */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Date d'exécution :
              </label>
              <input
                type="date"
                value={dateExecution}
                onChange={(e) => setDateExecution(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Type d'exécution */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Type d'exécution :
              </label>
              <select
                value={typeExecution}
                onChange={(e) => setTypeExecution(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <option value="">Sélectionner le type d'exécution</option>
                {TYPES_EXECUTION.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.label_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Document PDF */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Document PDF (preuve) :
              </label>
              <input
                type="file"
                id="document-execution"
                accept=".pdf"
                onChange={(e) => setDocumentExecution(e.target.files[0])}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Preuve d'exécution, reçu de paiement, certificat de fin de
                peine...
              </small>
            </div>

            {/* Observations */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Observations :
              </label>
              <textarea
                value={observationsExecution}
                onChange={(e) => setObservationsExecution(e.target.value)}
                placeholder="Remise de peine, appel en cours, suspension..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>
          </>
        ) : (
          /* Motif de non-exécution */
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Motif de non-exécution :
            </label>
            <textarea
              value={motifNonExecution}
              onChange={(e) => setMotifNonExecution(e.target.value)}
              placeholder="Raison pour laquelle l'exécution n'a pas eu lieu..."
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Bouton de validation */}
        {!etape.terminee ? (
          <UnifiedEtapeButton
            etapeId={etape.id || index}
            affaireId={affaireId}
            onComplete={(etapeId) =>
              onCompleter(
                etapeId,
                executionFaite ? observationsExecution : motifNonExecution,
              )
            }
          >
            Terminer l'étape
          </UnifiedEtapeButton>
        ) : (
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            Terminée
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour les étapes pénales procedure (audience et défense)
const EtapePenaleProcedure = ({
  etape,
  index,
  onCompleter,
  documentsDefense,
  setDocumentsDefense,
  observationsDefense,
  setObservationsDefense,
  jugement,
  setJugement,
  affaireId,
}) => {
  // Constantes pour les jugements
  const TYPES_JUGEMENT = [
    { value: "PRISON", label: "Prison", label_ar: "سجن" },
    { value: "AMENDE", label: "Amende", label_ar: "غرامة" },
    { value: "SURSIS", label: "Sursis", label_ar: "إيقاف التنفيذ" },
    { value: "ACQUITTEMENT", label: "Acquittement", label_ar: "براءة" },
  ];
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: etape.terminee ? "#e8f5e8" : "#f9f9f9",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h4
          style={{ margin: 0, color: etape.terminee ? "#2e7d32" : "#1a237e" }}
        >
          {etape.terminee ? "✅ " : ""}
          {etape.libelle_ar} {etape.libelle_fr && `(${etape.libelle_fr})`}
        </h4>
        <span
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Délai: {etape.delai_legal} jours
        </span>
      </div>

      <div
        style={{
          padding: "16px",
          backgroundColor: "white",
          borderRadius: "4px",
        }}
      >
        {/* Documents de défense */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Documents de défense (PDF) :
          </label>
          <input
            type="file"
            id="documents-defense-procedure"
            accept=".pdf"
            onChange={(e) => setDocumentsDefense(e.target.files[0])}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Mémoires de défense, preuves, témoignages...
          </small>
        </div>

        {/* Observations de l'avocat */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Observations de l'avocat :
          </label>
          <textarea
            value={observationsDefense}
            onChange={(e) => setObservationsDefense(e.target.value)}
            placeholder="Notes et observations sur l'audience et la défense..."
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minHeight: "80px",
              resize: "vertical",
            }}
          />
        </div>

        {/* Jugement */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Jugement :
          </label>
          <select
            value={jugement}
            onChange={(e) => setJugement(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <option value="">Sélectionner le jugement</option>
            {TYPES_JUGEMENT.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.label_ar}
              </option>
            ))}
          </select>
        </div>

        {!etape.terminee ? (
          <UnifiedEtapeButton
            etapeId={etape.id || index}
            affaireId={affaireId}
            onComplete={(etapeId) => onCompleter(etapeId, observationsDefense)}
          >
            Terminer l'étape
          </UnifiedEtapeButton>
        ) : (
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              height: 40,
              display: "flex",
              alignItems: "center",
            }}
          >
            Terminée
          </div>
        )}
      </div>
    </div>
  );
};

// entete
const ModalHeader = ({ title, onClose }) => (
  <div style={headerStyle}>
    <h3 style={{ margin: 0, color: "#1a237e" }}>{title}</h3>
    <button
      onClick={onClose}
      style={closeBtnStyle}
      type="button"
      aria-label="Close"
    >
      ×
    </button>
  </div>
);

const PhaseSelector = ({ phase, setPhase }) => {
  const { t } = useTranslation();
  const phases = [
    { id: "INITIALE", label: t("Phase Initiale"), color: "#1976d2" },
    { id: "PROCEDURE", label: t("Phase Procédure"), color: "#ffb300" },
    { id: "APPEL", label: t("Phase Appel"), color: "#ff9800" },
    { id: "EXECUTION", label: t("Phase Exécution"), color: "#4caf50" },
  ];
  return (
    <div style={phaseSelectorStyle}>
      {phases.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setPhase(p.id)}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
            background: phase === p.id ? p.color : "#f5f5f5",
            color: phase === p.id ? "#fff" : "#333",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

const RoleDisplay = ({ roleClient, affaireData }) => {
  const { t } = useTranslation();
  return (
    <div style={roleDisplayStyle}>
      <span style={{ fontWeight: "bold", color: "#1a237e" }}>
        {t("Rôle du client")}:
      </span>
      <span style={roleBadgeStyle}>
        {roleClient === "demandeur" ? t("Demandeur") : t("Opposant")}
      </span>
    </div>
  );
};

const ConfigurationRapide = ({ appliquerStrategie }) => (
  <div style={configRapideStyle}>
    <h6 style={{ marginBottom: 12, color: "#495057" }}>
      ⚙️ Configuration rapide des étapes
    </h6>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => appliquerStrategie("AVEC_AVERTISSEMENT")}
        style={btnStyle("#007bff")}
      >
        Avec avertissement
      </button>
      <button
        type="button"
        onClick={() => appliquerStrategie("DEMANDE_DIRECTE")}
        style={btnStyle("#28a745")}
      >
        Demande directe
      </button>
      <button
        type="button"
        onClick={() => appliquerStrategie("PLAINTE_DIRECTE")}
        style={btnStyle("#dc3545")}
      >
        Plainte directe
      </button>
      <button
        type="button"
        onClick={() => appliquerStrategie("AUTOMATIQUE")}
        style={btnStyle("#6c757d")}
      >
        Automatique
      </button>
    </div>
  </div>
);

const btnStyle = (color) => ({
  padding: "6px 12px",
  border: `1px solid ${color}`,
  borderRadius: 4,
  background: "#fff",
  color: color,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: "bold",
});

const unifiedButtonStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  width: "100%",
  marginTop: "16px",
};

// gère l'affichage et l'interaction avec chaque étape
const EtapeItem = ({
  index,
  etape,
  phase,
  affaireId,
  api,
  etapesOptionnelles,
  toggleEtapeOptionnelle,
  typesAvertissement,
  typesDemande,
  huissiers,
  opposants,
  selectedHuissier,
  setSelectedHuissier,
  selectedOpposant,
  setSelectedOpposant,
  searchOpposant,
  setSearchOpposant,
  showOpposantDropdown,
  setShowOpposantDropdown,
  filteredOpposants,
  handleOpposantSearch,
  selectOpposant,
  clearOpposantSearch,
  fichiersEtapes,
  handleFileUpload,
  getTypeFichierForEtape,
  creerEtape,
  completerEtape,
  // supprimerEtape,
  gererChampsDeliberation,
  gererChampsTemoins,
  ajouterTemoin,
  sauvegarderParametresNotification,
  calculerDateLimiteAppel,
  isDelaiAppelValide,
  tribunauxAppel,
  villesAppel,
  villeAppelSelectionnee,
  setVilleAppelSelectionnee,
  tribunalAppelSelectionne,
  setTribunalAppelSelectionne,
  handleCreerNouvelleAffaire,
  dateJugement,
  setDateJugement,
  affaireData,
  setEtapesTerminees,
  setEtapesPhase,
  // Props pour l'audience
  tribunaux,
  tribunalSelectionne,
  setTribunalSelectionne,
  dateAudience,
  setDateAudience,
  heureAudience,
  setHeureAudience,
  villesDisponibles,
  villeSelectionnee,
  setVilleSelectionnee,
  user,
  isAffairePenale,
  gererChampsTemoinsProp,
  ajouterTemoinProp,
  autoriteEmettrice,
  setAutoriteEmettrice,
  typeActionPenale,
  setTypeActionPenale,
  dateConvocationArrestation,
  setDateConvocationArrestation,
  auditionPoliceFaite,
  setAuditionPoliceFaite,
  observationsPenales,
  setObservationsPenales,
  //  Props pour la phase PROCEDURE
  documentsDefense,
  setDocumentsDefense,
  observationsDefense,
  setObservationsDefense,
  jugement,
  setJugement,
  // Props pour la phase EXECUTION
  executionFaite,
  setExecutionFaite,
  dateExecution,
  setDateExecution,
  detailsExecution,
  setDetailsExecution,
  documentExecution,
  setDocumentExecution,
  observationsExecution,
  setObservationsExecution,
  motifNonExecution,
  setMotifNonExecution,
  typeExecution,
  setTypeExecution,
}) => {
  //  Affichage conditionnel des étapes pénales opposant
  if (etape.type_etape === "PENALE_OPPOSANT_INITIALE") {
    return (
      <EtapePenaleOpposant
        etape={etape}
        index={index}
        onCompleter={completerEtape}
        autoriteEmettrice={autoriteEmettrice}
        setAutoriteEmettrice={setAutoriteEmettrice}
        typeActionPenale={typeActionPenale}
        setTypeActionPenale={setTypeActionPenale}
        dateConvocationArrestation={dateConvocationArrestation}
        setDateConvocationArrestation={setDateConvocationArrestation}
        auditionPoliceFaite={auditionPoliceFaite}
        setAuditionPoliceFaite={setAuditionPoliceFaite}
        observationsPenales={observationsPenales}
        setObservationsPenales={setObservationsPenales}
        affaireId={affaireId}
      />
    );
  }

  if (etape.type_etape === "PENALE_OPPOSANT_PROCEDURE") {
    return (
      <EtapePenaleProcedure
        etape={etape}
        index={index}
        onCompleter={completerEtape}
        documentsDefense={documentsDefense}
        setDocumentsDefense={setDocumentsDefense}
        observationsDefense={observationsDefense}
        setObservationsDefense={setObservationsDefense}
        jugement={jugement}
        setJugement={setJugement}
        affaireId={affaireId}
      />
    );
  }

  if (etape.type_etape === "PENALE_DEMANDEUR_EXECUTION") {
    return (
      <EtapePenaleExecutionDemandeur
        etape={etape}
        index={index}
        onCompleter={completerEtape}
        executionFaite={executionFaite}
        setExecutionFaite={setExecutionFaite}
        dateExecution={dateExecution}
        setDateExecution={setDateExecution}
        detailsExecution={detailsExecution}
        setDetailsExecution={setDetailsExecution}
        documentExecution={documentExecution}
        setDocumentExecution={setDocumentExecution}
        observationsExecution={observationsExecution}
        setObservationsExecution={setObservationsExecution}
        motifNonExecution={motifNonExecution}
        setMotifNonExecution={setMotifNonExecution}
        affaireId={affaireId}
      />
    );
  }

  if (etape.type_etape === "PENALE_OPPOSANT_EXECUTION") {
    return (
      <EtapePenaleExecutionOpposant
        etape={etape}
        index={index}
        onCompleter={completerEtape}
        executionFaite={executionFaite}
        setExecutionFaite={setExecutionFaite}
        dateExecution={dateExecution}
        setDateExecution={setDateExecution}
        typeExecution={typeExecution}
        setTypeExecution={setTypeExecution}
        documentExecution={documentExecution}
        setDocumentExecution={setDocumentExecution}
        observationsExecution={observationsExecution}
        setObservationsExecution={setObservationsExecution}
        motifNonExecution={motifNonExecution}
        setMotifNonExecution={setMotifNonExecution}
        affaireId={affaireId}
      />
    );
  }

  // VÉRIFICATION FORCÉE pour les affaires pénales opposant
  if (
    etape.libelle_ar &&
    etape.libelle_ar.includes("استدعاء أو اعتقال") &&
    isAffairePenale &&
    roleClient === "opposant"
  ) {
    return (
      <EtapePenaleOpposant
        etape={etape}
        index={index}
        onCompleter={completerEtape}
        autoriteEmettrice={autoriteEmettrice}
        setAutoriteEmettrice={setAutoriteEmettrice}
        typeActionPenale={typeActionPenale}
        setTypeActionPenale={setTypeActionPenale}
        dateConvocationArrestation={dateConvocationArrestation}
        setDateConvocationArrestation={setDateConvocationArrestation}
        auditionPoliceFaite={auditionPoliceFaite}
        setAuditionPoliceFaite={setAuditionPoliceFaite}
        observationsPenales={observationsPenales}
        setObservationsPenales={setObservationsPenales}
        affaireId={affaireId}
      />
    );
  }

  const isOptionnelle = etape.optionnel;

  // Étapes qui s'affichent automatiquement (sans checkbox)
  const etapesAutoAffichage = [
    "استلام إنذار",
    "استلام شكاية",
    "شكاية",
    "التحقيق الأولي",
    "قرار النيابة العامة",
    "جلسة المحاكمة",
  ];
  const estAutoAffichage = etapesAutoAffichage.includes(etape.libelle_ar);

  const estAppliquee =
    !isOptionnelle || etapesOptionnelles.includes(index) || estAutoAffichage;

  //  observations
  const [observations, setObservations] = useState(etape.observations || "");

  // Fonction pour déclencher la complétion de l'étape
  async function onTerminerEtape() {
    try {
      console.log("Marquage de l'étape comme terminée");

      //  les données des champs de formulaire
      const typeAvertissementSelect = document.getElementById(
        `type-avertissement-etape_${index}`,
      );
      const typeDemandeSelect = document.getElementById(
        `type-demande-etape_${index}`,
      );
      const delaiLegalInput = document.getElementById(
        `delai-legal-etape_${index}`,
      );

      const type_avertissement_id =
        typeAvertissementSelect && typeAvertissementSelect.value
          ? typeAvertissementSelect.value
          : null;
      const type_demande_id =
        typeDemandeSelect && typeDemandeSelect.value
          ? typeDemandeSelect.value
          : null;

      // Validation du délai légal
      let delai_legal = null;
      if (delaiLegalInput && delaiLegalInput.value) {
        const delaiValue = parseInt(delaiLegalInput.value);
        if (!isNaN(delaiValue) && delaiValue >= 0 && delaiValue <= 365) {
          delai_legal = delaiValue.toString();
        } else {
          console.warn("Délai légal invalide", delaiLegalInput.value);
          delai_legal = null;
        }
      }

      // avocat du demandeur
      let avocat_demandeur_nom = null;
      const avocatInput = document.getElementById(
        `avocat-demandeur-etape_${index}`,
      );
      if (avocatInput && avocatInput.value) {
        avocat_demandeur_nom = avocatInput.value.trim();
      }

      // date de réception  envoyée comme date_effective (YYYY-MM-DD)
      let date_effective = null;
      const dateReceptionInput = document.getElementById(
        `date-reception-etape_${index}`,
      );
      if (dateReceptionInput && dateReceptionInput.value) {
        date_effective = dateReceptionInput.value;
      }

      // Récupérer les données d'audience pour l'étape "استدعاء للمثول"
      let tribunal_id = null;
      let date_audience = null;
      let heure_audience = null;

      if (etape.libelle_ar === "استدعاء للمثول") {
        const tribunalSelect = document.getElementById(
          `tribunal-audience-etape_${index}`,
        );
        const dateAudienceInput = document.getElementById(
          `date-audience-etape_${index}`,
        );
        const heureAudienceInput = document.getElementById(
          `heure-audience-etape_${index}`,
        );

        tribunal_id = tribunalSelect ? tribunalSelect.value : null;
        date_audience = dateAudienceInput ? dateAudienceInput.value : null;
        heure_audience = heureAudienceInput ? heureAudienceInput.value : null;
      }

      // Récupérer les données de plainte pour l'étape "استلام شكاية"
      let contenu_plainte = null;
      let delai_reponse = null;

      if (etape.libelle_ar === "استلام شكاية") {
        const contenuPlainteTextarea = document.getElementById(
          `contenu-plainte-etape_${index}`,
        );
        const delaiReponseInput = document.getElementById(
          `delai-reponse-etape_${index}`,
        );

        contenu_plainte = contenuPlainteTextarea
          ? contenuPlainteTextarea.value
          : null;
        delai_reponse = delaiReponseInput ? delaiReponseInput.value : null;

        console.log("=== DEBUG PLAINTE ===");
        console.log("contenuPlainteTextarea:", contenuPlainteTextarea);
        console.log("delaiReponseInput:", delaiReponseInput);
        console.log("contenu_plainte:", contenu_plainte);
        console.log("delai_reponse:", delai_reponse);
      }

      // Récupérer les données de représentation pour l'étape "تقديم تمثيل"
      let resume_contenu = null;
      let date_soumission = null;

      if (etape.libelle_ar === "تقديم تمثيل") {
        const resumeContenuTextarea = document.getElementById(
          `resume-contenu-etape_${index}`,
        );
        const dateSoumissionInput = document.getElementById(
          `date-soumission-etape_${index}`,
        );

        resume_contenu = resumeContenuTextarea
          ? resumeContenuTextarea.value
          : null;
        date_soumission = dateSoumissionInput
          ? dateSoumissionInput.value
          : null;

        console.log("=== DEBUG REPRESENTATION FRONTEND ===");
        console.log("resume_contenu:", resume_contenu);
        console.log("date_soumission:", date_soumission);
      }

      // Récupérer les données de délibération
      const typeDeliberationRadios = document.querySelectorAll(
        `input[name="type-deliberation-${index}"]`,
      );
      let typeDeliberation = null;
      typeDeliberationRadios.forEach((radio) => {
        if (radio.checked) {
          typeDeliberation = radio.value;
        }
      });

      // Récupérer les détails selon le type de délibération
      let typeIntervention = null;
      let intervenant = null;

      if (typeDeliberation === "inspection") {
        const typeInterventionSelect = document.getElementById(
          `type-intervention-${index}`,
        );
        const intervenantSelect = document.getElementById(
          `intervenant-inspection-${index}`,
        );

        typeIntervention = typeInterventionSelect
          ? typeInterventionSelect.value
          : null;
        intervenant = intervenantSelect ? intervenantSelect.value : null;
      } else if (typeDeliberation === "expertise") {
        const typeExpertiseSelect = document.getElementById(
          `type-expertise-${index}`,
        );
        const expertSelect = document.getElementById(
          `expert-selection-${index}`,
        );

        typeIntervention = typeExpertiseSelect
          ? typeExpertiseSelect.value
          : null;
        intervenant = expertSelect ? expertSelect.value : null;
      }

      // Récupérer les conclusions définitives pour l'étape "مداولة"
      let conclusion_definitives = null;
      if (etape.libelle_ar === "مداولة") {
        const conclusionDefinitivesTextarea = document.getElementById(
          `conclusion-definitives-${index}`,
        );
        conclusion_definitives = conclusionDefinitivesTextarea
          ? conclusionDefinitivesTextarea.value
          : null;
      }

      // Récupérer les données de réponse pour l'étape "رد على المقال"
      let resume_reponse = null;
      if (etape.libelle_ar === "رد على المقال") {
        const resumeReponseTextarea = document.getElementById(
          `resume-reponse-etape_${index}`,
        );
        resume_reponse = resumeReponseTextarea
          ? resumeReponseTextarea.value
          : null;

        console.log("=== DEBUG REPONSE FRONTEND ===");
        console.log("resume_reponse:", resume_reponse);
      }

      // Récupérer les données de plainte pénale pour l'étape "شكاية"
      let resume_faits = null;
      let plainte_pdf = null;
      let docs_supplementaires = null;
      let temoins_a_ajouter = [];

      if (etape.libelle_ar === "شكاية") {
        const resumeFaitsTextarea = document.getElementById(
          `resume-faits-etape_${index}`,
        );
        const plaintePdfInput = document.getElementById(
          `plainte-pdf-etape_${index}`,
        );
        const docsSupplementairesInput = document.getElementById(
          `docs-supplementaires-etape_${index}`,
        );

        resume_faits = resumeFaitsTextarea ? resumeFaitsTextarea.value : null;
        plainte_pdf = plaintePdfInput ? plaintePdfInput.files[0] : null;
        docs_supplementaires = docsSupplementairesInput
          ? docsSupplementairesInput.files
          : null;

        // Récupérer les témoins ajoutés visuellement
        const listeTemoins = document.getElementById(`liste-temoins-${index}`);
        if (listeTemoins) {
          const temoinsElements =
            listeTemoins.querySelectorAll('div[id^="temoin-"]');
          temoins_a_ajouter = Array.from(temoinsElements).map((element) => {
            const temoinId = element.id.replace("temoin-", "");
            return temoinId;
          });
        }

        console.log("=== DEBUG PLAINTE PENALE FRONTEND ===");
        console.log("resume_faits:", resume_faits);
        console.log("plainte_pdf:", plainte_pdf);
        console.log("docs_supplementaires:", docs_supplementaires);
        console.log("temoins_a_ajouter:", temoins_a_ajouter);
      }

      // Récupérer les données des étapes pénales de la phase PROCÉDURE
      // 1. Étape "التحقيق الأولي" (Enquête préliminaire)
      let enquete_effectuee = null;
      let observations_enquete = null;

      if (etape.libelle_ar === "التحقيق الأولي") {
        const enqueteEffectueeCheckbox = document.getElementById(
          `enquete-effectuee-${index}`,
        );
        const observationsEnqueteTextarea = document.getElementById(
          `observations-enquete-${index}`,
        );

        enquete_effectuee = enqueteEffectueeCheckbox
          ? enqueteEffectueeCheckbox.checked
          : false;
        observations_enquete = observationsEnqueteTextarea
          ? observationsEnqueteTextarea.value
          : null;

        console.log("=== DEBUG ENQUÊTE PRÉLIMINAIRE FRONTEND ===");
        console.log("enquete_effectuee:", enquete_effectuee);
        console.log("observations_enquete:", observations_enquete);
      }

      // 2. Étape "قرار النيابة العامة" (Décision du parquet)
      let type_decision = null;
      let tribunal_competent_id = null;
      let observations_decision = null;
      let decision_officielle_pdf = null;

      if (etape.libelle_ar === "قرار النيابة العامة") {
        const typeDecisionRadios = document.querySelectorAll(
          `input[name="type-decision-${index}"]`,
        );
        const tribunalCompetentSelect = document.getElementById(
          `tribunal-competent-${index}`,
        );
        const observationsDecisionTextarea = document.getElementById(
          `observations-decision-${index}`,
        );
        const decisionOfficiellePdfInput = document.getElementById(
          `decision-officielle-pdf-${index}`,
        );

        // Récupérer le type de décision sélectionné
        typeDecisionRadios.forEach((radio) => {
          if (radio.checked) {
            type_decision = radio.value;
          }
        });

        tribunal_competent_id = tribunalCompetentSelect
          ? tribunalCompetentSelect.value
          : null;
        observations_decision = observationsDecisionTextarea
          ? observationsDecisionTextarea.value
          : null;
        decision_officielle_pdf = decisionOfficiellePdfInput
          ? decisionOfficiellePdfInput.files[0]
          : null;

        console.log("=== DEBUG DÉCISION DU PARQUET FRONTEND ===");
        console.log("type_decision:", type_decision);
        console.log("tribunal_competent_id:", tribunal_competent_id);
        console.log("observations_decision:", observations_decision);
        console.log("decision_officielle_pdf:", decision_officielle_pdf);
      }

      // 3. Étape "جلسة المحاكمة" (Audience pénale)
      let date_audience_penale = null;
      let heure_audience_penale = null;
      let tribunal_audience_penale_id = null;
      let plaignant_present = null;
      let accuse_present = null;
      let avocat_present = null;
      let ministere_public_present = null;
      let temoins_a_ajouter_audience = [];
      let compte_rendu_audience_pdf = null;
      let observations_audience = null;

      if (etape.libelle_ar === "جلسة المحاكمة") {
        const dateAudiencePenaleInput = document.getElementById(
          `date-audience-penale-${index}`,
        );
        const heureAudiencePenaleInput = document.getElementById(
          `heure-audience-penale-${index}`,
        );
        const tribunalAudiencePenaleSelect = document.getElementById(
          `tribunal-audience-penale-${index}`,
        );
        const plaignantPresentCheckbox = document.getElementById(
          `plaignant-present-${index}`,
        );
        const accusePresentCheckbox = document.getElementById(
          `accuse-present-${index}`,
        );
        const avocatPresentCheckbox = document.getElementById(
          `avocat-present-${index}`,
        );
        const ministerePublicPresentCheckbox = document.getElementById(
          `ministere-public-present-${index}`,
        );
        const compteRenduAudiencePdfInput = document.getElementById(
          `compte-rendu-audience-${index}`,
        );
        const observationsAudienceTextarea = document.getElementById(
          `observations-etape_${index}`,
        );

        date_audience_penale = dateAudiencePenaleInput
          ? dateAudiencePenaleInput.value
          : null;
        heure_audience_penale = heureAudiencePenaleInput
          ? heureAudiencePenaleInput.value
          : null;
        tribunal_audience_penale_id = tribunalAudiencePenaleSelect
          ? tribunalAudiencePenaleSelect.value
          : null;
        plaignant_present = plaignantPresentCheckbox
          ? plaignantPresentCheckbox.checked
          : false;
        accuse_present = accusePresentCheckbox
          ? accusePresentCheckbox.checked
          : false;
        avocat_present = avocatPresentCheckbox
          ? avocatPresentCheckbox.checked
          : false;
        ministere_public_present = ministerePublicPresentCheckbox
          ? ministerePublicPresentCheckbox.checked
          : false;
        compte_rendu_audience_pdf = compteRenduAudiencePdfInput
          ? compteRenduAudiencePdfInput.files[0]
          : null;
        observations_audience = observationsAudienceTextarea
          ? observationsAudienceTextarea.value
          : null;

        // Récupérer les témoins de l'audience pénale
        const sectionTemoins = document.getElementById(
          `section-temoins-${index}`,
        );
        if (sectionTemoins && sectionTemoins.style.display !== "none") {
          const listeTemoins = document.getElementById(
            `liste-temoins-${index}`,
          );
          if (listeTemoins) {
            const temoinsElements =
              listeTemoins.querySelectorAll("[data-temoin-id]");
            temoins_a_ajouter_audience = Array.from(temoinsElements).map(
              (element) => {
                const temoinId = element.getAttribute("data-temoin-id");
                return temoinId;
              },
            );
          }
        }

        console.log("=== DEBUG AUDIENCE PÉNALE FRONTEND ===");
        console.log("date_audience_penale:", date_audience_penale);
        console.log("heure_audience_penale:", heure_audience_penale);
        console.log(
          "tribunal_audience_penale_id:",
          tribunal_audience_penale_id,
        );
        console.log(
          "Présence - Plaignant:",
          plaignant_present,
          "Accusé:",
          accuse_present,
          "Avocat:",
          avocat_present,
          "Ministère public:",
          ministere_public_present,
        );
        console.log("temoins_a_ajouter_audience:", temoins_a_ajouter_audience);
        console.log("compte_rendu_audience_pdf:", compte_rendu_audience_pdf);
        console.log("observations_audience:", observations_audience);
      }

      console.log("Données récupérées:", {
        type_avertissement_id,
        type_demande_id,
        delai_legal,
        observations,
        selectedHuissier,
        selectedOpposant,
        typeDeliberation,
        typeIntervention,
        intervenant,
        tribunal_id,
        date_audience,
        heure_audience,
        contenu_plainte,
        delai_reponse,
        resume_contenu,
        date_soumission,
        conclusion_definitives,
        resume_reponse,
        resume_faits,
        plainte_pdf,
        docs_supplementaires,
        temoins_a_ajouter,
        //  données des étapes pénales
        enquete_effectuee,
        observations_enquete,
        type_decision,
        tribunal_competent_id,
        observations_decision,
        decision_officielle_pdf,
        date_audience_penale,
        heure_audience_penale,
        tribunal_audience_penale_id,
        plaignant_present,
        accuse_present,
        avocat_present,
        ministere_public_present,
        temoins_a_ajouter_audience,
        compte_rendu_audience_pdf,
        observations_audience,
      });

      // Créer FormData pour envoyer les données avec les fichiers
      const formData = new FormData();

      // Ajouter les données de base
      formData.append("observations", observations || "");
      if (selectedHuissier) formData.append("huissier_id", selectedHuissier);
      if (selectedOpposant) formData.append("opposant_id", selectedOpposant);
      if (date_effective) formData.append("date_effective", date_effective);
      if (type_avertissement_id)
        formData.append("type_avertissement_id", type_avertissement_id);
      if (type_demande_id) formData.append("type_demande_id", type_demande_id);
      if (delai_legal) formData.append("delai_legal", delai_legal);
      if (avocat_demandeur_nom)
        formData.append("avocat_demandeur_nom", avocat_demandeur_nom);

      // Ajouter les données d'audience
      if (tribunal_id) formData.append("tribunal_id", tribunal_id);
      if (date_audience) formData.append("date_audience", date_audience);
      if (heure_audience) formData.append("heure_audience", heure_audience);

      // Ajouter les données de plainte
      if (contenu_plainte) formData.append("contenu_plainte", contenu_plainte);
      if (delai_reponse) formData.append("delai_reponse", delai_reponse);

      // Ajouter les données de représentation
      if (resume_contenu) formData.append("resume_contenu", resume_contenu);
      if (date_soumission) formData.append("date_soumission", date_soumission);

      // Ajouter les données de délibération
      if (conclusion_definitives)
        formData.append("conclusion_definitives", conclusion_definitives);

      // Ajouter les données de réponse
      if (resume_reponse) formData.append("resume_reponse", resume_reponse);

      // Ajouter les données de plainte pénale
      if (resume_faits) formData.append("resume_faits", resume_faits);
      if (plainte_pdf) formData.append("plainte_pdf", plainte_pdf);
      if (docs_supplementaires) {
        for (let i = 0; i < docs_supplementaires.length; i++) {
          formData.append("docs_supplementaires", docs_supplementaires[i]);
        }
      }
      if (temoins_a_ajouter && temoins_a_ajouter.length > 0) {
        formData.append("temoins_a_ajouter", JSON.stringify(temoins_a_ajouter));
      }

      // Ajouter les données des étapes pénales de la phase PROCÉDURE
      if (enquete_effectuee !== null)
        formData.append("enquete_effectuee", enquete_effectuee);
      if (observations_enquete)
        formData.append("observations_enquete", observations_enquete);

      if (type_decision) formData.append("type_decision", type_decision);
      if (tribunal_competent_id)
        formData.append("tribunal_competent_id", tribunal_competent_id);
      if (observations_decision)
        formData.append("observations_decision", observations_decision);
      if (decision_officielle_pdf)
        formData.append("decision_officielle_pdf", decision_officielle_pdf);

      if (date_audience_penale)
        formData.append("date_audience_penale", date_audience_penale);
      if (heure_audience_penale)
        formData.append("heure_audience_penale", heure_audience_penale);
      if (tribunal_audience_penale_id)
        formData.append(
          "tribunal_audience_penale_id",
          tribunal_audience_penale_id,
        );
      if (plaignant_present !== null)
        formData.append("plaignant_present", plaignant_present);
      if (accuse_present !== null)
        formData.append("accuse_present", accuse_present);
      if (avocat_present !== null)
        formData.append("avocat_present", avocat_present);
      if (ministere_public_present !== null)
        formData.append("ministere_public_present", ministere_public_present);
      if (temoins_a_ajouter_audience && temoins_a_ajouter_audience.length > 0) {
        formData.append(
          "temoins_a_ajouter",
          JSON.stringify(temoins_a_ajouter_audience),
        );
      }
      if (compte_rendu_audience_pdf)
        formData.append("compte_rendu_audience_pdf", compte_rendu_audience_pdf);
      if (observations_audience)
        formData.append("observations_audience", observations_audience);

      // Debug de l'URL de l'API
      const etapeId = etape.id || `etape_${index}`;
      const apiUrl = `affaires/${affaireId}/etapes/${etapeId}/completer/`;
      console.log("=== DEBUG APPEL API ===");
      console.log("Affaire ID:", affaireId);
      console.log("Étape ID:", etapeId);
      console.log("URL API:", apiUrl);
      console.log("FormData contenu:", Array.from(formData.entries()));

      //  l'API pour compléter l'étape
      const response = await api.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Sauvegarder les participations selon le type de délibération
      if (typeDeliberation && typeIntervention && intervenant) {
        const etapeId = etape.id || `etape_${index}`;
        const dateIntervention = new Date().toISOString().split("T")[0];

        try {
          // Vérifier si l'étape existe, sinon la créer
          let etapeExists = true;
          try {
            await api.get(`etapejudiciaires/${etapeId}/`);
          } catch (etapeError) {
            if (etapeError.response && etapeError.response.status === 404) {
              etapeExists = false;
            }
          }

          if (!etapeExists) {
            // Créer l'étape si elle n'existe pas
            const etapeData = {
              idetape: etapeId,
              datedebut: new Date().toISOString().split("T")[0],
              idaffaire: affaireId,
              ordre_etape: index,
              etape_obligatoire: true,
            };
            console.log("Création de l'étape avec données:", etapeData);
            await api.post("etapejudiciaires/", etapeData);
            console.log("Étape créée:", etapeId);
          } else {
            console.log("Étape existe déjà:", etapeId);
          }

          // Fonction pour créer ou récupérer le type d'intervention
          const getOrCreateTypeIntervention = async (libelleType) => {
            try {
              // D'abord essayer de récupérer le type existant
              const typesResponse = await api.get("typeinterventions/");
              const existingType = typesResponse.data.find(
                (t) =>
                  (t.libelletypeintervention || '').toLowerCase() ===
                  (libelleType || '').toLowerCase(),
              );

              if (existingType) {
                return existingType.idtypeintervention;
              }

              // Si pas trouvé, créer un nouveau type
              const newTypeResponse = await api.post(
                "typeinterventions/",
                {
                  libelletypeintervention: libelleType,
                },
              );
              return newTypeResponse.data.idtypeintervention;
            } catch (error) {
              console.error(
                "Erreur lors de la gestion du type d'intervention:",
                error,
              );
              console.log("Continuer sans type d'intervention");
              return null;
            }
          };

          //   créer le type d'intervention
          const typeInterventionId =
            await getOrCreateTypeIntervention(typeIntervention);
          console.log("Type d'intervention ID:", typeInterventionId);

          if (intervenant === "huissier" && selectedHuissier) {
            // Créer participation huissier
            const participationData = {
              idetape: etapeId,
              idhuissier: selectedHuissier,
              dateintervention: dateIntervention,
            };

            // Ajouter le type d'intervention seulement s'il existe
            if (typeInterventionId) {
              participationData.idtypeintervention = typeInterventionId;
            }

            console.log("Données participation huissier:", participationData);
            await api.post(
              "participationhuissieretapes/",
              participationData,
            );
            console.log(
              "Participation huissier créée avec type d'intervention:",
              typeIntervention,
            );
          } else if (intervenant === "expert") {
            // Récupérer les experts disponibles
            try {
              const expertsResponse = await api.get("experts/");
              const experts = expertsResponse.data;
              console.log("Experts disponibles:", experts);

              if (experts && experts.length > 0) {
                const expertId = experts[0].idexpert; //  le premier expert disponible
                const participationData = {
                  idetape: etapeId,
                  idexpert: expertId,
                  dateintervention: dateIntervention,
                };

                if (typeInterventionId) {
                  participationData.idtypeintervention = typeInterventionId;
                }

                console.log("Données participation expert:", participationData);
                await api.post(
                  "participationexpertetapes/",
                  participationData,
                );
                console.log(
                  "Participation expert créée avec type d'intervention:",
                  typeIntervention,
                );
              } else {
                console.warn("Aucun expert disponible en base de données");
              }
            } catch (expertsError) {
              console.error(
                "Erreur lors de la récupération des experts:",
                expertsError,
              );
            }
          } else if (intervenant === "enqueteur") {
            //  l'enquêteur par huissier
            if (selectedHuissier) {
              const participationData = {
                idetape: etapeId,
                idhuissier: selectedHuissier,
                dateintervention: dateIntervention,
              };

              if (typeInterventionId) {
                participationData.idtypeintervention = typeInterventionId;
              }

              console.log(
                "Données participation enquêteur (huissier):",
                participationData,
              );
              await api.post(
                "participationhuissieretapes/",
                participationData,
              );
              console.log(
                "Participation enquêteur créée avec type d'intervention:",
                typeIntervention,
              );
            } else {
              console.warn("Aucun huissier sélectionné pour l'enquêteur");
            }
          }
        } catch (participationError) {
          console.error(
            "Erreur lors de la création de la participation:",
            participationError,
          );
          if (participationError.response) {
            console.error(
              "Détails de l'erreur:",
              participationError.response.data,
            );
          }
        }
      }

      if (response.status === 200) {
        console.log("Étape complétée avec succès en backend");

        // Créer l'étape terminée pour l'affichage
        const etapeTerminee = {
          ...etape,
          terminee: true,
          date_terminaison: new Date().toISOString(),
          observations: observations,
        };

        // Ajouter à la liste des étapes terminées
        setEtapesTerminees((prev) => [...prev, etapeTerminee]);

        // Marquer l'étape comme terminée dans la liste principale
        setEtapesPhase((prev) =>
          prev.map((e, i) => (i === index ? { ...e, terminee: true } : e)),
        );

        console.log("Étape marquée comme terminée");
      }
    } catch (e) {
      console.error("Erreur lors de la complétion de l'étape:", e);
      if (e.response) {
        console.error(
          `Erreur ${e.response.status}: Impossible de compléter l'étape - ${e.response.data?.message || e.response.statusText}`,
        );
      } else if (e.request) {
        console.error("Erreur de connexion: Impossible de compléter l'étape");
      } else {
        console.error(
          "Erreur inattendue lors de la complétion de l'étape:",
          e.message,
        );
      }
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 16,
        padding: 16,
        background: etape.terminee
          ? "#e8f5e8"
          : isOptionnelle
            ? "#fff3cd"
            : "#e3f2fd",
        borderRadius: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <h5
          style={{
            margin: "0 0 8px 0",
            color: etape.terminee ? "#2e7d32" : "#1a237e",
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          {etape.terminee ? "✅ " : ""}
          {etape.libelle_ar}
        </h5>

        {isOptionnelle && !estAutoAffichage && (
          <label
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <input
              type="checkbox"
              checked={etapesOptionnelles.includes(index)}
              onChange={(e) => toggleEtapeOptionnelle(index, e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontSize: 14, color: "#666" }}>
              Appliquer cette étape
            </span>
          </label>
        )}

        {estAppliquee && (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: "#fff",
              borderRadius: 6,
              border: "1px solid #e0e0e0",
            }}
          >
            {/* Étape 0 - type d'avertissement (Phase Initiale) - Masquée pour les affaires pénales */}
            {phase === "INITIALE" && index === 0 && !isAffairePenale && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Type d'avertissement:</label>
                    <select
                      id={`type-avertissement-etape_${index}`}
                      style={selectStyle}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const type = typesAvertissement.find(
                          (t) =>
                            String(t.idTypeAvertissement) ===
                            String(selectedId),
                        );
                        const delaiInput = document.getElementById(
                          `delai-legal-etape_${index}`,
                        );
                        if (type && delaiInput) {
                          delaiInput.value = type.delai_legal ?? "";
                        }
                        // recalcul date limite si date réception remplie
                        const dateReceptionInput = document.getElementById(
                          `date-reception-etape_${index}`,
                        );
                        const dateLimiteInput = document.getElementById(
                          `date-limite-etape_${index}`,
                        );
                        if (
                          dateReceptionInput &&
                          dateReceptionInput.value &&
                          delaiInput &&
                          dateLimiteInput
                        ) {
                          const base = new Date(dateReceptionInput.value);
                          const delai = parseInt(delaiInput.value || "0", 10);
                          if (!isNaN(base.getTime())) {
                            const d = new Date(base);
                            d.setDate(d.getDate() + (isNaN(delai) ? 0 : delai));
                            dateLimiteInput.value = d
                              .toISOString()
                              .split("T")[0];
                          }
                        }
                      }}
                    >
                      <option value="">
                        Sélectionner un type d'avertissement
                      </option>
                      {typesAvertissement.map((type) => (
                        <option
                          key={type.idTypeAvertissement}
                          value={type.idTypeAvertissement}
                        >
                          {type.libelle} - {type.libelle_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <label style={labelStyle}>Délai légal (jours):</label>
                    <input
                      type="number"
                      id={`delai-legal-etape_${index}`}
                      placeholder="15"
                      style={inputStyle}
                      onChange={(e) => {
                        const dateReceptionInput = document.getElementById(
                          `date-reception-etape_${index}`,
                        );
                        const dateLimiteInput = document.getElementById(
                          `date-limite-etape_${index}`,
                        );
                        if (
                          dateReceptionInput &&
                          dateReceptionInput.value &&
                          dateLimiteInput
                        ) {
                          const base = new Date(dateReceptionInput.value);
                          const delai = parseInt(e.target.value || "0", 10);
                          if (!isNaN(base.getTime())) {
                            const d = new Date(base);
                            d.setDate(d.getDate() + (isNaN(delai) ? 0 : delai));
                            dateLimiteInput.value = d
                              .toISOString()
                              .split("T")[0];
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Avocat du demandeur et dates */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    marginTop: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <label style={labelStyle}>Avocat du demandeur:</label>
                    <input
                      type="text"
                      id={`avocat-demandeur-etape_${index}`}
                      placeholder="Saisir le nom de l'avocat"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Date de réception:</label>
                    <input
                      type="date"
                      id={`date-reception-etape_${index}`}
                      style={inputStyle}
                      onChange={(e) => {
                        const delaiInput = document.getElementById(
                          `delai-legal-etape_${index}`,
                        );
                        const dateLimiteInput = document.getElementById(
                          `date-limite-etape_${index}`,
                        );
                        if (delaiInput && dateLimiteInput) {
                          const base = new Date(e.target.value);
                          const delai = parseInt(delaiInput.value || "0", 10);
                          if (!isNaN(base.getTime())) {
                            const d = new Date(base);
                            d.setDate(d.getDate() + (isNaN(delai) ? 0 : delai));
                            dateLimiteInput.value = d
                              .toISOString()
                              .split("T")[0];
                          }
                        }
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Date limite:</label>
                    <input
                      type="date"
                      id={`date-limite-etape_${index}`}
                      style={{ ...inputStyle, background: "#f5f5f5" }}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape 2 - type de demande (Phase Initiale) - SANS notification */}
            {/* Supprimé pour l'étape "استدعاء للمثول" - garder seulement la programmation d'audience */}
            {/* Masquée pour les affaires pénales */}
            {phase === "INITIALE" &&
              index === 2 &&
              etape.libelle_ar !== "استدعاء للمثول" &&
              !isAffairePenale && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Type de demande:</label>
                    <select
                      id={`type-demande-etape_${index}`}
                      style={selectStyle}
                    >
                      <option value="">Sélectionner un type de demande</option>
                      {typesDemande.map((type) => (
                        <option
                          key={type.idTypeDemande}
                          value={type.idTypeDemande}
                        >
                          {type.libelle} - {type.libelle_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <label style={labelStyle}>Délai légal (jours):</label>
                    <input
                      type="number"
                      id={`delai-legal-etape_${index}`}
                      placeholder="60"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

            {/* Champs Documents requis & description */}

            {/* Étape spécifique "استدعاء للمثول" - Convocation à comparaître - Masquée pour les affaires pénales */}
            {etape.libelle_ar === "استدعاء للمثول" && !isAffairePenale && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#e8f5e8",
                  borderRadius: 6,
                  border: "1px solid #4caf50",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#2e7d32",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  ️ Programmation de l'audience
                </h6>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  {/* Sélection de ville */}
                  {villesDisponibles.length > 0 && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={labelStyle}>Ville:</label>
                      <select
                        style={selectStyle}
                        value={villeSelectionnee}
                        onChange={(e) => setVilleSelectionnee(e.target.value)}
                      >
                        <option value="">
                          Toutes les villes ({villesDisponibles.length})
                        </option>
                        {villesDisponibles.map((ville) => (
                          <option key={ville} value={ville}>
                            {ville}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Tribunal:</label>
                    <select
                      id={`tribunal-audience-etape_${index}`}
                      style={selectStyle}
                      value={tribunalSelectionne || ""}
                      onChange={(e) =>
                        setTribunalSelectionne(e.target.value || null)
                      }
                    >
                      <option value="">Sélectionner un tribunal</option>
                      {tribunaux
                        .filter(
                          (tribunal) =>
                            !villeSelectionnee ||
                            tribunal.villetribunal === villeSelectionnee,
                        )
                        .map((tribunal) => (
                          <option
                            key={tribunal.idtribunal}
                            value={tribunal.idtribunal}
                          >
                            {tribunal.nomtribunal} - {tribunal.villetribunal}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Date d'audience:</label>
                    <input
                      type="date"
                      id={`date-audience-etape_${index}`}
                      style={inputStyle}
                      value={dateAudience}
                      onChange={(e) => setDateAudience(e.target.value)}
                    />
                  </div>

                  <div style={{ minWidth: 150 }}>
                    <label style={labelStyle}>Heure d'audience:</label>
                    <input
                      type="time"
                      id={`heure-audience-etape_${index}`}
                      style={inputStyle}
                      value={heureAudience}
                      onChange={(e) => setHeureAudience(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape spécifique "شكاية" - Dépôt de plainte pénale */}
            {etape.libelle_ar === "شكاية" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#ffebee",
                  borderRadius: 6,
                  border: "1px solid #f44336",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#c62828",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  🚨 Dépôt de plainte pénale
                </h6>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Résumé des faits:</label>
                  <textarea
                    id={`resume-faits-etape_${index}`}
                    placeholder="Décrivez les faits qui ont motivé la plainte..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "100px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Section Gestion des témoins */}
                <div style={{ marginBottom: 16 }}>
                  <h6
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 13,
                      color: "#c62828",
                    }}
                  >
                    Gestion des témoins
                  </h6>

                  <div style={{ marginBottom: 12 }}>
                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`temoins-plainte-${index}`}
                        value="aucun"
                        defaultChecked
                        onChange={(e) =>
                          gererChampsTemoinsProp(index, e.target.value)
                        }
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Aucun témoin</span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`temoins-plainte-${index}`}
                        value="temoins"
                        onChange={(e) =>
                          gererChampsTemoinsProp(index, e.target.value)
                        }
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Témoins présents</span>
                    </label>
                  </div>

                  <div
                    id={`section-temoins-${index}`}
                    style={{ display: "none", marginTop: 12 }}
                  >
                    <h6
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 13,
                        color: "#c62828",
                      }}
                    >
                      Ajouter des témoins
                    </h6>

                    <div
                      id={`liste-temoins-${index}`}
                      style={{ marginBottom: 12 }}
                    >
                      {/* Témoins ajoutés dynamiquement ici */}
                    </div>

                    <div
                      style={{
                        padding: 12,
                        background: "#fff5f5",
                        borderRadius: 4,
                        border: "1px solid #ffcdd2",
                      }}
                    >
                      <h6
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: 12,
                          color: "#c62828",
                        }}
                      >
                        Nouveau témoin
                      </h6>
                      <div
                        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Nom complet:</label>
                          <input
                            type="text"
                            id={`nom-temoin-${index}`}
                            placeholder="Nom et prénom"
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Rôle:</label>
                          <select
                            id={`role-temoin-${index}`}
                            style={selectStyle}
                          >
                            <option value="">Sélectionner le rôle</option>
                            <option value="témoin_principal">
                              Témoin principal
                            </option>
                            <option value="témoin_secondaire">
                              Témoin secondaire
                            </option>
                            <option value="expert">Expert</option>
                            <option value="témoin_technique">
                              Témoin technique
                            </option>
                            <option value="témoin_moral">Témoin moral</option>
                            <option value="témoin_audition">
                              Témoin d'audition
                            </option>
                          </select>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Adresse:</label>
                          <textarea
                            id={`adresse-temoin-${index}`}
                            placeholder="Adresse complète"
                            rows={2}
                            style={textareaStyle}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Téléphone:</label>
                          <input
                            type="tel"
                            id={`telephone-temoin-${index}`}
                            placeholder="Numéro de téléphone"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => ajouterTemoinProp(index)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#c62828",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          + Ajouter le témoin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Plainte officielle (PDF):</label>
                  <input
                    type="file"
                    id={`plainte-pdf-etape_${index}`}
                    accept=".pdf"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  />
                  <small style={{ color: "#666", fontSize: 12 }}>
                    * Document obligatoire
                  </small>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Documents supplémentaires:</label>
                  <input
                    type="file"
                    id={`docs-supplementaires-etape_${index}`}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    multiple
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  />
                  <small style={{ color: "#666", fontSize: 12 }}>
                    Photos, vidéos, témoignages, etc.
                  </small>
                </div>

                {/* Champ Observations pour l'étape pénale */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #e0e0e0",
                  }}
                >
                  <label style={labelStyle}>Observations:</label>
                  <textarea
                    id={`observations-etape_${index}`}
                    placeholder="Notes internes pour l'avocat..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "80px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Bouton Terminer l'étape pour l'étape pénale */}
                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={onTerminerEtape}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#c62828",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    Terminer l'étape
                  </button>
                </div>
              </div>
            )}

            {/* Étape spécifique "رد على المقال" - Réponse à la requête - Masquée pour les affaires pénales */}
            {etape.libelle_ar === "رد على المقال" && !isAffairePenale && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#f3e5f5",
                  borderRadius: 6,
                  border: "1px solid #9c27b0",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#6a1b9a",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Réponse à la requête
                </h6>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <label style={labelStyle}>Résumé de la réponse:</label>
                    <textarea
                      id={`resume-reponse-etape_${index}`}
                      placeholder="Résumé bref de la réponse..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 4,
                        fontSize: 14,
                        resize: "vertical",
                        minHeight: "80px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape spécifique "تقديم تمثيل" - Soumission d'une représentation - Masquée pour les affaires pénales */}
            {etape.libelle_ar === "تقديم تمثيل" && !isAffairePenale && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#e3f2fd",
                  borderRadius: 6,
                  border: "1px solid #2196f3",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1565c0",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Soumission d'une représentation
                </h6>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <label style={labelStyle}>Résumé du contenu:</label>
                    <textarea
                      id={`resume-contenu-etape_${index}`}
                      placeholder="Résumé bref du contenu de la représentation..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 4,
                        fontSize: 14,
                        resize: "vertical",
                        minHeight: "80px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Date de soumission:</label>
                    <input
                      type="date"
                      id={`date-soumission-etape_${index}`}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape spécifique "استلام شكاية" - Réception de plainte - Masquée pour les affaires pénales */}
            {etape.libelle_ar === "استلام شكاية" && !isAffairePenale && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#fff3e0",
                  borderRadius: 6,
                  border: "1px solid #ff9800",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#e65100",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Réception de plainte
                </h6>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <label style={labelStyle}>
                      Contenu de la plainte (résumé):
                    </label>
                    <textarea
                      id={`contenu-plainte-etape_${index}`}
                      placeholder="Résumé du contenu de la plainte reçue..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        borderRadius: 4,
                        fontSize: 14,
                        resize: "vertical",
                        minHeight: "80px",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Délai de réponse:</label>
                    <input
                      type="date"
                      id={`delai-reponse-etape_${index}`}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Étape spécifique "التحقيق الأولي" - Enquête préliminaire */}
            {etape.libelle_ar === "التحقيق الأولي" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#fff3e0",
                  borderRadius: 6,
                  border: "1px solid #ff9800",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#e65100",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  🔍 Enquête préliminaire
                </h6>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    <input
                      type="checkbox"
                      id={`enquete-effectuee-${index}`}
                      style={{ marginRight: 8 }}
                    />
                    Enquête préliminaire effectuée
                  </label>
                </div>

                {/* Champ Observations pour l'étape d'enquête */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #e0e0e0",
                  }}
                >
                  <label style={labelStyle}>Observations:</label>
                  <textarea
                    id={`observations-etape_${index}`}
                    placeholder="Notes sur l'enquête préliminaire..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "80px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Bouton Terminer l'étape pour l'enquête */}
                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={onTerminerEtape}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    Terminer l'étape
                  </button>
                </div>
              </div>
            )}

            {/* Étape spécifique "قرار النيابة العامة" - Décision du parquet */}
            {etape.libelle_ar === "قرار النيابة العامة" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#e8f5e8",
                  borderRadius: 6,
                  border: "1px solid #4caf50",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#2e7d32",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  ⚖️ Décision du parquet
                </h6>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Type de décision:</label>
                  <div style={{ marginTop: 8 }}>
                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`decision-parquet-${index}`}
                        value="classement_sans_suite"
                        onChange={(e) => {
                          const tribunalDiv = document.getElementById(
                            `tribunal-section-${index}`,
                          );
                          if (tribunalDiv) {
                            tribunalDiv.style.display =
                              e.target.value === "poursuite" ? "block" : "none";
                          }
                        }}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>
                        Classement sans suite (إذا لم تتوفر أدلة كافية)
                      </span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`decision-parquet-${index}`}
                        value="poursuite"
                        onChange={(e) => {
                          const tribunalDiv = document.getElementById(
                            `tribunal-section-${index}`,
                          );
                          if (tribunalDiv) {
                            tribunalDiv.style.display =
                              e.target.value === "poursuite" ? "block" : "none";
                          }
                        }}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>
                        Poursuite devant le tribunal compétent
                      </span>
                    </label>
                  </div>
                </div>

                <div
                  id={`tribunal-section-${index}`}
                  style={{ display: "none", marginBottom: 16 }}
                >
                  <label style={labelStyle}>Tribunal compétent:</label>
                  <select
                    id={`tribunal-competent-${index}`}
                    style={selectStyle}
                  >
                    <option value="">Sélectionner un tribunal</option>
                    {tribunaux.map((tribunal) => (
                      <option
                        key={tribunal.idtribunal}
                        value={tribunal.idtribunal}
                      >
                        {tribunal.nomtribunal} - {tribunal.villetribunal}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Décision officielle (PDF):</label>
                  <input
                    type="file"
                    id={`decision-officielle-${index}`}
                    accept=".pdf"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  />
                  <small style={{ color: "#666", fontSize: 12 }}>
                    * Document obligatoire
                  </small>
                </div>

                {/* Champ Observations pour la décision du parquet */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #e0e0e0",
                  }}
                >
                  <label style={labelStyle}>Observations:</label>
                  <textarea
                    id={`observations-etape_${index}`}
                    placeholder="Notes sur la décision du parquet..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "80px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Bouton Terminer l'étape pour la décision du parquet */}
                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={onTerminerEtape}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    Terminer l'étape
                  </button>
                </div>
              </div>
            )}

            {/* Étape spécifique "جلسة المحاكمة" - Audience pénale */}
            {etape.libelle_ar === "جلسة المحاكمة" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#f3e5f5",
                  borderRadius: 6,
                  border: "1px solid #9c27b0",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#6a1b9a",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  🏛️ Audience pénale
                </h6>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Date d'audience:</label>
                    <input
                      type="date"
                      id={`date-audience-penale-${index}`}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>Heure d'audience:</label>
                    <input
                      type="time"
                      id={`heure-audience-penale-${index}`}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Tribunal:</label>
                  <select
                    id={`tribunal-audience-penale-${index}`}
                    style={selectStyle}
                  >
                    <option value="">Sélectionner un tribunal</option>
                    {tribunaux.map((tribunal) => (
                      <option
                        key={tribunal.idtribunal}
                        value={tribunal.idtribunal}
                      >
                        {tribunal.nomtribunal} - {tribunal.villetribunal}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Présence des parties:</label>
                  <div style={{ marginTop: 8 }}>
                    <label style={radioLabelStyle}>
                      <input
                        type="checkbox"
                        id={`plaignant-present-${index}`}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Plaignant présent</span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="checkbox"
                        id={`accuse-present-${index}`}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Accusé présent</span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="checkbox"
                        id={`avocat-present-${index}`}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>
                        Avocat du plaignant présent
                      </span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="checkbox"
                        id={`ministere-public-present-${index}`}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>
                        Ministère public présent
                      </span>
                    </label>
                  </div>
                </div>

                {/* Section Gestion des témoins pour l'audience pénale */}
                <div style={{ marginBottom: 16 }}>
                  <h6
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 13,
                      color: "#6a1b9a",
                    }}
                  >
                    Gestion des témoins
                  </h6>

                  <div style={{ marginBottom: 12 }}>
                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`temoins-audience-penale-${index}`}
                        value="aucun"
                        defaultChecked
                        onChange={(e) =>
                          gererChampsTemoins(index, e.target.value)
                        }
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Aucun témoin</span>
                    </label>

                    <label style={radioLabelStyle}>
                      <input
                        type="radio"
                        name={`temoins-audience-penale-${index}`}
                        value="temoins"
                        onChange={(e) =>
                          gererChampsTemoins(index, e.target.value)
                        }
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>Témoins présents</span>
                    </label>
                  </div>

                  <div
                    id={`section-temoins-${index}`}
                    style={{ display: "none", marginTop: 12 }}
                  >
                    <h6
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: 13,
                        color: "#6a1b9a",
                      }}
                    >
                      Ajouter des témoins
                    </h6>

                    <div
                      id={`liste-temoins-${index}`}
                      style={{ marginBottom: 12 }}
                    >
                      {/* Témoins ajoutés dynamiquement  */}
                    </div>

                    <div
                      style={{
                        padding: 12,
                        background: "#faf5ff",
                        borderRadius: 4,
                        border: "1px solid #e1bee7",
                      }}
                    >
                      <h6
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: 12,
                          color: "#6a1b9a",
                        }}
                      >
                        Nouveau témoin
                      </h6>
                      <div
                        style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Nom complet:</label>
                          <input
                            type="text"
                            id={`nom-temoin-${index}`}
                            placeholder="Nom et prénom"
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Rôle:</label>
                          <select
                            id={`role-temoin-${index}`}
                            style={selectStyle}
                          >
                            <option value="">Sélectionner le rôle</option>
                            <option value="témoin_principal">
                              Témoin principal
                            </option>
                            <option value="témoin_secondaire">
                              Témoin secondaire
                            </option>
                            <option value="expert">Expert</option>
                            <option value="témoin_technique">
                              Témoin technique
                            </option>
                            <option value="témoin_moral">Témoin moral</option>
                            <option value="témoin_audition">
                              Témoin d'audition
                            </option>
                          </select>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Adresse:</label>
                          <textarea
                            id={`adresse-temoin-${index}`}
                            placeholder="Adresse complète"
                            rows={2}
                            style={textareaStyle}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={labelStyle}>Téléphone:</label>
                          <input
                            type="tel"
                            id={`telephone-temoin-${index}`}
                            placeholder="Numéro de téléphone"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => ajouterTemoin(index)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#6a1b9a",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          + Ajouter le témoin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>
                    Compte-rendu d'audience (PDF):
                  </label>
                  <input
                    type="file"
                    id={`compte-rendu-audience-${index}`}
                    accept=".pdf"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  />
                  <small style={{ color: "#666", fontSize: 12 }}>
                    * Document obligatoire
                  </small>
                </div>

                {/* Champ Observations pour l'audience pénale */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #e0e0e0",
                  }}
                >
                  <label style={labelStyle}>Observations:</label>
                  <textarea
                    id={`observations-etape_${index}`}
                    placeholder="Notes sur l'audience pénale..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "80px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Bouton Terminer l'étape pour l'audience pénale */}
                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={onTerminerEtape}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#9c27b0",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    Terminer l'étape
                  </button>
                </div>
              </div>
            )}

            {/* Étape spécifique "تقديم استئناف" -  Dépôt d'appel */}
            {etape.libelle_ar === "تقديم استئناف" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#e3f2fd",
                  borderRadius: 6,
                  border: "1px solid #2196f3",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1565c0",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  📋 Dépôt d'appel
                </h6>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>
                      Date du jugement de première instance:
                    </label>
                    <input
                      type="date"
                      id="date-jugement-appel"
                      style={inputStyle}
                      value={dateJugement}
                      onChange={(e) => {
                        setDateJugement(e.target.value);
                        const dateLimite = calculerDateLimiteAppel(
                          e.target.value,
                        );
                        const isValid = isDelaiAppelValide(e.target.value);

                        // Mettre à jour l'affichage du délai
                        const dateLimiteElement =
                          document.getElementById("date-limite-appel");
                        if (dateLimiteElement) {
                          dateLimiteElement.value = dateLimite;
                          dateLimiteElement.style.backgroundColor = isValid
                            ? "#e8f5e8"
                            : "#ffebee";
                          dateLimiteElement.style.borderColor = isValid
                            ? "#4caf50"
                            : "#f44336";
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={labelStyle}>
                      Date limite d'appel (10 jours):
                    </label>
                    <input
                      type="date"
                      id="date-limite-appel"
                      style={{
                        ...inputStyle,
                        backgroundColor: "#fff3cd",
                        borderColor: "#ffc107",
                      }}
                      value={calculerDateLimiteAppel(dateJugement)}
                      readOnly
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Motifs de l'appel:</label>
                  <textarea
                    placeholder="Décrivez les motifs de l'appel..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "80px",
                    }}
                  />
                </div>
                {(() => {
                  const aujourdhui = new Date();
                  const dateLimite = dateJugement
                    ? new Date(dateJugement)
                    : null;

                  if (dateLimite) {
                    dateLimite.setDate(dateLimite.getDate() + 10);
                    return aujourdhui <= dateLimite;
                  }
                  return false;
                })() && (
                  <button
                    onClick={() => {
                      const clientId = affaireData?.idclient;
                      const fonctionId = affaireData?.idfonctionclient;

                      console.log(
                        "Redirection vers:",
                        `/affaires?mode=ajout&source=appel&client_id=${clientId}&fonction_id=${fonctionId}&affaire_parent=${affaireId}`,
                      );

                      window.location.href = `/affaires?mode=ajout&source=appel&client_id=${clientId}&fonction_id=${fonctionId}&affaire_parent=${affaireId}`;
                    }}
                    style={{
                      background: "#4caf50",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      width: "100%",
                      marginTop: "12px",
                    }}
                    type="button"
                  >
                    Créer affaire d'appel
                  </button>
                )}

                {/*tribunal*/}

                {/*<div style={{ marginBottom: 16 }}>*/}
                {/*    <label style={labelStyle}>📎 Document d'appel:</label>*/}
                {/*    <input*/}
                {/*        type="file"*/}
                {/*        accept=".pdf,.doc,.docx"*/}
                {/*        style={{*/}
                {/*            width: '100%',*/}
                {/*            padding: '8px 12px',*/}
                {/*            border: '1px solid #e0e0e0',*/}
                {/*            borderRadius: 4,*/}
                {/*            fontSize: 14,*/}
                {/*            cursor: 'pointer'*/}
                {/*        }}*/}
                {/*    />*/}
                {/*</div>*/}
                {/*/!* Section sélection tribunal d'appel *!/*/}
                {/*<div*/}
                {/*  style={{*/}
                {/*    marginTop: 20,*/}
                {/*    padding: 16,*/}
                {/*    background: "#f8f9fa",*/}
                {/*    borderRadius: 6,*/}
                {/*    border: "1px solid #dee2e6",*/}
                {/*  }}*/}
                {/*>*/}
                {/*  <h6*/}
                {/*    style={{*/}
                {/*      margin: "0 0 12px 0",*/}
                {/*      color: "#495057",*/}
                {/*      fontSize: 14,*/}
                {/*      fontWeight: "bold",*/}
                {/*    }}*/}
                {/*  >*/}
                {/*    🏛️ Sélection du tribunal d'appel*/}
                {/*  </h6>*/}
                {/*  <div*/}
                {/*    style={{*/}
                {/*      display: "flex",*/}
                {/*      gap: 12,*/}
                {/*      flexWrap: "wrap",*/}
                {/*      marginBottom: 16,*/}
                {/*    }}*/}
                {/*  >*/}
                {/*    <div style={{ flex: 1, minWidth: 200 }}>*/}
                {/*      <label style={labelStyle}>Ville:</label>*/}
                {/*      <select*/}
                {/*        value={villeAppelSelectionnee}*/}
                {/*        onChange={(e) => {*/}
                {/*          setVilleAppelSelectionnee(e.target.value);*/}
                {/*          setTribunalAppelSelectionne(null);*/}
                {/*        }}*/}
                {/*        style={selectStyle}*/}
                {/*      >*/}
                {/*        <option value="">Sélectionner une ville</option>*/}
                {/*        {villesAppel.map((ville) => (*/}
                {/*          <option key={ville} value={ville}>*/}
                {/*            {ville}*/}
                {/*          </option>*/}
                {/*        ))}*/}
                {/*      </select>*/}
                {/*    </div>*/}
                {/*    <div style={{ flex: 1, minWidth: 200 }}>*/}
                {/*      <label style={labelStyle}>Tribunal d'appel:</label>*/}
                {/*      <select*/}
                {/*        value={tribunalAppelSelectionne || ""}*/}
                {/*        onChange={(e) =>*/}
                {/*          setTribunalAppelSelectionne(e.target.value || null)*/}
                {/*        }*/}
                {/*        style={selectStyle}*/}
                {/*        disabled={!villeAppelSelectionnee}*/}
                {/*      >*/}
                {/*        <option value="">Sélectionner un tribunal</option>*/}
                {/*        {tribunauxAppel*/}
                {/*          .filter(*/}
                {/*            (t) =>*/}
                {/*              !villeAppelSelectionnee ||*/}
                {/*              t.ville === villeAppelSelectionnee,*/}
                {/*          )*/}
                {/*          .map((tribunal) => (*/}
                {/*            <option key={tribunal.id} value={tribunal.id}>*/}
                {/*              {tribunal.nom} - {tribunal.ville}*/}
                {/*            </option>*/}
                {/*          ))}*/}
                {/*      </select>*/}
                {/*    </div>*/}
                {/*  </div>*/}
                {/*  /!* Affichage du statut du délai et bouton *!/*/}
                {/*  {tribunalAppelSelectionne && (*/}
                {/*    <div style={{ marginTop: 12 }}>*/}
                {/*      /!* Affichage du statut du délai *!/*/}
                {/*      <div*/}
                {/*        style={{*/}
                {/*          marginBottom: 12,*/}
                {/*          padding: 8,*/}
                {/*          borderRadius: 4,*/}
                {/*          backgroundColor: isDelaiAppelValide(*/}
                {/*            document.getElementById("date-jugement-appel")*/}
                {/*              ?.value || new Date().toISOString().split("T")[0],*/}
                {/*          )*/}
                {/*            ? "#e8f5e8"*/}
                {/*            : "#ffebee",*/}
                {/*          border: `1px solid ${isDelaiAppelValide(document.getElementById("date-jugement-appel")?.value || new Date().toISOString().split("T")[0]) ? "#4caf50" : "#f44336"}`,*/}
                {/*        }}*/}
                {/*      >*/}
                {/*        <div*/}
                {/*          style={{*/}
                {/*            fontSize: 12,*/}
                {/*            fontWeight: "bold",*/}
                {/*            color: isDelaiAppelValide(*/}
                {/*              document.getElementById("date-jugement-appel")*/}
                {/*                ?.value ||*/}
                {/*                new Date().toISOString().split("T")[0],*/}
                {/*            )*/}
                {/*              ? "#2e7d32"*/}
                {/*              : "#c62828",*/}
                {/*          }}*/}
                {/*        >*/}
                {/*          {isDelaiAppelValide(*/}
                {/*            document.getElementById("date-jugement-appel")*/}
                {/*              ?.value || new Date().toISOString().split("T")[0],*/}
                {/*          )*/}
                {/*            ? "Délai d'appel valide"*/}
                {/*            : "Délai d'appel expiré"}*/}
                {/*        </div>*/}
                {/*        <div*/}
                {/*          style={{ fontSize: 11, color: "#666", marginTop: 4 }}*/}
                {/*        >*/}
                {/*          Date limite :{" "}*/}
                {/*          {calculerDateLimiteAppel(*/}
                {/*            document.getElementById("date-jugement-appel")*/}
                {/*              ?.value || new Date().toISOString().split("T")[0],*/}
                {/*          )}*/}
                {/*        </div>*/}
                {/*      </div>*/}
                {/*      /!* Bouton conditionnel *!/*/}
                {/*      {isDelaiAppelValide(*/}
                {/*        document.getElementById("date-jugement-appel")?.value ||*/}
                {/*          new Date().toISOString().split("T")[0],*/}
                {/*      ) ? (*/}
                {/*        <button*/}
                {/*          onClick={handleCreerNouvelleAffaire}*/}
                {/*          style={{*/}
                {/*            background: "#4caf50",*/}
                {/*            color: "#fff",*/}
                {/*            border: "none",*/}
                {/*            borderRadius: 4,*/}
                {/*            padding: "10px 16px",*/}
                {/*            cursor: "pointer",*/}
                {/*            fontSize: 14,*/}
                {/*            fontWeight: "bold",*/}
                {/*            width: "100%",*/}
                {/*          }}*/}
                {/*          type="button"*/}
                {/*        >*/}
                {/*          Créer une nouvelle affaire d'appel*/}
                {/*        </button>*/}
                {/*      ) : (*/}
                {/*        <div*/}
                {/*          style={{*/}
                {/*            padding: "10px 16px",*/}
                {/*            background: "#f5f5f5",*/}
                {/*            color: "#666",*/}
                {/*            border: "1px solid #ddd",*/}
                {/*            borderRadius: 4,*/}
                {/*            fontSize: 14,*/}
                {/*            textAlign: "center",*/}
                {/*          }}*/}
                {/*        >*/}
                {/*          Délai d'appel expiré - Impossible de créer une*/}
                {/*          nouvelle affaire*/}
                {/*        </div>*/}
                {/*      )}*/}
                {/*    </div>*/}
                {/*  )}*/}
                {/*</div> //*/}
              </div>
            )}

            {/* Étape spécifique "حكم" - Saisie du jugement */}
            {etape.libelle_ar === "حكم" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#fff3cd",
                  borderRadius: 6,
                  border: "1px solid #ffc107",
                  width: "100%",
                }}
              >
                <h6
                  style={{
                    margin: "0 0 12px 0",
                    color: "#856404",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Saisie du jugement
                </h6>

                {/* Jugement */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Jugement:</label>
                  <textarea
                    placeholder="Écrivez ici le jugement de l'affaire..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e0e0e0",
                      borderRadius: 4,
                      fontSize: 14,
                      resize: "vertical",
                      minHeight: "120px",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Notification par huissier  */}
            {(etape.libelle_ar === "تبليغ الاستدعاء" ||
              etape.libelle_ar === "حكم" ||
              etape.libelle_ar === "تنفيذ الحكم") && (
              <NotificationParamsSection
                huissiers={huissiers}
                opposants={opposants}
                selectedHuissier={selectedHuissier}
                setSelectedHuissier={setSelectedHuissier}
                selectedOpposant={selectedOpposant}
                setSelectedOpposant={setSelectedOpposant}
                searchOpposant={searchOpposant}
                setSearchOpposant={setSearchOpposant}
                showOpposantDropdown={showOpposantDropdown}
                setShowOpposantDropdown={setShowOpposantDropdown}
                filteredOpposants={filteredOpposants}
                handleOpposantSearch={handleOpposantSearch}
                selectOpposant={selectOpposant}
                clearOpposantSearch={clearOpposantSearch}
                sauvegarderParametresNotification={
                  sauvegarderParametresNotification
                }
                autoriteEmettrice={autoriteEmettrice}
                setAutoriteEmettrice={setAutoriteEmettrice}
                typeActionPenale={typeActionPenale}
                setTypeActionPenale={setTypeActionPenale}
                dateConvocationArrestation={dateConvocationArrestation}
                setDateConvocationArrestation={setDateConvocationArrestation}
                auditionPoliceFaite={auditionPoliceFaite}
                setAuditionPoliceFaite={setAuditionPoliceFaite}
                observationsPenales={observationsPenales}
                setObservationsPenales={setObservationsPenales}
              />
            )}
          </div>
        )}

        {/* "مداولة" */}

        {etape.libelle_ar === "مداولة" && !isAffairePenale && (
          <DeliberationSection
            index={index}
            gererChampsDeliberation={gererChampsDeliberation}
          />
        )}

        {/*  "جلسات" */}

        {etape.libelle_ar === "جلسات" && !isAffairePenale && (
          <AudienceTemoinsSection
            index={index}
            gererChampsTemoins={gererChampsTemoins}
            ajouterTemoin={ajouterTemoin}
          />
        )}

        {/* "تنفيذ الحكم"  */}
        {etape.libelle_ar === "تنفيذ الحكم" && !isAffairePenale && (
          <ExecutionSection
            index={index}
            etape={etape}
            affaireId={affaireId}
            api={api}
            setEtapesTerminees={setEtapesTerminees}
            setEtapesPhase={setEtapesPhase}
          />
        )}

        {/* Section Observations/Upload - Masquée pour les affaires pénales car déjà intégrée dans la section rouge */}
        {!isAffairePenale && (
          <ObservationsUploadSection
            etape={etape}
            index={index}
            observations={observations}
            setObservations={setObservations}
            onTerminerEtape={onTerminerEtape}
            handleFileUpload={handleFileUpload}
            affaireId={affaireId}
          />
        )}
      </div>
    </div>
  );
};

const ModalLoadingStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const containerStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  maxWidth: 1200,
  width: "95%",
  maxHeight: "90vh",
  overflowY: "auto",
};

const smallContainerStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  maxWidth: 600,
  width: "90%",
  maxHeight: "80vh",
  overflowY: "auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  borderBottom: "1px solid #e0e0e0",
  paddingBottom: 12,
};

const closeBtnStyle = {
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  userSelect: "none",
};

const phaseSelectorStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  flexWrap: "wrap",
};

const roleDisplayStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  alignItems: "center",
};

const roleBadgeStyle = {
  padding: "6px 12px",
  background: "#1976d2",
  color: "#fff",
  borderRadius: 4,
  fontSize: 14,
  fontWeight: "bold",
};

const configRapideStyle = {
  marginBottom: 20,
  padding: 16,
  background: "#f8f9fa",
  borderRadius: 6,
  border: "1px solid #dee2e6",
};

const stepsContainerStyle = {
  padding: 20,
  background: "#f8f9fa",
  borderRadius: 8,
  border: "2px solid #e3f2fd",
  marginBottom: 20,
};

const stepsTitleStyle = {
  color: "#1a237e",
  margin: 0,
  fontSize: 18,
};

const phaseLabelStyle = (phase) => ({
  padding: "4px 12px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: "bold",
  color: "#fff",
  background:
    phase === "INITIALE"
      ? "#ff9800"
      : phase === "PROCEDURE"
        ? "#2196f3"
        : phase === "EXECUTION"
          ? "#4caf50"
          : "#9c27b0",
  marginBottom: 16,
  display: "inline-block",
});

const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 12,
  fontWeight: "bold",
  color: "#333",
};

const selectStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e0e0e0",
  borderRadius: 4,
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e0e0e0",
  borderRadius: 4,
  fontSize: 14,
};

const textareaStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e0e0e0",
  borderRadius: 4,
  fontSize: 14,
  resize: "vertical",
  minHeight: "60px",
};

//  SECTION PARAMETRES NOTIFICATION
const NotificationParamsSection = ({
  huissiers,
  opposants,
  selectedHuissier,
  setSelectedHuissier,
  selectedOpposant,
  setSelectedOpposant,
  searchOpposant,
  setSearchOpposant,
  showOpposantDropdown,
  setShowOpposantDropdown,
  filteredOpposants,
  handleOpposantSearch,
  selectOpposant,
  clearOpposantSearch,
  sauvegarderParametresNotification,
  autoriteEmettrice,
  setAutoriteEmettrice,
  typeActionPenale,
  setTypeActionPenale,
  dateConvocationArrestation,
  setDateConvocationArrestation,
  auditionPoliceFaite,
  setAuditionPoliceFaite,
  observationsPenales,
  setObservationsPenales,
}) => (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      background: "#f0f8ff",
      borderRadius: 6,
      border: "1px solid #1976d2",
    }}
  >
    <h6
      style={{
        margin: "0 0 12px 0",
        color: "#1976d2",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      Paramètres de notification officielle
    </h6>

    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 250 }}>
        <label style={labelStyle}>Huissier partenaire:</label>
        <select
          value={selectedHuissier || ""}
          onChange={(e) => setSelectedHuissier(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">Sélectionner un huissier</option>
          {huissiers.map((h) => (
            <option key={h.idhuissier} value={h.idhuissier}>
              {h.nomhuissier} - {h.telephonehuissier}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minWidth: 250, position: "relative" }}>
        <label style={labelStyle}>Destinataire/Opposant:</label>
        <input
          type="text"
          placeholder="Rechercher un opposant..."
          value={searchOpposant}
          onChange={(e) => handleOpposantSearch(e.target.value)}
          onFocus={() => setShowOpposantDropdown(true)}
          onBlur={() => setTimeout(() => setShowOpposantDropdown(false), 100)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
            paddingRight: 30,
          }}
        />
        {searchOpposant && (
          <button
            onClick={clearOpposantSearch}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#999",
              fontSize: 18,
            }}
            type="button"
            aria-label="Clear search"
          >
            ✗
          </button>
        )}
        {showOpposantDropdown && filteredOpposants.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              maxHeight: 200,
              overflowY: "auto",
              zIndex: 1000,
            }}
          >
            {filteredOpposants.map((o) => (
              <div
                key={o.idopposant}
                onClick={() => selectOpposant(o)}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  backgroundColor:
                    selectedOpposant === o.idopposant
                      ? "#e3f2fd"
                      : "transparent",
                }}
                role="option"
                tabIndex={-1}
                aria-selected={selectedOpposant === o.idopposant}
              >
                {(o.nomopposant_fr || o.nomopposant_ar || '')} - {(o.adresse1_fr || o.adresse1_ar || '')}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div style={{ marginTop: 12 }}>
      <button
        onClick={sauvegarderParametresNotification}
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: "bold",
        }}
        type="button"
      >
        💾 Sauvegarder
      </button>
    </div>
  </div>
);

const NotificationParamsUsed = ({
  huissiers,
  opposants,
  selectedHuissier,
  selectedOpposant,
  sauvegarderParametresNotification,
}) => (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      background: "#e8f5e8",
      borderRadius: 6,
      border: "1px solid #4caf50",
    }}
  >
    <h6
      style={{
        margin: "0 0 12px 0",
        color: "#4caf50",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      ✅ Paramètres de notification réutilisés automatiquement
    </h6>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Huissier partenaire:</label>
        <div
          style={{
            padding: "8px 12px",
            background: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
            color: "#666",
          }}
        >
          {huissiers.find((h) => h.idhuissier == selectedHuissier)
            ?.nomhuissier || ""}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Destinataire/Opposant:</label>
        <div
          style={{
            padding: "8px 12px",
            background: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
            color: "#666",
          }}
        >
          {opposants.find((o) => o.idopposant == selectedOpposant)
            ?.nomopposant_fr || opposants.find((o) => o.idopposant == selectedOpposant)?.nomopposant_ar || ""}
        </div>
      </div>
    </div>
    <div style={{ marginTop: 12 }}>
      <button
        onClick={sauvegarderParametresNotification}
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: "bold",
        }}
        type="button"
      >
        💾 Sauvegarder les paramètres
      </button>
    </div>
  </div>
);

const DocumentsDescriptionSection = ({ etape, index }) => (
  <div style={{ marginTop: 12 }}>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Documents requis:</label>
        <textarea
          id={`documents-requis-${etape.id || `etape_${index}`}`}
          placeholder="Listez les documents requis..."
          style={textareaStyle}
        />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Description:</label>
        <textarea
          id={`description-${etape.id || `etape_${index}`}`}
          placeholder="Description détaillée..."
          style={textareaStyle}
        />
      </div>
    </div>
  </div>
);

const NotificationSelectionSection = ({
  huissiers,
  opposants,
  selectedHuissier,
  setSelectedHuissier,
  selectedOpposant,
  setSelectedOpposant,
  searchOpposant,
  handleOpposantSearch,
  showOpposantDropdown,
  setShowOpposantDropdown,
  filteredOpposants,
  selectOpposant,
}) => (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      background: "#f0f8ff",
      borderRadius: 6,
      border: "1px solid #1976d2",
      width: "100%",
    }}
  >
    <h6
      style={{
        margin: "0 0 12px 0",
        color: "#1976d2",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      Sélection du huissier et de l'opposant pour la notification
    </h6>

    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Huissier partenaire:</label>
        <select
          value={selectedHuissier || ""}
          onChange={(e) => setSelectedHuissier(e.target.value)}
          style={selectStyle}
        >
          <option value="">Sélectionner un huissier</option>
          {huissiers.map((h) => (
            <option key={h.idhuissier} value={h.idhuissier}>
              {h.nomhuissier}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
        <label style={labelStyle}>Destinataire/Opposant:</label>
        <input
          type="text"
          value={searchOpposant}
          onChange={(e) => handleOpposantSearch(e.target.value)}
          placeholder="Rechercher un opposant..."
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
          }}
          onFocus={() => setShowOpposantDropdown(true)}
          onBlur={() => setTimeout(() => setShowOpposantDropdown(false), 150)}
        />
        {showOpposantDropdown && filteredOpposants.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              maxHeight: 200,
              overflowY: "auto",
              zIndex: 1000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {filteredOpposants.map((o) => (
              <div
                key={o.idopposant}
                onClick={() => selectOpposant(o)}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.target.style.background = "#fff")}
              >
                {o.nomopposant_fr || o.nomopposant_ar || ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const DeliberationSection = ({ index, gererChampsDeliberation }) => (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      background: "#fff3cd",
      borderRadius: 6,
      border: "1px solid #ffc107",
      width: "100%",
    }}
  >
    <h6
      style={{
        margin: "0 0 12px 0",
        color: "#856404",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      Type de décision de délibération
    </h6>
    <div
      style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
    >
      <label style={radioLabelStyle}>
        <input
          type="radio"
          name={`type-deliberation-${index}`}
          value="jugement"
          defaultChecked
          onChange={(e) => gererChampsDeliberation(index, e.target.value)}
          style={{ margin: 0 }}
        />
        <span style={{ fontSize: 14 }}>Jugement direct</span>
      </label>
      <label style={radioLabelStyle}>
        <input
          type="radio"
          name={`type-deliberation-${index}`}
          value="inspection"
          onChange={(e) => gererChampsDeliberation(index, e.target.value)}
          style={{ margin: 0 }}
        />
        <span style={{ fontSize: 14 }}>Inspection/Recherche</span>
      </label>
      <label style={radioLabelStyle}>
        <input
          type="radio"
          name={`type-deliberation-${index}`}
          value="expertise"
          onChange={(e) => gererChampsDeliberation(index, e.target.value)}
          style={{ margin: 0 }}
        />
        <span style={{ fontSize: 14 }}>Expertise</span>
      </label>
    </div>

    <InspectionFields index={index} />
    <ExpertiseFields index={index} />

    {/* Conclusion définitives */}
    <div style={{ marginTop: 16 }}>
      <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#856404" }}>
        📋 Conclusion définitives
      </h6>
      <textarea
        id={`conclusion-definitives-${index}`}
        placeholder="Saisissez les conclusions définitives de la délibération..."
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #e0e0e0",
          borderRadius: 4,
          fontSize: 14,
          resize: "vertical",
          minHeight: "100px",
          fontFamily: "inherit",
        }}
      />
    </div>
  </div>
);

const InspectionFields = ({ index }) => (
  <div
    id={`champs-inspection-${index}`}
    style={{ display: "none", marginTop: 12 }}
  >
    <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#856404" }}>
      🔍 Détails de l'inspection/recherche
    </h6>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Type d'intervention:</label>
        <select id={`type-intervention-${index}`} style={selectStyle}>
          <option value="">Sélectionner le type</option>
          <option value="inspection_lieu">Inspection de lieu</option>
          <option value="recherche_documents">Recherche de documents</option>
          <option value="enquete">Enquête</option>
          <option value="verification">Vérification</option>
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Intervenant:</label>
        <select id={`intervenant-inspection-${index}`} style={selectStyle}>
          <option value="">Sélectionner l'intervenant</option>
          <option value="huissier">Huissier</option>
          <option value="expert">Expert</option>
          <option value="enqueteur">Enquêteur</option>
        </select>
      </div>
    </div>
  </div>
);

const ExpertiseFields = ({ index }) => (
  <div
    id={`champs-expertise-${index}`}
    style={{ display: "none", marginTop: 12 }}
  >
    <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#856404" }}>
      Détails de l'expertise
    </h6>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Type d'expertise:</label>
        <select id={`type-expertise-${index}`} style={selectStyle}>
          <option value="">Sélectionner le type</option>
          <option value="verification">Vérification</option>
          <option value="technique">Expertise technique</option>
          <option value="medicale">Expertise médicale</option>
          <option value="comptable">Expertise comptable</option>
          <option value="immobiliere">Expertise immobilière</option>
          <option value="psychologique">Expertise psychologique</option>
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <label style={labelStyle}>Expert:</label>
        <select id={`expert-selection-${index}`} style={selectStyle}>
          <option value="">Sélectionner l'expert</option>
          {/* Chargement dynamique des experts possible  */}
        </select>
      </div>
    </div>
  </div>
);

const AudienceTemoinsSection = ({
  index,
  gererChampsTemoins,
  ajouterTemoin,
}) => (
  <>
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: "#e3f2fd",
        borderRadius: 6,
        border: "1px solid #2196f3",
        width: "100%",
      }}
    >
      <h6
        style={{
          margin: "0 0 12px 0",
          color: "#1565c0",
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        Gestion des témoins
      </h6>

      <div style={{ marginBottom: 16 }}>
        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={`temoins-audience-${index}`}
            value="aucun"
            defaultChecked
            onChange={(e) => gererChampsTemoins(index, e.target.value)}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: 14 }}>Aucun témoin</span>
        </label>

        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={`temoins-audience-${index}`}
            value="temoins"
            onChange={(e) => gererChampsTemoins(index, e.target.value)}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: 14 }}>Témoins présents</span>
        </label>
      </div>

      <div
        id={`section-temoins-${index}`}
        style={{ display: "none", marginTop: 12 }}
      >
        <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#1565c0" }}>
          Ajouter des témoins
        </h6>

        <div id={`liste-temoins-${index}`} style={{ marginBottom: 12 }}>
          {/* Témoins ajoutés dynamiquement ici */}
        </div>

        <div
          style={{
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 4,
            border: "1px solid #e0e0e0",
          }}
        >
          <h6 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#333" }}>
            Nouveau témoin
          </h6>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Nom complet:</label>
              <input
                type="text"
                id={`nom-temoin-${index}`}
                placeholder="Nom et prénom"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Rôle:</label>
              <select id={`role-temoin-${index}`} style={selectStyle}>
                <option value="">Sélectionner le rôle</option>
                <option value="témoin_principal">Témoin principal</option>
                <option value="témoin_secondaire">Témoin secondaire</option>
                <option value="expert">Expert</option>
                <option value="témoin_technique">Témoin technique</option>
                <option value="témoin_moral">Témoin moral</option>
                <option value="témoin_audition">Témoin d'audition</option>
              </select>
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Adresse:</label>
              <textarea
                id={`adresse-temoin-${index}`}
                placeholder="Adresse complète"
                rows={2}
                style={textareaStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Téléphone:</label>
              <input
                type="tel"
                id={`telephone-temoin-${index}`}
                placeholder="Numéro de téléphone"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button
              type="button"
              onClick={() => ajouterTemoin(index)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              + Ajouter le témoin
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

const ObservationsUploadSection = ({
  etape,
  index,
  observations,
  setObservations,
  onTerminerEtape,
  handleFileUpload,
  affaireId,
}) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "flex-start",
      marginTop: 12,
    }}
  >
    <div style={{ flex: 1, minWidth: 250 }}>
      <label style={labelStyle}>Observations:</label>
      <textarea
        placeholder="Décrivez les actions effectuées, documents déposés, etc..."
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        style={textareaStyle}
      />

      {/* Upload de documents générique pour toutes les étapes */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>📎 Document PDF:</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            id={`document-pdf-${index}`}
            onChange={(e) => {
              const fichier = e.target.files[0];
              if (fichier) {
                handleFileUpload(index, fichier, "DOCUMENT");
              }
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              fontSize: 14,
              cursor: "pointer",
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById(`document-pdf-${index}`);
              if (input) {
                input.value = "";
              }
            }}
            style={{
              padding: "8px 12px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✗
          </button>
        </div>
      </div>
    </div>

    <div
      style={{
        marginTop: 20,
        minWidth: 150,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      {!etape.terminee && (
        <UnifiedEtapeButton
          etapeId={etape.id || index}
          affaireId={affaireId}
          onComplete={onTerminerEtape}
          style={{ height: 40 }}
        >
          Terminer l'étape
        </UnifiedEtapeButton>
      )}
      {etape.terminee && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 4,
            fontSize: 14,
            height: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
          Terminée
        </div>
      )}
    </div>
  </div>
);

const radioLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginRight: 16,
  fontSize: 14,
  cursor: "pointer",
};

const ExecutionSection = ({
  index,
  etape,
  affaireId,
  api,
  setEtapesTerminees,
  setEtapesPhase,
}) => {
  const [typePV, setTypePV] = useState("");
  const [huissierExecution, setHuissierExecution] = useState(null);
  const [montantPaye, setMontantPaye] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [numeroRecu, setNumeroRecu] = useState("");
  const [motifAbsence, setMotifAbsence] = useState("");
  const [demandeCoercition, setDemandeCoercition] = useState(false);
  const [commentaires, setCommentaires] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const soumettrePV = async () => {
    if (!typePV) {
      console.error("Veuillez sélectionner un type de PV");
      return;
    }

    setIsSubmitting(true);
    try {
      // Générer un ID unique pour l'étape d'exécution
      const etapeExecutionId = `execution_${affaireId}_${Date.now()}`;

      const pvData = {
        etape_id: etapeExecutionId,
        type_pv: typePV,
        commentaires: commentaires,
      };

      // Ajouter les champs spécifiques selon le type
      if (typePV === "paiement") {
        pvData.montant_paye = parseFloat(montantPaye) || null;
        pvData.mode_paiement = modePaiement;
        pvData.numero_recu = numeroRecu;
      } else if (typePV === "pv_informatif") {
        pvData.motif_absence = motifAbsence;
        pvData.demande_coercition = demandeCoercition;
      }

      const response = await api.post(
        `affaires/${affaireId}/execution/pv/`,
        pvData,
      );

      if (response.status === 200) {
        console.log("PV d'exécution enregistré avec succès !");
        alert("✅ PV d'exécution enregistré avec succès !");

        // Marquer l'étape comme terminée
        const etapeTerminee = {
          ...etape,
          terminee: true,
          date_terminaison: new Date().toISOString(),
          observations: commentaires,
        };

        // Ajouter à la liste des étapes terminées
        setEtapesTerminees((prev) => [...prev, etapeTerminee]);

        // Marquer l'étape comme terminée dans la liste principale
        setEtapesPhase((prev) =>
          prev.map((e, i) => (i === index ? { ...e, terminee: true } : e)),
        );

        // Réinitialiser les champs
        setTypePV("");
        setMontantPaye("");
        setModePaiement("");
        setNumeroRecu("");
        setMotifAbsence("");
        setDemandeCoercition(false);
        setCommentaires("");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du PV:", error);
      if (error.response) {
        console.error(
          `Erreur ${error.response.status}: Impossible d'enregistrer le PV - ${error.response.data?.message || error.response.statusText}`,
        );
      } else if (error.request) {
        console.error("Erreur de connexion: Impossible d'enregistrer le PV");
      } else {
        console.error(
          "Erreur inattendue lors de l'enregistrement du PV:",
          error.message,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: "#e8f5e8",
        borderRadius: 6,
        border: "1px solid #4caf50",
        width: "100%",
      }}
    >
      <h6
        style={{
          margin: "0 0 12px 0",
          color: "#2e7d32",
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        ⚖️ Résultat de l'exécution du jugement
      </h6>

      {/* Sélection du type de PV */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Type de procès-verbal :</label>
        <select
          value={typePV}
          onChange={(e) => setTypePV(e.target.value)}
          style={selectStyle}
        >
          <option value="">Sélectionner le type de PV</option>
          <option value="abstention">Abstention (عدم الحضور)</option>
          <option value="paiement">Paiement (الدفع)</option>
          <option value="pv_informatif">PV Informatif (إخباري)</option>
        </select>
      </div>

      {/* Champs pour PAIEMENT */}
      {typePV === "paiement" && (
        <div style={{ marginBottom: 16 }}>
          <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#2e7d32" }}>
            💰 Détails du paiement
          </h6>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Montant payé (DH):</label>
              <input
                type="number"
                value={montantPaye}
                onChange={(e) => setMontantPaye(e.target.value)}
                placeholder="Montant en dirhams"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Mode de paiement:</label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                style={selectStyle}
              >
                <option value="">Sélectionner</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement bancaire</option>
                <option value="carte">Carte bancaire</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={labelStyle}>Numéro de reçu:</label>
            <input
              type="text"
              value={numeroRecu}
              onChange={(e) => setNumeroRecu(e.target.value)}
              placeholder="Numéro du reçu de paiement"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Champs pour PV INFORMATIF */}
      {typePV === "pv_informatif" && (
        <div style={{ marginBottom: 16 }}>
          <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#2e7d32" }}>
            PV informatif (إخباري)
          </h6>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Motif de l'absence:</label>
            <textarea
              value={motifAbsence}
              onChange={(e) => setMotifAbsence(e.target.value)}
              placeholder="Décrivez les tentatives effectuées, les lieux visités, les personnes contactées..."
              style={{
                ...textareaStyle,
                minHeight: "80px",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={demandeCoercition}
                onChange={(e) => setDemandeCoercition(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Demande de coercition urgente
            </label>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: "#fff3cd",
              borderRadius: 4,
              border: "1px solid #ffc107",
              fontSize: 12,
              color: "#856404",
            }}
          >
            ⚠️ PV informatif établi - Réclamation urgente pour coercition
          </div>
        </div>
      )}

      {/* Champs pour ABSTENTION */}
      {typePV === "abstention" && (
        <div style={{ marginBottom: 16 }}>
          <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#2e7d32" }}>
            ❌ PV d'abstention
          </h6>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Observations d'abstention:</label>
            <textarea
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              placeholder="Décrivez les circonstances de l'abstention, les tentatives de contact..."
              style={{
                ...textareaStyle,
                minHeight: "80px",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: "#ffebee",
              borderRadius: 4,
              border: "1px solid #f44336",
              fontSize: 12,
              color: "#c62828",
            }}
          >
            ❌ Le débiteur ne s'est pas présenté - Poursuite des procédures
          </div>
        </div>
      )}

      {/*/!* Commentaires généraux *!/*/}
      {/*{typePV && (*/}
      {/*  <div style={{ marginBottom: 16 }}>*/}
      {/*    <label style={labelStyle}>Commentaires généraux:</label>*/}
      {/*    <textarea*/}
      {/*      value={commentaires}*/}
      {/*      onChange={(e) => setCommentaires(e.target.value)}*/}
      {/*      placeholder="Commentaires additionnels sur le PV..."*/}
      {/*      style={{*/}
      {/*        ...textareaStyle,*/}
      {/*        minHeight: "60px",*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* Sélection de l'huissier d'exécution */}
      <div style={{ marginTop: 16 }}>
        <h6 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#2e7d32" }}>
          Huissier chargé de l'exécution
        </h6>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <label style={labelStyle}>Huissier d'exécution:</label>
            <select
              value={huissierExecution || ""}
              onChange={(e) => setHuissierExecution(e.target.value || null)}
              style={selectStyle}
            >
              <option value="">Sélectionner un huissier</option>
              <option value="1">Huissier 1 - Tél: 0123456789</option>
              <option value="2">Huissier 2 - Tél: 0987654321</option>
              <option value="3">Huissier 3 - Tél: 0555666777</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document du PV */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>📎 Procès-verbal d'exécution:</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            fontSize: 14,
            cursor: "pointer",
          }}
        />
      </div>

      {/* Bouton de soumission */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={soumettrePV}
          disabled={isSubmitting || !typePV}
          style={{
            ...btnStyle("#4caf50"),
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: "bold",
            opacity: isSubmitting || !typePV ? 0.6 : 1,
            cursor: isSubmitting || !typePV ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting
            ? "⏳ Enregistrement..."
            : "✅ Enregistrer le PV d'exécution"}
        </button>
      </div>
    </div>
  );
};

export default WorkflowPage;
