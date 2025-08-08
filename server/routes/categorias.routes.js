/**
 * Rutas para gestión de categorías
 * 
 * Define todas las rutas relacionadas con categorías de productos.
 * 
 * @module routes/categorias.routes
 * @requires express, ../controllers/categorias.controller, ../middlewares/auth
 * @related_files ../controllers/categorias.controller.js
 */

const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/categorias
 * @desc Obtiene todas las categorías
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/',
  checkPermiso('productos', 'ver'),
  categoriasController.obtenerTodas
);

/**
 * @route GET /api/categorias/:id
 * @desc Obtiene una categoría por su ID
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/:id',
  checkPermiso('productos', 'ver'),
  categoriasController.obtenerPorId
);

/**
 * @route POST /api/categorias
 * @desc Crea una nueva categoría
 * @access Privado (requiere permiso crear:productos)
 */
router.post(
  '/',
  checkPermiso('productos', 'crear'),
  categoriasController.crear
);

/**
 * @route PUT /api/categorias/:id
 * @desc Actualiza una categoría existente
 * @access Privado (requiere permiso editar:productos)
 */
router.put(
  '/:id',
  checkPermiso('productos', 'editar'),
  categoriasController.actualizar
);

/**
 * @route DELETE /api/categorias/:id
 * @desc Elimina una categoría
 * @access Privado (requiere permiso eliminar:productos)
 */
router.delete(
  '/:id',
  checkPermiso('productos', 'eliminar'),
  categoriasController.eliminar
);

/**
 * @route GET /api/categorias/buscar
 * @desc Busca categorías por nombre
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/buscar',
  checkPermiso('productos', 'ver'),
  categoriasController.buscar
);

module.exports = router;