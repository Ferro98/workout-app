import type { Client, ClientOut } from "../types";
import { apiClient } from "./apiClient";

export const clientService = {
    getCoachClients: async (): Promise<Client[]> => {
        const data = await apiClient.get('/api/clients/');

        return data.map((c: ClientOut): Client => {
            const initials = c.name
                ? c.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                : '??';
            
            return {
                id: c.id,
                fullName: c.name,
                initials: initials,
                colorBg: c.colorBg || '#EFF6FF',
                colorText: c.colorText || '#1D4ED8',

                activeProgramName: c.activeProgramName ?? null,
                lastSessionDate: c.lastSessionDate ?? null,
                isActive: c.isActive
            };
        })
    }
}