/**
 * Controlador de clientes
 * 
 * Gestiona todas las operaciones relacionadas con clientes,
 * recibe peticiones HTTP y utiliza el modelo para interactuar con la base de datos.
 * 
 * @module controllers/clientes.controller
 * @requires ../models/cliente.model
 * @related_files ../routes/clientes.routes.js, ../models/cliente.model.js
 */

const clienteModel = require('../models/cliente.model');

const clientesController = {
  /**
   * Obtiene todos los clientes
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodos: async (req, res) => {
    try {
      const clientes = await clienteModel.obtenerTodos();
      
      res.json({
        success: true,
        data: clientes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener clientes',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene un cliente por su ID
   * @param {Object} req - Objeto de solicitud con parámetro id
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const cliente = await clienteModel.obtenerPorId(id);
      
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener cliente',
        error: error.message
      });
    }
  },
  
  /**
   * Busca clientes por término
   * @param {Object} req - Objeto de solicitud con query termino
   * @param {Object} res - Objeto de respuesta
   */
  buscar: async (req, res) => {
    try {
      const { termino } = req.query;
      
      if (!termino) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }
      
      const clientes = await clienteModel.buscar(termino);
      
      res.json({
        success: true,
        data: clientes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al buscar clientes',
        error: error.message
      });
    }
  },
  
  /**
   * Crea un nuevo cliente
   * @param {Object} req - Objeto de solicitud con datos del cliente en body
   * @param {Object} res - Objeto de respuesta
   */
  crear: async (req, res) => {
    try {
      const { nombre, apellido, telefono, email, direccion } = req.body;
      
      // Validaciones básicas
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del cliente es obligatorio'
        });
      }
      
      const cliente = {
        nombre,
        apellido,
        telefono,
        email,
        direccion
      };
      
      const clienteCreado = await clienteModel.crear(cliente);
      
      res.status(201).json({
        success: true,
        message: 'Cliente creado correctamente',
        data: clienteCreado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear cliente',
        error: error.message
      });
    }
  },
  
  /**
   * Actualiza un cliente existente
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, telefono, email, direccion } = req.body;
      
      // Validaciones básicas
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del cliente es obligatorio'
        });
      }
      
      // Verificar que el cliente existe
      const clienteExistente = await clienteModel.obtenerPorId(id);
      
      if (!clienteExistente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      
      const cliente = {
        nombre,
        apellido,
        telefono,
        email,
        direccion
      };
      
      const actualizado = await clienteModel.actualizar(id, cliente);
      
      if (!actualizado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el cliente'
        });
      }
      
      res.json({
        success: true,
        message: 'Cliente actualizado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar cliente',
        error: error.message
      });
    }
  },
  
  /**
   * Elimina un cliente
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el cliente existe
      const clienteExistente = await clienteModel.obtenerPorId(id);
      
      if (!clienteExistente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      
      try {
        const eliminado = await clienteModel.eliminar(id);
        
        res.json({
          success: true,
          message: 'Cliente eliminado correctamente'
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar cliente',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene el historial de compras de un cliente
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerHistorialCompras: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el cliente existe
      const clienteExistente = await clienteModel.obtenerPorId(id);
      
      if (!clienteExistente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
      
      const historial = await clienteModel.obtenerHistorialCompras(id);
      
      res.json({
        success: true,
        data: historial
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial de compras',
        error: error.message
      });
    }
  }
};

module.exports = clientesController;