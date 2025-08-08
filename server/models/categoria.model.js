/**
 * Modelo de categorías
 * 
 * Gestiona las categorías de productos en la base de datos.
 * 
 * @module models/categoria.model
 * @requires ../config/database
 * @related_files ../controllers/categorias.controller.js
 */

const db = require('../config/database');

/**
 * Métodos para gestionar las categorías en la base de datos
 * @type {Object}
 */
const categoriaModel = {
  /**
   * Obtiene todas las categorías
   * @returns {Promise<Array>} Lista de categorías
   */
  obtenerTodos: async () => {
    try {
      const query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.descripcion,
          COUNT(p.id) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id
        GROUP BY c.id
        ORDER BY c.nombre ASC
      `;
      
      const [categorias] = await db.query(query);
      return categorias;
    } catch (error) {
      console.error('Error en obtenerTodos (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Obtiene una categoría por su ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object>} Datos de la categoría
   */
  obtenerPorId: async (id) => {
    try {
      const query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.descripcion,
          COUNT(p.id) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [categorias] = await db.query(query, [id]);
      
      if (categorias.length === 0) {
        return null;
      }
      
      return categorias[0];
    } catch (error) {
      console.error('Error en obtenerPorId (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Busca categorías por término en nombre o descripción
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Categorías que coinciden con la búsqueda
   */
  buscar: async (termino) => {
    try {
      const query = `
        SELECT 
          c.id, 
          c.nombre, 
          c.descripcion,
          COUNT(p.id) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id
        WHERE c.nombre LIKE ? OR c.descripcion LIKE ?
        GROUP BY c.id
        ORDER BY c.nombre ASC
      `;
      
      const terminoBusqueda = `%${termino}%`;
      const [categorias] = await db.query(query, [terminoBusqueda, terminoBusqueda]);
      
      return categorias;
    } catch (error) {
      console.error('Error en buscar (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Crea una nueva categoría
   * @param {Object} categoria - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada con ID
   */
  crear: async (categoria) => {
    try {
      const { nombre, descripcion } = categoria;
      
      const query = `
        INSERT INTO categorias (nombre, descripcion)
        VALUES (?, ?)
      `;
      
      const [resultado] = await db.query(query, [nombre, descripcion]);
      
      return {
        id: resultado.insertId,
        nombre,
        descripcion,
        total_productos: 0
      };
    } catch (error) {
      console.error('Error en crear (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Actualiza una categoría existente
   * @param {number} id - ID de la categoría
   * @param {Object} categoria - Nuevos datos de la categoría
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  actualizar: async (id, categoria) => {
    try {
      const { nombre, descripcion } = categoria;
      
      const query = `
        UPDATE categorias
        SET nombre = ?, descripcion = ?
        WHERE id = ?
      `;
      
      const [resultado] = await db.query(query, [nombre, descripcion, id]);
      
      return resultado.affectedRows > 0;
    } catch (error) {
      console.error('Error en actualizar (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Elimina una categoría
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  eliminar: async (id) => {
    try {
      // Verificar si la categoría está en uso
      const queryVerificar = `
        SELECT COUNT(*) AS total
        FROM productos
        WHERE categoria_id = ?
      `;
      
      const [verificacion] = await db.query(queryVerificar, [id]);
      
      if (verificacion[0].total > 0) {
        throw new Error('No se puede eliminar la categoría porque está asociada a productos');
      }
      
      const query = `
        DELETE FROM categorias
        WHERE id = ?
      `;
      
      const [resultado] = await db.query(query, [id]);
      
      return resultado.affectedRows > 0;
    } catch (error) {
      console.error('Error en eliminar (categoria.model):', error);
      throw error;
    }
  },
  
  /**
   * Obtiene la lista de productos en una categoría
   * @param {number} id - ID de la categoría
   * @returns {Promise<Array>} Lista de productos en la categoría
   */
  obtenerProductos: async (id) => {
    try {
      const query = `
        SELECT 
          p.id, 
          p.codigo, 
          p.nombre, 
          p.descripcion,
          p.precio_costo,
          p.precio_venta,
          p.imagen,
          s.cantidad AS stock_actual
        FROM productos p
        LEFT JOIN stock s ON p.id = s.producto_id
        WHERE p.categoria_id = ?
        ORDER BY p.nombre ASC
      `;
      
      const [productos] = await db.query(query, [id]);
      
      return productos;
    } catch (error) {
      console.error('Error en obtenerProductos (categoria.model):', error);
      throw error;
    }
  }
};

module.exports = categoriaModel;