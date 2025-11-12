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
  logout: () => void;
  initAdmin: (email: string, password: string, nom: string) => Promise<void>;
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
      const { user: userData, token: userToken } = response.data.data;

      setUser(userData);
      setToken(userToken);

      // Sauvegarder dans le localStorage
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Définir le token dans axios
      api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

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
      const { user: userData, token: userToken } = response.data.data;

      setUser(userData);
      setToken(userToken);

      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));

      api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      toast.success("Compte administrateur créé avec succès !");
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Erreur lors de l'initialisation";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    toast.success("Déconnexion réussie");
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
