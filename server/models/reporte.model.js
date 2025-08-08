/**
 * Modelo para la generación de reportes financieros
 * A
 * Este modelo contiene todas las consultas para generar reportes
 * sobre ventas, compras, ganancias y stock.
 * 
 * @module models/reporte.model
 * @requires ../config/database
 * @related_files ../controllers/reportes.controller.js, ../routes/reportes.routes.js
 */

const { query } = require('../config/database');

const reporteModel = {
  /**
   * Obtiene el resumen de ventas por período
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Object>} Resumen de ventas
   */
  obtenerResumenVentas: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        COUNT(*) AS total_ventas,
        SUM(subtotal) AS subtotal,
        SUM(descuento) AS descuento,
        SUM(total) AS total,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) AS total_tarjeta,
        SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) AS total_transferencia,
        SUM(CASE WHEN metodo_pago = 'credito' THEN total ELSE 0 END) AS total_credito
      FROM ventas
      WHERE fecha BETWEEN ? AND ?
      AND estado = 'completada'
    `;
    
    const resultado = await query(sql, [fechaInicio, fechaFin]);
    return resultado[0];
  },
  
  /**
   * Obtiene el detalle de ventas por período
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Array>} Lista de ventas en el período
   */
  obtenerDetalleVentas: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        v.id, v.numero, v.fecha, v.subtotal, v.descuento, v.total,
        v.metodo_pago, v.estado,
        CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) AS cliente,
        CONCAT(u.nombre, ' ', u.apellido) AS usuario
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.fecha BETWEEN ? AND ?
      ORDER BY v.fecha DESC
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene la distribución de ventas por día de la semana
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Array>} Ventas agrupadas por día de la semana
   */
  obtenerVentasPorDiaSemana: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        DAYNAME(fecha) AS dia_semana,
        COUNT(*) AS total_ventas,
        SUM(total) AS monto_total
      FROM ventas
      WHERE fecha BETWEEN ? AND ?
      AND estado = 'completada'
      GROUP BY DAYNAME(fecha)
      ORDER BY FIELD(
        DAYNAME(fecha),
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
        'Friday', 'Saturday', 'Sunday'
      )
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene la distribución de ventas por hora del día
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Array>} Ventas agrupadas por hora
   */
  obtenerVentasPorHora: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        HOUR(fecha) AS hora,
        COUNT(*) AS total_ventas,
        SUM(total) AS monto_total
      FROM ventas
      WHERE fecha BETWEEN ? AND ?
      AND estado = 'completada'
      GROUP BY HOUR(fecha)
      ORDER BY HOUR(fecha)
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene un resumen de las compras en un período
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Object>} Resumen de compras
   */
  obtenerResumenCompras: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        COUNT(*) AS total_compras,
        SUM(subtotal) AS subtotal,
        SUM(impuestos) AS impuestos,
        SUM(total) AS total
      FROM compras
      WHERE fecha BETWEEN ? AND ?
      AND estado = 'recibida'
    `;
    
    const resultado = await query(sql, [fechaInicio, fechaFin]);
    return resultado[0];
  },
  
  /**
   * Obtiene las compras agrupadas por proveedor
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Array>} Compras agrupadas por proveedor
   */
  obtenerComprasPorProveedor: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        p.id, p.nombre AS proveedor,
        COUNT(c.id) AS total_compras,
        SUM(c.total) AS monto_total
      FROM compras c
      JOIN proveedores p ON c.proveedor_id = p.id
      WHERE c.fecha BETWEEN ? AND ?
      AND c.estado = 'recibida'
      GROUP BY p.id
      ORDER BY SUM(c.total) DESC
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene un resumen de ganancias por período
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Object>} Resumen de ganancias
   */
  obtenerResumenGanancias: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia_bruta,
        SUM(dv.descuento) AS descuentos_total
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
    `;
    
    const resultado = await query(sql, [fechaInicio, fechaFin]);
    return resultado[0];
  },
  
  /**
   * Obtiene las ganancias por categoría de producto
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @returns {Promise<Array>} Ganancias agrupadas por categoría
   */
  obtenerGananciasPorCategoria: async (fechaInicio, fechaFin) => {
    const sql = `
      SELECT 
        c.id, c.nombre AS categoria,
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia,
        ((SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad)) / SUM(dv.precio_total)) * 100 AS margen
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
      GROUP BY c.id
      ORDER BY ganancia DESC
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene las ganancias por producto
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @param {number} limit - Límite de resultados (para top productos)
   * @returns {Promise<Array>} Ganancias por producto
   */
  obtenerGananciasPorProducto: async (fechaInicio, fechaFin, limit = null) => {
    let sql = `
      SELECT 
        p.id, p.codigo, p.nombre,
        SUM(dv.cantidad) AS unidades_vendidas,
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia,
        ((SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad)) / SUM(dv.precio_total)) * 100 AS margen
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
      GROUP BY p.id
      ORDER BY ganancia DESC
    `;
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene la evolución de ganancias a lo largo del tiempo
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @param {string} agrupacion - Tipo de agrupación (dia, semana, mes)
   * @returns {Promise<Array>} Ganancias agrupadas por período
   */
  obtenerEvolucionGanancias: async (fechaInicio, fechaFin, agrupacion = 'dia') => {
    let groupFormat;
    
    // Definir formato de agrupación
    switch (agrupacion) {
      case 'semana':
        groupFormat = 'YEARWEEK(v.fecha, 1)';
        break;
      case 'mes':
        groupFormat = "DATE_FORMAT(v.fecha, '%Y-%m')";
        break;
      default: // día
        groupFormat = "DATE(v.fecha)";
        break;
    }
    
    const sql = `
      SELECT 
        ${agrupacion === 'semana' ? 
          "CONCAT(YEAR(v.fecha), '-W', WEEK(v.fecha, 1))" : 
          agrupacion === 'mes' ? 
          "DATE_FORMAT(v.fecha, '%Y-%m')" : 
          "DATE(v.fecha)"
        } AS periodo,
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
      GROUP BY ${groupFormat}
      ORDER BY periodo ASC
    `;
    
    return await query(sql, [fechaInicio, fechaFin]);
  },
  
  /**
   * Obtiene los productos más vendidos
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @param {number} limit - Cantidad de productos a mostrar
   * @returns {Promise<Array>} Lista de productos más vendidos
   */
  obtenerProductosMasVendidos: async (fechaInicio, fechaFin, limit = 10) => {
    const sql = `
      SELECT 
        p.id, p.codigo, p.nombre,
        SUM(dv.cantidad) AS unidades_vendidas,
        SUM(dv.precio_total) AS ventas_total
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
      GROUP BY p.id
      ORDER BY unidades_vendidas DESC
      LIMIT ?
    `;
    
    return await query(sql, [fechaInicio, fechaFin, limit]);
  },
  
  /**
   * Obtiene los productos menos vendidos
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @param {number} limit - Cantidad de productos a mostrar
   * @returns {Promise<Array>} Lista de productos menos vendidos
   */
  obtenerProductosMenosVendidos: async (fechaInicio, fechaFin, limit = 10) => {
    const sql = `
      SELECT 
        p.id, p.codigo, p.nombre,
        IFNULL(SUM(dv.cantidad), 0) AS unidades_vendidas,
        IFNULL(SUM(dv.precio_total), 0) AS ventas_total
      FROM productos p
      LEFT JOIN detalle_venta dv ON p.id = dv.producto_id
      LEFT JOIN ventas v ON dv.venta_id = v.id AND v.fecha BETWEEN ? AND ? AND v.estado = 'completada'
      WHERE p.activo = true
      GROUP BY p.id
      ORDER BY unidades_vendidas ASC
      LIMIT ?
    `;
    
    return await query(sql, [fechaInicio, fechaFin, limit]);
  },
  
  /**
   * Obtiene el top de clientes por compras realizadas
   * @param {Date} fechaInicio - Fecha de inicio del período
   * @param {Date} fechaFin - Fecha de fin del período
   * @param {number} limit - Cantidad de clientes a mostrar
   * @returns {Promise<Array>} Lista de mejores clientes
   */
  obtenerMejoresClientes: async (fechaInicio, fechaFin, limit = 10) => {
    const sql = `
      SELECT 
        c.id,
        CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) AS cliente,
        COUNT(v.id) AS total_compras,
        SUM(v.total) AS monto_total
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE v.fecha BETWEEN ? AND ?
      AND v.estado = 'completada'
      GROUP BY c.id
      ORDER BY monto_total DESC
      LIMIT ?
    `;
    
    return await query(sql, [fechaInicio, fechaFin, limit]);
  },
  
  /**
   * Obtiene datos para el dashboard
   * @returns {Promise<Object>} Datos para el dashboard
   */
  obtenerDatosDashboard: async () => {
    // Fecha de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Fecha de inicio del mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Fecha de inicio del año
    const inicioAno = new Date(hoy.getFullYear(), 0, 1);
    
    // Total ventas del día
    const ventasHoy = await query(`
      SELECT COUNT(*) AS total, SUM(total) AS monto
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
      AND estado = 'completada'
    `);
    
    // Total ventas del mes
    const ventasMes = await query(`
      SELECT COUNT(*) AS total, SUM(total) AS monto
      FROM ventas
      WHERE fecha >= ?
      AND estado = 'completada'
    `, [inicioMes]);
    
    // Ganancia del día
    const gananciaHoy = await query(`
      SELECT 
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE DATE(v.fecha) = CURDATE()
      AND v.estado = 'completada'
    `);
    
    // Ganancia del mes
    const gananciaMes = await query(`
      SELECT 
        SUM(dv.precio_total) AS ventas_total,
        SUM(p.precio_costo * dv.cantidad) AS costo_total,
        SUM(dv.precio_total) - SUM(p.precio_costo * dv.cantidad) AS ganancia
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha >= ?
      AND v.estado = 'completada'
    `, [inicioMes]);
    
    // Productos con stock bajo
    const stockBajo = await query(`
      SELECT COUNT(*) AS total
      FROM stock s
      JOIN productos p ON s.producto_id = p.id
      WHERE s.cantidad <= s.stock_minimo
      AND p.activo = true
    `);
    
    // Últimas ventas
    const ultimasVentas = await query(`
      SELECT 
        v.id, v.numero, v.fecha, v.total,
        CONCAT(c.nombre, ' ', IFNULL(c.apellido, '')) AS cliente
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.estado = 'completada'
      ORDER BY v.fecha DESC
      LIMIT 5
    `);
    
    // Productos más vendidos del mes
    const productosMasVendidos = await query(`
      SELECT 
        p.id, p.nombre,
        SUM(dv.cantidad) AS unidades_vendidas
      FROM detalle_venta dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.fecha >= ?
      AND v.estado = 'completada'
      GROUP BY p.id
      ORDER BY unidades_vendidas DESC
      LIMIT 5
    `, [inicioMes]);
    
    return {
      ventasHoy: ventasHoy[0],
      ventasMes: ventasMes[0],
      gananciaHoy: gananciaHoy[0],
      gananciaMes: gananciaMes[0],
      stockBajo: stockBajo[0],
      ultimasVentas,
      productosMasVendidos
    };
  }
};

module.exports = reporteModel;