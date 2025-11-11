import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {getAllClients, createClient, updateClient, deleteClient} from '@/api/clients';
import {Client, ClientFormData} from '@/types';

// Hook pour récupérer tous les clients
export const useClients = () => {
  return useQuery<Client[]>({ queryKey: ['clients'], queryFn: getAllClients, staleTime: 1000 * 60 * 5 }); // 5 minutes
};


// Hook pour créer un client
export const useCreateClient = () => {
  const queryClient = useQueryClient();        
  return useMutation({
    mutationFn: (data: Omit<ClientFormData, 'id'>) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du client');
    },
  });
};

// Hook pour mettre à jour un client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientFormData }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du client');
    },
  });
};

// Hook pour supprimer un client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression du client');
    },
  });
};
