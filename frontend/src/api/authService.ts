import type { LoginPayload, RegisterPayload, TokenResponse, UserMe } from '../types';
import { apiClient } from './apiClient';

export const authService = {
  /**
   * Effettua il Login
   * NOTA: Se FastAPI usa OAuth2PasswordRequestForm, dobbiamo inviare i dati come FormData.
   */
  login: async (credentials: LoginPayload): Promise<TokenResponse> => {
    // Convertiamo il JSON in URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    // Poiché apiClient imposta 'application/json' di default, qui usiamo fetch direttamente 
    // per non sovrascrivere l'header necessario al FormData.
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      body: formData,
      // Non settiamo il Content-Type, il browser lo imposterà in automatico a application/x-www-form-urlencoded
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login fallito. Controlla le credenziali.');
    }

    const data: TokenResponse = await response.json();
    
    // Salva il token nel browser!
    localStorage.setItem('token', data.access_token);
    
    return data;
  },

  /**
   * Effettua la Registrazione (JSON standard)
   */
  register: async (payload: RegisterPayload): Promise<any> => {
    // Qui possiamo usare tranquillamente il nostro apiClient perché è un normale JSON
    return await apiClient.post('/auth/register', payload);
  },

  /**
   * Ottiene i dati dell'utente loggato (utile all'avvio dell'app per capire chi è)
   */
  getMe: async (): Promise<UserMe> => {
    return await apiClient.get('/users/me'); // Adatta questo URL al tuo endpoint reale
  },

  /**
   * Effettua il Logout cancellando il token
   */
  logout: () => {
    localStorage.removeItem('token');
    // Opzionale: reindirizza alla pagina di login
    window.location.href = '/login'; 
  }
};