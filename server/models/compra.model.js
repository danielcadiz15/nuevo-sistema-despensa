/**
 * Modelo para la gestión de compras
 * 
 * Este modelo contiene todas las operaciones de base de datos relacionadas
 * con las compras a proveedores y sus detalles.
 * 
 * @module models/compra.model
 * @requires ../config/database
 * @related_files ../controllers/compras.controller.js, ../routes/compras.routes.js
 */

const { query, beginTransaction, transactionQuery, commitTransaction, rollbackTransaction } = require('../config/database');

const compraModel = {
  /**
   * Obtiene todas las compras con información básica
   * @returns {Promise<Array>} Lista de compras
   */
  obtenerTodas: async () => {
    const sql = `
      SELECT c.id, c.numero, c.fecha, c.estado, c.total,
             p.nombre as proveedor, u.nombre as usuario
      FROM compras c
      JOIN proveedores p ON c.proveedor_id = p.id
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.fecha DESC
    `;
    
    return await query(sql);
  },
  
  /**
   * Obtiene una compra por su ID con detalles
   * @param {number} id - ID de la compra
   * @returns {Promise<Object>} Datos de la compra con sus detalles
   */
  obtenerPorId: async (id) => {
    // Obtener información de la compra
    const sqlCompra = `
      SELECT c.*, p.nombre as proveedor, p.contacto, p.telefono, p.email,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM compras c
      JOIN proveedores p ON c.proveedor_id = p.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `;
    
    const compras = await query(sqlCompra, [id]);
    
    if (compras.length === 0) {
      return null;
    }
    
    const compra = compras[0];
    
    // Obtener detalles de la compra
    const sqlDetalles = `
      SELECT d.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM detalle_compra d
      JOIN productos p ON d.producto_id = p.id
      WHERE d.compra_id = ?
    `;
    
    const detalles = await query(sqlDetalles, [id]);
    
    // Agregar detalles a la compra
    compra.detalles = detalles;
    
    return compra;
  },
  
  /**
   * Crea una nueva compra con sus detalles
   * @param {Object} compra - Datos de la compra
   * @param {Array} detalles - Detalles de productos
   * @returns {Promise<Object>} Compra creada con su ID
   */
  crear: async (compra, detalles) => {
    const connection = await beginTransaction();
    
    try {
      // Calcular subtotal, impuestos y total
      let subtotal = 0;
      
      detalles.forEach(detalle => {
        detalle.precio_total = detalle.cantidad * detalle.precio_unitario;
        subtotal += detalle.precio_total;
      });
      
      // Calcular impuestos (si aplica)
      const impuestos = compra.impuestos || 0;
      const total = subtotal + impuestos;
      
      // Insertar compra
      const sqlCompra = `
        INSERT INTO compras (
          proveedor_id, usuario_id, subtotal, impuestos, total, estado, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const resultCompra = await transactionQuery(
        connection,
        sqlCompra,
        [
          compra.proveedor_id,
          compra.usuario_id,
          subtotal,
          impuestos,
          total,
          compra.estado || 'pendiente',
          compra.notas || null
        ]
      );
      
      const compraId = resultCompra.insertId;
      
      // Insertar detalles
      const sqlDetalle = `
        INSERT INTO detalle_compra (
          compra_id, producto_id, cantidad, precio_unitario, precio_total
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      for (const detalle of detalles) {
        await transactionQuery(
          connection,
          sqlDetalle,
          [
            compraId,
            detalle.producto_id,
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.precio_total
          ]
        );
      }
      
      await commitTransaction(connection);
      
      // Devolver datos de la compra creada
      return {
        id: compraId,
        numero: `C${String(compraId).padStart(6, '0')}`,
        ...compra,
        subtotal,
        impuestos,
        total,
        detalles
      };
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Cambia el estado de una compra a 'recibida'
   * @param {number} id - ID de la compra
   * @param {Object} datos - Datos adicionales para la recepción
   * @returns {Promise<boolean>} True si se recibió correctamente
   */
  recibirCompra: async (id, datos) => {
    const connection = await beginTransaction();
    
    try {
      // Obtener la compra para verificar que esté pendiente
      const compras = await transactionQuery(
        connection,
        'SELECT * FROM compras WHERE id = ?',
        [id]
      );
      
      if (compras.length === 0) {
        throw new Error('Compra no encontrada');
      }
      
      const compra = compras[0];
      
      if (compra.estado !== 'pendiente') {
        throw new Error('La compra ya ha sido recibida o cancelada');
      }
      
      // Actualizar estado de la compra
      await transactionQuery(
        connection,
        'UPDATE compras SET estado = ?, fecha_recepcion = NOW() WHERE id = ?',
        ['recibida', id]
      );
      
      // Obtener detalles de la compra
      const detalles = await transactionQuery(
        connection,
        'SELECT * FROM detalle_compra WHERE compra_id = ?',
        [id]
      );
      
      // Actualizar stock de productos
      for (const detalle of detalles) {
        // El trigger automático actualiza el stock, pero si deseas aplicar lógica específica
        // puedes comentar esta parte y hacer una actualización manual
        
        // También puedes actualizar el precio de costo de los productos
        if (datos && datos.actualizar_precios) {
          await transactionQuery(
            connection,
            'UPDATE productos SET precio_costo = ? WHERE id = ?',
            [detalle.precio_unitario, detalle.producto_id]
          );
        }
      }
      
      await commitTransaction(connection);
      return true;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Cancela una compra pendiente
   * @param {number} id - ID de la compra
   * @returns {Promise<boolean>} True si se canceló correctamente
   */
  cancelarCompra: async (id) => {
    const connection = await beginTransaction();
    
    try {
      // Obtener la compra para verificar que esté pendiente
      const compras = await transactionQuery(
        connection,
        'SELECT * FROM compras WHERE id = ?',
        [id]
      );
      
      if (compras.length === 0) {
        throw new Error('Compra no encontrada');
      }
      
      const compra = compras[0];
      
      if (compra.estado !== 'pendiente') {
        throw new Error('No se puede cancelar una compra que ya ha sido recibida');
      }
      
      // Actualizar estado de la compra
      await transactionQuery(
        connection,
        'UPDATE compras SET estado = ? WHERE id = ?',
        ['cancelada', id]
      );
      
      await commitTransaction(connection);
      return true;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Obtiene las compras de un proveedor específico
   * @param {number} proveedorId - ID del proveedor
   * @returns {Promise<Array>} Lista de compras del proveedor
   */
  obtenerPorProveedor: async (proveedorId) => {
    const sql = `
      SELECT c.id, c.numero, c.fecha, c.estado, c.total,
             p.nombre as proveedor, u.nombre as usuario
      FROM compras c
      JOIN proveedores p ON c.proveedor_id = p.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.proveedor_id = ?
      ORDER BY c.fecha DESC
    `;
    
    return await query(sql, [proveedorId]);
  }
};

module.exports = compraModel;