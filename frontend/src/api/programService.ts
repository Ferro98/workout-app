// src/api/sessionService.ts
import { apiClient } from './apiClient';

export const programService = {
//   createProgram : async (clientId: number, payload: SessionCreatePayload) => {
//     const data = await apiClient.post(`/clients/${clientId}/sessions`, payload);
//     return data; // Restituisce direttamente i dati già parsati dal JSON
//   },

  getActiveProgramForClient: async (clientId: number) => {
    const data = await apiClient.get(`/programs/${clientId}/program`);
    return data;
  }
};