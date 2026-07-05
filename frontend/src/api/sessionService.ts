// src/api/sessionService.ts
import { apiClient } from "./apiClient";

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
  dayId: number;
  startedAt: string; // ISO string della data di inizio
  endedAt?: string | null;
  durationSeconds?: number | null;
  generalNote?: string | null;
  exercises: SessionExerciseIn[];
}

export const sessionService = {
  // Invia la sessione conclusa al backend
  createSession: async (clientId: number, payload: SessionCreatePayload) => {
    return await apiClient.post(`/api/clients/${clientId}/sessions`, payload);
  },

  // Esempio di altra chiamata utile per il futuro:
  getHistoryByClient: async (clientId: number) => {
    return await apiClient.get(`/api/clients/${clientId}/sessions`);
  },
};
