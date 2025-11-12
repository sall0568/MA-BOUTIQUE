import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Clock,
  TrendingDown,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: any;
  color: string;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      path: "/dashboard",
      icon: TrendingUp,
      color: "blue",
    },
    {
      id: "products",
      label: "Produits",
      path: "/products",
      icon: Package,
      color: "purple",
    },
    {
      id: "sales",
      label: "Ventes",
      path: "/sales",
      icon: ShoppingCart,
      color: "green",
    },
    {
      id: "clients",
      label: "Clients",
      path: "/clients",
      icon: Users,
      color: "indigo",
    },
    {
      id: "credits",
      label: "Crédits",
      path: "/credits",
      icon: Clock,
      color: "orange",
    },
    {
      id: "expenses",
      label: "Dépenses",
      path: "/expenses",
      icon: TrendingDown,
      color: "red",
    },
    {
      id: "reports",
      label: "Rapports",
      path: "/reports",
      icon: BarChart3,
      color: "cyan",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  📊 Ma Boutique Pro
                </h1>
                <p className="text-sm text-gray-600">
                  Gestion complète de votre commerce
                </p>
              </div>
            </div>

            {/* Utilisateur et déconnexion */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <User size={18} className="text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{user?.nom}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white shadow-lg border-r
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
          mt-[73px] lg:mt-0
        `}
        >
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      active
                        ? `bg-${item.color}-50 text-${item.color}-600 font-medium`
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Version */}
            <div className="pt-4 mt-4 border-t">
              <p className="text-xs text-gray-400 px-4">Version 1.0.0</p>
            </div>
          </nav>
        </aside>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
