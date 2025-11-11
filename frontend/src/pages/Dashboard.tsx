// frontend/src/pages/Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { useLowStockProducts } from "@/hooks/useProducts";
import { formatMoney } from "@/utils/formatters";
import api from "@/api/axios";
import { DashboardStats, Product } from "@/types";
import RestockModal from "@/components/modals/RestockModal";

const Dashboard = () => {
  const [showReapproModal, setShowReapproModal] = useState(false);
  const [productToReappro, setProductToReappro] = useState<Product | null>(
    null
  );

  // Récupérer les statistiques
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["stats", "dashboard"],
    queryFn: async () => {
      const response = await api.get("/stats/dashboard");
      return response.data.data;
    },
  });

  // Récupérer les produits en rupture
  const { data: lowStockProducts = [], isLoading: lowStockLoading } =
    useLowStockProducts(5);

  const handleReappro = (product: Product) => {
    setProductToReappro(product);
    setShowReapproModal(true);
  };

  if (statsLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Tableau de bord</h2>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventes du jour"
          value={formatMoney(stats?.ventesAujourdhui || 0)}
          icon={DollarSign}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Bénéfice net"
          value={formatMoney(stats?.beneficeNet || 0)}
          icon={TrendingUp}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Valeur du stock"
          value={formatMoney(stats?.valeurStock || 0)}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Crédits en cours"
          value={formatMoney(stats?.creditEnCours || 0)}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStatCard
          label="Ventes semaine"
          value={formatMoney(stats?.ventesSemaine || 0)}
        />
        <MiniStatCard
          label="Ventes mois"
          value={formatMoney(stats?.ventesMois || 0)}
        />
        <MiniStatCard
          label="Dépenses mois"
          value={formatMoney(stats?.depensesMois || 0)}
          valueColor="text-red-600"
        />
        <MiniStatCard label="Total clients" value={stats?.totalClients || 0} />
      </div>

      {/* Alertes stock */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-gray-800">
            Alertes Stock ({lowStockProducts.length})
          </h3>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto text-green-500 mb-2" size={48} />
            <p className="text-gray-600">
              ✅ Tous les produits ont un bon niveau de stock
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{product.nom}</h4>
                  <p className="text-sm text-gray-600">
                    Stock:{" "}
                    <span className="font-bold text-red-600">
                      {product.stock}
                    </span>{" "}
                    / Min: <span className="font-bold">{product.stockMin}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Code: {product.code}
                  </p>
                </div>
                <button
                  onClick={() => handleReappro(product)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réapprovisionner
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="Nouvelle vente"
          description="Enregistrer une vente rapidement"
          link="/sales"
          color="green"
        />
        <QuickAction
          title="Ajouter un produit"
          description="Créer un nouveau produit"
          link="/products"
          color="purple"
        />
        <QuickAction
          title="Voir les rapports"
          description="Consulter les statistiques détaillées"
          link="/reports"
          color="cyan"
        />
      </div>

      {/* Modal Réapprovisionnement */}
      {showReapproModal && productToReappro && (
        <RestockModal
          product={productToReappro}
          isOpen={showReapproModal}
          onClose={() => {
            setShowReapproModal(false);
            setProductToReappro(null);
          }}
          onSuccess={() => {
            setShowReapproModal(false);
            setProductToReappro(null);
          }}
        />
      )}
    </div>
  );
};

// Composant StatCard
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: "blue" | "green" | "purple" | "orange";
  trend?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: StatCardProps) => {
  const colors = {
    blue: "border-blue-500 text-blue-500 bg-blue-50",
    green: "border-green-500 text-green-500 bg-green-50",
    purple: "border-purple-500 text-purple-500 bg-purple-50",
    orange: "border-orange-500 text-orange-500 bg-orange-50",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
        colors[color].split(" ")[0]
      } hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colors[color].split(" ")[2]}`}>
          <Icon className={colors[color].split(" ")[1]} size={24} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      {trend && (
        <p className="text-sm text-green-600 font-medium">{trend} vs hier</p>
      )}
    </div>
  );
};

// Composant MiniStatCard
interface MiniStatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

const MiniStatCard = ({
  label,
  value,
  valueColor = "text-gray-800",
}: MiniStatCardProps) => (
  <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
  </div>
);

// Composant QuickAction
interface QuickActionProps {
  title: string;
  description: string;
  link: string;
  color: string;
}

const QuickAction = ({ title, description, link, color }: QuickActionProps) => (
  <a
    href={link}
    className={`block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-l-4 border-${color}-500`}
  >
    <h4 className="font-bold text-gray-800 mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </a>
);

export default Dashboard;
