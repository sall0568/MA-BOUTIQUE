// ========== TYPES DE BASE ==========

export interface Product {
  id: number;
  nom: string;
  code: string;
  categorie: string;
  fournisseur?: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  stockMin: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  nom: string;
  telephone: string;
  credit: number;
  achatsTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  productId: number;
  product?: Product;
  clientId?: number;
  client?: Client;
  quantite: number;
  prixUnitaire: number;
  total: number;
  typeVente: 'comptant' | 'credit';
  date: string;
  createdAt: string;
}

export interface Credit {
  id: number;
  clientId: number;
  client?: Client;
  montant: number;
  montantRestant: number;
  dateCredit: string;
  echeance: string;
  statut: 'En cours' | 'Payé';
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  description: string;
  montant: number;
  categorie: string;
  date: string;
  createdAt: string;
}

// ========== TYPES POUR LES FORMULAIRES ==========

export interface ProductFormData {
  nom: string;
  code: string;
  categorie: string;
  fournisseur?: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  stockMin?: number;
}

export interface SaleFormData {
  productId: number;
  clientId?: number;
  quantite: number;
  typeVente: 'comptant' | 'credit';
}

export interface ClientFormData {
  nom: string;
  telephone: string;
}

export interface ExpenseFormData {
  description: string;
  montant: number;
  categorie: string;
}

export interface CreditPaymentData {
  creditId: number;
  montant: number;
}

// ========== TYPES POUR LES RÉPONSES API ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

// ========== TYPES POUR LES STATISTIQUES ==========

export interface DashboardStats {
  totalProduits: number;
  valeurStock: number;
  ventesAujourdhui: number;
  ventesSemaine: number;
  ventesMois: number;
  beneficeTotal: number;
  beneficeNet: number;
  produitsEnRupture: number;
  totalClients: number;
  creditEnCours: number;
  depensesMois: number;
}

export interface ProductStats {
  id: number;
  nom: string;
  quantiteVendue: number;
  revenu: number;
  benefice: number;
}

export interface ClientStats {
  id: number;
  nom: string;
  achatsTotal: number;
  nombreAchats: number;
  credit: number;
}

// ========== TYPES POUR LES FILTRES ==========

export interface SaleFilter {
  dateDebut?: string;
  dateFin?: string;
  clientId?: number;
  productId?: number;
  typeVente?: 'comptant' | 'credit';
}

export interface ProductFilter {
  categorie?: string;
  enRupture?: boolean;
  search?: string;
}

export interface CreditFilter {
  statut?: 'En cours' | 'Payé';
  clientId?: number;
  enRetard?: boolean;
}

export interface ExpenseFilter {
  dateDebut?: string;
  dateFin?: string;
  categorie?: string;
}

// ========== TYPES POUR LES CATÉGORIES ==========

export type ProductCategory = 
  | 'Alimentation'
  | 'Hygiène'
  | 'Boissons'
  | 'Électronique'
  | 'Vêtements'
  | 'Autre';

export type ExpenseCategory =
  | 'Loyer'
  | 'Factures'
  | 'Transport'
  | 'Salaire'
  | 'Achat stock'
  | 'Autre';

// ========== TYPES POUR LES MODALS ==========

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProductModalProps extends ModalProps {
  product?: Product;
  onSuccess: () => void;
}

export interface SaleModalProps extends ModalProps {
  onSuccess: () => void;
}

export interface ClientModalProps extends ModalProps {
  client?: Client;
  onSuccess: () => void;
}

export interface ExpenseModalProps extends ModalProps {
  onSuccess: () => void;
}

export interface CreditPaymentModalProps extends ModalProps {
  credit: Credit;
  onSuccess: () => void;
}

export interface RestockModalProps extends ModalProps {
  product: Product;
  onSuccess: () => void;
}

// ========== TYPES POUR LES HOOKS ==========

export interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  createProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (id: number, data: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  restockProduct: (id: number, quantite: number) => Promise<void>;
  refetch: () => void;
}

export interface UseSalesResult {
  sales: Sale[];
  isLoading: boolean;
  error: Error | null;
  createSale: (data: SaleFormData) => Promise<void>;
  refetch: () => void;
}

export interface UseClientsResult {
  clients: Client[];
  isLoading: boolean;
  error: Error | null;
  createClient: (data: ClientFormData) => Promise<void>;
  updateClient: (id: number, data: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  refetch: () => void;
}

export interface UseCreditsResult {
  credits: Credit[];
  isLoading: boolean;
  error: Error | null;
  payCredit: (id: number, montant?: number) => Promise<void>;
  refetch: () => void;
}

export interface UseStatsResult {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ========== TYPES POUR LE STORE ==========

export interface StoreState {
  user: User | null;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'admin' | 'user';
}

// ========== TYPES POUR LES NOTIFICATIONS ==========

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// ========== TYPES UTILITAIRES ==========

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

// ========== CONSTANTES ==========

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Alimentation',
  'Hygiène',
  'Boissons',
  'Électronique',
  'Vêtements',
  'Autre'
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Loyer',
  'Factures',
  'Transport',
  'Salaire',
  'Achat stock',
  'Autre'
];