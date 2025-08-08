/**
 * Controlador de promociones
 * 
 * Gestiona todas las operaciones relacionadas con promociones
 * y descuentos.
 * 
 * @module controllers/promociones.controller
 * @requires ../models/promocion.model
 * @related_files ../routes/promociones.routes.js
 */

const promocionModel = require('../models/promocion.model');

const promocionesController = {
  /**
   * Obtiene todas las promociones
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodas: async (req, res) => {
	  try {
		const promociones = await promocionModel.obtenerTodas();
		
		// Parsear condiciones JSON con manejo seguro
		promociones.forEach(promo => {
		  try {
			promo.condiciones = JSON.parse(promo.condiciones || '{}');
		  } catch (e) {
			console.error(`Error al parsear condiciones para promoción ${promo.id}:`, e);
			promo.condiciones = {};
		  }
		});
		
		res.json({
		  success: true,
		  data: promociones
		});
	  } catch (error) {
		console.error('Error al obtener promociones:', error);
		res.status(500).json({
		  success: false,
		  message: 'Error al obtener promociones',
		  error: error.message
		});
	  }
	},
  
  /**
   * Obtiene las promociones activas en la fecha actual
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerActivas: async (req, res) => {
    try {
      const promociones = await promocionModel.obtenerActivasPorFecha();
      
      // Parsear condiciones JSON
      promociones.forEach(promo => {
        promo.condiciones = JSON.parse(promo.condiciones || '{}');
      });
      
      res.json({
        success: true,
        data: promociones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener promociones activas',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene una promoción por su ID
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const promocion = await promocionModel.obtenerPorId(id);
      
      if (!promocion) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: promocion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener promoción',
        error: error.message
      });
    }
  },
  
  /**
   * Crea una nueva promoción
   * @param {Object} req - Objeto de solicitud con datos en body
   * @param {Object} res - Objeto de respuesta
   */
  crear: async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin,
        activo,
        condiciones,
        productos
      } = req.body;
      
      // Validaciones básicas
      if (!nombre || !tipo || !valor || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }
      
      // Crear promoción
      const promocion = {
        nombre,
        descripcion,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin,
        activo: activo !== undefined ? activo : true,
        condiciones,
        productos,
        usuario_id: req.usuario.id
      };
      
      const promocionCreada = await promocionModel.crear(promocion);
      
      res.status(201).json({
        success: true,
        message: 'Promoción creada correctamente',
        data: promocionCreada
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear promoción',
        error: error.message
      });
    }
  },
  
  /**
   * Actualiza una promoción existente
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        descripcion,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin,
        activo,
        condiciones,
        productos
      } = req.body;
      
      // Validaciones básicas
      if (!nombre || !tipo || !valor || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }
      
      // Verificar que la promoción existe
      const promocionExistente = await promocionModel.obtenerPorId(id);
      
      if (!promocionExistente) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada'
        });
      }
      
      // Actualizar promoción
      const promocion = {
        nombre,
        descripcion,
        tipo,
        valor,
        fecha_inicio,
        fecha_fin,
        activo,
        condiciones,
        productos
      };
      
      const actualizada = await promocionModel.actualizar(id, promocion);
      
      if (!actualizada) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar la promoción'
        });
      }
      
      res.json({
        success: true,
        message: 'Promoción actualizada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar promoción',
        error: error.message
      });
    }
  },
  
  /**
   * Cambia el estado de una promoción (activa/inactiva)
   * @param {Object} req - Objeto de solicitud con id en params y activo en body
   * @param {Object} res - Objeto de respuesta
   */
  cambiarEstado: async (req, res) => {
	  try {
		const { id } = req.params;
		const { activo } = req.body;
		
		console.log(`Intentando cambiar estado de promoción ${id} a ${activo}`);
		
		if (activo === undefined) {
		  return res.status(400).json({
			success: false,
			message: 'Se requiere especificar el estado'
		  });
		}
		
		// Verificar que la promoción existe - con manejo de errores
		try {
		  const promocionExistente = await promocionModel.obtenerPorId(id);
		  
		  if (!promocionExistente) {
			return res.status(404).json({
			  success: false,
			  message: 'Promoción no encontrada'
			});
		  }
		  
		  const actualizada = await promocionModel.cambiarEstado(id, activo);
		  
		  if (!actualizada) {
			return res.status(500).json({
			  success: false,
			  message: 'No se pudo cambiar el estado de la promoción'
			});
		  }
		  
		  res.json({
			success: true,
			message: `Promoción ${activo ? 'activada' : 'desactivada'} correctamente`
		  });
		} catch (innerError) {
		  console.error(`Error al verificar promoción ${id}:`, innerError);
		  res.status(500).json({
			success: false,
			message: `Error al verificar promoción: ${innerError.message}`
		  });
		}
	  } catch (error) {
		console.error('Error al cambiar estado de promoción:', error);
		res.status(500).json({
		  success: false,
		  message: 'Error al cambiar estado de promoción',
		  error: error.message
		});
	  }
	},
  
  /**
   * Elimina una promoción
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la promoción existe
      const promocionExistente = await promocionModel.obtenerPorId(id);
      
      if (!promocionExistente) {
        return res.status(404).json({
          success: false,
          message: 'Promoción no encontrada'
        });
      }
      
      const eliminada = await promocionModel.eliminar(id);
      
      if (!eliminada) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar la promoción'
        });
      }
      
      res.json({
        success: true,
        message: 'Promoción eliminada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar promoción',
        error: error.message
      });
    }
  },
  
  /**
   * Aplica promociones a un carrito de productos
   * @param {Object} req - Objeto de solicitud con items en body
   * @param {Object} res - Objeto de respuesta
   */
