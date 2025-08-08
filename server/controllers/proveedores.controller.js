/**
 * Controlador de proveedores
 * Diseñado para ser compatible con migración futura a Firebase
 * 
 * @module controllers/proveedores.controller
 * @requires ../config/database
 */

const { DataAccess, query } = require('../config/database');

// Datos de respaldo para proveedores
const PROVEEDORES_EJEMPLO = [
  { id: 1, nombre: 'Proveedor General', contacto: 'Juan Pérez', telefono: '123456789', email: 'contacto@proveedor.com' },
  { id: 2, nombre: 'Distribuidora Alimentos', contacto: 'María López', telefono: '987654321', email: 'contacto@distribuidora.com' },
  { id: 3, nombre: 'Limpieza Industrial', contacto: 'Carlos Gómez', telefono: '456789123', email: 'ventas@limpiezaindustrial.com' }
];

const proveedoresController = {
  /**
   * Obtiene todos los proveedores
   */
  obtenerTodos: async (req, res) => {
    try {
      console.log('Obteniendo todos los proveedores');
      
      // Intentar obtener datos reales
      const proveedores = await DataAccess.getAll('proveedores', {
        orderBy: 'nombre ASC',
        fallbackData: PROVEEDORES_EJEMPLO
      });
      
      console.log(`Se encontraron ${proveedores.length} proveedores`);
      
      res.json({
        success: true,
        data: proveedores
      });
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      
      res.json({
        success: true,
        data: PROVEEDORES_EJEMPLO,
        _message: 'Usando datos de respaldo debido a error'
      });
    }
  },
  
  /**
   * Obtiene un proveedor por su ID
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      
      const proveedor = await DataAccess.getById('proveedores', id, {
        fallbackData: PROVEEDORES_EJEMPLO.find(p => p.id === parseInt(id))
      });
      
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: proveedor
      });
    } catch (error) {
      console.error('Error al obtener proveedor por ID:', error);
      
      // Buscar en datos de ejemplo
      const proveedorEjemplo = PROVEEDORES_EJEMPLO.find(p => p.id === parseInt(req.params.id));
      
      if (proveedorEjemplo) {
        res.json({
          success: true,
          data: proveedorEjemplo,
          _message: 'Usando datos de ejemplo'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
    }
  },
  
  // Implementa el resto de métodos CRUD según necesites...
};

module.exports = proveedoresController;