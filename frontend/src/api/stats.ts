import api from './axios';
import { DashboardStats, ApiResponse } from '@/types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>('/stats/dashboard');
  return response.data.data!;
};