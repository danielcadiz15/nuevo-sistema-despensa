/**
 * Controlador de reportes
 * 
 * Gestiona la generación de reportes financieros y estadísticos
 * del sistema.
 * 
 * @module controllers/reportes.controller
 * @requires ../models/reporte.model
 * @related_files ../routes/reportes.routes.js
 */

const reporteModel = require('../models/reporte.model');

const reportesController = {
  /**
   * Obtiene datos para el dashboard principal
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerDatosDashboard: async (req, res) => {
    try {
      const datos = await reporteModel.obtenerDatosDashboard();
      
      res.json({
        success: true,
        data: datos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del dashboard',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene reporte de ventas en un período
   * @param {Object} req - Objeto de solicitud con fechaInicio y fechaFin
   * @param {Object} res - Objeto de respuesta
   */
  obtenerReporteVentas: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }
      
      // Obtener resumen de ventas
      const resumen = await reporteModel.obtenerResumenVentas(fechaInicio, fechaFin);
      
      // Obtener detalle de ventas
      const detalle = await reporteModel.obtenerDetalleVentas(fechaInicio, fechaFin);
      
      // Obtener distribuciones por día y hora
      const ventasPorDia = await reporteModel.obtenerVentasPorDiaSemana(fechaInicio, fechaFin);
      const ventasPorHora = await reporteModel.obtenerVentasPorHora(fechaInicio, fechaFin);
      
      res.json({
        success: true,
        data: {
          resumen,
          detalle,
          ventasPorDia,
          ventasPorHora
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de ventas',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene reporte de compras en un período
   * @param {Object} req - Objeto de solicitud con fechaInicio y fechaFin
   * @param {Object} res - Objeto de respuesta
   */
  obtenerReporteCompras: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }
      
      // Obtener resumen de compras
      const resumen = await reporteModel.obtenerResumenCompras(fechaInicio, fechaFin);
      
      // Obtener compras por proveedor
      const comprasPorProveedor = await reporteModel.obtenerComprasPorProveedor(fechaInicio, fechaFin);
      
      res.json({
        success: true,
        data: {
          resumen,
          comprasPorProveedor
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de compras',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene reporte de ganancias en un período
   * @param {Object} req - Objeto de solicitud con fechaInicio, fechaFin y otros parámetros
   * @param {Object} res - Objeto de respuesta
   */
  obtenerReporteGanancias: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, agrupacion = 'dia' } = req.query;
      
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }
      
      // Obtener resumen de ganancias
      const resumen = await reporteModel.obtenerResumenGanancias(fechaInicio, fechaFin);
      
      // Obtener ganancias por categoría
      const gananciasPorCategoria = await reporteModel.obtenerGananciasPorCategoria(fechaInicio, fechaFin);
      
      // Obtener top productos por ganancia
      const topProductosPorGanancia = await reporteModel.obtenerGananciasPorProducto(fechaInicio, fechaFin, 10);
      
      // Obtener evolución de ganancias
      const evolucionGanancias = await reporteModel.obtenerEvolucionGanancias(fechaInicio, fechaFin, agrupacion);
      
      // Obtener productos más vendidos
      const productosMasVendidos = await reporteModel.obtenerProductosMasVendidos(fechaInicio, fechaFin, 10);
      
      // Obtener productos menos vendidos
      const productosMenosVendidos = await reporteModel.obtenerProductosMenosVendidos(fechaInicio, fechaFin, 10);
      
      // Obtener mejores clientes
      const mejoresClientes = await reporteModel.obtenerMejoresClientes(fechaInicio, fechaFin, 10);
      
      res.json({
        success: true,
        data: {
          resumen,
          gananciasPorCategoria,
          topProductosPorGanancia,
          evolucionGanancias,
          productosMasVendidos,
          productosMenosVendidos,
          mejoresClientes
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte de ganancias',
        error: error.message
      });
    }
  }
};

module.exports = reportesController;