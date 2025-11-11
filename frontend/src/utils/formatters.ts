// Formatage de la monnaie en FCFA
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Formatage de la date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Formatage de la date courte
export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

// Formatage de l'heure
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formatage date et heure
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Obtenir la date du jour
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Obtenir l'heure actuelle
export const getCurrentTime = (): string => {
  return new Date().toTimeString().substring(0, 5);
};

// Calculer le nombre de jours entre deux dates
export const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Vérifier si une date est passée
export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

// Formater un numéro de téléphone
export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
};

// Formater un pourcentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formater un nombre
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

// Tronquer un texte
export const truncate = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Capitaliser la première lettre
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Générer un code aléatoire
export const generateCode = (prefix: string = '', length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};