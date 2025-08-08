/**
 * Rutas para gestión de usuarios
 * 
 * Define las rutas para consulta y gestión de usuarios.
 * 
 * @module routes/usuarios.routes
 * @requires express, ../controllers/usuarios.controller, ../middlewares/auth
 * @related_files ../controllers/usuarios.controller.js
 */

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/usuarios
 * @desc Obtiene todos los usuarios
 * @access Privado (requiere permiso ver:usuarios)
 */
router.get(
  '/',
  checkPermiso('usuarios', 'ver'),
  usuariosController.obtenerTodos
);

/**
 * @route GET /api/usuarios/buscar
 * @desc Busca usuarios por término
 * @access Privado (requiere permiso ver:usuarios)
 */
router.get(
  '/buscar',
  checkPermiso('usuarios', 'ver'),
  usuariosController.buscar
);

/**
 * @route GET /api/usuarios/roles
 * @desc Obtiene todos los roles disponibles
 * @access Privado (requiere permiso ver:usuarios)
 */
router.get(
  '/roles',
  checkPermiso('usuarios', 'ver'),
  usuariosController.obtenerRoles
);

/**
 * @route GET /api/usuarios/:id
 * @desc Obtiene un usuario por su ID
 * @access Privado (requiere permiso ver:usuarios)
 */
router.get(
  '/:id',
  checkPermiso('usuarios', 'ver'),
  usuariosController.obtenerPorId
);

/**
 * @route POST /api/usuarios
 * @desc Crea un nuevo usuario
 * @access Privado (requiere permiso crear:usuarios)
 */
router.post(
  '/',
  checkPermiso('usuarios', 'crear'),
  usuariosController.crear
);

/**
 * @route PUT /api/usuarios/:id
 * @desc Actualiza un usuario existente
 * @access Privado (requiere permiso editar:usuarios)
 */
router.put(
  '/:id',
  checkPermiso('usuarios', 'editar'),
  usuariosController.actualizar
);

/**
 * @route PATCH /api/usuarios/:id/password
 * @desc Cambia la contraseña de un usuario
 * @access Privado (propio usuario o permiso editar:usuarios)
 */
router.patch(
  '/:id/password',
  usuariosController.cambiarPassword
);

/**
 * @route PATCH /api/usuarios/:id/estado
 * @desc Cambia el estado activo/inactivo de un usuario
 * @access Privado (requiere permiso editar:usuarios)
 */
router.patch(
  '/:id/estado',
  checkPermiso('usuarios', 'editar'),
  usuariosController.cambiarEstado
);

module.exports = router;