import api from "./axios";
import { Product, ProductFormData, ApiResponse } from "@/types";

export const getAllProducts = async (filters?: any): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>("/products", { params: filters });
  return response.data.data || [];
};

export const getProductById = async (id: number): Promise<Product | null> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data.data || null;
};

export const getProductByCode = async (code: string): Promise<Product | null> => {
  const response = await api.get<ApiResponse<Product>>(`/products/code/${code}`);
  return response.data.data || null;
};


export const createProduct = async (data: ProductFormData): Promise<Product> => {
  const response = await api.post<ApiResponse<Product>>("/products", data);
  return response.data.data!;
};

export const updateProduct = async (id: number, data: ProductFormData): Promise<Product> => {
  const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return response.data.data!;
};

export const restockProduct = async (id: number, quantity: number): Promise<Product> => {
  const response = await api.post<ApiResponse<Product>>(`/products/${id}/restock`, { quantity });
  return response.data.data!;
};

export const getLowStockProducts = async (threshold: number): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>("/products/low-stock", { params: { threshold } });
  return response.data.data || [];
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};
