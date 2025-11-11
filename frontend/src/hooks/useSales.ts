import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getAllSales, createSale, deleteSale } from '@/api/sales';
import { SaleFormData } from '@/types';

// Hook pour récupérer toutes les ventes
export const useSales = (filters?: any) => {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => getAllSales(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook pour créer une vente
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaleFormData) => createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vente enregistrée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la vente');
    },
  });
};

// Hook pour annuler une vente
export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vente annulée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });
};