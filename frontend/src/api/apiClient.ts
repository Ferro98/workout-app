// src/api/apiClient.ts

const API_BASE_URL = 'http://localhost:8000'; // Sposta in un file .env in produzione

/**
 * Funzione base che wrappa la fetch nativa.
 * Agisce come l'interceptor di Axios: attacca il token e lancia errori se lo status non è 2xx.
 */
async function customFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  // Inizializza gli headers
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Attacca il token JWT se esiste
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Costruisci la configurazione finale
  const config: RequestInit = {
    ...options,
    headers,
  };

  // Esegue la chiamata
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Gestione Errori: a differenza di Axios, fetch NON lancia eccezioni per errori HTTP (es. 404 o 401).
  // Dobbiamo forzarlo noi.
  if (!response.ok) {
    // Prova a estrarre il dettaglio dell'errore (il "detail" di FastAPI)
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (e) {
      // Se il body non è JSON, mantieni l'errore generico
    }
    throw new Error(errorMessage);
  }

  // Se la risposta è 204 (No Content), non c'è JSON da parsare
  if (response.status === 204) {
    return null;
  }

  // Ritorna direttamente i dati parsati, proprio come facevi con axios (response.data)
  return response.json();
}

// Esportiamo un oggetto apiClient con la stessa "forma" di Axios
// così nei tuoi service non dovrai cambiare il modo in cui scrivi le chiamate!
export const apiClient = {
  get: (endpoint: string, options?: RequestInit) => 
    customFetch(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body: any, options?: RequestInit) => 
    customFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: (endpoint: string, body: any, options?: RequestInit) => 
    customFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: (endpoint: string, options?: RequestInit) => 
    customFetch(endpoint, { ...options, method: 'DELETE' }),
};