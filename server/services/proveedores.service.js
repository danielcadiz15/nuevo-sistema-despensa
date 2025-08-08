/**
 * Servicio para gestión de proveedores
 * 
 * Proporciona métodos para realizar operaciones con proveedores.
 * 
 * @module services/proveedores.service
 * @requires ./api.service
 */

import ApiService from './api.service';

/**
 * Servicio para operaciones con proveedores
 * @extends ApiService
 */
class ProveedoresService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/proveedores');
  }
  
  /**
   * Obtiene todos los proveedores
   * @returns {Promise<Array>} Lista de proveedores
   */
  async obtenerTodos() {
    const response = await this.get('/');
    return response.data;
  }
  
  /**
   * Obtiene un proveedor por su ID
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} Datos del proveedor
   */
  async obtenerPorId(id) {
    const response = await this.get(`/${id}`);
    return response.data;
  }
  
  /**
   * Busca proveedores por término
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Proveedores que coinciden con la búsqueda
   */
  async buscar(termino) {
    const response = await this.get(`/buscar?termino=${termino}`);
    return response.data;
  }
  
  /**
   * Crea un nuevo proveedor
   * @param {Object} proveedor - Datos del proveedor
   * @returns {Promise<Object>} Respuesta de la API
   */
  async crear(proveedor) {
    const response = await this.post('/', proveedor);
    return response;
  }
  
  /**
   * Actualiza un proveedor existente
   * @param {number} id - ID del proveedor
   * @param {Object} proveedor - Nuevos datos del proveedor
   * @returns {Promise<Object>} Respuesta de la API
   */
  async actualizar(id, proveedor) {
    const response = await this.put(`/${id}`, proveedor);
    return response;
  }
  
  /**
   * Elimina un proveedor
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} Respuesta de la API
   */
  async eliminar(id) {
    const response = await this.delete(`/${id}`);
    return response;
  }
}

export default new ProveedoresService();