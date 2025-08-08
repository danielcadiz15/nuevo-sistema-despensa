/**
 * Modelo para la gestión de ventas
 * 
 * Este modelo contiene todas las operaciones de base de datos relacionadas
 * con las ventas y sus detalles.
 * 
 * @module models/venta.model
 * @requires ../config/database
 * @related_files ../controllers/ventas.controller.js, ../routes/ventas.routes.js
 */

const { query, beginTransaction, transactionQuery, commitTransaction, rollbackTransaction } = require('../config/database');

const ventaModel = {
  /**
   * Obtiene todas las ventas con información básica
   * @returns {Promise<Array>} Lista de ventas
   */
  obtenerTodas: async () => {
    const sql = `
      SELECT v.id, v.numero, v.fecha, v.estado, v.total,
             CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) as cliente,
             CONCAT(u.nombre, ' ', u.apellido) as usuario
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.fecha DESC
    `;
    
    return await query(sql);
  },
  
  /**
   * Obtiene una venta por su ID con detalles
   * @param {number} id - ID de la venta
   * @returns {Promise<Object>} Datos de la venta con sus detalles
   */
/**
 * Obtiene una venta por su ID con todos sus detalles
 * @param {number} id - ID de la venta
 * @returns {Promise<Object>} Venta con sus detalles
 */
	obtenerPorId: async (id) => {
	  try {
		// 1. Obtener la información básica de la venta
		const sqlVenta = `
		  SELECT v.*, 
				 c.nombre as cliente_nombre, c.apellido as cliente_apellido,
				 u.nombre as usuario_nombre, u.apellido as usuario_apellido
		  FROM ventas v
		  LEFT JOIN clientes c ON v.cliente_id = c.id
		  LEFT JOIN usuarios u ON v.usuario_id = u.id
		  WHERE v.id = ?
		`;
		
		const ventas = await query(sqlVenta, [id]);
		
		if (ventas.length === 0) {
		  return null;
		}
		
		const venta = ventas[0];
		
		// 2. Obtener los detalles (productos) de la venta
		const sqlDetalles = `
		  SELECT dv.*, 
				 p.nombre as producto_nombre, p.codigo as producto_codigo,
				 p.descripcion as producto_descripcion, p.imagen as producto_imagen,
				 p.precio_costo as producto_costo
		  FROM detalle_venta dv
		  JOIN productos p ON dv.producto_id = p.id
		  WHERE dv.venta_id = ?
		`;
		
		const detalles = await query(sqlDetalles, [id]);
		
		// 3. Calcular totales y estadísticas
		let subtotalReal = 0;
		let descuentoTotal = 0;
		
		detalles.forEach(detalle => {
		  // Calcular el precio total sin descuento
		  const precioTotalSinDescuento = detalle.precio_unitario * detalle.cantidad;
		  
		  // Añadir esta propiedad para mostrar en el frontend
		  detalle.precio_total_sin_descuento = precioTotalSinDescuento;
		  
		  // Actualizar acumuladores
		  subtotalReal += precioTotalSinDescuento;
		  descuentoTotal += detalle.descuento || 0;
		});
		
		// 4. Estructurar la respuesta completa
		return {
		  ...venta,
		  detalles: detalles,
		  // Añadir estadísticas calculadas
		  estadisticas: {
			cantidad_productos: detalles.length,
			items_totales: detalles.reduce((sum, item) => sum + item.cantidad, 0),
			subtotal_real: subtotalReal,
			descuento_total: descuentoTotal,
			// Calcular el margen de ganancia si se tienen los costos
			ganancia: detalles.reduce((sum, item) => {
			  const costo = item.producto_costo * item.cantidad;
			  const venta = item.precio_total;
			  return sum + (venta - costo);
			}, 0)
		  }
		};
	  } catch (error) {
		console.error('Error al obtener venta por ID:', error);
		throw error;
	  }
	},
  
  /**
   * Crea una nueva venta con sus detalles
   * @param {Object} venta - Datos de la venta
   * @param {Array} detalles - Detalles de productos
   * @returns {Promise<Object>} Venta creada con su ID
   */
  crear: async (venta, detalles) => {
    const connection = await beginTransaction();
    
    try {
      // Calcular subtotal y total
      let subtotal = 0;
      
      detalles.forEach(detalle => {
        detalle.precio_total = detalle.cantidad * detalle.precio_unitario;
        
        // Aplicar descuento al detalle si existe
        if (detalle.descuento) {
          detalle.precio_total -= detalle.descuento;
        }
        
        subtotal += detalle.precio_total;
      });
      
      // Aplicar descuento general si existe
      const descuento = venta.descuento || 0;
      const impuestos = venta.impuestos || 0;
      const total = subtotal - descuento + impuestos;
      
  // Insertar venta con los nuevos campos
	  const sqlVenta = `
		INSERT INTO ventas (
		  cliente_id, usuario_id, subtotal, descuento, impuestos, 
		  total, metodo_pago, estado, notas, monto_pagado, pago_pendiente
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	  `;
	  
	  const resultVenta = await transactionQuery(
		connection,
		sqlVenta,
		[
		  venta.cliente_id || null,
		  venta.usuario_id,
		  subtotal,
		  descuento,
		  impuestos,
		  total,
		  venta.metodo_pago || 'efectivo',
		  venta.estado || 'completada',
		  venta.notas || null,
		  venta.estado === 'pendiente' ? (venta.monto_pagado || 0) : total,
		  venta.estado === 'pendiente' ? (total - (venta.monto_pagado || 0)) : 0
		]
	  );
      
      const ventaId = resultVenta.insertId;
      
      // Insertar detalles y actualizar stock
      const sqlDetalle = `
        INSERT INTO detalle_venta (
          venta_id, producto_id, cantidad, precio_unitario,
          descuento, precio_total, promocion_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      for (const detalle of detalles) {
        // Insertar detalle (el trigger se encarga de actualizar el stock)
        await transactionQuery(
          connection,
          sqlDetalle,
          [
            ventaId,
            detalle.producto_id,
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.descuento || 0,
            detalle.precio_total,
            detalle.promocion_id || null
          ]
        );
      }
      
      await commitTransaction(connection);
      
      // Obtener el número de venta generado por el trigger
      const ventaCompleta = await query(
        'SELECT numero FROM ventas WHERE id = ?',
        [ventaId]
      );
      
      // Devolver datos de la venta creada
      return {
        id: ventaId,
        numero: ventaCompleta[0].numero,
        ...venta,
        subtotal,
        descuento,
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
   * Cambia el estado de una venta
   * @param {number} id - ID de la venta
   * @param {string} estado - Nuevo estado ('completada', 'cancelada', 'pendiente', 'devuelta')
   * @param {string} motivo - Motivo del cambio (opcional)
   * @returns {Promise<boolean>} True si se cambió correctamente
   */
  cambiarEstado: async (id, estado, motivo) => {
    const connection = await beginTransaction();
    
    try {
      // Obtener la venta para verificar su estado actual
      const ventas = await transactionQuery(
        connection,
        'SELECT * FROM ventas WHERE id = ?',
        [id]
      );
      
      if (ventas.length === 0) {
        throw new Error('Venta no encontrada');
      }
      
      const venta = ventas[0];
      
      // No permitir cambiar a estado completada si ya está cancelada o devuelta
      if ((venta.estado === 'cancelada' || venta.estado === 'devuelta') && 
          estado === 'completada') {
        throw new Error('No se puede cambiar a completada una venta cancelada o devuelta');
      }
      
      // Actualizar estado de la venta
      await transactionQuery(
        connection,
        'UPDATE ventas SET estado = ?, notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
        [estado, motivo ? `\n[${new Date().toISOString()}] ${motivo}` : '', id]
      );
      
      // Si se cancela o devuelve, restaurar el stock
      if ((estado === 'cancelada' || estado === 'devuelta') && 
          (venta.estado === 'completada' || venta.estado === 'pendiente')) {
        
        // Obtener detalles de la venta
        const detalles = await transactionQuery(
          connection,
          'SELECT * FROM detalle_venta WHERE venta_id = ?',
          [id]
        );
        
        // Para cada producto, restaurar el stock y registrar movimiento
        for (const detalle of detalles) {
          // Actualizar stock
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
            [detalle.cantidad, detalle.producto_id]
          );
          
          // Registrar movimiento
          await transactionQuery(
            connection,
            `INSERT INTO movimientos_stock 
              (producto_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id)
             VALUES (?, 'entrada', ?, ?, ?, ?, ?)`,
            [
              detalle.producto_id,
              detalle.cantidad,
              `Venta ${estado}: ${motivo || ''}`,
              id,
              estado === 'cancelada' ? 'cancelacion' : 'devolucion',
              venta.usuario_id
            ]
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
   * Obtiene ventas por cliente
   * @param {number} clienteId - ID del cliente
   * @returns {Promise<Array>} Lista de ventas del cliente
   */
  obtenerPorCliente: async (clienteId) => {
    const sql = `
      SELECT v.id, v.numero, v.fecha, v.estado, v.total,
             CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) as cliente,
             CONCAT(u.nombre, ' ', u.apellido) as usuario
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.cliente_id = ?
      ORDER BY v.fecha DESC
    `;
    
    return await query(sql, [clienteId]);
  },
  
  /**
   * Busca ventas por fecha o número
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Ventas que coinciden con la búsqueda
   */
  buscar: async (termino) => {
    const sql = `
      SELECT v.id, v.numero, v.fecha, v.estado, v.total,
             CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) as cliente,
             CONCAT(u.nombre, ' ', u.apellido) as usuario
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.numero LIKE ? OR 
            DATE_FORMAT(v.fecha, '%Y-%m-%d') LIKE ? OR
            CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) LIKE ?
      ORDER BY v.fecha DESC
    `;
    
    const busqueda = `%${termino}%`;
    return await query(sql, [busqueda, busqueda, busqueda]);
  },
  
  /**
   * Obtiene estadísticas de ventas del día actual
   * @returns {Promise<Object>} Estadísticas de ventas
   */
  obtenerEstadisticasDia: async () => {
    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as monto_total,
        SUM(IF(metodo_pago = 'efectivo', total, 0)) as efectivo,
        SUM(IF(metodo_pago = 'tarjeta', total, 0)) as tarjeta,
        SUM(IF(metodo_pago = 'transferencia', total, 0)) as transferencia
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
      AND estado = 'completada'
    `;
    
    const result = await query(sql);
    return result[0];
  }
};

module.exports = ventaModel;