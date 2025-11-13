# Guide de déploiement en production

Ce guide explique comment configurer les secrets JWT pour la production.

## 🔐 Configuration des secrets JWT en production

### Étape 1: Générer des secrets sécurisés

**⚠️ IMPORTANT**: Ne générez JAMAIS les mêmes secrets pour le développement et la production !

```bash
# Dans le dossier backend/
npm run generate-secrets
```

Ou utilisez une des méthodes suivantes :

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL (Linux/Mac)
openssl rand -hex 64

# PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 64 | % {[char]$_})
```

**Générez DEUX secrets différents** :
- Un pour `JWT_ACCESS_SECRET`
- Un pour `JWT_REFRESH_SECRET`

### Étape 2: Stocker les secrets de manière sécurisée

#### Option A: Variables d'environnement du serveur (recommandé pour petits projets)

Sur votre serveur Linux :

```bash
# Éditer le fichier d'environnement système
sudo nano /etc/environment

# Ajouter les variables
JWT_ACCESS_SECRET=votre-secret-access-64-caracteres-hex
JWT_REFRESH_SECRET=votre-secret-refresh-64-caracteres-hex
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
```

Ou créer un fichier `.env` sur le serveur (assurez-vous qu'il n'est PAS dans Git) :

```bash
# Sur le serveur
cd /path/to/your/app/backend
nano .env
```

#### Option B: Gestionnaire de secrets (recommandé pour projets importants)

**AWS Secrets Manager** :
```bash
aws secretsmanager create-secret \
  --name ma-boutique/jwt-secrets \
  --secret-string '{"JWT_ACCESS_SECRET":"...","JWT_REFRESH_SECRET":"..."}'
```

**Azure Key Vault** :
```bash
az keyvault secret set --vault-name ma-boutique-vault --name JWT-ACCESS-SECRET --value "..."
az keyvault secret set --vault-name ma-boutique-vault --name JWT-REFRESH-SECRET --value "..."
```

**HashiCorp Vault** :
```bash
vault kv put secret/ma-boutique jwt_access_secret="..." jwt_refresh_secret="..."
```

### Étape 3: Vérifier la configuration

L'application valide automatiquement les secrets au démarrage. En production, elle **ne démarrera pas** si :

- Les secrets sont manquants
- Les secrets sont trop courts (< 32 caractères)
- Les secrets ne respectent pas les critères de complexité
- Les secrets par défaut sont utilisés

### Étape 4: Vérifier les logs au démarrage

Lors du démarrage en production, vous devriez voir :

```
✅ Configuration JWT validée avec succès
   Access token expiration: 15m
   Refresh token expiration: 7d
   Secrets: ******************** (masqués pour la sécurité)
```

Si vous voyez des erreurs, l'application ne démarrera pas et affichera les problèmes à corriger.

## 🔄 Rotation des secrets

### Quand rotater les secrets ?

- **Tous les 90 jours** (recommandé)
- Après une compromission suspectée
- Après qu'un développeur ayant accès aux secrets quitte l'équipe
- Selon les exigences de conformité de votre organisation

### Comment rotater les secrets ?

1. **Générer de nouveaux secrets** :
   ```bash
   npm run generate-secrets
   ```

2. **Mettre à jour les variables d'environnement** sur le serveur

3. **Redémarrer l'application** :
   ```bash
   pm2 restart ma-boutique
   # ou
   systemctl restart ma-boutique
   ```

4. **⚠️ Important** : Tous les utilisateurs connectés seront déconnectés et devront se reconnecter

## 🛡️ Bonnes pratiques de sécurité

### ✅ À FAIRE

- ✅ Utiliser des secrets différents pour chaque environnement (dev, staging, prod)
- ✅ Stocker les secrets dans un gestionnaire de secrets en production
- ✅ Limiter l'accès aux secrets aux personnes autorisées uniquement
- ✅ Rotater les secrets régulièrement
- ✅ Surveiller les logs pour détecter les tentatives d'utilisation de secrets par défaut
- ✅ Utiliser des secrets d'au moins 64 caractères en production
- ✅ Mélanger majuscules, minuscules, chiffres et caractères spéciaux

### ❌ À NE JAMAIS FAIRE

- ❌ Committer les secrets dans Git
- ❌ Partager les secrets par email, chat ou autre canal non sécurisé
- ❌ Utiliser les mêmes secrets en dev et en production
- ❌ Utiliser des secrets faibles ou prévisibles
- ❌ Stocker les secrets dans le code source
- ❌ Exposer les secrets dans les logs ou les messages d'erreur
- ❌ Partager les secrets avec des personnes non autorisées

## 📋 Checklist de déploiement

Avant de déployer en production, vérifiez :

- [ ] Les secrets JWT sont générés et uniques
- [ ] Les secrets respectent les critères de validation (longueur, complexité)
- [ ] Les secrets sont stockés de manière sécurisée (pas dans Git)
- [ ] Les variables d'environnement sont configurées sur le serveur
- [ ] `NODE_ENV=production` est défini
- [ ] L'application démarre sans erreurs de validation JWT
- [ ] Les logs confirment la validation réussie des secrets
- [ ] Un processus de rotation des secrets est en place
- [ ] L'accès aux secrets est limité et documenté

## 🚨 En cas de compromission

Si vous suspectez qu'un secret JWT a été compromis :

1. **Générer immédiatement de nouveaux secrets**
2. **Mettre à jour les secrets sur le serveur**
3. **Redémarrer l'application** (déconnectera tous les utilisateurs)
4. **Révoquer tous les refresh tokens** (optionnel, via script)
5. **Analyser les logs** pour détecter toute activité suspecte
6. **Notifier les utilisateurs** si nécessaire

## 📞 Support

Pour toute question sur la configuration des secrets JWT, consultez :
- `ENV_SETUP.md` pour la configuration de base
- `README.md` pour la documentation générale
- Les logs de l'application pour les erreurs de validation

