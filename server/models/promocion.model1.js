/**
 * Modelo para la gestión de promociones
 * 
 * Este modelo contiene todas las operaciones relacionadas con
 * promociones y descuentos.
 * 
 * @module models/promocion.model
 * @requires ../config/database
 * @related_files ../controllers/promociones.controller.js, ../routes/promociones.routes.js
 */

const { 
  query, 
  beginTransaction, 
  transactionQuery, 
  commitTransaction, 
  rollbackTransaction 
} = require('../config/database');

const promocionModel = {
  /**
   * Obtiene todas las promociones activas
   * @returns {Promise<Array>} Lista de promociones
   */
  obtenerTodas: async () => {
	  const sql = `
		SELECT p.*, COALESCE(u.nombre, 'Sistema') as creador
		FROM promociones p
		LEFT JOIN usuarios u ON p.usuario_id = u.id
		ORDER BY p.fecha_creacion DESC
	  `;
	  
	  try {
		return await query(sql);
	  } catch (error) {
		console.error('Error en SQL obtenerTodas:', error);
		return [];
	  }
	},
  
  /**
   * Obtiene las promociones activas en una fecha
   * @param {Date} fecha - Fecha para verificar validez
   * @returns {Promise<Array>} Lista de promociones activas
   */
  obtenerActivasPorFecha: async (fecha = new Date()) => {
    const sql = `
      SELECT p.*, u.nombre as creador
      FROM promociones p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.activo = true
      AND p.fecha_inicio <= ?
      AND p.fecha_fin >= ?
      ORDER BY p.fecha_creacion DESC
    `;
    
    const fechaStr = fecha.toISOString().split('T')[0];
    return await query(sql, [fechaStr, fechaStr]);
  },
  
  /**
   * Obtiene una promoción por su ID
   * @param {number} id - ID de la promoción
   * @returns {Promise<Object>} Datos de la promoción
   */
	obtenerPorId: async (id) => {
	  try {
		// Cambiado JOIN por LEFT JOIN para manejar casos donde el usuario no existe
		const sql = `
		  SELECT p.*, COALESCE(u.nombre, 'Usuario eliminado') as creador
		  FROM promociones p
		  LEFT JOIN usuarios u ON p.usuario_id = u.id
		  WHERE p.id = ?
		`;
		
		const promociones = await query(sql, [id]);
		
		if (promociones.length === 0) {
		  return null;
		}
		
		const promocion = promociones[0];
		
		// Manejo más seguro del parsing JSON
		try {
		  promocion.condiciones = JSON.parse(promocion.condiciones || '{}');
		} catch (e) {
		  console.error(`Error al parsear condiciones para promoción ${id}:`, e);
		  promocion.condiciones = {};
		}
		
		// Modificado para usar LEFT JOIN con productos por si alguno fue eliminado
		const sqlProductos = `
		  SELECT pp.*, p.codigo, p.nombre, p.precio_venta
		  FROM productos_promocion pp
		  LEFT JOIN productos p ON pp.producto_id = p.id
		  WHERE pp.promocion_id = ?
		`;
		
		promocion.productos = await query(sqlProductos, [id]);
		
		return promocion;
	  } catch (error) {
		console.error(`Error al obtener promoción ${id}:`, error);
		throw error; // Re-lanzar para que el controlador pueda manejarlo
	  }
	},
  
  /**
   * Crea una nueva promoción
   * @param {Object} promocion - Datos de la promoción
   * @returns {Promise<Object>} Promoción creada con su ID
   */
  crear: async (promocion) => {
    const connection = await beginTransaction();
    
    try {
      // Convertir condiciones a JSON si es un objeto
      const condicionesJson = typeof promocion.condiciones === 'object' 
        ? JSON.stringify(promocion.condiciones)
        : promocion.condiciones;
      
      // Insertar promoción
      const sqlPromocion = `
        INSERT INTO promociones (
          nombre, descripcion, tipo, valor,
          fecha_inicio, fecha_fin, activo, condiciones, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const resultPromocion = await transactionQuery(
        connection,
        sqlPromocion,
        [
          promocion.nombre,
          promocion.descripcion,
          promocion.tipo,
          promocion.valor,
          promocion.fecha_inicio,
          promocion.fecha_fin,
          promocion.activo || true,
          condicionesJson,
          promocion.usuario_id
        ]
      );
      
      const promocionId = resultPromocion.insertId;
      
      // Si hay productos asociados, guardarlos
      if (promocion.productos && promocion.productos.length > 0) {
        const sqlProductosPromo = `
          INSERT INTO productos_promocion (promocion_id, producto_id)
          VALUES (?, ?)
        `;
        
        for (const productoId of promocion.productos) {
          await transactionQuery(connection, sqlProductosPromo, [promocionId, productoId]);
        }
      }
      
      await commitTransaction(connection);
      
      return {
        id: promocionId,
        ...promocion
      };
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Actualiza una promoción existente
   * @param {number} id - ID de la promoción
   * @param {Object} promocion - Nuevos datos de la promoción
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  actualizar: async (id, promocion) => {
    const connection = await beginTransaction();
    
    try {
      // Convertir condiciones a JSON si es un objeto
      const condicionesJson = typeof promocion.condiciones === 'object' 
        ? JSON.stringify(promocion.condiciones)
        : promocion.condiciones;
      
      // Actualizar promoción
      const sqlPromocion = `
        UPDATE promociones
        SET 
          nombre = ?,
          descripcion = ?,
          tipo = ?,
          valor = ?,
          fecha_inicio = ?,
          fecha_fin = ?,
          activo = ?,
          condiciones = ?
        WHERE id = ?
      `;
      
      await transactionQuery(
        connection,
        sqlPromocion,
        [
          promocion.nombre,
          promocion.descripcion,
          promocion.tipo,
          promocion.valor,
          promocion.fecha_inicio,
          promocion.fecha_fin,
          promocion.activo,
          condicionesJson,
          id
        ]
      );
      
      // Eliminar productos asociados anteriores
      const sqlEliminarProductos = `
        DELETE FROM productos_promocion
        WHERE promocion_id = ?
      `;
      
      await transactionQuery(connection, sqlEliminarProductos, [id]);
      
      // Si hay productos asociados, guardarlos
      if (promocion.productos && promocion.productos.length > 0) {
        const sqlProductosPromo = `
          INSERT INTO productos_promocion (promocion_id, producto_id)
          VALUES (?, ?)
        `;
        
        for (const productoId of promocion.productos) {
          await transactionQuery(connection, sqlProductosPromo, [id, productoId]);
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
   * Cambia el estado de una promoción (activa/inactiva)
   * @param {number} id - ID de la promoción
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<boolean>} True si se cambió correctamente
   */
  cambiarEstado: async (id, activo) => {
    const sql = 'UPDATE promociones SET activo = ? WHERE id = ?';
    const result = await query(sql, [activo, id]);
    return result.affectedRows > 0;
  },
  
  /**
   * Elimina una promoción
   * @param {number} id - ID de la promoción
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  eliminar: async (id) => {
    const connection = await beginTransaction();
    
    try {
      // Eliminar productos asociados
      const sqlEliminarProductos = `
        DELETE FROM productos_promocion
        WHERE promocion_id = ?
      `;
      
      await transactionQuery(connection, sqlEliminarProductos, [id]);
      
      // Eliminar la promoción
      const sqlEliminarPromocion = `
        DELETE FROM promociones
        WHERE id = ?
      `;
      
      const result = await transactionQuery(connection, sqlEliminarPromocion, [id]);
      
      await commitTransaction(connection);
      
      return result.affectedRows > 0;
    } catch (error) {
      await rollbackTransaction(connection);
      throw error;
    }
  },
  
  /**
   * Aplica promociones a un carrito de productos
   * @param {Array} items - Items del carrito
   * @returns {Promise<Array>} Items con promociones aplicadas
   */
  aplicarPromociones: async (items) => {
    // Obtener promociones activas
    const promocionesActivas = await promocionModel.obtenerActivasPorFecha(new Date());
    
    if (promocionesActivas.length === 0) {
      return items;
    }
    
    // Procesar cada promoción
    for (const promocion of promocionesActivas) {
      // Convertir condiciones de JSON a objeto
      promocion.condiciones = JSON.parse(promocion.condiciones || '{}');
      
      // Obtener productos asociados a la promoción
      const sqlProductos = `
        SELECT producto_id
        FROM productos_promocion
        WHERE promocion_id = ?
      `;
      
      const productosPromocion = await query(sqlProductos, [promocion.id]);
      const productosIds = productosPromocion.map(p => p.producto_id);
      
      // Aplicar promoción según su tipo
      switch (promocion.tipo) {
        case 'porcentaje':
          aplicarDescuentoPorcentaje(items, promocion, productosIds);
          break;
        case 'monto_fijo':
          aplicarDescuentoMontoFijo(items, promocion, productosIds);
          break;
        case '2x1':
          aplicarPromocion2x1(items, promocion, productosIds);
          break;
        case 'nx1':
          aplicarPromocionNx1(items, promocion, productosIds);
          break;
      }
    }
    
    return items;
  }
};

/**
 * Aplica descuento por porcentaje a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarDescuentoPorcentaje(items, promocion, productosIds) {
  for (const item of items) {
    // Verificar si el producto está en la promoción
    if (productosIds.length === 0 || productosIds.includes(item.id)) {
      // Verificar condiciones adicionales
      if (cumpleCondiciones(item, promocion.condiciones)) {
        // Calcular descuento
        const descuento = (item.precio * item.cantidad) * (promocion.valor / 100);
        
        // Aplicar descuento
        item.descuento = (item.descuento || 0) + descuento;
        item.subtotal = (item.precio * item.cantidad) - item.descuento;
        
        // Agregar referencia a la promoción aplicada
        item.promociones = item.promociones || [];
        item.promociones.push({
          id: promocion.id,
          nombre: promocion.nombre,
          descuento: descuento
        });
      }
    }
  }
}

/**
 * Aplica descuento de monto fijo a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarDescuentoMontoFijo(items, promocion, productosIds) {
  for (const item of items) {
    // Verificar si el producto está en la promoción
    if (productosIds.length === 0 || productosIds.includes(item.id)) {
      // Verificar condiciones adicionales
      if (cumpleCondiciones(item, promocion.condiciones)) {
        // Aplicar descuento por unidad (hasta el valor del producto)
        const descuentoPorUnidad = Math.min(promocion.valor, item.precio);
        const descuento = descuentoPorUnidad * item.cantidad;
        
        // Aplicar descuento
        item.descuento = (item.descuento || 0) + descuento;
        item.subtotal = (item.precio * item.cantidad) - item.descuento;
        
        // Agregar referencia a la promoción aplicada
        item.promociones = item.promociones || [];
        item.promociones.push({
          id: promocion.id,
          nombre: promocion.nombre,
          descuento: descuento
        });
      }
    }
  }
}

/**
 * Aplica promoción 2x1 a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarPromocion2x1(items, promocion, productosIds) {
  for (const item of items) {
    // Verificar si el producto está en la promoción
    if (productosIds.length === 0 || productosIds.includes(item.id)) {
      // Verificar condiciones adicionales
      if (cumpleCondiciones(item, promocion.condiciones)) {
        // Calcular unidades gratis (1 por cada 2)
        const unidadesGratis = Math.floor(item.cantidad / 2);
        
        if (unidadesGratis > 0) {
          // Calcular descuento (precio por unidades gratis)
          const descuento = item.precio * unidadesGratis;
          
          // Aplicar descuento
          item.descuento = (item.descuento || 0) + descuento;
          item.subtotal = (item.precio * item.cantidad) - item.descuento;
          
          // Agregar referencia a la promoción aplicada
          item.promociones = item.promociones || [];
          item.promociones.push({
            id: promocion.id,
            nombre: promocion.nombre,
            descuento: descuento,
            unidadesGratis: unidadesGratis
          });
        }
      }
    }
  }
}

/**
 * Aplica promoción Nx1 a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarPromocionNx1(items, promocion, productosIds) {
  // Obtener N de las condiciones (por defecto 3)
  const n = promocion.condiciones.n || 3;
  
  for (const item of items) {
    // Verificar si el producto está en la promoción
    if (productosIds.length === 0 || productosIds.includes(item.id)) {
      // Verificar condiciones adicionales
      if (cumpleCondiciones(item, promocion.condiciones)) {
        // Calcular unidades gratis (1 por cada N)
        const unidadesGratis = Math.floor(item.cantidad / n);
        
        if (unidadesGratis > 0) {
          // Calcular descuento (precio por unidades gratis)
          const descuento = item.precio * unidadesGratis;
          
          // Aplicar descuento
          item.descuento = (item.descuento || 0) + descuento;
          item.subtotal = (item.precio * item.cantidad) - item.descuento;
          
          // Agregar referencia a la promoción aplicada
          item.promociones = item.promociones || [];
          item.promociones.push({
            id: promocion.id,
            nombre: promocion.nombre,
            descuento: descuento,
            unidadesGratis: unidadesGratis
          });
        }
      }
    }
  }
}

/**
 * Verifica si un item cumple las condiciones para aplicar una promoción
 * @param {Object} item - Item del carrito
 * @param {Object} condiciones - Condiciones de la promoción
 * @returns {boolean} True si cumple las condiciones
 */
function cumpleCondiciones(item, condiciones) {
  // Cantidad mínima
  if (condiciones.min_cantidad && item.cantidad < condiciones.min_cantidad) {
    return false;
  }
  
  // Monto mínimo
  if (condiciones.min_monto && (item.precio * item.cantidad) < condiciones.min_monto) {
    return false;
  }
  
  // Otras condiciones específicas podrían agregarse aquí
  
  return true;
}

module.exports = promocionModel;