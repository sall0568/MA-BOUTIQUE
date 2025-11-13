import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  Users,
  ShoppingCart,
  Activity
} from "lucide-react";
import { useLowStockProducts } from "@/hooks/useProducts";
import { formatMoney } from "@/utils/formatters";
import api from "@/api/axios";
import { DashboardStats, Product } from "@/types";
import RestockModal from "@/components/modals/RestockModal";

const Dashboard = () => {
  const [showReapproModal, setShowReapproModal] = useState(false);
  const [productToReappro, setProductToReappro] = useState<Product | null>(null);

  // Récupérer les statistiques
  const { data: stats, isLoading: statsLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["stats", "dashboard"],
    queryFn: async () => {
      const response = await api.get("/stats/dashboard");
      return response.data.data;
    },
    refetchInterval: 60000 // Actualiser toutes les minutes
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const beneficeRate = stats?.ventesMois 
    ? ((stats.beneficeNet / stats.ventesMois) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Titre avec bouton actualiser */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Tableau de bord</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Indicateurs de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Ventes Aujourd'hui"
          value={formatMoney(stats?.ventesAujourdhui || 0)}
          icon={ShoppingCart}
          color="blue"
          trend="+12%"
          trendUp={true}
        />
        <KPI
          label="Bénéfice Net"
          value={formatMoney(stats?.beneficeNet || 0)}
          icon={TrendingUp}
          color="green"
          subtitle={`Marge: ${beneficeRate}%`}
        />
        <KPI
          label="Valeur du Stock"
          value={formatMoney(stats?.valeurStock || 0)}
          icon={Package}
          color="purple"
          subtitle={`${stats?.totalProduits || 0} produits`}
        />
        <KPI
          label="Crédits en Cours"
          value={formatMoney(stats?.creditEnCours || 0)}
          icon={Clock}
          color="orange"
          subtitle={`${stats?.totalClients || 0} clients`}
        />
      </div>

      {/* Graphiques et Statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2 text-blue-600" size={24} />
            Évolution des Ventes
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Aujourd'hui"
              value={stats?.ventesAujourdhui || 0}
              max={stats?.ventesSemaine || 1}
              color="blue"
            />
            <ProgressBar
              label="Cette Semaine"
              value={stats?.ventesSemaine || 0}
              max={stats?.ventesMois || 1}
              color="green"
            />
            <ProgressBar
              label="Ce Mois"
              value={stats?.ventesMois || 0}
              max={stats?.ventesMois || 1}
              color="purple"
              percentage={100}
            />
          </div>
        </div>

        {/* Résumé Financier */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <DollarSign className="mr-2 text-green-600" size={24} />
            Résumé Financier (Mois)
          </h3>
          <div className="space-y-4">
            <FinancialRow
              label="Total Ventes"
              value={stats?.ventesMois || 0}
              color="green"
              icon={TrendingUp}
            />
            <FinancialRow
              label="Dépenses"
              value={stats?.depensesMois || 0}
              color="red"
              icon={TrendingDown}
            />
            <div className="border-t pt-4">
              <FinancialRow
                label="Bénéfice Net"
                value={stats?.beneficeNet || 0}
                color="blue"
                icon={DollarSign}
                bold
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alertes Stock */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500" size={24} />
            <h3 className="text-xl font-bold text-gray-800">
              Alertes Stock ({lowStockProducts.length})
            </h3>
          </div>
          {lowStockProducts.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Action requise
            </span>
          )}
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
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Package className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{product.nom}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">
                          Stock: <span className="font-bold text-red-600">{product.stock}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Min: <span className="font-bold">{product.stockMin}</span>
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleReappro(product)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Réapprovisionner</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Nouvelle Vente"
          description="Enregistrer une vente rapidement"
          link="/sales"
          icon={ShoppingCart}
          color="green"
        />
        <QuickActionCard
          title="Ajouter un Produit"
          description="Créer un nouveau produit"
          link="/products"
          icon={Package}
          color="purple"
        />
        <QuickActionCard
          title="Voir les Rapports"
          description="Consulter les statistiques détaillées"
          link="/reports"
          icon={Activity}
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
            refetch();
          }}
        />
      )}
    </div>
  );
};

// Composant KPI
interface KPIProps {
  label: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}

const KPI = ({ label, value, icon: Icon, color, trend, trendUp, subtitle }: KPIProps) => {
  const colors = {
    blue: 'border-blue-500 bg-blue-50 text-blue-600',
    green: 'border-green-500 bg-green-50 text-green-600',
    purple: 'border-purple-500 bg-purple-50 text-purple-600',
    orange: 'border-orange-500 bg-orange-50 text-orange-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500 hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color].split(' ')[1]}`}>
          <Icon className={colors[color].split(' ')[2]} size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
      <div className="flex items-center justify-between">
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-gray-500">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

// Composant ProgressBar
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: 'blue' | 'green' | 'purple';
  percentage?: number;
}

const ProgressBar = ({ label, value, max, color, percentage }: ProgressBarProps) => {
  const percent = percentage || (max > 0 ? (value / max) * 100 : 0);
  
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-800">{formatMoney(value)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Composant FinancialRow
interface FinancialRowProps {
  label: string;
  value: number;
  color: 'green' | 'red' | 'blue';
  icon: any;
  bold?: boolean;
}

const FinancialRow = ({ label, value, color, icon: Icon, bold }: FinancialRowProps) => {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className={colors[color]} size={18} />
        <span className={`text-gray-700 ${bold ? 'font-bold' : ''}`}>{label}</span>
      </div>
      <span className={`${bold ? 'text-xl font-bold' : 'font-medium'} ${colors[color]}`}>
        {formatMoney(value)}
      </span>
    </div>
  );
};

// Composant QuickActionCard
interface QuickActionCardProps {
  title: string;
  description: string;
  link: string;
  icon: any;
  color: string;
}

const QuickActionCard = ({ title, description, link, icon: Icon, color }: QuickActionCardProps) => (
  <a
    href={link}
    className={`block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 border-l-4 border-${color}-500`}
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className={`p-3 bg-${color}-50 rounded-lg`}>
        <Icon className={`text-${color}-600`} size={24} />
      </div>
      <h4 className="font-bold text-gray-800">{title}</h4>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </a>
);

export default Dashboard;