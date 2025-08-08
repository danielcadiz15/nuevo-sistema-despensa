/**
 * Controlador de categorías
 * Diseñado para ser compatible con migración futura a Firebase
 * 
 * @module controllers/categorias.controller
 * @requires ../config/database
 */

const { DataAccess, query } = require('../config/database');

// Datos de fallback/ejemplo para usar cuando hay errores
const CATEGORIAS_EJEMPLO = [
  { id: 1, nombre: 'General', descripcion: 'Categoría general para productos sin clasificación' },
  { id: 2, nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
  { id: 3, nombre: 'Alimentos', descripcion: 'Productos alimenticios' },
  { id: 4, nombre: 'Limpieza', descripcion: 'Productos de limpieza' },
  { id: 5, nombre: 'Hogar', descripcion: 'Artículos para el hogar' }
];

const categoriasController = {
  /**
   * Obtiene todas las categorías
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodas: async (req, res) => {
    try {
      console.log('Obteniendo todas las categorías');
      
      // Intentar obtener datos reales
      const categorias = await DataAccess.getAll('categorias', {
        orderBy: 'nombre ASC',
        fallbackData: CATEGORIAS_EJEMPLO
      });
      
      console.log(`Se encontraron ${categorias.length} categorías`);
      
      res.json({
        success: true,
        data: categorias
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      
      // Devolver datos de respaldo
      res.json({
        success: true,
        data: CATEGORIAS_EJEMPLO,
        _message: 'Usando datos de respaldo debido a error'
      });
    }
  },
  
  /**
   * Obtiene una categoría por su ID
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      
      const categoria = await DataAccess.getById('categorias', id, {
        fallbackData: CATEGORIAS_EJEMPLO.find(c => c.id === parseInt(id))
      });
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: categoria
      });
    } catch (error) {
      console.error('Error al obtener categoría por ID:', error);
      
      // Intentar devolver datos de ejemplo que coincidan con el ID
      const categoriaEjemplo = CATEGORIAS_EJEMPLO.find(c => c.id === parseInt(req.params.id));
      
      if (categoriaEjemplo) {
        res.json({
          success: true,
          data: categoriaEjemplo,
          _message: 'Usando datos de ejemplo debido a error'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }
  },
  
  /**
   * Crea una nueva categoría
   * @param {Object} req - Objeto de solicitud con datos en body
   * @param {Object} res - Objeto de respuesta
   */
  crear: async (req, res) => {
    try {
      const { nombre, descripcion } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        });
      }
      
      const nuevaCategoria = await DataAccess.create('categorias', {
        nombre,
        descripcion: descripcion || ''
      });
      
      res.status(201).json({
        success: true,
        message: 'Categoría creada correctamente',
        data: nuevaCategoria
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear categoría',
        error: error.message
      });
    }
  },
  
  /**
   * Actualiza una categoría existente
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        });
      }
      
      // Verificar que existe
      const existeCategoria = await DataAccess.getById('categorias', id);
      
      if (!existeCategoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      
      const actualizado = await DataAccess.update('categorias', id, {
        nombre,
        descripcion: descripcion || ''
      });
      
      if (!actualizado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar la categoría'
        });
      }
      
      res.json({
        success: true,
        message: 'Categoría actualizada correctamente',
        data: {
          id: parseInt(id),
          nombre,
          descripcion: descripcion || ''
        }
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
        error: error.message
      });
    }
  },
  
  /**
   * Elimina una categoría
   * @param {Object} req - Objeto de solicitud con id en params
   * @param {Object} res - Objeto de respuesta
   */
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que existe
      const existeCategoria = await DataAccess.getById('categorias', id);
      
      if (!existeCategoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      
      // Verificar si hay productos asociados
      const productosAsociados = await query(
        'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ?',
        [id]
      );
      
      if (productosAsociados[0].total > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la categoría porque tiene productos asociados'
        });
      }
      
      const eliminado = await DataAccess.delete('categorias', id);
      
      if (!eliminado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar la categoría'
        });
      }
      
      res.json({
        success: true,
        message: 'Categoría eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar categoría',
        error: error.message
      });
    }
  },
  
  /**
   * Busca categorías por nombre
   * @param {Object} req - Objeto de solicitud con término en query
   * @param {Object} res - Objeto de respuesta
   */
  buscar: async (req, res) => {
    try {
      const { termino } = req.query;
      
      if (!termino) {
        return this.obtenerTodas(req, res);
      }
      
      const sql = 'SELECT * FROM categorias WHERE nombre LIKE ? ORDER BY nombre';
      const categorias = await query(sql, [`%${termino}%`]);
      
      res.json({
        success: true,
        data: categorias
      });
    } catch (error) {
      console.error('Error al buscar categorías:', error);
      
      // Búsqueda simple en datos de ejemplo
      const categoriasFiltradas = CATEGORIAS_EJEMPLO.filter(
        c => c.nombre.toLowerCase().includes(req.query.termino.toLowerCase())
      );
      
      res.json({
        success: true,
        data: categoriasFiltradas,
        _message: 'Usando datos de ejemplo debido a error'
      });
    }
  }
};

module.exports = categoriasController;