/**
 * Aplica promociones a un carrito de productos
 * @param {Object} req - Objeto de solicitud con items en body
 * @param {Object} res - Objeto de respuesta
 */
	aplicarPromociones: async (req, res) => {
	  console.group('⚠️ DEPURACIÓN: Controller aplicarPromociones');
	  
	  try {
		const { items } = req.body;
		
		console.log('📥 Items recibidos en controlador:', JSON.stringify(items, null, 2));
		
		if (!items || !Array.isArray(items) || items.length === 0) {
		  console.log('❌ Array de items inválido o vacío');
		  console.groupEnd();
		  return res.status(400).json({
			success: false,
			message: 'Se requiere un array de items válido'
		  });
		}
		
		// Formato seguro de items: asegurarse de que tengan la estructura correcta
		const itemsFormateados = items.map(item => ({
		  id: parseInt(item.id) || 0,
		  codigo: item.codigo || '',
		  nombre: item.nombre || '',
		  precio: parseFloat(item.precio) || 0,
		  cantidad: parseInt(item.cantidad) || 0,
		  subtotal: parseFloat(item.subtotal) || parseFloat(item.precio * item.cantidad) || 0,
		  // Asegurarse de que estos campos existan para evitar errores
		  promociones: [],
		  descuento: 0
		}));
		
		console.log('🔄 Items formateados:', JSON.stringify(itemsFormateados, null, 2));
		
		const itemsConPromociones = await promocionModel.aplicarPromociones(itemsFormateados);
		
		console.log('✅ Items con promociones aplicadas:', JSON.stringify(itemsConPromociones, null, 2));
		
		// Verificar cambios
		const itemsConDescuentos = itemsConPromociones.filter(item => (item.descuento || 0) > 0);
		console.log(`👉 Productos con descuentos aplicados: ${itemsConDescuentos.length}`);
		
		console.groupEnd();
		
		res.json({
		  success: true,
		  data: itemsConPromociones
		});
	  } catch (error) {
		console.error('❌ Error en controlador aplicarPromociones:', error);
		console.groupEnd();
		res.status(500).json({
		  success: false,
		  message: 'Error al aplicar promociones',
		  error: error.message
		});
	  }
	}
};

module.exports = promocionesController;