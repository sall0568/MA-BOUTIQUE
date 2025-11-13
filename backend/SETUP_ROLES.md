# Guide de Configuration du Système de Rôles

## 📋 Étapes de configuration

### 1. Arrêter le serveur backend

Si le serveur backend est en cours d'exécution, arrêtez-le d'abord pour éviter les conflits de fichiers.

### 2. Générer le client Prisma

```bash
cd backend
npx prisma generate
```

**Si vous obtenez une erreur de permission** :
- Arrêtez complètement le serveur backend
- Fermez tous les processus Node.js
- Réessayez la commande

### 3. Initialiser les rôles et permissions

```bash
npm run init-roles
```

Cette commande va :
- Créer toutes les permissions dans la base de données
- Créer les rôles par défaut (admin, manager, cashier, user)
- Établir la hiérarchie des rôles
- Assigner les permissions aux rôles

### 4. Assigner les rôles aux utilisateurs existants

```bash
npm run assign-roles
```

Cette commande va :
- Trouver tous les utilisateurs sans `roleId`
- Assigner le `roleId` correspondant à leur champ `role` (string)
- Afficher un résumé des assignations

### 5. Vérifier la configuration

Vérifiez que tout fonctionne :

```bash
# Démarrer le serveur
npm run dev
```

Testez une route protégée pour vérifier que les permissions fonctionnent.

## 🔍 Vérification

### Vérifier les rôles créés

```sql
SELECT * FROM Role;
```

Vous devriez voir 4 rôles :
- admin (level: 100)
- manager (level: 75)
- cashier (level: 50)
- user (level: 25)

### Vérifier les permissions assignées

```sql
SELECT r.name, COUNT(rp.permissionId) as permission_count
FROM Role r
LEFT JOIN RolePermission rp ON r.id = rp.roleId
GROUP BY r.id, r.name;
```

### Vérifier les utilisateurs

```sql
SELECT id, email, role, roleId FROM User;
```

Tous les utilisateurs devraient avoir un `roleId` assigné.

## 🐛 Dépannage

### Erreur: "roleData does not exist"

Le client Prisma n'a pas été régénéré. Exécutez :
```bash
npx prisma generate
```

### Erreur: "No roles found"

Les rôles n'ont pas été initialisés. Exécutez :
```bash
npm run init-roles
```

### Les permissions ne fonctionnent pas

1. Vérifiez que les rôles sont initialisés
2. Vérifiez que les utilisateurs ont un `roleId`
3. Vérifiez les logs du serveur pour les erreurs
4. Assurez-vous que le client Prisma est à jour

## ✅ Checklist

- [ ] Migration Prisma créée
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Rôles initialisés (`npm run init-roles`)
- [ ] Rôles assignés aux utilisateurs (`npm run assign-roles`)
- [ ] Serveur redémarré
- [ ] Permissions testées

## 📚 Documentation

- `ROLES_SYSTEM.md` : Documentation complète du système de rôles
- `MIGRATION_GUIDE.md` : Guide de migration détaillé

