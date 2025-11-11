import api from './axios';
import { Client, ClientFormData, ApiResponse } from '@/types';

export const getAllClients = async (): Promise<Client[]> => {
  const response = await api.get<ApiResponse<Client[]>>('/clients');
  return response.data.data || [];
};

export const createClient = async (data: ClientFormData): Promise<Client> => {
  const response = await api.post<ApiResponse<Client>>('/clients', data);
  return response.data.data!;
};

export const updateClient = async (id: number, data: Partial<ClientFormData>): Promise<Client> => {
  const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
  return response.data.data!;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};