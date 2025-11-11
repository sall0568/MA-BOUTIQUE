import { useState, useRef, useEffect } from 'react';
import { X, Scan, Search, AlertCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useCreateSale } from '@/hooks/useSales';
import { SaleModalProps } from '@/types';
import { formatMoney } from '@/utils/formatters';

const SaleModal = ({ isOpen, onClose, onSuccess }: SaleModalProps) => {
  const [searchMode, setSearchMode] = useState<'scan' | 'search'>('scan');
  const [barcode, setBarcode] = useState('');
  const [formData, setFormData] = useState({
    productId: 0,
    quantite: '',
    client: 'Client anonyme',
    typeVente: 'comptant' as 'comptant' | 'credit'
  });

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const createSale = useCreateSale();

  useEffect(() => {
    if (searchMode === 'scan' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [searchMode]);

  const handleBarcodeSearch = (code: string) => {
    const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (product) {
      setFormData({ ...formData, productId: product.id });
      setBarcode('');
    } else {
      alert(`Aucun produit trouvé avec le code: ${code}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const client = clients.find(c => c.nom === formData.client);
    
    await createSale.mutateAsync({
      productId: formData.productId,
      clientId: client?.id,
      quantite: parseInt(formData.quantite),
      typeVente: formData.typeVente
    });
    
    onSuccess();
  };

  const selectedProduct = products.find(p => p.id === formData.productId);
  const montantTotal = selectedProduct && formData.quantite
    ? selectedProduct.prixVente * parseInt(formData.quantite)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Nouvelle vente</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode de sélection */}
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setSearchMode('scan')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 ${
                searchMode === 'scan'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <Scan size={20} />
              <span>Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('search')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 ${
                searchMode === 'search'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              <Search size={20} />
              <span>Recherche</span>
            </button>
          </div>

          {searchMode === 'scan' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && barcode && handleBarcodeSearch(barcode)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Scannez ou tapez le code..."
                autoFocus
              />
            </div>
          )}

          {searchMode === 'search' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom} - Stock: {p.stock} - {formatMoney(p.prixVente)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProduct && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-800">{selectedProduct.nom}</h4>
              <p className="text-sm text-gray-600">Stock: {selectedProduct.stock}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="Client anonyme">Client anonyme</option>
              {clients.map(c => (
                <option key={c.id} value={c.nom}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, typeVente: 'comptant' })}
              className={`px-4 py-3 rounded-lg border-2 ${
                formData.typeVente === 'comptant'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600'
              }`}
            >
              💵 Comptant
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, typeVente: 'credit' })}
              disabled={formData.client === 'Client anonyme'}
              className={`px-4 py-3 rounded-lg border-2 ${
                formData.typeVente === 'credit'
                  ? 'border-orange-600 bg-orange-50 text-orange-700'
                  : 'border-gray-300 text-gray-600'
              } disabled:opacity-50`}
            >
              🕐 Crédit
            </button>
          </div>

          {montantTotal > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-2xl font-bold text-green-600">{formatMoney(montantTotal)}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={createSale.isPending} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleModal;