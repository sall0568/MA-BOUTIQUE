import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/api/axios";
import toast from "react-hot-toast";

interface User {
  id: number;
  email: string;
  nom: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initAdmin: (email: string, password: string, nom: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Définir le token dans axios
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      if (!accessToken) {
        throw new Error("Token d'accès manquant dans la réponse");
      }

      setUser(userData);
      setToken(accessToken);

      // Sauvegarder dans le localStorage
      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      // Définir le token dans axios
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      toast.success(`Bienvenue ${userData.nom} !`);
    } catch (error: any) {
      const message = error.response?.data?.error || "Erreur de connexion";
      toast.error(message);
      throw error;
    }
  };

  const initAdmin = async (email: string, password: string, nom: string) => {
    try {
      const response = await api.post("/auth/init", { email, password, nom });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      if (!accessToken) {
        throw new Error("Token d'accès manquant dans la réponse");
      }

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      toast.success("Compte administrateur créé avec succès !");
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Erreur lors de l'initialisation";
      toast.error(message);
      throw error;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await api.post("/auth/refresh", {
        refreshToken: refreshTokenValue,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      if (!accessToken) {
        return false;
      }

      setToken(accessToken);
      localStorage.setItem("token", accessToken);
      
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      return true;
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      
      // Envoyer le refresh token au backend pour le révoquer
      if (refreshTokenValue) {
        try {
          await api.post("/auth/logout", {
            refreshToken: refreshTokenValue,
          });
        } catch (error) {
          // Ignorer les erreurs de déconnexion (peut être déjà déconnecté)
          console.warn("Erreur lors de la déconnexion côté serveur:", error);
        }
      }
    } catch (error) {
      console.warn("Erreur lors de la déconnexion:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
      toast.success("Déconnexion réussie");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        initAdmin,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
