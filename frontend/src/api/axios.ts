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

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Gestion des erreurs
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.error || 'Une erreur est survenue';

      // Si erreur 401 et ce n'est pas une requête de refresh et on n'a pas déjà tenté de refresh
      if (status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
        if (isRefreshing) {
          // Si un refresh est déjà en cours, mettre la requête en queue
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return api(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Pas de refresh token, déconnexion
          processQueue(new Error('No refresh token'), null);
          isRefreshing = false;
          handleLogout();
          return Promise.reject(error);
        }

        try {
          // Tenter de rafraîchir le token
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Mettre à jour les tokens
          localStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Mettre à jour l'en-tête de la requête originale
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Traiter la queue
          processQueue(null, accessToken);
          isRefreshing = false;

          // Réessayer la requête originale
          return api(originalRequest);
        } catch (refreshError) {
          // Le refresh a échoué, déconnexion
          processQueue(refreshError, null);
          isRefreshing = false;
          handleLogout();
          return Promise.reject(refreshError);
        }
      }

      // Gestion des autres erreurs
      switch (status) {
        case 400:
          toast.error(message);
          break;
        case 401:
          // Déjà géré ci-dessus, mais au cas où
          handleLogout();
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

// Fonction pour gérer la déconnexion
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  toast.error('Session expirée. Veuillez vous reconnecter.');
  window.location.href = '/login';
};

export default api;