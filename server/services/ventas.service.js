/**
 * Servicio para gestión de ventas
 * 
 * Proporciona métodos para consultar y gestionar ventas.
 * 
 * @module services/ventas.service
 * @requires ./api.service
 * @related_files ../pages/ventas/*
 */

import ApiService from './api.service';

/**
 * Servicio para operaciones con ventas
 * @extends ApiService
 */
class VentasService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/ventas');
  }
  
  /**
   * Obtiene todas las ventas
   * @returns {Promise<Array>} Lista de ventas
   */
  async obtenerTodas() {
    const response = await this.get();
    return response.data;
  }
  
  /**
   * Obtiene una venta por su ID
   * @param {number} id - ID de la venta
   * @returns {Promise<Object>} Datos de la venta
   */
  async obtenerPorId(id) {
    const response = await this.get(`/${id}`);
    return response.data;
  }
  
  /**
   * Crea una nueva venta
   * @param {Object} venta - Datos de la venta
   * @param {Array} detalles - Detalles de productos
   * @returns {Promise<Object>} Venta creada
   */
  async crear(venta, detalles) {
    const response = await this.post('', { venta, detalles });
    return response;
  }
  
  /**
   * Cambia el estado de una venta
   * @param {number} id - ID de la venta
   * @param {string} estado - Nuevo estado
   * @param {string} motivo - Motivo del cambio (opcional)
   * @returns {Promise<Object>} Respuesta de la API
   */
  async cambiarEstado(id, estado, motivo = '') {
    const response = await this.patch(`/${id}/estado`, { estado, motivo });
    return response;
  }
  
  /**
   * Obtiene ventas por cliente
   * @param {number} clienteId - ID del cliente
   * @returns {Promise<Array>} Lista de ventas del cliente
   */
  async obtenerPorCliente(clienteId) {
    const response = await this.get(`/cliente/${clienteId}`);
    return response.data;
  }
  
  /**
   * Busca ventas por término
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Ventas que coinciden con la búsqueda
   */
  async buscar(termino) {
    const response = await this.get('/buscar', { termino });
    return response.data;
  }
  
  /**
   * Obtiene estadísticas de ventas del día actual
   * @returns {Promise<Object>} Estadísticas de ventas
   */
  async obtenerEstadisticasDia() {
    const response = await this.get('/estadisticas/dia');
    return response.data;
  }
}

export default new VentasService();