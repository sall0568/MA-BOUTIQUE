import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { usePayCredit } from "@/hooks/useCredits";
import { CreditPaymentModalProps } from "@/types";
import { formatMoney } from "@/utils/formatters";

const CreditPaymentModal = ({
  credit,
  isOpen,
  onClose,
  onSuccess,
}: CreditPaymentModalProps) => {
  const [montant, setMontant] = useState("");
  const payCredit = usePayCredit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await payCredit.mutateAsync({
      id: credit.id,
      montant: montant ? parseFloat(montant) : undefined,
    });
    onSuccess();
  };

  const montantRestant = credit.montantRestant || credit.montant;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="text-green-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Payer le crédit</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600">Client</p>
          <p className="font-bold text-gray-800">{credit.clientId}</p>
          <p className="text-sm text-gray-600 mt-2">Montant restant</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatMoney(montantRestant)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant à payer (laisser vide pour payer tout)
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder={`Max: ${montantRestant} FCFA`}
              min="0"
              max={montantRestant}
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">
                Montant du paiement:
              </span>
              <span className="text-xl font-bold text-green-600">
                {formatMoney(montant ? parseFloat(montant) : montantRestant)}
              </span>
            </div>
          </div>

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
              disabled={payCredit.isPending}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              Confirmer le paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditPaymentModal;
