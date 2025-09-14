import api from "./axios";

//  les fichiers d'une affaire donnée
//   tableau d'objets { id, nom_fichier, type_fichier, description, date_upload, version, public, upload_par_username, url }
export const fetchFichiersByAffaire = async (affaireId) => {
  const res = await api.get(`affaires/${affaireId}/fichiers/`);
  return res.data;
};

//  tous les fichiers avec info d'affaire
export const fetchTousFichiers = async () => {
  const res = await api.get(`fichiers/`);
  return res.data;
};

//  tous les documents (contrats + fichiers d'affaire) normalisés
export const fetchTousDocuments = async () => {
  const res = await api.get(`documents/`);
  return res.data;
};
