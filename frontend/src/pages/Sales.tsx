import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { formatMoney, formatDateShort } from '@/utils/formatters';
import SaleModal from '@/components/modals/SaleModal';

const Sales = () => {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const { data: sales = [], isLoading } = useSales();
  const { data: products = [] } = useProducts();

  const filteredSales = sales; // Ajoutez les filtres ici

  const totalVentes = filteredSales.reduce((sum, v) => sum + v.total, 0);
  const totalBenefice = filteredSales.reduce((sum, v) => {
    const product = products.find(p => p.id === v.productId);
    return sum + (product ? (v.prixUnitaire - product.prixAchat) * v.quantite : 0);
  }, 0);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Ventes</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          <span>Nouvelle vente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Nombre de ventes</p>
          <p className="text-2xl font-bold text-gray-800">{filteredSales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total des ventes</p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(totalVentes)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total bénéfice</p>
          <p className="text-2xl font-bold text-orange-600">{formatMoney(totalBenefice)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">{formatDateShort(sale.date)}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{sale.product?.nom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{sale.client?.nom || 'Anonyme'}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{sale.quantite}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">{formatMoney(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <SaleModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />}
    </div>
  );
};

export default Sales;