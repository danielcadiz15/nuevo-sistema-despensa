/**
 * Modelo para la gestión de productos
 *
 * Este modelo contiene todas las operaciones de base de datos relacionadas
 * con los productos y su gestión.
 *
 * @module models/producto.model
 * @requires ../config/database
 * @related_files ../controllers/productos.controller.js, ../routes/productos.routes.js
 */

const {
    query,
    beginTransaction,
    transactionQuery,
    commitTransaction,
    rollbackTransaction
} = require('../config/database');

const productoModel = {
    /**
     * Obtiene todos los productos activos con información básica
     * @returns {Promise<Array>} Lista de productos
     */
    // En producto.model.js - método obtenerTodos
    obtenerTodos: async() => {
        try {
            console.log('Ejecutando obtenerTodos para productos');

            // Verificar que hay productos
            const countSql = 'SELECT COUNT(*) as total FROM productos WHERE activo = 1';
            const countResult = await query(countSql);
            console.log('Total de productos activos:', countResult[0]?.total || 0);

            // Consulta principal con JOIN explícito
            const sql = `
		  SELECT 
			p.id, p.codigo, p.nombre, p.descripcion, 
			p.precio_costo, p.precio_venta, p.activo,
			p.categoria_id, COALESCE(c.nombre, 'General') as categoria,
			p.proveedor_id, COALESCE(prov.nombre, '') as proveedor,
			COALESCE(s.cantidad, 0) as stock_actual, 
			COALESCE(s.stock_minimo, 5) as stock_minimo
		  FROM productos p
		  LEFT JOIN stock s ON p.id = s.producto_id
		  LEFT JOIN categorias c ON p.categoria_id = c.id
		  LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
		  WHERE p.activo = 1
		  ORDER BY p.nombre ASC
		`;

            const productos = await query(sql);

            // Verificar que productos no sea null antes de acceder a length
            if (productos && Array.isArray(productos)) {
                console.log(`Obtenidos ${productos.length} productos de la base de datos`);

                // Imprimir para depuración
                if (productos.length > 0) {
                    console.log('Primer producto:', JSON.stringify(productos[0]));
                }

                return productos;
            } else {
                console.log('No se obtuvieron productos válidos, devolviendo array vacío');
                return [];
            }
        } catch (error) {
            console.error('Error en obtenerTodos de productos:', error);
            // Devolver array vacío en caso de error en lugar de propagar el error
            return [];
        }
    },

    /**
     * Obtiene un producto por su ID con información completa
     * @param {number} id - ID del producto
     * @returns {Promise<Object>} Datos del producto
     */
    obtenerPorId: async(id) => {
        const sql = `
      SELECT p.*, c.nombre as categoria, 
             prov.nombre as proveedor,
             s.cantidad as stock_actual, s.stock_minimo, s.ubicacion
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
      LEFT JOIN stock s ON p.id = s.producto_id
      WHERE p.id = ? AND p.activo = true
    `;

        const productos = await query(sql, [id]);
        return productos.length > 0 ? productos[0] : null;
    },

    /**
     * Busca productos por nombre, código o categoría
     * @param {string} termino - Término de búsqueda
     * @returns {Promise<Array>} Productos que coinciden con la búsqueda
     */
	buscar: async (termino) => {
	  try {
		console.log('Ejecutando búsqueda SQL con término:', termino);
		
		// Simplificar la consulta y hacerla más amplia para encontrar más coincidencias
		const sql = `
		  SELECT 
			p.id, p.codigo, p.nombre, p.descripcion, 
			p.precio_costo, p.precio_venta, p.activo,
			p.categoria_id, COALESCE(c.nombre, 'General') as categoria,
			p.proveedor_id, COALESCE(prov.nombre, '') as proveedor,
			COALESCE(s.cantidad, 0) as stock_actual, 
			COALESCE(s.stock_minimo, 5) as stock_minimo
		  FROM productos p
		  LEFT JOIN stock s ON p.id = s.producto_id
		  LEFT JOIN categorias c ON p.categoria_id = c.id
		  LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
		  WHERE p.activo = true
			AND (
			  p.nombre LIKE ? OR 
			  p.codigo LIKE ? OR 
			  LOWER(p.nombre) LIKE LOWER(?) OR
			  c.nombre LIKE ?
			)
		  ORDER BY p.nombre ASC
		`;
		
		// Hacer el término más permisivo, rodeándolo con % en ambos lados
		const busqueda = `%${termino}%`;
		const productos = await query(sql, [busqueda, busqueda, busqueda, busqueda]);
		
		console.log(`Búsqueda encontró ${productos?.length || 0} productos con término '${termino}'`);
		if (productos.length > 0) {
		  console.log('Primer producto encontrado:', JSON.stringify(productos[0]));
		} else {
		  console.log('No se encontraron productos');
		}
		
		return productos;
	  } catch (error) {
		console.error('Error en búsqueda SQL:', error);
		return [];
	  }
	},

    /**
     * Crea un nuevo producto con su registro de stock inicial
     * @param {Object} producto - Datos del producto
     * @returns {Promise<Object>} Producto creado con su ID
     */
    /**
     * Crea un nuevo producto con su registro de stock inicial
     * @param {Object} producto - Datos del producto
     * @returns {Promise<Object>} Producto creado con su ID
     */
    crear: async(producto) => {
        let connection = null;

        try {
            console.log('=== INICIO CREAR PRODUCTO ===');
            console.log('Datos recibidos para crear:', producto);

            // Iniciar transacción
            connection = await beginTransaction();
            console.log('Transacción iniciada correctamente');

            // 1. Verificar si el código ya existe para evitar duplicados
            const checkSql = 'SELECT id FROM productos WHERE codigo = ? AND activo = true';
            const existingProducts = await transactionQuery(connection, checkSql, [producto.codigo]);

            if (existingProducts && existingProducts.length > 0) {
                console.log('ADVERTENCIA: Ya existe un producto con el código:', producto.codigo);
                throw new Error(`Ya existe un producto con el código ${producto.codigo}`);
            }

            // 2. Insertar en tabla productos
            const sqlProducto = `
		  INSERT INTO productos (
			codigo, nombre, descripcion, precio_costo, precio_venta,
			imagen, categoria_id, proveedor_id
		  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;

            const resultProducto = await transactionQuery(
                    connection,
                    sqlProducto,
                    [
                        producto.codigo,
                        producto.nombre,
                        producto.descripcion || '',
                        parseFloat(producto.precio_costo) || 0,
                        parseFloat(producto.precio_venta) || 0,
                        producto.imagen || null,
                        producto.categoria_id || null,
                        producto.proveedor_id || null
                    ]);

            const productoId = resultProducto.insertId;
            console.log('Producto insertado con ID:', productoId);

            // 3. Actualizar el stock creado por el trigger
            if (producto.cantidad && producto.cantidad > 0) {
                console.log('Actualizando stock inicial a:', producto.cantidad);

                // Verificar que el trigger creó el registro de stock
                const checkStockSql = 'SELECT id FROM stock WHERE producto_id = ?';
                const stockRows = await transactionQuery(connection, checkStockSql, [productoId]);

                if (stockRows && stockRows.length > 0) {
                    // Actualizar el stock si existe
                    await transactionQuery(
                        connection,
                        'UPDATE stock SET cantidad = ?, stock_minimo = ? WHERE producto_id = ?',
                        [
                            parseInt(producto.cantidad) || 0,
                            parseInt(producto.stock_minimo) || 5,
                            productoId
                        ]);
                    console.log('Stock actualizado correctamente');
                } else {
                    // Crear stock si no lo creó el trigger (contingencia)
                    console.log('El trigger no creó stock, creando manualmente');
                    await transactionQuery(
                        connection,
                        'INSERT INTO stock (producto_id, cantidad, stock_minimo) VALUES (?, ?, ?)',
                        [
                            productoId,
                            parseInt(producto.cantidad) || 0,
                            parseInt(producto.stock_minimo) || 5
                        ]);
                }

                // 4. Registrar movimiento de stock inicial
                await transactionQuery(
                    connection,
                    `INSERT INTO movimientos_stock 
			  (producto_id, tipo, cantidad, motivo, usuario_id)
			 VALUES (?, ?, ?, ?, ?)`,
                    [
                        productoId,
                        'entrada',
                        parseInt(producto.cantidad),
                        'Stock inicial',
                        producto.usuario_id || 1
                    ]);
                console.log('Movimiento de stock registrado');
            }

            // Confirmar la transacción
            await commitTransaction(connection);
            console.log('Transacción confirmada - producto creado exitosamente');

            // Devolver el producto con su ID
            return {
                id: productoId,
                ...producto,
                stock_actual: parseInt(producto.cantidad) || 0
            };
        } catch (error) {
            console.error('ERROR en producto.model.js (crear):', error);

            // Revertir la transacción si hay una conexión activa
            if (connection) {
                try {
                    await rollbackTransaction(connection);
                    console.log('Transacción revertida debido a error');
                } catch (rollbackError) {
                    console.error('Error adicional al revertir la transacción:', rollbackError);
                }
            }

            // Relanzar el error para manejarlo en el controlador
            throw error;
        }
    },

    /**
     * Actualiza un producto existente
     * @param {number} id - ID del producto
     * @param {Object} producto - Nuevos datos del producto
     * @returns {Promise<boolean>} True si se actualizó correctamente
     */
    actualizar: async(id, producto) => {
        const sql = `
      UPDATE productos
      SET 
        codigo = ?,
        nombre = ?,
        descripcion = ?,
        precio_costo = ?,
        precio_venta = ?,
        imagen = ?,
        categoria_id = ?,
        proveedor_id = ?,
        fecha_modificacion = NOW()
      WHERE id = ?
    `;

        const result = await query(
                sql,
                [
                    producto.codigo,
                    producto.nombre,
                    producto.descripcion,
                    producto.precio_costo,
                    producto.precio_venta,
                    producto.imagen,
                    producto.categoria_id,
                    producto.proveedor_id,
                    id
                ]);

        // Actualizar stock mínimo si se proporciona
        if (producto.stock_minimo) {
            await query(
                'UPDATE stock SET stock_minimo = ? WHERE producto_id = ?',
                [producto.stock_minimo, id]);
        }

        return result.affectedRows > 0;
    },
	/**
 * Obtiene un producto por su código exacto
 * @param {string} codigo - Código del producto
 * @returns {Promise<Object>} Producto encontrado o null
 */
	obtenerPorCodigo: async (codigo) => {
	  const sql = `
		SELECT p.*, 
			   c.nombre as categoria,
			   s.cantidad as stock_actual,
			   s.stock_minimo
		FROM productos p
		LEFT JOIN categorias c ON p.categoria_id = c.id
		JOIN stock s ON p.id = s.producto_id
		WHERE p.codigo = ?
		AND p.activo = true
	  `;
	  
	  const productos = await query(sql, [codigo]);
	  
	  return productos.length > 0 ? productos[0] : null;
	},
    /**
     * Desactiva un producto (eliminación lógica)
     * @param {number} id - ID del producto
     * @returns {Promise<boolean>} True si se desactivó correctamente
     */
    eliminar: async(id) => {
        const sql = 'UPDATE productos SET activo = false WHERE id = ?';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    },

    /**
     * Obtiene productos con stock bajo (menor o igual al stock mínimo)
     * @returns {Promise<Array>} Lista de productos con stock bajo
     */
    obtenerStockBajo: async() => {
        const sql = `
      SELECT 
        p.id, p.codigo, p.nombre, p.precio_costo,
        s.cantidad, s.stock_minimo,
        prov.nombre AS proveedor, prov.telefono AS contacto_proveedor
      FROM productos p
      JOIN stock s ON p.id = s.producto_id
      LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
      WHERE p.activo = true AND s.cantidad <= s.stock_minimo
      ORDER BY (s.stock_minimo - s.cantidad) DESC
    `;

        return await query(sql);
    },

    /**
     * Ajusta el stock de un producto manualmente
     * @param {number} id - ID del producto
     * @param {number} cantidad - Nueva cantidad
     * @param {string} motivo - Motivo del ajuste
     * @param {number} usuario_id - ID del usuario que realiza el ajuste
     * @returns {Promise<boolean>} True si se ajustó correctamente
     */
    ajustarStock: async(id, cantidad, motivo, usuario_id) => {
        const connection = await beginTransaction();

        try {
            // Obtener stock actual
            const stocks = await transactionQuery(
                    connection,
                    'SELECT cantidad FROM stock WHERE producto_id = ?',
                    [id]);

            if (stocks.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const stockActual = stocks[0].cantidad;

            // Calcular diferencia
            const diferencia = cantidad - stockActual;
            const tipo = diferencia > 0 ? 'entrada' : 'salida';

            // Actualizar stock
            await transactionQuery(
                connection,
                'UPDATE stock SET cantidad = ? WHERE producto_id = ?',
                [cantidad, id]);

            // Registrar movimiento
            await transactionQuery(
                connection,
                `INSERT INTO movimientos_stock 
          (producto_id, tipo, cantidad, motivo, usuario_id, referencia_tipo)
         VALUES (?, ?, ?, ?, ?, 'ajuste')`,
                [id, tipo, Math.abs(diferencia), motivo, usuario_id]);

            await commitTransaction(connection);
            return true;
        } catch (error) {
            await rollbackTransaction(connection);
            throw error;
        }
    },

    /**
     * Obtiene el historial de movimientos de stock de un producto
     * @param {number} id - ID del producto
     * @returns {Promise<Array>} Historial de movimientos
     */
    obtenerHistorialMovimientos: async(id) => {
        try {
            console.log(`Obteniendo historial de movimientos para producto ID ${id}`);

            const sql = `
		  SELECT 
			ms.id, ms.tipo, ms.cantidad, COALESCE(ms.motivo, '') as motivo, ms.fecha,
			ms.referencia_tipo, ms.referencia_id,
			COALESCE(u.nombre, 'Sistema') as usuario,
			CASE
			  WHEN ms.referencia_tipo = 'venta' THEN v.numero
			  WHEN ms.referencia_tipo = 'compra' THEN c.numero
			  ELSE NULL
			END as numero_referencia
		  FROM movimientos_stock ms
		  LEFT JOIN usuarios u ON ms.usuario_id = u.id
		  LEFT JOIN ventas v ON ms.referencia_tipo = 'venta' AND ms.referencia_id = v.id
		  LEFT JOIN compras c ON ms.referencia_tipo = 'compra' AND ms.referencia_id = c.id
		  WHERE ms.producto_id = ?
		  ORDER BY ms.fecha DESC
		`;

            const movimientos = await query(sql, [id]);
            console.log(`Se encontraron ${movimientos.length} movimientos`);

            return movimientos;
        } catch (error) {
            console.error(`Error al obtener historial de movimientos para producto ${id}:`, error);
            return [];
        }
    }
 };	


 module.exports = productoModel;