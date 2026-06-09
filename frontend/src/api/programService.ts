// src/api/sessionService.ts
import type { Program, ProgramCreate } from '../types';
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
  },

  // Ottiene i programmi del cliente (attivo + storico)
  getClientPrograms: async (clientId: number): Promise<Program[]> => {
    return await apiClient.get(`/api/programs/${clientId}/programs`);
  },

  // AZIONE 1: Modifica diretta (Invia l'intero oggetto modificato)
  updateProgramDirect: async (programId: number, payload: Partial<Program>): Promise<Program> => {
    return await apiClient.patch(`/api/programs/${programId}`, payload);
  },

  // AZIONE 2: Nuova versione basata su una esistente
  createNewVersion: async (programId: number, payload: ProgramCreate): Promise<Program> => {
    return await apiClient.post(`/api/programs/${programId}/new-version`, payload);
  },

  // AZIONE 3: Nuova scheda da zero o copia (Usa lo schema ProgramCreate)
  createClientProgram: async (clientId: number, payload: ProgramCreate): Promise<Program> => {
    return await apiClient.post(`/api/programs/${clientId}/program`, payload);
  }
};

void function helpers() {} 

export function mapProgramToCreatePayload(program: Program): ProgramCreate {
  return {
    name: program.name,
    coachNote: program.coachNote,
    days: program.days.map((day, dIdx) => ({
      dayIndex: dIdx, // Sincronizziamo l'indice in base all'ordine dell'array
      name: day.name,
      focus: day.focus,
      coachNote: day.coachNote,
      exercises: day.exercises.map((ex, exIdx) => ({
        exerciseId: ex.exerciseId,
        sortOrder: exIdx, // Mantiene l'ordine corretto di esecuzione impostato nel frontend
        sets: ex.sets,
        reps: ex.reps,
        duration: ex.duration,
        restSeconds: ex.restSeconds,
        notes: ex.notes,
        targetSets: ex.targetSets.map((ts, tsIdx) => ({
          setIndex: tsIdx,
          rpe: ts.rpe,
          reps: ts.reps ?? null,
          duration: ts.duration ?? null,
          tempoPerRep: ts.tempoPerRep ?? null,
          suggestedWeight: ts.suggestedWeight ?? null,
          restSeconds: ts.restSeconds ?? null,
          note: ts.note ?? null
        }))
      }))
    }))
  };
}