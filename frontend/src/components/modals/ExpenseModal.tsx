import { useState } from "react";
import { X } from "lucide-react";
import { useCreateExpense } from "@/hooks/useExpenses";
import { ExpenseModalProps, EXPENSE_CATEGORIES } from "@/types";
import { formatMoney } from "@/utils/formatters";
import { parsePath } from "react-router-dom";

const ExpenseModal = ({ isOpen, onClose, onSuccess }: ExpenseModalProps) => {
  const [formData, setFormData] = useState({
    description: "",
    montant: "",
    categorie: "Autre",
  });
  const createExpense = useCreateExpense();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpense.mutateAsync({
      description: formData.description,
      montant: parseFloat(formData.montant),
      categorie: formData.categorie,
      date: "",
    });
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Nouvelle dépense</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) =>
                setFormData({ ...formData, montant: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categorie}
              onChange={(e) =>
                setFormData({ ...formData, categorie: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {formData.montant && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Montant:</span>
                <span className="text-xl font-bold text-red-600">
                  {formatMoney(parseFloat(formData.montant))}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createExpense.isPending}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
