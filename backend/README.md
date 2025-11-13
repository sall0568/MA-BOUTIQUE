# Ma Boutique Pro - Backend

Backend API pour l'application Ma Boutique Pro, construit avec Express, TypeScript, Prisma et JWT.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- SQLite (pour le développement)

### Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Voir ENV_SETUP.md pour les détails
cp .env.example .env  # (si le fichier existe)
# Ou créez un fichier .env manuellement

# Générer les secrets JWT
npm run generate-secrets

# Initialiser la base de données
npx prisma migrate dev
npx prisma generate

# Démarrer en mode développement
npm run dev
```

## 📋 Configuration

### Variables d'environnement

Consultez le fichier [ENV_SETUP.md](./ENV_SETUP.md) pour une documentation complète sur la configuration des variables d'environnement, notamment les secrets JWT.

### Génération de secrets JWT

Pour générer des secrets JWT sécurisés :

```bash
npm run generate-secrets
```

Ou utilisez directement :

```bash
node scripts/generate-jwt-secrets.js
```

## 🔒 Sécurité JWT

Le système inclut une validation automatique des secrets JWT :

- ✅ Validation de la longueur minimale (32 caractères)
- ✅ Validation de la complexité en production
- ✅ Détection des secrets par défaut
- ✅ Validation au démarrage de l'application
- ✅ Blocage en production si les secrets sont invalides

### En production

En production, l'application **ne démarrera pas** si :
- Les secrets JWT sont manquants
- Les secrets sont trop courts (< 32 caractères)
- Les secrets ne respectent pas les critères de complexité
- Les secrets par défaut sont utilisés

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/          # Configuration (JWT, base de données)
│   ├── controllers/     # Contrôleurs des routes
│   ├── middleware/      # Middlewares Express
│   ├── routes/          # Définition des routes
│   ├── utils/           # Utilitaires (JWT, permissions)
│   └── server.ts        # Point d'entrée de l'application
├── prisma/              # Schéma et migrations Prisma
├── scripts/             # Scripts utilitaires
└── package.json
```

## 🛠️ Scripts disponibles

- `npm run dev` - Démarre le serveur en mode développement avec hot-reload
- `npm run build` - Compile TypeScript vers JavaScript
- `npm start` - Démarre le serveur en mode production
- `npm run generate-secrets` - Génère des secrets JWT sécurisés

## 📚 Documentation

- [Configuration des variables d'environnement](./ENV_SETUP.md)
- [Schéma Prisma](./prisma/schema.prisma)

## 🔐 Bonnes pratiques de sécurité

1. **Ne committez JAMAIS** le fichier `.env` dans Git
2. **Utilisez des secrets différents** pour chaque environnement
3. **Générez des secrets complexes** avec le script fourni
4. **Rotatez régulièrement** vos secrets (tous les 90 jours)
5. **Stockez les secrets de manière sécurisée** en production (gestionnaire de secrets)

## 🐛 Dépannage

### L'application ne démarre pas en production

Vérifiez que :
- Tous les secrets JWT sont définis dans les variables d'environnement
- Les secrets respectent les critères de validation (longueur, complexité)
- Les secrets ne sont pas les valeurs par défaut

Consultez les logs au démarrage pour plus de détails.

### Erreur de validation JWT

Consultez [ENV_SETUP.md](./ENV_SETUP.md) pour les critères de validation et comment générer des secrets valides.

