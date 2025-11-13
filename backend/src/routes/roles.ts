import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  initRoles,
  getManageableRolesList
} from '../controllers/roleController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/authMiddleware';
import { PERMISSIONS } from '../utils/permissions';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes pour la gestion des rôles
router.get('/', requirePermission(PERMISSIONS.USERS_READ), getAllRoles);
router.get('/manageable', requirePermission(PERMISSIONS.USERS_READ), getManageableRolesList);
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), getRoleById);
router.post('/', requirePermission(PERMISSIONS.USERS_CREATE), createRole);
router.put('/:id', requirePermission(PERMISSIONS.USERS_UPDATE), updateRole);
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DELETE), deleteRole);
router.post('/:id/permissions', requirePermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS), assignPermissionsToRole);
router.post('/init/default', requirePermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS), initRoles);

export default router;

