import api from './axios';
import { Credit, ApiResponse } from '@/types';

export const getAllCredits = async (filters?: any): Promise<Credit[]> => {
  const response = await api.get<ApiResponse<Credit[]>>('/credits', { params: filters });
  return response.data.data || [];
};

export const payCredit = async (id: number, montant?: number): Promise<Credit> => {
  const response = await api.patch<ApiResponse<Credit>>(`/credits/${id}/pay`, { montant });
  return response.data.data!;
};