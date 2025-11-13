// backend/src/config/https.config.ts
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { Application } from 'express';

interface HttpsConfig {
  enabled: boolean;
  keyPath: string;
  certPath: string;
}

/**
 * Charge la configuration HTTPS depuis les variables d'environnement
 */
export const loadHttpsConfig = (): HttpsConfig => {
  return {
    enabled: process.env.HTTPS_ENABLED === 'true',
    keyPath: process.env.SSL_KEY_PATH || './certs/server.key',
    certPath: process.env.SSL_CERT_PATH || './certs/server.cert',
  };
};

/**
 * Crée un serveur HTTP ou HTTPS selon la configuration
 */
export const createServer = (app: Application): http.Server | https.Server => {
  const config = loadHttpsConfig();

  if (config.enabled) {
    try {
      // Vérifier l'existence des fichiers
      const keyPath = path.resolve(config.keyPath);
      const certPath = path.resolve(config.certPath);

      if (!fs.existsSync(keyPath)) {
        throw new Error(`Fichier clé SSL introuvable: ${keyPath}`);
      }

      if (!fs.existsSync(certPath)) {
        throw new Error(`Fichier certificat SSL introuvable: ${certPath}`);
      }

      // Charger les certificats
      const httpsOptions = {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certPath, 'utf8'),
      };

      console.log('🔒 HTTPS activé');
      return https.createServer(httpsOptions, app);
    } catch (error) {
      console.error('❌ Erreur lors de la configuration HTTPS:', error);
      console.log('⚠️  Démarrage en HTTP non sécurisé');
      return http.createServer(app);
    }
  }

  console.log('🌐 HTTP activé (mode développement)');
  return http.createServer(app);
};

/**
 * Instructions pour générer des certificats SSL auto-signés (développement)
 */
export const printSslInstructions = (): void => {
  console.log('\n📝 Pour activer HTTPS en développement:');
  console.log('1. Créer le dossier certs: mkdir -p backend/certs');
  console.log('2. Générer le certificat auto-signé:');
  console.log('   openssl req -x509 -newkey rsa:4096 -keyout backend/certs/server.key -out backend/certs/server.cert -days 365 -nodes');
  console.log('3. Activer HTTPS dans .env: HTTPS_ENABLED=true\n');
  console.log('⚠️  Note: Les certificats auto-signés ne doivent être utilisés qu\'en développement!\n');
  console.log('📌 Pour la production, utilisez Let\'s Encrypt ou un certificat commercial.\n');
};