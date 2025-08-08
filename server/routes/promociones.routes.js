/**
 * Rutas para la gestión de promociones
 * 
 * Define todas las rutas relacionadas con promociones y descuentos.
 * 
 * @module routes/promociones.routes
 * @requires express, ../controllers/promociones.controller, ../middlewares/auth
 * @related_files ../controllers/promociones.controller.js
 */

const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/promociones.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/promociones
 * @desc Obtiene todas las promociones
 * @access Privado (requiere permiso ver:promociones)
 */
router.get(
  '/',
  checkPermiso('promociones', 'ver'),
  promocionesController.obtenerTodas
);

/**
 * @route GET /api/promociones/activas
 * @desc Obtiene las promociones activas en la fecha actual
 * @access Privado (requiere permiso ver:promociones)
 */
router.get(
  '/activas',
  checkPermiso('promociones', 'ver'),
  promocionesController.obtenerActivas
);

/**
 * @route GET /api/promociones/:id
 * @desc Obtiene una promoción por su ID
 * @access Privado (requiere permiso ver:promociones)
 */
router.get(
  '/:id',
  checkPermiso('promociones', 'ver'),
  promocionesController.obtenerPorId
);

/**
 * @route POST /api/promociones
 * @desc Crea una nueva promoción
 * @access Privado (requiere permiso crear:promociones)
 */
router.post(
  '/',
  checkPermiso('promociones', 'crear'),
  promocionesController.crear
);

/**
 * @route PUT /api/promociones/:id
 * @desc Actualiza una promoción existente
 * @access Privado (requiere permiso editar:promociones)
 */
router.put(
  '/:id',
  checkPermiso('promociones', 'editar'),
  promocionesController.actualizar
);

/**
 * @route PATCH /api/promociones/:id/estado
 * @desc Cambia el estado de una promoción (activa/inactiva)
 * @access Privado (requiere permiso editar:promociones)
 */
router.patch(
  '/:id/estado',
  checkPermiso('promociones', 'editar'),
  promocionesController.cambiarEstado
);

/**
 * @route DELETE /api/promociones/:id
 * @desc Elimina una promoción
 * @access Privado (requiere permiso eliminar:promociones)
 */
router.delete(
  '/:id',
  checkPermiso('promociones', 'eliminar'),
  promocionesController.eliminar
);

/**
 * @route POST /api/promociones/aplicar
 * @desc Aplica promociones a un carrito de productos
 * @access Privado (requiere permiso ver:promociones)
 */
router.post(
  '/aplicar',
  checkPermiso('promociones', 'ver'),
  promocionesController.aplicarPromociones
);

module.exports = router;