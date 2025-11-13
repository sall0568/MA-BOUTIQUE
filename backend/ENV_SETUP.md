# Configuration des variables d'environnement

Ce document explique comment configurer les variables d'environnement pour le backend, notamment les secrets JWT.

## Fichier .env

Créez un fichier `.env` à la racine du dossier `backend/` avec le contenu suivant :

```env
# ============================================
# Configuration de l'environnement
# ============================================
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# ============================================
# Configuration de la base de données
# ============================================
DATABASE_URL="file:./prisma/dev.db"

# ============================================
# Configuration JWT - SÉCURITÉ CRITIQUE
# ============================================
# ⚠️  IMPORTANT: En production, ces secrets DOIVENT être:
#    - Uniques et aléatoires
#    - D'au moins 32 caractères
#    - Complexes (majuscules, minuscules, chiffres, caractères spéciaux)
#    - Stockés de manière sécurisée
#    - Jamais committés dans Git

JWT_ACCESS_SECRET=votre-secret-jwt-changez-moi-minimum-32-caracteres-complexe
JWT_REFRESH_SECRET=votre-refresh-secret-changez-moi-minimum-32-caracteres-complexe
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Génération de secrets sécurisés

### Option 1: Utiliser le script fourni (recommandé)

```bash
node scripts/generate-jwt-secrets.js
```

Ce script génère automatiquement deux secrets JWT complexes et sécurisés.

### Option 2: Utiliser Node.js directement

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Exécutez cette commande deux fois pour générer deux secrets différents.

### Option 3: Utiliser OpenSSL (Linux/Mac)

```bash
openssl rand -hex 64
```

### Option 4: Utiliser PowerShell (Windows)

```powershell
-join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 64 | % {[char]$_})
```

## Validation automatique

Le système valide automatiquement vos secrets JWT au démarrage :

- **En développement** : Affiche des avertissements si les secrets ne respectent pas les critères
- **En production** : Bloque le démarrage si les secrets sont invalides ou manquants

### Critères de validation

Les secrets JWT doivent respecter :

1. **Longueur minimale** : 32 caractères
2. **Complexité** (en production uniquement) : Au moins 3 types de caractères parmi :
   - Majuscules (A-Z)
   - Minuscules (a-z)
   - Chiffres (0-9)
   - Caractères spéciaux (!@#$%^&*...)
3. **Pas de secrets par défaut** : Les secrets ne doivent pas contenir de valeurs par défaut communes

## Sécurité en production

### Bonnes pratiques

1. ✅ **Utilisez des secrets différents** pour chaque environnement (dev, staging, prod)
2. ✅ **Stockez les secrets de manière sécurisée** :
   - Variables d'environnement du serveur
   - Gestionnaires de secrets (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
   - Ne JAMAIS les committer dans Git
3. ✅ **Rotatez régulièrement** vos secrets (tous les 90 jours recommandé)
4. ✅ **Surveillez les logs** pour détecter toute tentative d'utilisation de secrets par défaut
5. ✅ **Limitez l'accès** aux secrets aux personnes autorisées uniquement

### Ce qu'il ne faut JAMAIS faire

❌ Committer les secrets dans Git  
❌ Partager les secrets par email ou chat  
❌ Utiliser les mêmes secrets en dev et en production  
❌ Utiliser des secrets faibles ou prévisibles  
❌ Stocker les secrets dans le code source  

## Format des durées d'expiration

Les durées d'expiration JWT utilisent le format : `nombre + unité`

- `s` = secondes (ex: `30s`)
- `m` = minutes (ex: `15m`)
- `h` = heures (ex: `2h`)
- `d` = jours (ex: `7d`)

Exemples valides :
- `JWT_ACCESS_EXPIRES_IN=15m` (15 minutes)
- `JWT_REFRESH_EXPIRES_IN=7d` (7 jours)
- `JWT_ACCESS_EXPIRES_IN=1h` (1 heure)

## Dépannage

### Erreur : "Configuration JWT invalide"

Si vous voyez cette erreur au démarrage :

1. Vérifiez que tous les secrets sont définis dans votre fichier `.env`
2. Vérifiez que les secrets respectent les critères de validation
3. En développement, consultez les avertissements dans la console
4. En production, l'application ne démarrera pas si les secrets sont invalides

### Erreur : "Les secrets JWT par défaut sont utilisés en production"

Cette erreur signifie que vous utilisez encore les valeurs par défaut en production.

**Solution** : Générez de nouveaux secrets sécurisés et mettez à jour votre fichier `.env` ou vos variables d'environnement.

