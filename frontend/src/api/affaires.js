import api from "./axios";

const API_URL = "/affairejudiciaires/";

export const fetchAffaires = async () => {
  const response = await api.get(API_URL);
  return response.data;
};
//affaire par id
export const fetchAffaire = async (id) => {
  const response = await api.get(`${API_URL}${id}/`);
  return response.data;
};