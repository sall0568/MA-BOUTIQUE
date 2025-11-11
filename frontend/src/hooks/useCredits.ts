import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {getAllCredits, payCredit} from '@/api/credits';
import {Credit} from '@/types';

// Hook pour récupérer tous les crédits
export const useCredits = () => {
  return useQuery<Credit[]>({ queryKey: ['credits'], queryFn: getAllCredits, staleTime: 1000 * 60 * 5 }); // 5 minutes
};

// Hook pour payer un crédit
export const usePayCredit = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, montant }: { id: number; montant?: number }) => payCredit(id, montant),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success('Paiement de crédit effectué avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erreur lors du paiement du crédit');
        },
    });
};