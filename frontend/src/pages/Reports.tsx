import { useStats } from "@/hooks/useStats";
import { formatMoney } from "@/utils/formatters";
import { TrendingUp, Package, Users, DollarSign } from "lucide-react";

const Reports = () => {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">
        Rapports & Statistiques
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">
              Résumé Financier
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ventes mois:</span>
              <span className="font-bold text-green-600">
                {formatMoney(stats?.ventesMois || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bénéfices:</span>
              <span className="font-bold text-green-600">
                {formatMoney(stats?.beneficeTotal || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dépenses:</span>
              <span className="font-bold text-red-600">
                {formatMoney(stats?.depensesMois || 0)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-gray-800 font-medium">Bénéfice net:</span>
              <span className="font-bold text-blue-600">
                {formatMoney(stats?.beneficeNet || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="text-purple-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Stock</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Produits actifs:</span>
              <span className="font-bold text-gray-800">
                {stats?.totalProduits || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valeur stock:</span>
              <span className="font-bold text-purple-600">
                {formatMoney(stats?.valeurStock || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Alertes:</span>
              <span className="font-bold text-red-600">
                {stats?.produitsEnRupture || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Clients</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total clients:</span>
              <span className="font-bold text-gray-800">
                {stats?.totalClients || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Crédits en cours:</span>
              <span className="font-bold text-orange-600">
                {formatMoney(stats?.creditEnCours || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
