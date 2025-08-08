/**
 * Rutas para gestión de proveedores
 * 
 * @module routes/proveedores.routes
 * @requires express, ../controllers/proveedores.controller
 */

const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedores.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/proveedores
 * @desc Obtiene todos los proveedores
 */
router.get(
  '/',
  checkPermiso('productos', 'ver'),
  proveedoresController.obtenerTodos
);

/**
 * @route GET /api/proveedores/:id
 * @desc Obtiene un proveedor por su ID
 */
router.get(
  '/:id',
  checkPermiso('productos', 'ver'),
  proveedoresController.obtenerPorId
);

// Agrega otras rutas CRUD según sea necesario...

module.exports = router;