// src/api/exerciseService.ts
import type { Exercise } from "../types";
import { apiClient } from "./apiClient";

export const exerciseService = {
  // Fetches the full exercise catalog (any authenticated user)
  getAll: async (): Promise<Exercise[]> => {
    return await apiClient.get("/api/exercises/");
  },
};
