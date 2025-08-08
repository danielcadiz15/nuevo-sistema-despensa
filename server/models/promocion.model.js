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
      SELECT p.*, COALESCE(u.nombre, 'Sistema') as creador
      FROM promociones p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
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
	  console.group('⚠️ DEPURACIÓN: Model aplicarPromociones');
	  
	  try {
		console.log('📥 Iniciando aplicación de promociones a', items.length, 'items');
		
		// Obtener promociones activas
		const promocionesActivas = await promocionModel.obtenerActivasPorFecha(new Date());
		
		console.log('🔍 Promociones activas encontradas:', promocionesActivas.length);
		promocionesActivas.forEach((p, i) => {
		  console.log(`   [${i+1}] ${p.nombre} (${p.tipo}) - Valor: ${p.valor}`);
		});
		
		if (promocionesActivas.length === 0) {
		  console.log('⚠️ No hay promociones activas disponibles');
		  console.groupEnd();
		  return items;
		}
		
		// Clone items para no modificar el original
		const itemsConPromociones = JSON.parse(JSON.stringify(items));
		
		// Inicializar propiedades necesarias en todos los items
		itemsConPromociones.forEach(item => {
		  item.promociones = item.promociones || [];
		  item.descuento = item.descuento || 0;
		  item.subtotal = (item.precio * item.cantidad);
		  item.tienePromocion = false;
		});
		
		// Procesar cada promoción
		for (const promocion of promocionesActivas) {
		  console.log(`🔄 Procesando promoción "${promocion.nombre}" (${promocion.tipo})`);
		  
		  try {
			// Convertir condiciones de JSON a objeto
			promocion.condiciones = typeof promocion.condiciones === 'string' 
			  ? JSON.parse(promocion.condiciones || '{}') 
			  : (promocion.condiciones || {});
			
			console.log('📄 Condiciones:', JSON.stringify(promocion.condiciones, null, 2));
			
			// Obtener productos asociados a la promoción
			const sqlProductos = `
			  SELECT producto_id
			  FROM productos_promocion
			  WHERE promocion_id = ?
			`;
			
			const productosPromocion = await query(sqlProductos, [promocion.id]);
			const productosIds = productosPromocion.map(p => p.producto_id);
			
			console.log(`👉 Promoción aplica a ${productosIds.length || 'todos los'} productos específicos`);
			if (productosIds.length > 0) {
			  console.log('   IDs de productos:', productosIds.join(', '));
			}
			
			// Aplicar promoción según su tipo
			switch (promocion.tipo) {
			  case 'porcentaje':
				console.log('💹 Aplicando descuento por porcentaje');
				aplicarDescuentoPorcentaje(itemsConPromociones, promocion, productosIds);
				break;
			  case 'monto_fijo':
				console.log('💰 Aplicando descuento de monto fijo');
				aplicarDescuentoMontoFijo(itemsConPromociones, promocion, productosIds);
				break;
			  case '2x1':
				console.log('🎯 Aplicando promoción 2x1');
				aplicarPromocion2x1(itemsConPromociones, promocion, productosIds);
				break;
			  case 'nx1':
				console.log('🎁 Aplicando promoción Nx1');
				aplicarPromocionNx1(itemsConPromociones, promocion, productosIds);
				break;
			  case 'nxm':
				console.log('🎁 Aplicando promoción X+Y (compra X, lleva X+Y)');
				aplicarPromocionNxM(itemsConPromociones, promocion, productosIds);
				break;
			  default:
				console.log(`⚠️ Tipo de promoción no soportado: ${promocion.tipo}`);
			}
		  } catch (error) {
			console.error(`❌ Error al aplicar promoción ${promocion.id}:`, error);
			// Continuar con la siguiente promoción
		  }
		}
		
		// Verificar resultados después de aplicar todas las promociones
		const itemsConDescuentos = itemsConPromociones.filter(item => (item.descuento || 0) > 0);
		console.log(`✅ Productos con descuentos aplicados: ${itemsConDescuentos.length} de ${itemsConPromociones.length}`);
		
		// Mostrar detalles de productos con descuentos
		if (itemsConDescuentos.length > 0) {
		  console.log('📊 Resumen de descuentos aplicados:');
		  itemsConDescuentos.forEach(item => {
			console.log(`   - ${item.nombre}: Descuento: ${item.descuento}, Promos: ${item.promociones.length}`);
			item.promociones.forEach(promo => {
			  console.log(`     · ${promo.nombre}: -${promo.descuento} (${promo.mensaje || 'Sin mensaje'})`);
			});
		  });
		}
		
		console.log('✅ Promociones aplicadas correctamente');
		console.groupEnd();
		return itemsConPromociones;
	  } catch (error) {
		console.error('❌ Error en modelo aplicarPromociones:', error);
		console.groupEnd();
		// En caso de error, devolver los items originales sin modificar
		return items;
	  }
	}
};

