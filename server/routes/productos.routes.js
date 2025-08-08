/**
 * Rutas para la gestión de productos
 * 
 * Define todas las rutas relacionadas con productos y las asocia
 * con las funciones del controlador correspondiente.
 * 
 * @module routes/productos.routes
 * @requires express, ../controllers/productos.controller, ../middlewares/auth
 * @related_files ../controllers/productos.controller.js, ../models/producto.model.js
 */

const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { checkPermiso } = require('../middlewares/auth');

/**
 * @route GET /api/productos
 * @desc Obtiene todos los productos
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/',
  checkPermiso('productos', 'ver'),
  productosController.obtenerTodos
);
router.get(
  '/codigo/:codigo',
  productosController.obtenerPorCodigo
);
/**
 * @route GET /api/productos/buscar
 * @desc Busca productos por término
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/buscar',
  checkPermiso('productos', 'ver'),
  productosController.buscar
);

/**
 * @route GET /api/productos/stock-bajo
 * @desc Obtiene productos con stock bajo
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/stock-bajo',
  checkPermiso('productos', 'ver'),
  productosController.obtenerStockBajo
);

/**
 * @route GET /api/productos/:id
 * @desc Obtiene un producto por su ID
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/:id',
  checkPermiso('productos', 'ver'),
  productosController.obtenerPorId
);

/**
 * @route GET /api/productos/:id/movimientos
 * @desc Obtiene el historial de movimientos de un producto
 * @access Privado (requiere permiso ver:productos)
 */
router.get(
  '/:id/movimientos',
  checkPermiso('productos', 'ver'),
  productosController.obtenerHistorialMovimientos
);

/**
 * @route POST /api/productos
 * @desc Crea un nuevo producto
 * @access Privado (requiere permiso crear:productos)
 */
router.post(
  '/',
  checkPermiso('productos', 'crear'),
  productosController.crear
);

/**
 * @route PUT /api/productos/:id
 * @desc Actualiza un producto existente
 * @access Privado (requiere permiso editar:productos)
 */
router.put(
  '/:id',
  checkPermiso('productos', 'editar'),
  productosController.actualizar
);

/**
 * @route DELETE /api/productos/:id
 * @desc Elimina un producto (desactivación lógica)
 * @access Privado (requiere permiso eliminar:productos)
 */
router.delete(
  '/:id',
  checkPermiso('productos', 'eliminar'),
  productosController.eliminar
);

// Ruta adicional para pruebas de GET sin acceder a la base de datos
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'La API está funcionando correctamente',
    data: [
      { id: 1, nombre: 'Producto de prueba', precio: 100 }
    ]
  });
});
/**
 * @route PATCH /api/productos/:id/stock
 * @desc Ajusta el stock de un producto
 * @access Privado (requiere permiso editar:productos)
 */
router.patch(
  '/:id/stock',
  checkPermiso('productos', 'editar'),
  productosController.ajustarStock
);

module.exports = router;