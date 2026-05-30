// src/api/sessionService.ts
import { apiClient } from './apiClient';

// Opzionale: definisci le interfacce TS per avere l'autocompletamento perfetto
export interface SessionSetIn {
  set_index: number;
  completed: boolean;
  actualReps?: string | null;
  actualWeight?: string | null;
  actualRir?: string | null;
  note?: string | null;
}

export interface SessionExerciseIn {
  programExerciseId: number;
  sets: SessionSetIn[];
  note?: string | null;
}

export interface SessionCreatePayload {
  programId: number;
  programDayId: number;
  date: string; // ISO string della data di inizio
  ended_at?: string | null;
  durationSeconds?: number | null;
  generalNote?: string | null;
  exercises: SessionExerciseIn[];
}

export const sessionService = {
  // Invia la sessione conclusa al backend
  createSession: async (clientId: number, payload: SessionCreatePayload) => {
    const response = await apiClient.post(`/clients/${clientId}/sessions`, payload);
    return response.data; // Restituisce direttamente i dati già parsati dal JSON
  },

  // Esempio di altra chiamata utile per il futuro:
  getHistoryByClient: async (clientId: number) => {
    const response = await apiClient.get(`/clients/${clientId}/sessions`);
    return response.data;
  }
};