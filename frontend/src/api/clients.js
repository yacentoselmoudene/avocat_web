import api from "./axios";

const API_URL = "/clients/";
//tous les clients
export const fetchClients = async () => {
  const response = await api.get(API_URL);
  return response.data;
};
//client par id
export const fetchClient = async (id) => {
  const response = await api.get(`${API_URL}${id}/`);
  return response.data;
};