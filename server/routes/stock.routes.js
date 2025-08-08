/**
 * Rutas para gestión de stock
 * 
 * Define las rutas para consulta y ajuste de inventario.
 * 
 * @module routes/stock.routes
 * @requires express, ../controllers/stock.controller, ../middlewares/auth
 * @related_files ../controllers/stock.controller.js
 */

const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stock.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/stock/bajo
 * @desc Obtiene productos con stock bajo
 * @access Privado (requiere permiso ver:stock)
 */
router.get(
  '/bajo',
  checkPermiso('stock', 'ver'),
  stockController.obtenerStockBajo
);

/**
 * @route PATCH /api/stock/:id
 * @desc Ajusta el stock de un producto
 * @access Privado (requiere permiso editar:stock)
 */
router.patch(
  '/:id',
  checkPermiso('stock', 'editar'),
  stockController.ajustarStock
);

/**
 * @route GET /api/stock/:id/movimientos
 * @desc Obtiene el historial de movimientos de un producto
 * @access Privado (requiere permiso ver:stock)
 */
router.get(
  '/:id/movimientos',
  checkPermiso('stock', 'ver'),
  stockController.obtenerHistorialMovimientos
);

module.exports = router;