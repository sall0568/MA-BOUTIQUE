import api from './axios';
import { Expense, ExpenseFormData, ApiResponse } from '@/types';

export const getAllExpenses = async (filters?: any): Promise<Expense[]> => {
  const response = await api.get<ApiResponse<Expense[]>>('/expenses', { params: filters });
  return response.data.data || [];
};

export const createExpense = async (data: ExpenseFormData): Promise<Expense> => {
  const response = await api.post<ApiResponse<Expense>>('/expenses', data);
  return response.data.data!;
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};