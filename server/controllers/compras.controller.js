/**
 * Controlador de compras
 * 
 * Gestiona todas las operaciones relacionadas con compras a proveedores,
 * recibe peticiones HTTP y utiliza el modelo para interactuar con la base de datos.
 * 
 * @module controllers/compras.controller
 * @requires ../models/compra.model
 * @related_files ../routes/compras.routes.js, ../models/compra.model.js
 */

const compraModel = require('../models/compra.model');

const comprasController = {
  /**
   * Obtiene todas las compras
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodas: async (req, res) => {
    try {
      const compras = await compraModel.obtenerTodas();
      
      res.json({
        success: true,
        data: compras
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener compras',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene una compra por su ID
   * @param {Object} req - Objeto de solicitud con parámetro id
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const compra = await compraModel.obtenerPorId(id);
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: compra
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener compra',
        error: error.message
      });
    }
  },
  
  /**
   * Crea una nueva compra
   * @param {Object} req - Objeto de solicitud con datos de la compra y detalles en body
   * @param {Object} res - Objeto de respuesta
   */
  crear: async (req, res) => {
    try {
      const { compra, detalles } = req.body;
      
      // Validaciones básicas
      if (!compra || !compra.proveedor_id || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos. Se requiere proveedor y al menos un producto'
        });
      }
      
      // Añadir usuario que realiza la compra
      compra.usuario_id = req.usuario.id;
      
      // Validar detalles
      for (const detalle of detalles) {
        if (!detalle.producto_id || !detalle.cantidad || !detalle.precio_unitario) {
          return res.status(400).json({
            success: false,
            message: 'Todos los productos deben incluir ID, cantidad y precio'
          });
        }
      }
      
      const compraCreada = await compraModel.crear(compra, detalles);
      
      res.status(201).json({
        success: true,
        message: 'Compra creada correctamente',
        data: compraCreada
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear compra',
        error: error.message
      });
    }
  },
  
  /**
   * Recibe una compra (cambia estado a 'recibida')
   * @param {Object} req - Objeto de solicitud con id en params y datos adicionales en body
   * @param {Object} res - Objeto de respuesta
   */
  recibirCompra: async (req, res) => {
    try {
      const { id } = req.params;
      const datos = req.body;
      
      // Verificar que la compra existe
      const compraExistente = await compraModel.obtenerPorId(id);
      
      if (!compraExistente) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }
      
      if (compraExistente.estado !== 'pendiente') {
        return res.status(400).json({
          success: false,
          message: `La compra ya está en estado '${compraExistente.estado}'`
        });
      }
      
      const recibida = await compraModel.recibirCompra(id, datos);
      
      res.json({
        success: true,
        message: 'Compra recibida correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al recibir compra',
        error: error.message
      });
    }
  },
  
  /**
   * Cancela una compra pendiente
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  cancelarCompra: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la compra existe
      const compraExistente = await compraModel.obtenerPorId(id);
      
      if (!compraExistente) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }
      
      if (compraExistente.estado !== 'pendiente') {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar una compra que ya ha sido recibida'
        });
      }
      
      const cancelada = await compraModel.cancelarCompra(id);
      
      res.json({
        success: true,
        message: 'Compra cancelada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cancelar compra',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene compras por proveedor
   * @param {Object} req - Objeto de solicitud con proveedor_id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorProveedor: async (req, res) => {
    try {
      const { proveedor_id } = req.params;
      const compras = await compraModel.obtenerPorProveedor(proveedor_id);
      
      res.json({
        success: true,
        data: compras
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener compras del proveedor',
        error: error.message
      });
    }
  }
};

module.exports = comprasController;