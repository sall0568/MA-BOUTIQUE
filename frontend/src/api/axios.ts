// frontend/src/api/axios.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Créer une instance Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ajouter le token JWT si disponible
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Logger en développement
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Logger en développement
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError) => {
    // Gestion des erreurs
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.error || 'Une erreur est survenue';

      switch (status) {
        case 400:
          toast.error(message);
          break;
        case 401:
          toast.error('Session expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Accès refusé');
          break;
        case 404:
          toast.error(message);
          break;
        case 409:
          toast.error(message);
          break;
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      toast.error('Une erreur inattendue est survenue');
    }

    console.error('❌ Erreur de réponse:', error);
    return Promise.reject(error);
  }
);

export default api;