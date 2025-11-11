import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {getAllExpenses, createExpense, deleteExpense} from '@/api/expenses';
import {Expense} from '@/types';

// Hook pour récupérer toutes les dépenses
export const useExpenses = () => {
  return useQuery<Expense[]>({ queryKey: ['expenses'], queryFn: getAllExpenses, staleTime: 1000 * 60 * 5 }); // 5 minutes
};

// Hook pour créer une dépense
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Expense, 'id' | 'createdAt'>) => createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Dépense créée avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erreur lors de la création');
        },
    });
};

// Hook pour supprimer une dépense
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Dépense supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });
};