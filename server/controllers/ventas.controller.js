/**
 * Controlador de ventas
 * 
 * Gestiona todas las operaciones relacionadas con ventas,
 * recibe peticiones HTTP y utiliza el modelo para interactuar con la base de datos.
 * 
 * @module controllers/ventas.controller
 * @requires ../models/venta.model
 * @related_files ../routes/ventas.routes.js, ../models/venta.model.js
 */
const { 
  query, 
  beginTransaction, 
  transactionQuery, 
  commitTransaction, 
  rollbackTransaction 
} = require('../config/database');
const ventaModel = require('../models/venta.model');

const ventasController = {
  /**
   * Obtiene todas las ventas
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodas: async (req, res) => {
    try {
      const ventas = await ventaModel.obtenerTodas();
      
      res.json({
        success: true,
        data: ventas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener ventas',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene una venta por su ID
   * @param {Object} req - Objeto de solicitud con parámetro id
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const venta = await ventaModel.obtenerPorId(id);
      
      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: venta
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener venta',
        error: error.message
      });
    }
  },
  
  /**
   * Crea una nueva venta
   * @param {Object} req - Objeto de solicitud con datos de la venta y detalles en body
   * @param {Object} res - Objeto de respuesta
   */
	crear: async (req, res) => {
	  // Obtener una conexión para la transacción
	  const connection = await beginTransaction();
	  
	  try {
		const { venta, detalles } = req.body;
		
		// Validar datos mínimos necesarios
		if (!venta || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
		  await rollbackTransaction(connection);
		  return res.status(400).json({
			success: false,
			message: 'Datos de venta incompletos o inválidos'
		  });
		}
		
		// Establecer valores por defecto si no vienen
		venta.usuario_id = venta.usuario_id || req.usuario.id;
		venta.fecha = venta.fecha || new Date();
		
		// Insertar la venta principal
		const sqlVenta = `
		  INSERT INTO ventas 
		  (cliente_id, usuario_id, subtotal, descuento, impuestos, total, metodo_pago, estado, notas) 
		  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		
		const paramsVenta = [
		  venta.cliente_id || null,
		  venta.usuario_id,
		  venta.subtotal || 0,
		  venta.descuento || 0,
		  venta.impuestos || 0,
		  venta.total,
		  venta.metodo_pago || 'efectivo',
		  venta.estado || 'completada',
		  venta.notas || null
		];
		
		console.log('Insertando venta principal...');
		const resultadoVenta = await transactionQuery(connection, sqlVenta, paramsVenta);
		const ventaId = resultadoVenta.insertId;
		
		console.log(`Venta creada con ID: ${ventaId}`);
		
		// Insertar los detalles de la venta
		for (const detalle of detalles) {
		  // Obtener información del producto
		  const sqlProducto = 'SELECT * FROM productos WHERE id = ?';
		  const productos = await transactionQuery(connection, sqlProducto, [detalle.producto_id]);
		  
		  if (productos.length === 0) {
			await rollbackTransaction(connection);
			return res.status(400).json({
			  success: false,
			  message: `Producto con ID ${detalle.producto_id} no encontrado`
			});
		  }
		  
		  const producto = productos[0];
		  
		  // Insertar el detalle
		  // Insertar detalle de venta con sucursal_id
		  const sqlDetalle = `
			INSERT INTO detalle_venta 
			(venta_id, producto_id, cantidad, precio_unitario, descuento, precio_total, sucursal_id) 
			VALUES (?, ?, ?, ?, ?, ?, ?)
		  `;
		  
		  const paramsDetalle = [
			ventaId,
			detalle.producto_id,
			cantidadParaDescontar, // Usar la cantidad que incluye unidades gratis
			detalle.precio_unitario || producto.precio_venta,
			detalle.descuento || 0,
			detalle.precio_total || (detalle.precio_unitario * detalle.cantidad - (detalle.descuento || 0)),
			detalle.sucursal_id || venta.sucursal_id || null
		  ];
		  
		  console.log(`Insertando detalle para producto ${detalle.producto_id} con sucursal ${detalle.sucursal_id || venta.sucursal_id || 'global'}...`);
		  await transactionQuery(connection, sqlDetalle, paramsDetalle);
		  
		  // Actualizar stock del producto por sucursal
		  const sucursalId = detalle.sucursal_id || venta.sucursal_id;
		  
		  // Usar cantidadParaStock si está disponible (para promociones con unidades gratis)
		  const cantidadParaDescontar = detalle.cantidadParaStock || detalle.cantidad;
		  
		  if (sucursalId) {
			// Descontar stock de la sucursal específica
			const sqlStock = 'UPDATE stock SET cantidad = cantidad - ? WHERE producto_id = ? AND sucursal_id = ?';
			await transactionQuery(connection, sqlStock, [cantidadParaDescontar, detalle.producto_id, sucursalId]);
		  } else {
			// Fallback: descuento global (comportamiento anterior)
			const sqlStock = 'UPDATE stock SET cantidad = cantidad - ? WHERE producto_id = ?';
			await transactionQuery(connection, sqlStock, [cantidadParaDescontar, detalle.producto_id]);
		  }
		  
		  // Registrar movimiento de stock con sucursal
		  const sqlMovimiento = `
			INSERT INTO movimientos_stock 
			(producto_id, tipo, cantidad, referencia_id, referencia_tipo, usuario_id, sucursal_id) 
			VALUES (?, 'salida', ?, ?, 'venta', ?, ?)
		  `;
		  
		  await transactionQuery(
			connection, 
			sqlMovimiento, 
			[detalle.producto_id, cantidadParaDescontar, ventaId, venta.usuario_id, sucursalId || null]
		  );
		}
		
		// Confirmar la transacción
		await commitTransaction(connection);
		
		// Obtener la venta completa para devolverla
		const ventaCompleta = await ventaModel.obtenerPorId(ventaId);
		
		res.status(201).json({
		  success: true,
		  message: 'Venta creada correctamente',
		  data: ventaCompleta
		});
	  } catch (error) {
		// Revertir la transacción en caso de error
		await rollbackTransaction(connection);
		
		console.error('Error al crear venta:', error);
		res.status(500).json({
		  success: false,
		  message: 'Error al crear venta',
		  error: error.message
		});
	  }
	},
  
  /**
 * Cambia el estado de una venta
 * @param {Object} req - Objeto de solicitud con id en params y datos en body
 * @param {Object} res - Objeto de respuesta
 */
	cambiarEstado: async (req, res) => {
	  const connection = await beginTransaction();
	  try {
		const { id } = req.params;
		const { estado, motivo } = req.body;
		console.log(`Cambiando estado de venta ${id} a ${estado}, motivo: ${motivo}`);
		if (!estado) {
		  return res.status(400).json({
			success: false,
			message: 'Se requiere especificar el estado'
		  });
		}
		// Verificar que la venta existe
		const ventaExistente = await transactionQuery(
		  connection,
		  'SELECT * FROM ventas WHERE id = ?',
		  [id]
		);
		if (ventaExistente.length === 0) {
		  await rollbackTransaction(connection);
		  return res.status(404).json({
			success: false,
			message: 'Venta no encontrada'
		  });
		}
		const venta = ventaExistente[0];
		// Normalizar estado para comparación robusta
		const estadoActual = (venta.estado || '').toLowerCase().trim();
		const nuevoEstado = (estado || '').toLowerCase().trim();
		// Validar transición de estado, excepto para superusuario
		const esSuperUsuario = req.usuario && (req.usuario.email === 'danielcadiz15@gmail.com' || req.usuario.email === 'adrian@condinea.com');
		console.log(`🔍 Usuario: ${req.usuario.email}, Rol: ${req.usuario.rol}, EsSuperUsuario: ${esSuperUsuario}`);
		const estadosValidos = {
		  'pendiente': ['completada', 'cancelada'],
		  'completada': ['devuelta'],
		  'cancelada': [],
		  'devuelta': []
		};
		if (!esSuperUsuario) {
		  if (!estadosValidos[estadoActual] || !estadosValidos[estadoActual].includes(nuevoEstado)) {
			await rollbackTransaction(connection);
			return res.status(400).json({
			  success: false,
			  message: `No se puede cambiar de estado ${venta.estado} a ${estado}`
			});
		  }
		}
		// Si se está cancelando o devolviendo, restaurar stock
		if (estado === 'cancelada' || estado === 'devuelta') {
		  console.log(`Restaurando stock para venta ${id}`);
		  // Obtener detalles de la venta para restaurar stock
		  const detalles = await transactionQuery(
			connection,
			'SELECT * FROM detalle_venta WHERE venta_id = ?',
			[id]
		  );
		  // Restaurar stock para cada producto por sucursal
		  for (const detalle of detalles) {
			console.log(`Restaurando ${detalle.cantidad} unidades de producto ${detalle.producto_id} en sucursal ${detalle.sucursal_id || 'global'}`);
			
			// Actualizar stock por sucursal si está disponible
			if (detalle.sucursal_id) {
			  await transactionQuery(
				connection,
				'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ? AND sucursal_id = ?',
				[detalle.cantidad, detalle.producto_id, detalle.sucursal_id]
			  );
			} else {
			  // Fallback: restaurar stock global (comportamiento anterior)
			  await transactionQuery(
				connection,
				'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
				[detalle.cantidad, detalle.producto_id]
			  );
			}
			
			// Registrar movimiento de stock con sucursal
			await transactionQuery(
			  connection,
			  `INSERT INTO movimientos_stock 
			  (producto_id, tipo, cantidad, referencia_id, referencia_tipo, motivo, usuario_id, sucursal_id)
			  VALUES (?, 'entrada', ?, ?, ?, ?, ?, ?)`,
			  [
				detalle.producto_id, 
				detalle.cantidad, 
				id, 
				estado === 'cancelada' ? 'cancelacion' : 'devolucion',
				estado === 'cancelada' 
				  ? `Cancelación de venta ${venta.numero || id}` 
				  : `Devolución de venta ${venta.numero || id}${motivo ? ': ' + motivo : ''}`,
				req.usuario.id,
				detalle.sucursal_id || null
			  ]
			);
		  }
		}
		// Actualizar estado de la venta con el motivo si se proporciona
		const motivo_nota = motivo 
		  ? `\n${estado === 'cancelada' ? 'Motivo de cancelación' : 'Motivo de devolución'}: ${motivo}`
		  : '';
		await transactionQuery(
		  connection,
		  'UPDATE ventas SET estado = ?, notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
		  [estado, motivo_nota, id]
		);
		await commitTransaction(connection);
		res.json({
		  success: true,
		  message: `Venta ${estado === 'cancelada' ? 'cancelada' : (estado === 'devuelta' ? 'devuelta' : 'actualizada')} correctamente`
		});
	  } catch (error) {
		await rollbackTransaction(connection);
		console.error('Error al cambiar estado de venta:', error);
		res.status(500).json({
		  success: false,
		  message: 'Error al cambiar estado de venta',
		  error: error.message
		});
	  }
	},
  /**
 * Realiza devolución parcial de productos
 * @param {Object} req - Objeto de solicitud con id en params y productos en body
 * @param {Object} res - Objeto de respuesta
 */
	devolverProductos: async (req, res) => {
	  const connection = await beginTransaction();
	  
	  try {
		const { id } = req.params;
		const { productos, motivo } = req.body;
		
		if (!productos || !Array.isArray(productos) || productos.length === 0) {
		  return res.status(400).json({
			success: false,
			message: 'Se requiere especificar los productos a devolver'
		  });
		}
		
		// Verificar que la venta existe y está completada
		const ventaExistente = await transactionQuery(
		  connection,
		  'SELECT * FROM ventas WHERE id = ? AND estado = "completada"',
		  [id]
		);
		
		if (ventaExistente.length === 0) {
		  await rollbackTransaction(connection);
		  return res.status(404).json({
			success: false,
			message: 'Venta no encontrada o no está en estado completada'
		  });
		}
		
		const venta = ventaExistente[0];
		
		// Verificar que los productos pertenecen a la venta
		for (const prod of productos) {
		  const detalleExistente = await transactionQuery(
			connection,
			'SELECT * FROM detalle_venta WHERE venta_id = ? AND producto_id = ?',
			[id, prod.producto_id]
		  );
		  
		  if (detalleExistente.length === 0) {
			await rollbackTransaction(connection);
			return res.status(400).json({
			  success: false,
			  message: `El producto con ID ${prod.producto_id} no pertenece a esta venta`
			});
		  }
		  
		  const detalle = detalleExistente[0];
		  
		  // Verificar que la cantidad a devolver es válida
		  if (prod.cantidad <= 0 || prod.cantidad > detalle.cantidad) {
			await rollbackTransaction(connection);
			return res.status(400).json({
			  success: false,
			  message: `Cantidad inválida para el producto con ID ${prod.producto_id}`
			});
		  }
		  
		  // Restaurar stock por sucursal
		  const sucursalId = detalle.sucursal_id;
		  
		  if (sucursalId) {
			// Restaurar stock de la sucursal específica
			await transactionQuery(
			  connection,
			  'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ? AND sucursal_id = ?',
			  [prod.cantidad, prod.producto_id, sucursalId]
			);
		  } else {
			// Fallback: restaurar stock global (comportamiento anterior)
			await transactionQuery(
			  connection,
			  'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
			  [prod.cantidad, prod.producto_id]
			);
		  }
		  
		  // Registrar movimiento de stock con sucursal
		  await transactionQuery(
			connection,
			`INSERT INTO movimientos_stock 
			(producto_id, tipo, cantidad, referencia_id, referencia_tipo, motivo, usuario_id, sucursal_id)
			VALUES (?, 'entrada', ?, ?, 'devolucion', ?, ?, ?)`,
			[
			  prod.producto_id, 
			  prod.cantidad, 
			  id, 
			  `Devolución parcial de venta ${venta.numero || id}${motivo ? ': ' + motivo : ''}`,
			  req.usuario.id,
			  sucursalId || null
			]
		  );
		  
		  // Actualizar detalle de venta si es devolución total del producto
		  if (prod.cantidad === detalle.cantidad) {
			await transactionQuery(
			  connection,
			  'UPDATE detalle_venta SET devuelto = true WHERE venta_id = ? AND producto_id = ?',
			  [id, prod.producto_id]
			);
		  }
		}
		
		// Añadir nota a la venta sobre la devolución parcial
		const notaDevolcion = motivo 
		  ? `\nDevolución parcial: ${motivo}`
		  : '\nDevolución parcial de productos';
		
		await transactionQuery(
		  connection,
		  'UPDATE ventas SET notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
		  [notaDevolcion, id]
		);
		
		await commitTransaction(connection);
		
		res.json({
		  success: true,
		  message: 'Productos devueltos correctamente'
		});
	  } catch (error) {
		await rollbackTransaction(connection);
		console.error('Error al devolver productos:', error);
		res.status(500).json({
		  success: false,
		  message: 'Error al devolver productos',
		  error: error.message
		});
	  }
	},
  /**
   * Elimina productos de una venta editada
   * @param {Object} req - Objeto de solicitud con id en params y productos a eliminar en body
   * @param {Object} res - Objeto de respuesta
   */
  eliminarProductos: async (req, res) => {
    const connection = await beginTransaction();
    
    try {
      const { id } = req.params;
      const { productos } = req.body; // Array de { producto_id, cantidad, sucursal_id }
      
      console.log(`Eliminando productos de venta ${id}:`, productos);
      
      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        await rollbackTransaction(connection);
        return res.status(400).json({
          success: false,
          message: 'Se requiere especificar productos a eliminar'
        });
      }
      
      // Verificar que la venta existe y está en estado editable
      const ventas = await transactionQuery(
        connection,
        'SELECT * FROM ventas WHERE id = ?',
        [id]
      );
      
      if (ventas.length === 0) {
        await rollbackTransaction(connection);
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      const venta = ventas[0];
      
      // Solo permitir edición en ventas pendientes o completadas
      if (!['pendiente', 'completada'].includes(venta.estado)) {
        await rollbackTransaction(connection);
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden editar ventas pendientes o completadas'
        });
      }
      
      let totalEliminado = 0;
      
      // Procesar cada producto a eliminar
      for (const producto of productos) {
        const { producto_id, cantidad, sucursal_id } = producto;
        
        // Verificar que el detalle existe
        const detalles = await transactionQuery(
          connection,
          'SELECT * FROM detalle_venta WHERE venta_id = ? AND producto_id = ?',
          [id, producto_id]
        );
        
        if (detalles.length === 0) {
          console.log(`Producto ${producto_id} no encontrado en venta ${id}`);
          continue;
        }
        
        const detalle = detalles[0];
        
        // Calcular cantidad a eliminar (no más de lo que hay)
        const cantidadAEliminar = Math.min(cantidad, detalle.cantidad);
        
        if (cantidadAEliminar <= 0) {
          console.log(`Cantidad a eliminar inválida para producto ${producto_id}`);
          continue;
        }
        
        // Actualizar o eliminar el detalle
        if (cantidadAEliminar >= detalle.cantidad) {
          // Eliminar completamente el detalle
          await transactionQuery(
            connection,
            'DELETE FROM detalle_venta WHERE venta_id = ? AND producto_id = ?',
            [id, producto_id]
          );
        } else {
          // Actualizar la cantidad del detalle
          const nuevaCantidad = detalle.cantidad - cantidadAEliminar;
          const nuevoPrecioTotal = (detalle.precio_unitario * nuevaCantidad) - (detalle.descuento || 0);
          
          await transactionQuery(
            connection,
            'UPDATE detalle_venta SET cantidad = ?, precio_total = ? WHERE venta_id = ? AND producto_id = ?',
            [nuevaCantidad, nuevoPrecioTotal, id, producto_id]
          );
        }
        
        // Restaurar stock en la sucursal correspondiente
        if (sucursal_id) {
          // Restaurar stock por sucursal
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ? AND sucursal_id = ?',
            [cantidadAEliminar, producto_id, sucursal_id]
          );
        } else {
          // Fallback: restaurar stock global (comportamiento anterior)
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
            [cantidadAEliminar, producto_id]
          );
        }
        
        // Registrar movimiento de stock
        await transactionQuery(
          connection,
          `INSERT INTO movimientos_stock 
            (producto_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id, sucursal_id)
           VALUES (?, 'entrada', ?, ?, ?, ?, ?, ?)`,
          [
            producto_id,
            cantidadAEliminar,
            `Eliminación de producto de venta ${venta.numero || id}`,
            id,
            'eliminacion_venta',
            req.usuario.id,
            sucursal_id || null
          ]
        );
        
        // Calcular valor eliminado
        const precioUnitario = detalle.precio_unitario;
        const descuentoUnitario = (detalle.descuento || 0) / detalle.cantidad;
        const valorEliminado = (precioUnitario * cantidadAEliminar) - (descuentoUnitario * cantidadAEliminar);
        totalEliminado += valorEliminado;
        
        console.log(`Eliminado ${cantidadAEliminar} unidades de producto ${producto_id}, valor: ${valorEliminado}`);
      }
      
      // Recalcular total de la venta
      const detallesRestantes = await transactionQuery(
        connection,
        'SELECT SUM(precio_total) as subtotal FROM detalle_venta WHERE venta_id = ?',
        [id]
      );
      
      const nuevoSubtotal = detallesRestantes[0]?.subtotal || 0;
      const descuento = venta.descuento || 0;
      const impuestos = venta.impuestos || 0;
      const nuevoTotal = nuevoSubtotal - descuento + impuestos;
      
      // Actualizar total de la venta
      await transactionQuery(
        connection,
        'UPDATE ventas SET subtotal = ?, total = ? WHERE id = ?',
        [nuevoSubtotal, nuevoTotal, id]
      );
      
      // Agregar nota sobre la eliminación
      const notaEliminacion = `\n[${new Date().toISOString()}] Eliminados productos por valor de ${totalEliminado.toFixed(2)}`;
      await transactionQuery(
        connection,
        'UPDATE ventas SET notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
        [notaEliminacion, id]
      );
      
      await commitTransaction(connection);
      
      console.log(`Productos eliminados de venta ${id}, total eliminado: ${totalEliminado}, nuevo total: ${nuevoTotal}`);
      
      res.json({
        success: true,
        message: 'Productos eliminados correctamente',
        data: {
          total_eliminado: totalEliminado,
          nuevo_total: nuevoTotal,
          productos_eliminados: productos.length
        }
      });
      
    } catch (error) {
      await rollbackTransaction(connection);
      console.error('Error al eliminar productos de venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar productos de la venta',
        error: error.message
      });
    }
  },
  /**
   * Actualiza una venta completa con ajuste de stock
   * @param {Object} req - Objeto de solicitud con id en params y datos de venta en body
   * @param {Object} res - Objeto de respuesta
   */
  actualizarVenta: async (req, res) => {
    const connection = await beginTransaction();
    
    try {
      const { id } = req.params;
      const { venta, detalles } = req.body;
      
      // Validar que la venta existe
      const ventas = await transactionQuery(
        connection,
        'SELECT * FROM ventas WHERE id = ?',
        [id]
      );
      
      if (ventas.length === 0) {
        await rollbackTransaction(connection);
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      const ventaOriginal = ventas[0];
      
      // Solo permitir edición en ventas pendientes o completadas
      if (!['pendiente', 'completada'].includes(ventaOriginal.estado)) {
        await rollbackTransaction(connection);
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden editar ventas pendientes o completadas'
        });
      }
      
      // Obtener detalles originales de la venta
      const detallesOriginales = await transactionQuery(
        connection,
        'SELECT * FROM detalle_venta WHERE venta_id = ?',
        [id]
      );
      
      console.log(`🔄 Actualizando venta ${id} con ${detalles.length} productos nuevos`);
      console.log(`📦 Detalles originales: ${detallesOriginales.length} productos`);
      
      // 1. Restaurar stock de productos originales
      for (const detalleOriginal of detallesOriginales) {
        const { producto_id, cantidad: cantidadOriginal, sucursal_id } = detalleOriginal;
        
        if (sucursal_id) {
          // Restaurar stock por sucursal
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ? AND sucursal_id = ?',
            [cantidadOriginal, producto_id, sucursal_id]
          );
        } else {
          // Fallback: restaurar stock global
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
            [cantidadOriginal, producto_id]
          );
        }
        
        console.log(`🔄 Restaurado ${cantidadOriginal} unidades de producto ${producto_id}`);
      }
      
      // 2. Eliminar todos los detalles originales
      await transactionQuery(
        connection,
        'DELETE FROM detalle_venta WHERE venta_id = ?',
        [id]
      );
      
      // 3. Insertar nuevos detalles y actualizar stock
      let nuevoTotal = 0;
      
      for (const detalle of detalles) {
        const { producto_id, cantidad, precio_unitario, descuento = 0, sucursal_id } = detalle;
        
        // Verificar stock disponible
        let stockActual;
        if (sucursal_id) {
          const stockResult = await transactionQuery(
            connection,
            'SELECT cantidad FROM stock WHERE producto_id = ? AND sucursal_id = ?',
            [producto_id, sucursal_id]
          );
          stockActual = stockResult[0]?.cantidad || 0;
        } else {
          const stockResult = await transactionQuery(
            connection,
            'SELECT cantidad FROM stock WHERE producto_id = ?',
            [producto_id]
          );
          stockActual = stockResult[0]?.cantidad || 0;
        }
        
        if (stockActual < cantidad) {
          await rollbackTransaction(connection);
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para el producto ${producto_id}. Disponible: ${stockActual}, Solicitado: ${cantidad}`
          });
        }
        
        // Insertar nuevo detalle
        const precioTotal = (precio_unitario * cantidad) - descuento;
        await transactionQuery(
          connection,
          `INSERT INTO detalle_venta 
            (venta_id, producto_id, cantidad, precio_unitario, precio_total, descuento, sucursal_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, producto_id, cantidad, precio_unitario, precioTotal, descuento, sucursal_id]
        );
        
        // Actualizar stock
        const nuevoStock = Math.max(0, stockActual - cantidad);
        if (sucursal_id) {
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = ? WHERE producto_id = ? AND sucursal_id = ?',
            [nuevoStock, producto_id, sucursal_id]
          );
        } else {
          await transactionQuery(
            connection,
            'UPDATE stock SET cantidad = ? WHERE producto_id = ?',
            [nuevoStock, producto_id]
          );
        }
        
        // Registrar movimiento de stock
        await transactionQuery(
          connection,
          `INSERT INTO movimientos_stock 
            (producto_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario_id, sucursal_id)
           VALUES (?, 'salida', ?, ?, ?, ?, ?, ?)`,
          [
            producto_id,
            cantidad,
            `Actualización de venta ${ventaOriginal.numero || id}`,
            id,
            'actualizacion_venta',
            req.usuario.id,
            sucursal_id || null
          ]
        );
        
        nuevoTotal += precioTotal;
        console.log(`✅ Agregado ${cantidad} unidades de producto ${producto_id}, precio: ${precioTotal}`);
      }
      
      // 4. Actualizar total de la venta
      const descuento = venta.descuento || 0;
      const impuestos = venta.impuestos || 0;
      const totalFinal = nuevoTotal - descuento + impuestos;
      
      await transactionQuery(
        connection,
        `UPDATE ventas SET 
          subtotal = ?, 
          total = ?, 
          descuento = ?,
          impuestos = ?,
          fecha_modificacion = NOW(),
          modificado_por = ?
         WHERE id = ?`,
        [nuevoTotal, totalFinal, descuento, impuestos, req.usuario.id, id]
      );
      
      // 5. Agregar nota sobre la actualización
      const notaActualizacion = `\n[${new Date().toISOString()}] Venta actualizada por ${req.usuario.nombre || req.usuario.email}. Nuevo total: ${totalFinal.toFixed(2)}`;
      await transactionQuery(
        connection,
        'UPDATE ventas SET notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
        [notaActualizacion, id]
      );
      
      await commitTransaction(connection);
      
      console.log(`✅ Venta ${id} actualizada correctamente. Nuevo total: ${totalFinal}`);
      
      res.json({
        success: true,
        message: 'Venta actualizada correctamente',
        data: {
          id: id,
          total: totalFinal,
          productos_actualizados: detalles.length
        }
      });
      
    } catch (error) {
      await rollbackTransaction(connection);
      console.error('Error al actualizar venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la venta',
        error: error.message
      });
    }
  },
  /**
   * Obtiene ventas por cliente
   * @param {Object} req - Objeto de solicitud con cliente_id en params
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorCliente: async (req, res) => {
    try {
      const { cliente_id } = req.params;
      const ventas = await ventaModel.obtenerPorCliente(cliente_id);
      
      res.json({
        success: true,
        data: ventas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener ventas del cliente',
        error: error.message
      });
    }
  },
  
  /**
   * Busca ventas por término
   * @param {Object} req - Objeto de solicitud con query termino
   * @param {Object} res - Objeto de respuesta
   */
  buscar: async (req, res) => {
    try {
      const { termino } = req.query;
      
      if (!termino) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }
      
      const ventas = await ventaModel.buscar(termino);
      
      res.json({
        success: true,
        data: ventas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al buscar ventas',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene estadísticas de ventas del día actual
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerEstadisticasDia: async (req, res) => {
    try {
      const estadisticas = await ventaModel.obtenerEstadisticasDia();
      
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de ventas',
        error: error.message
      });
    }
  }
};

module.exports = ventasController;