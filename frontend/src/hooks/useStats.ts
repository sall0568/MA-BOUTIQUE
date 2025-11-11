import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {getDashboardStats} from '@/api/stats';
import {DashboardStats, ProductStats, ClientStats} from '@/types';  

// Hook pour récupérer les statistiques
export const useStats = () => {
  return useQuery<DashboardStats>({ queryKey: ['stats'], queryFn: getDashboardStats });
};

// Hook pour actualiser les statistiques
export const useRefreshStats = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => getDashboardStats(),
        onSuccess: (data) => {
            queryClient.setQueryData(['Dashboard-Stats'], data);
            toast.success('Statistiques actualisées avec succès');
        },
        onError: () => {
            toast.error('Erreur lors de l\'actualisation des statistiques');
        },
    });
};

// Hook pour récupérer les statistiques des produits
export const useProductStats = () => {
  return useQuery<ProductStats[]>({ queryKey: ['product-stats'], queryFn: () => Promise.resolve([]) }); // Remplacer par l'appel API réel
};

// Hook pour récupérer les statistiques des clients
export const useClientStats = () => {
  return useQuery<ClientStats[]>({ queryKey: ['client-stats'], queryFn: () => Promise.resolve([]) }); // Remplacer par l'appel API réel
};

// Hook pour actualiser les statistiques des produits
export const useRefreshProductStats = () => {
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => Promise.resolve([]), // Remplacer par l'appel API réel
        onSuccess: (data) => {
            queryClient.setQueryData(['product-stats'], data);
            toast.success('Statistiques des produits actualisées avec succès');
        },
        onError: () => {
            toast.error('Erreur lors de l\'actualisation des statistiques des produits');
        },
    });
};

// Hook pour actualiser les statistiques des clients
export const useRefreshClientStats = () => {
  const queryClient = useQueryClient(); 
    return useMutation({
        mutationFn: () => Promise.resolve([]), // Remplacer par l'appel API réel
        onSuccess: (data) => {
            queryClient.setQueryData(['client-stats'], data);
            toast.success('Statistiques des clients actualisées avec succès');
        },
        onError: () => {
            toast.error('Erreur lors de l\'actualisation des statistiques des clients');
        },
    });
};


