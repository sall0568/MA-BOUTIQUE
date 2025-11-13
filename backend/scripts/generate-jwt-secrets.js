#!/usr/bin/env node

/**
 * Script utilitaire pour générer des secrets JWT sécurisés
 * 
 * Usage:
 *   node scripts/generate-jwt-secrets.js
 * 
 * Ce script génère deux secrets JWT aléatoires et sécurisés
 * que vous pouvez utiliser dans votre fichier .env
 */

const crypto = require('crypto');

/**
 * Génère un secret JWT sécurisé
 * @param {number} length - Longueur en bytes (par défaut 64)
 * @returns {string} Secret hexadécimal
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Génère un secret avec complexité (majuscules, minuscules, chiffres, spéciaux)
 * @param {number} length - Longueur du secret
 * @returns {string} Secret complexe
 */
function generateComplexSecret(length = 64) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + specials;

  let secret = '';
  
  // S'assurer qu'on a au moins un caractère de chaque type
  secret += uppercase[Math.floor(Math.random() * uppercase.length)];
  secret += lowercase[Math.floor(Math.random() * lowercase.length)];
  secret += numbers[Math.floor(Math.random() * numbers.length)];
  secret += specials[Math.floor(Math.random() * specials.length)];

  // Remplir le reste avec des caractères aléatoires
  for (let i = secret.length; i < length; i++) {
    secret += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mélanger les caractères
  return secret.split('').sort(() => Math.random() - 0.5).join('');
}

console.log('🔐 Génération de secrets JWT sécurisés...\n');
console.log('='.repeat(70));
console.log('Copiez ces valeurs dans votre fichier .env:\n');

// Générer les secrets
const accessSecret = generateComplexSecret(64);
const refreshSecret = generateComplexSecret(64);

console.log('JWT_ACCESS_SECRET=' + accessSecret);
console.log('\nJWT_REFRESH_SECRET=' + refreshSecret);
console.log('\n' + '='.repeat(70));
console.log('\n✅ Secrets générés avec succès!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Ne partagez JAMAIS ces secrets');
console.log('   - Utilisez des secrets différents pour chaque environnement');
console.log('   - Stockez-les de manière sécurisée');
console.log('   - Ne les committez JAMAIS dans Git\n');

