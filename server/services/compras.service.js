/**
 * Servicio para gestión de compras
 * 
 * Proporciona métodos para consultar y gestionar compras a proveedores.
 * 
 * @module services/compras.service
 * @requires ./api.service
 * @related_files ../pages/compras/*
 */

import ApiService from './api.service';

/**
 * Servicio para operaciones con compras
 * @extends ApiService
 */
class ComprasService extends ApiService {
  /**
   * Constructor
   */
  constructor() {
    super('/compras');
  }
  
  /**
   * Obtiene todas las compras
   * @returns {Promise<Array>} Lista de compras
   */
  async obtenerTodas() {
    const response = await this.get();
    return response.data;
  }
  
  /**
   * Obtiene una compra por su ID
   * @param {number} id - ID de la compra
   * @returns {Promise<Object>} Datos de la compra
   */
  async obtenerPorId(id) {
    const response = await this.get(`/${id}`);
    return response.data;
  }
  
  /**
   * Crea una nueva compra
   * @param {Object} compra - Datos de la compra
   * @param {Array} detalles - Detalles de productos
   * @returns {Promise<Object>} Compra creada
   */
  async crear(compra, detalles) {
    const response = await this.post('', { compra, detalles });
    return response;
  }
  
  /**
   * Recibe una compra (cambia estado a 'recibida')
   * @param {number} id - ID de la compra
   * @param {Object} datos - Datos adicionales para la recepción
   * @returns {Promise<Object>} Respuesta de la API
   */
  async recibirCompra(id, datos = {}) {
    const response = await this.patch(`/${id}/recibir`, datos);
    return response;
  }
  
  /**
   * Cancela una compra pendiente
   * @param {number} id - ID de la compra
   * @returns {Promise<Object>} Respuesta de la API
   */
  async cancelarCompra(id) {
    const response = await this.patch(`/${id}/cancelar`);
    return response;
  }
  
  /**
   * Obtiene compras por proveedor
   * @param {number} proveedorId - ID del proveedor
   * @returns {Promise<Array>} Lista de compras del proveedor
   */
  async obtenerPorProveedor(proveedorId) {
    const response = await this.get(`/proveedor/${proveedorId}`);
    return response.data;
  }
}

export default new ComprasService();