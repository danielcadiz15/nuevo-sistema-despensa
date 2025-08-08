/**
 * Rutas para gestión de compras
 * 
 * Define las rutas para consulta y gestión de compras a proveedores.
 * 
 * @module routes/compras.routes
 * @requires express, ../controllers/compras.controller, ../middlewares/auth
 * @related_files ../controllers/compras.controller.js
 */

const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/compras
 * @desc Obtiene todas las compras
 * @access Privado (requiere permiso ver:compras)
 */
router.get(
  '/',
  checkPermiso('compras', 'ver'),
  comprasController.obtenerTodas
);

/**
 * @route GET /api/compras/:id
 * @desc Obtiene una compra por su ID
 * @access Privado (requiere permiso ver:compras)
 */
router.get(
  '/:id',
  checkPermiso('compras', 'ver'),
  comprasController.obtenerPorId
);

/**
 * @route POST /api/compras
 * @desc Crea una nueva compra
 * @access Privado (requiere permiso crear:compras)
 */
router.post(
  '/',
  checkPermiso('compras', 'crear'),
  comprasController.crear
);

/**
 * @route PATCH /api/compras/:id/recibir
 * @desc Recibe una compra (cambia estado a 'recibida')
 * @access Privado (requiere permiso editar:compras)
 */
router.patch(
  '/:id/recibir',
  checkPermiso('compras', 'editar'),
  comprasController.recibirCompra
);

/**
 * @route PATCH /api/compras/:id/cancelar
 * @desc Cancela una compra pendiente
 * @access Privado (requiere permiso editar:compras)
 */
router.patch(
  '/:id/cancelar',
  checkPermiso('compras', 'editar'),
  comprasController.cancelarCompra
);

/**
 * @route GET /api/compras/proveedor/:proveedor_id
 * @desc Obtiene compras por proveedor
 * @access Privado (requiere permiso ver:compras)
 */
router.get(
  '/proveedor/:proveedor_id',
  checkPermiso('compras', 'ver'),
  comprasController.obtenerPorProveedor
);

module.exports = router;