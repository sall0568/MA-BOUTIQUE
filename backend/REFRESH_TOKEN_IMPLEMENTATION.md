# Implémentation du système de Refresh Token

Ce document décrit l'implémentation complète du système de refresh token pour l'authentification JWT.

## 📋 Vue d'ensemble

Le système utilise une architecture à deux tokens :
- **Access Token** : Token de courte durée (15 minutes par défaut) utilisé pour authentifier les requêtes API
- **Refresh Token** : Token de longue durée (7 jours par défaut) stocké en base de données et utilisé pour obtenir de nouveaux access tokens

## 🔧 Architecture

### Backend

#### 1. Génération des tokens (`backend/src/utils/jwt.ts`)

- `generateAccessToken()` : Génère un JWT signé avec le secret d'access
- `generateRefreshToken()` : Génère un token aléatoire sécurisé et le stocke en base de données
- `generateTokenPair()` : Génère les deux tokens simultanément

#### 2. Vérification des tokens

- `verifyAccessToken()` : Vérifie et décode un access token JWT
- `verifyRefreshToken()` : Vérifie un refresh token en base de données (existence, expiration, révocation, statut utilisateur)

#### 3. Gestion des tokens

- `revokeRefreshToken()` : Révoque un refresh token spécifique
- `revokeAllUserTokens()` : Révoque tous les refresh tokens d'un utilisateur
- `cleanExpiredTokens()` : Nettoie les tokens expirés (à exécuter périodiquement)

#### 4. Routes API (`backend/src/routes/auth.ts`)

- `POST /api/auth/refresh` : Rafraîchit un access token avec un refresh token
- `POST /api/auth/logout` : Révoque le refresh token lors de la déconnexion
- `POST /api/auth/logout-all` : Révoque tous les refresh tokens d'un utilisateur

### Frontend

#### 1. Intercepteur Axios (`frontend/src/api/axios.ts`)

L'intercepteur de réponse gère automatiquement le refresh des tokens :

- **Détection d'erreur 401** : Lorsqu'une requête retourne 401 (token expiré)
- **Refresh automatique** : Tente de rafraîchir le token avec le refresh token
- **Queue de requêtes** : Met en attente les requêtes pendant le refresh pour éviter les appels multiples
- **Réessai automatique** : Réessaie la requête originale avec le nouveau token
- **Déconnexion automatique** : Si le refresh échoue, déconnecte l'utilisateur

#### 2. AuthContext (`frontend/src/contexts/AuthContext.tsx`)

- `refreshToken()` : Fonction manuelle pour rafraîchir le token
- `logout()` : Améliorée pour révoquer le refresh token côté serveur
- Stockage des tokens dans le localStorage

## 🔄 Flux d'authentification

### 1. Connexion

```
1. Utilisateur se connecte → POST /api/auth/login
2. Backend génère accessToken + refreshToken
3. Frontend stocke les deux tokens dans localStorage
4. Access token ajouté aux en-têtes des requêtes suivantes
```

### 2. Requête API avec token valide

```
1. Frontend envoie requête avec access token
2. Backend vérifie et valide le token
3. Requête traitée normalement
```

### 3. Requête API avec token expiré

```
1. Frontend envoie requête avec access token expiré
2. Backend retourne 401 (Unauthorized)
3. Intercepteur Axios détecte l'erreur 401
4. Frontend récupère refreshToken du localStorage
5. Frontend appelle POST /api/auth/refresh avec refreshToken
6. Backend vérifie le refreshToken et génère une nouvelle paire de tokens
7. Backend révoque l'ancien refreshToken (rotation)
8. Frontend met à jour les tokens dans localStorage
9. Frontend réessaie la requête originale avec le nouveau access token
10. Requête traitée avec succès
```

### 4. Refresh token expiré ou invalide

```
1. Frontend tente de rafraîchir le token
2. Backend retourne 401 (refresh token invalide/expiré)
3. Frontend nettoie le localStorage
4. Frontend redirige vers /login
```

### 5. Déconnexion

```
1. Utilisateur se déconnecte
2. Frontend appelle POST /api/auth/logout avec refreshToken
3. Backend révoque le refreshToken
4. Frontend nettoie le localStorage
5. Utilisateur redirigé vers /login
```

## 🛡️ Sécurité

### Mesures de sécurité implémentées

1. **Rotation des refresh tokens** : Chaque refresh génère un nouveau refresh token et révoque l'ancien
2. **Stockage sécurisé** : Refresh tokens stockés en base de données avec expiration
3. **Révocation** : Possibilité de révoquer un token ou tous les tokens d'un utilisateur
4. **Validation stricte** : Vérification de l'existence, expiration, révocation et statut utilisateur
5. **Nettoyage automatique** : Fonction pour nettoyer les tokens expirés

### Bonnes pratiques

- ✅ Access tokens de courte durée (15 minutes)
- ✅ Refresh tokens de longue durée (7 jours)
- ✅ Rotation des refresh tokens à chaque utilisation
- ✅ Révocation lors de la déconnexion
- ✅ Validation stricte côté serveur
- ✅ Gestion des erreurs robuste

## 📝 Configuration

### Variables d'environnement

```env
JWT_ACCESS_SECRET=votre-secret-access-64-caracteres
JWT_REFRESH_SECRET=votre-secret-refresh-64-caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Durées recommandées

- **Access Token** : 15 minutes (équilibre entre sécurité et expérience utilisateur)
- **Refresh Token** : 7 jours (bon compromis pour éviter les reconnexions fréquentes)

## 🧪 Tests

### Scénarios à tester

1. ✅ Connexion et réception des tokens
2. ✅ Requête avec token valide
3. ✅ Refresh automatique lors d'un token expiré
4. ✅ Déconnexion et révocation du token
5. ✅ Gestion de plusieurs requêtes simultanées avec token expiré
6. ✅ Refresh token expiré
7. ✅ Refresh token révoqué

### Test manuel

1. Connectez-vous et vérifiez que les tokens sont stockés
2. Attendez 15 minutes (ou modifiez `JWT_ACCESS_EXPIRES_IN` à `1m` pour tester plus vite)
3. Effectuez une requête API
4. Vérifiez dans la console que le refresh s'est effectué automatiquement
5. Vérifiez que la requête a été réessayée avec succès

## 🔧 Maintenance

### Nettoyage des tokens expirés

Pour nettoyer les tokens expirés, vous pouvez créer un job cron ou une tâche planifiée :

```typescript
import { cleanExpiredTokens } from './utils/jwt';

// Exécuter quotidiennement
const deletedCount = await cleanExpiredTokens();
console.log(`${deletedCount} tokens expirés supprimés`);
```

### Monitoring

Surveillez :
- Le nombre de refresh tokens en base de données
- Les tentatives de refresh échouées
- Les tokens expirés non nettoyés

## 📚 Références

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Refresh Token Flow](https://oauth.net/2/refresh-tokens/)
- Documentation du projet : `PRODUCTION_DEPLOYMENT.md`

