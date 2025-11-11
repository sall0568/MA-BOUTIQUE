import { useState } from "react";
import { Plus, Edit2, Trash2, Phone, User } from "lucide-react";
import { useClients, useDeleteClient } from "@/hooks/useClients";
import { formatMoney } from "@/utils/formatters";
import { Client } from "@/types";
import ClientModal from "@/components/modals/ClientModal";

const Clients = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { data: clients = [], isLoading } = useClients();
  const deleteClient = useDeleteClient();

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      await deleteClient.mutateAsync(id);
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
        <h2 className="text-3xl font-bold text-gray-800">Mes Clients</h2>
        <button
          onClick={() => {
            setEditingClient(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Nouveau client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {client.nom}
                  </h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{client.telephone}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Achats total:</span>
                <span className="font-bold text-gray-800">
                  {formatMoney(client.achatsTotal)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Crédit en cours:</span>
                <span
                  className={`font-bold ${
                    client.credit > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatMoney(client.credit)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ClientModal
          client={editingClient as Client | undefined}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingClient(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
};

export default Clients;
