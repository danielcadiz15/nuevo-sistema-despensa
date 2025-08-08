/**
 * Modelo de proveedores
 * 
 * Gestiona los proveedores en la base de datos.
 * 
 * @module models/proveedor.model
 * @requires ../config/database
 * @related_files ../controllers/proveedores.controller.js
 */

const db = require('../config/database');

/**
 * Métodos para gestionar los proveedores en la base de datos
 * @type {Object}
 */
const proveedorModel = {
  /**
   * Obtiene todos los proveedores
   * @returns {Promise<Array>} Lista de proveedores
   */
  obtenerTodos: async () => {
    try {
      const query = `
        SELECT 
          p.id, 
          p.nombre, 
          p.contacto,
          p.telefono,
          p.email,
          p.direccion,
          p.notas,
          COUNT(prod.id) AS total_productos
        FROM proveedores p
        LEFT JOIN productos prod ON p.id = prod.proveedor_id
        GROUP BY p.id
        ORDER BY p.nombre ASC
      `;
      
      const [proveedores] = await db.query(query);
      return proveedores;
    } catch (error) {
      console.error('Error en obtenerTodos (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Obtiene un proveedor por su ID
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} Datos del proveedor
   */
  obtenerPorId: async (id) => {
    try {
      const query = `
        SELECT 
          p.id, 
          p.nombre, 
          p.contacto,
          p.telefono,
          p.email,
          p.direccion,
          p.notas,
          COUNT(prod.id) AS total_productos
        FROM proveedores p
        LEFT JOIN productos prod ON p.id = prod.proveedor_id
        WHERE p.id = ?
        GROUP BY p.id
      `;
      
      const [proveedores] = await db.query(query, [id]);
      
      if (proveedores.length === 0) {
        return null;
      }
      
      return proveedores[0];
    } catch (error) {
      console.error('Error en obtenerPorId (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Busca proveedores por término en nombre, contacto, email o teléfono
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Proveedores que coinciden con la búsqueda
   */
  buscar: async (termino) => {
    try {
      const query = `
        SELECT 
          p.id, 
          p.nombre, 
          p.contacto,
          p.telefono,
          p.email,
          p.direccion,
          p.notas,
          COUNT(prod.id) AS total_productos
        FROM proveedores p
        LEFT JOIN productos prod ON p.id = prod.proveedor_id
        WHERE p.nombre LIKE ? OR p.contacto LIKE ? OR p.email LIKE ? OR p.telefono LIKE ?
        GROUP BY p.id
        ORDER BY p.nombre ASC
      `;
      
      const terminoBusqueda = `%${termino}%`;
      const [proveedores] = await db.query(query, [
        terminoBusqueda, 
        terminoBusqueda, 
        terminoBusqueda, 
        terminoBusqueda
      ]);
      
      return proveedores;
    } catch (error) {
      console.error('Error en buscar (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Crea un nuevo proveedor
   * @param {Object} proveedor - Datos del proveedor
   * @returns {Promise<Object>} Proveedor creado con ID
   */
  crear: async (proveedor) => {
    try {
      const { nombre, contacto, telefono, email, direccion, notas } = proveedor;
      
      const query = `
        INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [resultado] = await db.query(query, [
        nombre, 
        contacto || null, 
        telefono || null, 
        email || null, 
        direccion || null, 
        notas || null
      ]);
      
      return {
        id: resultado.insertId,
        nombre,
        contacto,
        telefono,
        email,
        direccion,
        notas,
        total_productos: 0
      };
    } catch (error) {
      console.error('Error en crear (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Actualiza un proveedor existente
   * @param {number} id - ID del proveedor
   * @param {Object} proveedor - Nuevos datos del proveedor
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  actualizar: async (id, proveedor) => {
    try {
      const { nombre, contacto, telefono, email, direccion, notas } = proveedor;
      
      const query = `
        UPDATE proveedores
        SET nombre = ?, contacto = ?, telefono = ?, email = ?, direccion = ?, notas = ?
        WHERE id = ?
      `;
      
      const [resultado] = await db.query(query, [
        nombre, 
        contacto || null, 
        telefono || null, 
        email || null, 
        direccion || null, 
        notas || null,
        id
      ]);
      
      return resultado.affectedRows > 0;
    } catch (error) {
      console.error('Error en actualizar (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Elimina un proveedor
   * @param {number} id - ID del proveedor
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  eliminar: async (id) => {
    try {
      // Verificar si el proveedor está en uso
      const queryVerificar = `
        SELECT COUNT(*) AS total
        FROM productos
        WHERE proveedor_id = ?
      `;
      
      const [verificacion] = await db.query(queryVerificar, [id]);
      
      if (verificacion[0].total > 0) {
        throw new Error('No se puede eliminar el proveedor porque está asociado a productos');
      }
      
      const query = `
        DELETE FROM proveedores
        WHERE id = ?
      `;
      
      const [resultado] = await db.query(query, [id]);
      
      return resultado.affectedRows > 0;
    } catch (error) {
      console.error('Error en eliminar (proveedor.model):', error);
      throw error;
    }
  },
  
  /**
   * Obtiene la lista de productos de un proveedor
   * @param {number} id - ID del proveedor
   * @returns {Promise<Array>} Lista de productos del proveedor
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
        WHERE p.proveedor_id = ?
        ORDER BY p.nombre ASC
      `;
      
      const [productos] = await db.query(query, [id]);
      
      return productos;
    } catch (error) {
      console.error('Error en obtenerProductos (proveedor.model):', error);
      throw error;
    }
  }
};

module.exports = proveedorModel;