/**
 * Aplica descuento por porcentaje a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarDescuentoPorcentaje(items, promocion, productosIds) {
  console.group(`⚠️ DEPURACIÓN: aplicarDescuentoPorcentaje (${promocion.valor}%)`);
  let productosAplicados = 0;
  
  for (const item of items) {
    try {
      console.log(`👉 Evaluando producto: ${item.nombre} (ID: ${item.id})`);
      
      // Solo procesar si el item tiene los campos necesarios
      if (!item || !item.id || !item.precio || !item.cantidad) {
        console.log('❌ Item incompleto, omitiendo');
        continue;
      }
      
      // Verificar si el producto está en la promoción o si es general
      const aplicaAlProducto = productosIds.length === 0 || productosIds.includes(parseInt(item.id));
      console.log(`- ¿Aplica al producto?: ${aplicaAlProducto ? 'SÍ' : 'NO'}`);
      
      if (aplicaAlProducto) {
        // Verificar condiciones adicionales
        const cumpleCondicionesResult = cumpleCondiciones(item, promocion.condiciones);
        console.log(`- ¿Cumple condiciones?: ${cumpleCondicionesResult ? 'SÍ' : 'NO'}`);
        
        if (cumpleCondicionesResult) {
          // Calcular descuento
          const valorOriginal = item.precio * item.cantidad;
          const descuento = valorOriginal * (promocion.valor / 100);
          
          console.log(`- Precio: ${item.precio}, Cantidad: ${item.cantidad}, Valor original: ${valorOriginal}`);
          console.log(`- Descuento calculado (${promocion.valor}%): ${descuento.toFixed(2)}`);
          
          // Aplicar descuento
          item.descuento = (item.descuento || 0) + descuento;
          item.subtotal = valorOriginal - item.descuento;
          
          console.log(`- Descuento total: ${item.descuento.toFixed(2)}, Subtotal final: ${item.subtotal.toFixed(2)}`);
          
          // Agregar referencia a la promoción aplicada
          item.promociones = item.promociones || [];
          item.promociones.push({
            id: promocion.id,
            nombre: promocion.nombre,
            descuento: descuento,
            mensaje: `¡${promocion.nombre}! ${promocion.valor}% de descuento`
          });
          
          // Agregar flag para indicar que tiene una promoción activa
          item.tienePromocion = true;
          productosAplicados++;
          
          console.log(`✅ Promoción aplicada a ${item.nombre}: -$${descuento.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error al aplicar descuento porcentaje al item ${item?.id || 'desconocido'}:`, error);
      // Continuar con el siguiente item
    }
  }
  
  console.log(`✅ Promoción por porcentaje aplicada a ${productosAplicados} productos`);
  console.groupEnd();
}



/**
 * Aplica descuento de monto fijo a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
	function aplicarDescuentoPorcentaje(items, promocion, productosIds) {
	  console.group(`⚠️ DEPURACIÓN: aplicarDescuentoPorcentaje (${promocion.valor}%)`);
	  let productosAplicados = 0;
	  
	  for (const item of items) {
		try {
		  console.log(`👉 Evaluando producto: ${item.nombre} (ID: ${item.id})`);
		  
		  // Solo procesar si el item tiene los campos necesarios
		  if (!item || !item.id || !item.precio || !item.cantidad) {
			console.log('❌ Item incompleto, omitiendo');
			continue;
		  }
		  
		  // Verificar si el producto está en la promoción o si es general
		  const aplicaAlProducto = productosIds.length === 0 || productosIds.includes(parseInt(item.id));
		  console.log(`- ¿Aplica al producto?: ${aplicaAlProducto ? 'SÍ' : 'NO'}`);
		  
		  if (aplicaAlProducto) {
			// Verificar condiciones adicionales
			const cumpleCondicionesResult = cumpleCondiciones(item, promocion.condiciones);
			console.log(`- ¿Cumple condiciones?: ${cumpleCondicionesResult ? 'SÍ' : 'NO'}`);
			
			if (cumpleCondicionesResult) {
			  // Calcular descuento
			  const valorOriginal = item.precio * item.cantidad;
			  const descuento = valorOriginal * (promocion.valor / 100);
			  
			  console.log(`- Precio: ${item.precio}, Cantidad: ${item.cantidad}, Valor original: ${valorOriginal}`);
			  console.log(`- Descuento calculado (${promocion.valor}%): ${descuento.toFixed(2)}`);
			  
			  // Aplicar descuento
			  item.descuento = (item.descuento || 0) + descuento;
			  item.subtotal = valorOriginal - item.descuento;
			  
			  console.log(`- Descuento total: ${item.descuento.toFixed(2)}, Subtotal final: ${item.subtotal.toFixed(2)}`);
			  
			  // Agregar referencia a la promoción aplicada
			  item.promociones = item.promociones || [];
			  item.promociones.push({
				id: promocion.id,
				nombre: promocion.nombre,
				descuento: descuento,
				mensaje: `¡${promocion.nombre}! ${promocion.valor}% de descuento`
			  });
			  
			  // Agregar flag para indicar que tiene una promoción activa
			  item.tienePromocion = true;
			  productosAplicados++;
			  
			  console.log(`✅ Promoción aplicada a ${item.nombre}: -$${descuento.toFixed(2)}`);
			}
		  }
		} catch (error) {
		  console.error(`❌ Error al aplicar descuento porcentaje al item ${item?.id || 'desconocido'}:`, error);
		  // Continuar con el siguiente item
		}
	  }
	  
	  console.log(`✅ Promoción por porcentaje aplicada a ${productosAplicados} productos`);
	  console.groupEnd();
	}

/**
 * Aplica promoción 2x1 a los items
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarPromocion2x1(items, promocion, productosIds) {
  for (const item of items) {
    try {
      // Solo procesar si el item tiene los campos necesarios
      if (!item || !item.id || !item.precio || !item.cantidad) {
        continue;
      }
      
      // Verificar si el producto está en la promoción
      if (productosIds.length === 0 || productosIds.includes(parseInt(item.id))) {
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
              unidadesGratis: unidadesGratis,
              mensaje: `¡${promocion.nombre}! ${unidadesGratis} unidad(es) gratis`
            });
            
            // Agregar flag para indicar que tiene una promoción activa
            item.tienePromocion = true;
            
            console.log(`Promoción 2x1 aplicada a ${item.nombre}: ${unidadesGratis} unidades gratis, -$${descuento.toFixed(2)}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error al aplicar promoción 2x1 al item ${item?.id || 'desconocido'}:`, error);
      // Continuar con el siguiente item
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
  try {
    // Obtener N de las condiciones (por defecto 3)
    const n = promocion.condiciones.n || 3;
    
    for (const item of items) {
      try {
        // Solo procesar si el item tiene los campos necesarios
        if (!item || !item.id || !item.precio || !item.cantidad) {
          continue;
        }
        
        // Verificar si el producto está en la promoción
        if (productosIds.length === 0 || productosIds.includes(parseInt(item.id))) {
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
                unidadesGratis: unidadesGratis,
                mensaje: `¡${promocion.nombre}! ${unidadesGratis} unidad(es) gratis por comprar ${n}`
              });
              
              // Agregar flag para indicar que tiene una promoción activa
              item.tienePromocion = true;
              
              console.log(`Promoción ${n}x1 aplicada a ${item.nombre}: ${unidadesGratis} unidades gratis, -$${descuento.toFixed(2)}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error al aplicar promoción nx1 al item ${item?.id || 'desconocido'}:`, error);
        // Continuar con el siguiente item
      }
    }
  } catch (error) {
    console.error(`Error general al aplicar promoción nx1:`, error);
  }
}



/**
 * Aplica promoción X+Y a los items (compra X, lleva X+Y)
 * @param {Array} items - Items del carrito
 * @param {Object} promocion - Datos de la promoción
 * @param {Array} productosIds - IDs de productos incluidos en la promoción
 */
