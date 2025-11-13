/**
 * Configuration et validation des secrets JWT pour la production
 * 
 * Ce module centralise la gestion des secrets JWT avec des validations strictes
 * pour garantir la sécurité en production.
 */

import crypto from 'crypto';

interface JWTConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide la longueur et la complexité d'un secret JWT
 */
function validateSecretStrength(secret: string, secretName: string): string[] {
  const errors: string[] = [];

  // Longueur minimale recommandée : 32 caractères
  const MIN_LENGTH = 32;
  if (secret.length < MIN_LENGTH) {
    errors.push(
      `${secretName} doit contenir au moins ${MIN_LENGTH} caractères (actuellement: ${secret.length})`
    );
  }

  // Vérifier la complexité (mélange de caractères)
  const hasUpperCase = /[A-Z]/.test(secret);
  const hasLowerCase = /[a-z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);

  // En production, exiger une complexité élevée
  if (process.env.NODE_ENV === 'production') {
    const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
      .filter(Boolean).length;

    if (complexityCount < 3) {
      errors.push(
        `${secretName} doit contenir au moins 3 types de caractères différents ` +
        `(majuscules, minuscules, chiffres, caractères spéciaux)`
      );
    }
  }

  // Vérifier qu'il ne s'agit pas d'un secret par défaut
  const defaultSecrets = [
    'votre-secret-jwt-changez-moi',
    'votre-refresh-secret-changez-moi',
    'secret',
    'password',
    '123456',
    'changeme',
    'default-secret'
  ];

  if (defaultSecrets.some(defaultSecret => 
    secret.toLowerCase().includes(defaultSecret.toLowerCase())
  )) {
    errors.push(
      `${secretName} ne peut pas contenir de secrets par défaut ou communs`
    );
  }

  return errors;
}

/**
 * Valide le format d'une durée d'expiration JWT
 */
function validateExpirationFormat(expiration: string, expirationName: string): string[] {
  const errors: string[] = [];
  const validFormat = /^\d+[smhd]$/;

  if (!validFormat.test(expiration)) {
    errors.push(
      `${expirationName} doit être au format: nombre + unité (s, m, h, d). ` +
      `Exemple: "15m", "7d", "1h"`
    );
  }

  return errors;
}

/**
 * Valide toute la configuration JWT
 */
export function validateJWTConfig(): ValidationResult {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Récupérer les variables d'environnement
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  // Vérifier la présence des secrets (obligatoire en production)
  if (!accessSecret) {
    errors.push('JWT_ACCESS_SECRET est manquant dans les variables d\'environnement');
  }

  if (!refreshSecret) {
    errors.push('JWT_REFRESH_SECRET est manquant dans les variables d\'environnement');
  }

  // Valider la force des secrets si présents
  if (accessSecret) {
    const secretErrors = validateSecretStrength(accessSecret, 'JWT_ACCESS_SECRET');
    errors.push(...secretErrors);
  }

  if (refreshSecret) {
    const secretErrors = validateSecretStrength(refreshSecret, 'JWT_REFRESH_SECRET');
    errors.push(...secretErrors);
  }

  // Valider les formats d'expiration
  const accessExpErrors = validateExpirationFormat(accessExpiresIn, 'JWT_ACCESS_EXPIRES_IN');
  errors.push(...accessExpErrors);

  const refreshExpErrors = validateExpirationFormat(refreshExpiresIn, 'JWT_REFRESH_EXPIRES_IN');
  errors.push(...refreshExpErrors);

  // En production, les erreurs sont bloquantes
  if (isProduction && errors.length > 0) {
    return {
      isValid: false,
      errors
    };
  }

  // En développement, on peut être plus permissif mais on avertit
  if (!isProduction && errors.length > 0) {
    console.warn('⚠️  Avertissements de configuration JWT:');
    errors.forEach(error => console.warn(`  - ${error}`));
    console.warn('  Ces problèmes doivent être corrigés avant le déploiement en production.\n');
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Charge et valide la configuration JWT
 * @throws Error si la configuration est invalide en production
 */
export function loadJWTConfig(): JWTConfig {
  const validation = validateJWTConfig();

  if (!validation.isValid) {
    console.error('❌ ERREUR CRITIQUE: Configuration JWT invalide!\n');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n💡 Vérifiez votre fichier .env et assurez-vous que tous les secrets sont correctement configurés.');
    console.error('   Consultez .env.example pour un exemple de configuration.\n');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  // En production, on doit avoir les secrets
  if (process.env.NODE_ENV === 'production' && (!accessSecret || !refreshSecret)) {
    console.error('❌ Les secrets JWT sont obligatoires en production!');
    process.exit(1);
  }

  // Valeurs par défaut pour le développement uniquement
  const config: JWTConfig = {
    accessSecret: accessSecret || 'votre-secret-jwt-changez-moi-dev-only',
    refreshSecret: refreshSecret || 'votre-refresh-secret-changez-moi-dev-only',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  };

  // Log de confirmation en production (sans exposer les secrets)
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Configuration JWT validée avec succès');
    console.log(`   Access token expiration: ${config.accessExpiresIn}`);
    console.log(`   Refresh token expiration: ${config.refreshExpiresIn}`);
    console.log(`   Secrets: ${'*'.repeat(20)} (masqués pour la sécurité)\n`);
  }

  return config;
}

/**
 * Génère un secret JWT sécurisé (utilitaire pour la génération)
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

// Export de la configuration chargée
export const jwtConfig = loadJWTConfig();

