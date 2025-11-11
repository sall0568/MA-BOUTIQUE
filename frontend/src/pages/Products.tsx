import { useState } from "react";
import { Plus, Search, Edit2, Trash2, RefreshCw, Package } from "lucide-react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { formatMoney } from "@/utils/formatters";
import { Product } from "@/types";
import ProductModal from "@/components/modals/ProductModal";
import RestockModal from "@/components/modals/RestockModal";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(
    null
  );

  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  // Filtrer les produits
  const filteredProducts = products.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await deleteProduct.mutateAsync(id);
    }
  };

  const handleRestock = (product: Product) => {
    setRestockingProduct(product);
    setShowRestockModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleCloseRestockModal = () => {
    setShowRestockModal(false);
    setRestockingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Mes Produits</h2>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} produits au total
          </p>
        </div>

        <button
          onClick={() => setShowProductModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          <span>Nouveau produit</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Rechercher par nom, code ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des produits */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm ? "Aucun produit trouvé" : "Aucun produit"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Essayez avec un autre terme de recherche"
              : "Commencez par ajouter votre premier produit"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Ajouter un produit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Header produit */}
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      {product.nom}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {product.categorie}
                    </span>
                    {product.stock <= product.stockMin && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>Stock bas</span>
                      </span>
                    )}
                  </div>

                  {/* Informations produit */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Code</p>
                      <p className="font-medium text-gray-800">
                        {product.code}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prix achat</p>
                      <p className="font-bold text-gray-800">
                        {formatMoney(product.prixAchat)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prix vente</p>
                      <p className="font-bold text-green-600">
                        {formatMoney(product.prixVente)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Stock</p>
                      <p
                        className={`font-bold ${
                          product.stock <= product.stockMin
                            ? "text-red-600"
                            : "text-gray-800"
                        }`}
                      >
                        {product.stock} unités
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fournisseur</p>
                      <p className="font-medium text-gray-800">
                        {product.fournisseur || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Marge</p>
                      <p className="font-bold text-orange-600">
                        {formatMoney(product.prixVente - product.prixAchat)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleRestock(product)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Réapprovisionner"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editingProduct as Product | undefined}
          isOpen={showProductModal}
          onClose={handleCloseProductModal}
          onSuccess={handleCloseProductModal}
        />
      )}

      {showRestockModal && restockingProduct && (
        <RestockModal
          product={restockingProduct}
          isOpen={showRestockModal}
          onClose={handleCloseRestockModal}
          onSuccess={handleCloseRestockModal}
        />
      )}
    </div>
  );
};

export default Products;
