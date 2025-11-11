// frontend/src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
  getLowStockProducts,
} from '@/api/products';
import { Product, ProductFormData } from '@/types';

// Hook pour récupérer tous les produits
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook pour récupérer un produit par ID
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
};

// Hook pour rechercher un produit par code
export const useProductByCode = (code: string) => {
  return useQuery({
    queryKey: ['product', 'code', code],
    queryFn: () => getProductByCode(code),
    enabled: !!code && code.length > 0,
    retry: false,
  });
};

// Hook pour les produits en alerte stock
export const useLowStockProducts = (threshold: number) => {
  return useQuery({
    queryKey: ['products', 'low-stock', threshold],
    queryFn: () => getLowStockProducts(threshold),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook pour créer un produit
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    },
  });
};

// Hook pour mettre à jour un produit
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductFormData | Partial<ProductFormData> }) =>
      updateProduct(id, data as ProductFormData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Produit mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });
};

// Hook pour réapprovisionner un produit
export const useRestockProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantite }: { id: number; quantite: number }) =>
      restockProduct(id, quantite),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Réapprovisionnement effectué avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du réapprovisionnement');
    },
  });
};

// Hook pour supprimer un produit
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });
};