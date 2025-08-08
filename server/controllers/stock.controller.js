/**
 * Controlador de stock
 * 
 * Gestiona el stock de productos, ajustes de inventario y
 * movimientos de entrada/salida.
 * 
 * @module controllers/stock.controller
 * @requires ../models/producto.model
 * @related_files ../routes/stock.routes.js
 */

const productoModel = require('../models/producto.model');

const stockController = {
  /**
   * Obtiene productos con stock bajo
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerStockBajo: async (req, res) => {
    try {
      const productos = await productoModel.obtenerStockBajo();
      
      res.json({
        success: true,
        data: productos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos con stock bajo',
        error: error.message
      });
    }
  },
  
  /**
   * Ajusta el stock de un producto
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  ajustarStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { cantidad, motivo } = req.body;
      
      if (cantidad === undefined || !motivo) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere cantidad y motivo'
        });
      }
      
      // Verificar que el producto existe
      const productoExistente = await productoModel.obtenerPorId(id);
      
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      const ajustado = await productoModel.ajustarStock(
        id,
        cantidad,
        motivo,
        req.usuario.id
      );
      
      if (!ajustado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo ajustar el stock'
        });
      }
      
      res.json({
        success: true,
        message: 'Stock ajustado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al ajustar stock',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene el historial de movimientos de un producto
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerHistorialMovimientos: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el producto existe
      const productoExistente = await productoModel.obtenerPorId(id);
      
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      const movimientos = await productoModel.obtenerHistorialMovimientos(id);
      
      res.json({
        success: true,
        data: movimientos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de movimientos',
        error: error.message
      });
    }
  }
};

module.exports = stockController;