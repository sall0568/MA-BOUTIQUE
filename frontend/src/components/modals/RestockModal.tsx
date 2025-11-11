import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { useRestockProduct } from '@/hooks/useProducts';
import { Product, RestockModalProps } from '@/types';
import { formatMoney } from '@/utils/formatters';

const RestockModal = ({ product, isOpen, onClose, onSuccess }: RestockModalProps) => {
  const [quantite, setQuantite] = useState('');
  const restockProduct = useRestockProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await restockProduct.mutateAsync({
      id: product.id,
      quantite: parseInt(quantite)
    });
    onSuccess();
  };

  const coutTotal = product.prixAchat * parseInt(quantite || '0');
  const nouveauStock = product.stock + parseInt(quantite || '0');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Package className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Réapprovisionner</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-bold text-gray-800 mb-2">{product.nom}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Stock actuel:</p>
                <p className="font-bold text-gray-800">{product.stock} unités</p>
              </div>
              <div>
                <p className="text-gray-600">Stock minimum:</p>
                <p className="font-bold text-gray-800">{product.stockMin} unités</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité à ajouter <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
                autoFocus
              />
            </div>

            {quantite && parseInt(quantite) > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Récapitulatif</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité ajoutée:</span>
                    <span className="font-bold text-gray-800">{quantite} unités</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nouveau stock:</span>
                    <span className="font-bold text-green-600">{nouveauStock} unités</span>
                  </div>
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Coût total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatMoney(coutTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!quantite || parseInt(quantite) <= 0 || restockProduct.isPending}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Réapprovisionner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;