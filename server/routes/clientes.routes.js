/**
 * Rutas para gestión de clientes
 * 
 * Define las rutas para consulta y gestión de clientes.
 * 
 * @module routes/clientes.routes
 * @requires express, ../controllers/clientes.controller, ../middlewares/auth
 * @related_files ../controllers/clientes.controller.js
 */

const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/clientes
 * @desc Obtiene todos los clientes
 * @access Privado (requiere permiso ver:clientes)
 */
router.get(
  '/',
  checkPermiso('clientes', 'ver'),
  clientesController.obtenerTodos
);

/**
 * @route GET /api/clientes/buscar
 * @desc Busca clientes por término
 * @access Privado (requiere permiso ver:clientes)
 */
router.get(
  '/buscar',
  checkPermiso('clientes', 'ver'),
  clientesController.buscar
);

/**
 * @route GET /api/clientes/:id
 * @desc Obtiene un cliente por su ID
 * @access Privado (requiere permiso ver:clientes)
 */
router.get(
  '/:id',
  checkPermiso('clientes', 'ver'),
  clientesController.obtenerPorId
);

/**
 * @route POST /api/clientes
 * @desc Crea un nuevo cliente
 * @access Privado (requiere permiso crear:clientes)
 */
router.post(
  '/',
  checkPermiso('clientes', 'crear'),
  clientesController.crear
);

/**
 * @route PUT /api/clientes/:id
 * @desc Actualiza un cliente existente
 * @access Privado (requiere permiso editar:clientes)
 */
router.put(
  '/:id',
  checkPermiso('clientes', 'editar'),
  clientesController.actualizar
);

/**
 * @route DELETE /api/clientes/:id
 * @desc Elimina un cliente
 * @access Privado (requiere permiso eliminar:clientes)
 */
router.delete(
  '/:id',
  checkPermiso('clientes', 'eliminar'),
  clientesController.eliminar
);

/**
 * @route GET /api/clientes/:id/compras
 * @desc Obtiene el historial de compras de un cliente
 * @access Privado (requiere permiso ver:clientes)
 */
router.get(
  '/:id/compras',
  checkPermiso('clientes', 'ver'),
  clientesController.obtenerHistorialCompras
);

module.exports = router;