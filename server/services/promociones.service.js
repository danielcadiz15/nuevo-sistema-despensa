/**
 * Servicio para gestión de promociones
 * 
 * Proporciona métodos para interactuar con la API de promociones.
 * 
 * @module services/promociones.service
 * @requires ./api.service
 * @related_files ../pages/promociones/*
 */

import ApiService from './api.service';

/**
 * Servicio para operaciones con promociones
 * @extends ApiService
 */
class PromocionesService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/api/promociones');
  }
  
  /**
   * Obtiene todas las promociones
   * @returns {Promise<Array>} Lista de promociones
   */
  async obtenerTodas() {
	  try {
		const response = await this.get();
		return response.data;
	  } catch (error) {
		console.error('Error al obtener promociones:', error);
		// Devolver un array vacío en caso de error para no romper la UI
		return { success: true, data: [] };
	  }
	}
  
  /**
   * Obtiene las promociones activas en la fecha actual
   * @returns {Promise<Array>} Lista de promociones activas
   */
  async obtenerActivas() {
    const response = await this.get('/activas');
    return response.data;
  }
  
  /**
   * Obtiene una promoción por su ID
   * @param {number} id - ID de la promoción
   * @returns {Promise<Object>} Datos de la promoción
   */
  async obtenerPorId(id) {
    const response = await this.get(`/${id}`);
    return response.data;
  }
  
  /**
   * Crea una nueva promoción
   * @param {Object} promocion - Datos de la promoción
   * @returns {Promise<Object>} Promoción creada
   */
  async crear(promocion) {
    const response = await this.post('', promocion);
    return response.data;
  }
  
  /**
   * Actualiza una promoción existente
   * @param {number} id - ID de la promoción
   * @param {Object} promocion - Nuevos datos de la promoción
   * @returns {Promise<Object>} Respuesta de la API
   */
  async actualizar(id, promocion) {
    const response = await this.put(`/${id}`, promocion);
    return response;
  }
  
  /**
   * Cambia el estado de una promoción
   * @param {number} id - ID de la promoción
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>} Respuesta de la API
   */
  async cambiarEstado(id, activo) {
	  try {
		console.log(`Cambiando estado de promoción ${id} a ${activo}`);
		const response = await this.patch(`/${id}/estado`, { activo });
		return response;
	  } catch (error) {
		console.error(`Error al cambiar estado de promoción ${id}:`, error);
		// Devolver un objeto de respuesta para evitar errores en la UI
		return { 
		  data: { 
			success: false, 
			message: `Error al cambiar estado: ${error.message}` 
		  } 
		};
	  }
	}
  
  /**
   * Elimina una promoción
   * @param {number} id - ID de la promoción
   * @returns {Promise<Object>} Respuesta de la API
   */
  async eliminar(id) {
    const response = await this.delete(`/${id}`);
    return response;
  }
  
  /**
   * Aplica promociones a un carrito
   * @param {Array} items - Items del carrito
   * @returns {Promise<Array>} Items con promociones aplicadas
   */
  async aplicarPromociones(items) {
  try {
    console.log('Enviando solicitud a /aplicar con items:', items);
    const response = await this.post('/aplicar', { items });
    console.log('Respuesta recibida:', response);
    return response;
  } catch (error) {
    console.error('Error en servicio aplicarPromociones:', error);
    throw error;
  }
}

export default new PromocionesService();