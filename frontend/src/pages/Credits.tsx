import { useState } from "react";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { formatMoney, formatDateShort } from "@/utils/formatters";
import { Credit } from "@/types";
import CreditPaymentModal from "@/components/modals/CreditPaymentModal";

const Credits = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const { data: credits = [], isLoading } = useCredits();

  const creditsEnCours = credits.filter((c) => c.statut === "En cours");
  const totalEnCours = creditsEnCours.reduce(
    (sum, c) => sum + (c.montantRestant || c.montant),
    0
  );

  const handlePay = (credit: Credit) => {
    setSelectedCredit(credit);
    setShowPaymentModal(true);
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
      <h2 className="text-3xl font-bold text-gray-800">Gestion des Crédits</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Crédits en cours</p>
          <p className="text-2xl font-bold text -gray-800">
            {creditsEnCours.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total en cours</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatMoney(totalEnCours)}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Montant restant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {credits.map((credit) => {
              const montantRestant = credit.montantRestant || credit.montant;
              return (
                <tr key={credit.id} className="border-b">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {credit.clientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatMoney(credit.montant)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatMoney(montantRestant)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {formatDateShort(credit.dateCredit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {credit.statut === "Payé" ? (
                      <span className="flex items-center text-green-600 font-bold">
                        <CheckCircle className="mr-1" size={16} />
                        Payé
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 font-bold">
                        <Clock className="mr-1" size={16} />
                        En cours
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {credit.statut === "En cours" && (
                      <button
                        onClick={() => handlePay(credit)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedCredit && (
        <CreditPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          credit={selectedCredit}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedCredit(null);
          }}
        />
      )}
    </div>
  );
};

export default Credits;