function aplicarPromocionNxM(items, promocion, productosIds) {
  try {
    // Obtener X y Y de las condiciones
    const x = promocion.condiciones.x || 5; // Por defecto 5
    const y = promocion.condiciones.y || 1; // Por defecto 1

    for (const item of items) {
      try {
        // Solo procesar si el item tiene los campos necesarios
        if (!item || !item.id || !item.precio || !item.cantidad) {
          continue;
        }
        
        // Verificar si el producto está en la promoción
        if (productosIds.length === 0 || productosIds.includes(parseInt(item.id))) {
          // Verificar condiciones adicionales
          if (cumpleCondiciones(item, promocion.condiciones)) {
            // Calcular cuántos grupos completos de X+Y se pueden formar
            const gruposCompletos = Math.floor(item.cantidad / (x + y));
            
            if (gruposCompletos > 0) {
              // Calcular unidades gratis (Y por cada grupo completo)
              const unidadesGratis = gruposCompletos * y;
              
              // Calcular descuento (precio por unidades gratis)
              const descuento = item.precio * unidadesGratis;
              
              // Aplicar descuento
              item.descuento = (item.descuento || 0) + descuento;
              item.subtotal = (item.precio * item.cantidad) - item.descuento;
              
              // IMPORTANTE: Agregar unidades gratis a la cantidad para el descuento de stock
              // Esto asegura que se descuenten del stock todas las unidades que salen físicamente
              item.cantidadParaStock = (item.cantidadParaStock || item.cantidad) + unidadesGratis;
              
              // Agregar referencia a la promoción aplicada
              item.promociones = item.promociones || [];
              item.promociones.push({
                id: promocion.id,
                nombre: promocion.nombre,
                descuento: descuento,
                unidadesGratis: unidadesGratis,
                mensaje: `¡${promocion.nombre}! ${unidadesGratis} unidad(es) gratis por comprar ${x}`
              });
              
              // Agregar flag para indicar que tiene una promoción activa
              item.tienePromocion = true;
              
              console.log(`Promoción ${x}+${y} aplicada a ${item.nombre}: ${unidadesGratis} unidades gratis, -$${descuento.toFixed(2)}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error al aplicar promoción nxm al item ${item?.id || 'desconocido'}:`, error);
        // Continuar con el siguiente item
      }
    }
  } catch (error) {
    console.error(`Error general al aplicar promoción nxm:`, error);
  }
}

/**
 * Verifica si un item cumple las condiciones para aplicar una promoción
 * @param {Object} item - Item del carrito
 * @param {Object} condiciones - Condiciones de la promoción
 * @returns {boolean} True si cumple las condiciones
 */
	function cumpleCondiciones(item, condiciones) {
	  console.group('⚠️ DEPURACIÓN: cumpleCondiciones');
	  
	  try {
		// Si no hay condiciones, cumple por defecto
		if (!condiciones || Object.keys(condiciones).length === 0) {
		  console.log('✅ No hay condiciones, se cumple por defecto');
		  console.groupEnd();
		  return true;
		}
		
		console.log(`📄 Evaluando condiciones para ${item.nombre}`);
		console.log(`- Condiciones a evaluar:`, JSON.stringify(condiciones, null, 2));
		
		// Cantidad mínima
		if (condiciones.min_cantidad) {
		  console.log(`- Cantidad mínima requerida: ${condiciones.min_cantidad}, Actual: ${item.cantidad}`);
		  if (item.cantidad < condiciones.min_cantidad) {
			console.log(`❌ No cumple cantidad mínima`);
			console.groupEnd();
			return false;
		  }
		}
		
		// Monto mínimo
		if (condiciones.min_monto) {
		  const montoItem = item.precio * item.cantidad;
		  console.log(`- Monto mínimo requerido: ${condiciones.min_monto}, Actual: ${montoItem}`);
		  if (montoItem < condiciones.min_monto) {
			console.log(`❌ No cumple monto mínimo`);
			console.groupEnd();
			return false;
		  }
		}
		
		// Otras condiciones específicas podrían agregarse aquí
		
		console.log('✅ Todas las condiciones cumplidas');
		console.groupEnd();
		return true;
	  } catch (error) {
		console.error('❌ Error al verificar condiciones:', error);
		console.groupEnd();
		return false; // Si hay error, no aplicar la promoción
	  }
	}

module.exports = promocionModel;