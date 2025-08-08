/**
 * Servicio para reportes financieros
 * 
 * Proporciona métodos para obtener reportes de ventas, compras y ganancias.
 * 
 * @module services/reportes.service
 * @requires ./api.service
 * @related_files ../pages/reportes/*
 */

import ApiService from './api.service';

/**
 * Servicio para obtener reportes financieros
 * @extends ApiService
 */
class ReportesService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/reportes');
  }
  
  /**
   * Obtiene datos para el dashboard
   * @returns {Promise<Object>} Datos para el dashboard
   */
  async obtenerDatosDashboard() {
    const response = await this.get('/dashboard');
    return response.data;
  }
  
  /**
   * Obtiene reporte de ventas en un período
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Reporte de ventas
   */
  async obtenerReporteVentas(fechaInicio, fechaFin) {
    const response = await this.get('/ventas', { fechaInicio, fechaFin });
    return response.data;
  }
  
  /**
   * Obtiene reporte de compras en un período
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Reporte de compras
   */
  async obtenerReporteCompras(fechaInicio, fechaFin) {
    const response = await this.get('/compras', { fechaInicio, fechaFin });
    return response.data;
  }
  
  /**
   * Obtiene reporte de ganancias en un período
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @param {string} agrupacion - Tipo de agrupación (dia, semana, mes)
   * @returns {Promise<Object>} Reporte de ganancias
   */
  async obtenerReporteGanancias(fechaInicio, fechaFin, agrupacion = 'dia') {
    const response = await this.get('/ganancias', { 
      fechaInicio, 
      fechaFin,
      agrupacion
    });
    return response.data;
  }
}

export default new ReportesService();