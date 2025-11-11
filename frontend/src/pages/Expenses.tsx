import { useState } from "react";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import { formatMoney, formatDateShort } from "@/utils/formatters";
import ExpenseModal from "@/components/modals/ExpenseModal";

const Expenses = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const totalDepenses = expenses.reduce((sum, d) => sum + d.montant, 0);

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      await deleteExpense.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dépenses</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
        >
          <Plus size={20} />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingDown className="text-red-600" size={32} />
          <div>
            <p className="text-sm text-gray-600">Total des dépenses</p>
            <p className="text-3xl font-bold text-red-600">
              {formatMoney(totalDepenses)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">
                  {formatDateShort(expense.date)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  {expense.description}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                    {expense.categorie}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-red-600">
                  {formatMoney(expense.montant)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ExpenseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Expenses;
