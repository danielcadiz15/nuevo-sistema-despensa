/**
 * Rutas para reportes financieros
 * 
 * Define todas las rutas relacionadas con reportes y estadísticas.
 * 
 * @module routes/reportes.routes
 * @requires express, ../controllers/reportes.controller, ../middlewares/auth
 * @related_files ../controllers/reportes.controller.js
 */

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/reportes/dashboard
 * @desc Obtiene datos para el dashboard
 * @access Privado (requiere permiso ver:reportes)
 */
router.get(
  '/dashboard',
  checkPermiso('reportes', 'ver'),
  reportesController.obtenerDatosDashboard
);

/**
 * @route GET /api/reportes/ventas
 * @desc Obtiene reporte de ventas en un período
 * @access Privado (requiere permiso ver:reportes)
 */
router.get(
  '/ventas',
  checkPermiso('reportes', 'ver'),
  reportesController.obtenerReporteVentas
);

/**
 * @route GET /api/reportes/compras
 * @desc Obtiene reporte de compras en un período
 * @access Privado (requiere permiso ver:reportes)
 */
router.get(
  '/compras',
  checkPermiso('reportes', 'ver'),
  reportesController.obtenerReporteCompras
);

/**
 * @route GET /api/reportes/ganancias
 * @desc Obtiene reporte de ganancias en un período
 * @access Privado (requiere permiso ver:reportes)
 */
router.get(
  '/ganancias',
  checkPermiso('reportes', 'ver'),
  reportesController.obtenerReporteGanancias
);

module.exports = router;