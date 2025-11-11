import api from './axios';
import { Sale, SaleFormData, ApiResponse } from '@/types';

export const getAllSales = async (filters?: any): Promise<Sale[]> => {
  const response = await api.get<ApiResponse<Sale[]>>('/sales', { params: filters });
  return response.data.data || [];
};

export const createSale = async (data: SaleFormData): Promise<Sale> => {
  const response = await api.post<ApiResponse<Sale>>('/sales', data);
  return response.data.data!;
};

export const deleteSale = async (id: number): Promise<void> => {
  await api.delete(`/sales/${id}`);
};