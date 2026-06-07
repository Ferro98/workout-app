// src/api/sessionService.ts
import type { Program } from '../types';
import { apiClient } from './apiClient';

export const programService = {
  /**
   * LATO CLIENTE: Prende la scheda attiva dell'utente loggato (usa il token)
   */
  getMyActiveProgram: async (): Promise<Program> => {
    return await apiClient.get('/api/programs/active'); // Mappa l'endpoint @router.get("/active")
  },

  /**
   * LATO COACH: Prende la scheda attiva di un cliente specifico passandone l'ID
   */
  getActiveProgramForClient: async (clientId: number): Promise<Program> => {
    return await apiClient.get(`/api/programs/${clientId}/program`);
  }
};