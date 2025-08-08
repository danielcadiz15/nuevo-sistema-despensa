/**
 * Rutas para gestión de ventas
 * 
 * Define las rutas para consulta y gestión de ventas.
 * 
 * @module routes/ventas.routes
 * @requires express, ../controllers/ventas.controller, ../middlewares/auth
 * @related_files ../controllers/ventas.controller.js
 */

const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/ventas
 * @desc Obtiene todas las ventas
 * @access Privado (requiere permiso ver:ventas)
 */
router.get(
  '/',
  checkPermiso('ventas', 'ver'),
  ventasController.obtenerTodas
);

/**
 * @route GET /api/ventas/buscar
 * @desc Busca ventas por término
 * @access Privado (requiere permiso ver:ventas)
 */
 
router.get(
  '/buscar',
  checkPermiso('ventas', 'ver'),
  ventasController.buscar
);
/**
 * @route POST /api/ventas/:id/devolver-productos
 * @desc Realiza devolución parcial de productos
 * @access Privado (requiere permiso editar:ventas)
 */
router.post(
  '/:id/devolver-productos',
  checkPermiso('ventas', 'editar'),
  ventasController.devolverProductos
);

/**
 * @route DELETE /api/ventas/:id/eliminar-productos
 * @desc Elimina productos de una venta editada
 * @access Privado (requiere permiso editar:ventas)
 */
router.delete(
  '/:id/eliminar-productos',
  checkPermiso('ventas', 'editar'),
  ventasController.eliminarProductos
);

/**
 * @route GET /api/ventas/estadisticas/dia
 * @desc Obtiene estadísticas de ventas del día actual
 * @access Privado (requiere permiso ver:ventas)
 */
router.get(
  '/estadisticas/dia',
  checkPermiso('ventas', 'ver'),
  ventasController.obtenerEstadisticasDia
);

/**
 * @route GET /api/ventas/:id
 * @desc Obtiene una venta por su ID
 * @access Privado (requiere permiso ver:ventas)
 */
router.get(
  '/:id',
  checkPermiso('ventas', 'ver'),
  ventasController.obtenerPorId
);

/**
 * @route POST /api/ventas
 * @desc Crea una nueva venta
 * @access Privado (requiere permiso crear:ventas)
 */
router.post(
  '/',
  checkPermiso('ventas', 'crear'),
  ventasController.crear
);

/**
 * @route PATCH /api/ventas/:id/estado
 * @desc Cambia el estado de una venta
 * @access Privado (requiere permiso editar:ventas)
 */
router.patch(
  '/:id/estado',
  checkPermiso('ventas', 'editar'),
  ventasController.cambiarEstado
);

/**
 * @route PUT /api/ventas/:id
 * @desc Actualiza una venta completa con ajuste de stock
 * @access Privado (requiere permiso editar:ventas)
 */
router.put(
  '/:id',
  checkPermiso('ventas', 'editar'),
  ventasController.actualizarVenta
);

/**
 * @route GET /api/ventas/cliente/:cliente_id
 * @desc Obtiene ventas por cliente
 * @access Privado (requiere permiso ver:ventas)
 */
router.get(
  '/cliente/:cliente_id',
  checkPermiso('ventas', 'ver'),
  ventasController.obtenerPorCliente
);

module.exports = router;