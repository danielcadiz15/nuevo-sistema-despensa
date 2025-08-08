/**
 * Modelo para la gestión de clientes
 * 
 * Este modelo contiene todas las operaciones de base de datos relacionadas
 * con los clientes y su gestión.
 * 
 * @module models/cliente.model
 * @requires ../config/database
 * @related_files ../controllers/clientes.controller.js, ../routes/clientes.routes.js
 */

const { query } = require('../config/database');

const clienteModel = {
  /**
   * Obtiene todos los clientes
   * @returns {Promise<Array>} Lista de clientes
   */
  obtenerTodos: async () => {
    const sql = `
      SELECT *
      FROM clientes
      ORDER BY nombre ASC, apellido ASC
    `;
    
    return await query(sql);
  },
  
  /**
   * Obtiene un cliente por su ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  obtenerPorId: async (id) => {
    const sql = `
      SELECT *
      FROM clientes
      WHERE id = ?
    `;
    
    const clientes = await query(sql, [id]);
    return clientes.length > 0 ? clientes[0] : null;
  },
  
  /**
   * Busca clientes por nombre o datos de contacto
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Clientes que coinciden con la búsqueda
   */
  buscar: async (termino) => {
    const sql = `
      SELECT *
      FROM clientes
      WHERE nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR telefono LIKE ?
      ORDER BY nombre ASC, apellido ASC
    `;
    
    const busqueda = `%${termino}%`;
    return await query(sql, [busqueda, busqueda, busqueda, busqueda]);
  },
  
  /**
   * Crea un nuevo cliente
   * @param {Object} cliente - Datos del cliente
   * @returns {Promise<Object>} Cliente creado con su ID
   */
  crear: async (cliente) => {
    const sql = `
      INSERT INTO clientes (
        nombre, apellido, telefono, email, direccion
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await query(
      sql,
      [
        cliente.nombre,
        cliente.apellido,
        cliente.telefono,
        cliente.email,
        cliente.direccion
      ]
    );
    
    return {
      id: result.insertId,
      ...cliente
    };
  },
  
  /**
   * Actualiza un cliente existente
   * @param {number} id - ID del cliente
   * @param {Object} cliente - Nuevos datos del cliente
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  actualizar: async (id, cliente) => {
    const sql = `
      UPDATE clientes
      SET 
        nombre = ?,
        apellido = ?,
        telefono = ?,
        email = ?,
        direccion = ?
      WHERE id = ?
    `;
    
    const result = await query(
      sql,
      [
        cliente.nombre,
        cliente.apellido,
        cliente.telefono,
        cliente.email,
        cliente.direccion,
        id
      ]
    );
    
    return result.affectedRows > 0;
  },
  
  /**
   * Elimina un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  eliminar: async (id) => {
    // Primero verificamos si el cliente tiene ventas asociadas
    const ventasCheck = await query(
      'SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?',
      [id]
    );
    
    if (ventasCheck[0].count > 0) {
      throw new Error('No se puede eliminar el cliente porque tiene ventas asociadas');
    }
    
    const sql = 'DELETE FROM clientes WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
  
  /**
   * Obtiene el historial de compras de un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<Array>} Historial de compras
   */
  obtenerHistorialCompras: async (id) => {
    const sql = `
      SELECT 
        v.id, v.numero, v.fecha, v.subtotal, v.descuento, 
        v.impuestos, v.total, v.metodo_pago, v.estado,
        u.nombre as vendedor
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.cliente_id = ?
      ORDER BY v.fecha DESC
    `;
    
    return await query(sql, [id]);
  }
};

module.exports = clienteModel;