/**
 * Servicio para gestión de clientes
 * 
 * Proporciona métodos para consultar y gestionar clientes.
 * 
 * @module services/clientes.service
 * @requires ./api.service
 * @related_files ../pages/clientes/*
 */

import ApiService from './api.service';

/**
 * Servicio para operaciones con clientes
 * @extends ApiService
 */
class ClientesService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/clientes');
  }
  
  /**
   * Obtiene todos los clientes
   * @returns {Promise<Array>} Lista de clientes
   */
  async obtenerTodos() {
    const response = await this.get();
    return response.data;
  }
  
  /**
   * Obtiene un cliente por su ID
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  async obtenerPorId(id) {
    const response = await this.get(`/${id}`);
    return response.data;
  }
  
  /**
   * Busca clientes por término
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Clientes que coinciden con la búsqueda
   */
  async buscar(termino) {
    const response = await this.get('/buscar', { termino });
    return response.data;
  }
  
  /**
   * Crea un nuevo cliente
   * @param {Object} cliente - Datos del cliente
   * @returns {Promise<Object>} Cliente creado
   */
  async crear(cliente) {
    const response = await this.post('', cliente);
    return response;
  }
  
  /**
   * Actualiza un cliente existente
   * @param {number} id - ID del cliente
   * @param {Object} cliente - Nuevos datos del cliente
   * @returns {Promise<Object>} Respuesta de la API
   */
  async actualizar(id, cliente) {
    const response = await this.put(`/${id}`, cliente);
    return response;
  }
  
  /**
   * Elimina un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Respuesta de la API
   */
  async eliminar(id) {
    const response = await this.delete(`/${id}`);
    return response;
  }
  
  /**
   * Obtiene el historial de compras de un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise<Array>} Historial de compras
   */
  async obtenerHistorialCompras(id) {
    const response = await this.get(`/${id}/compras`);
    return response.data;
  }
}

export default new ClientesService();