// src/services/firebase.service.js - FIX PARA RESPUESTAS POST
import { auth } from '../firebase/config';

/**
 * Servicio base para interactuar con Firebase Functions
 * Reemplaza ApiService para usar Firebase directamente
 */
class FirebaseService {
  constructor(module = '') {
    // URL base de Firebase Functions
    this.baseURL = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 
               'https://api-x7ps3erlnq-uc.a.run.app';
    this.module = module;
  }

  /**
   * Obtiene headers de autenticación
   */
  async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Construye URL completa
   */
  buildURL(endpoint = '') {
    // Forzar el uso de /api en todas las rutas
    return `${this.baseURL}/api${this.module}${endpoint}`;
  }

  /**
   * Maneja respuesta de Firebase con mejor detección de errores
   */
  handleFirebaseResponse(response) {
    console.log('🔍 Procesando respuesta Firebase:', response);
    
    // Verificar si es una respuesta de error
    if (!response) {
      console.error('❌ Respuesta vacía de Firebase');
      throw new Error('Respuesta vacía del servidor');
    }
    
    // Si la respuesta tiene success: false, es un error
    if (response.success === false) {
      console.error('❌ Error reportado por Firebase:', response.message);
      throw new Error(response.message || 'Error del servidor');
    }
    
    // Firebase Functions devuelve: { success: true, data: {...} }
    if (response && response.success === true && response.data !== undefined) {
      // 🆕 CORREGIDO: Para endpoints de deudas, devolver el objeto completo
      if (response.total_deuda !== undefined || response.saldo_total !== undefined) {
        console.log('✅ Respuesta Firebase válida (deudas):', response);
        return response;
      }
      
      console.log('✅ Respuesta Firebase válida:', response.data);
      return response.data;
    }
    
    // NUEVO: Si la respuesta es directamente los datos (sin wrapper success/data)
	  // pero parece ser una respuesta válida, devolverla tal cual
	 if (Array.isArray(response) || (response && typeof response === 'object' && !response.error)) {
		console.log('✅ Respuesta directa válida:', response);
		return response;
	 }
    
    // Si llegamos aquí, la respuesta no tiene el formato esperado
    console.error('❌ Formato de respuesta no reconocido:', response);
    throw new Error('Formato de respuesta inválido del servidor');
  }

  /**
   * GET request a Firebase Functions
   */
  async get(endpoint = '', params = {}) {
    try {
      const headers = await this.getAuthHeaders();
      let url = this.buildURL(endpoint);
      
      // Agregar parámetros de consulta si existen
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      console.log(`🔥 Firebase GET: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Firebase GET Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Firebase GET Response:`, data);
      
      return this.handleFirebaseResponse(data);
    } catch (error) {
      console.error(`❌ Firebase GET Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * POST request a Firebase Functions (CRÍTICO para crear clientes)
   */
  async post(endpoint = '', data = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const url = this.buildURL(endpoint);

      console.log(`🔥 Firebase POST: ${url}`, data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      // Verificar status HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Firebase POST HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`✅ Firebase POST Response:`, responseData);
      
      return this.handleFirebaseResponse(responseData);
    } catch (error) {
      console.error(`❌ Firebase POST Error (${endpoint}):`, error);
      
      // Dar más información sobre el tipo de error
      if (error.message.includes('HTTP')) {
        throw new Error(`Error del servidor: ${error.message}`);
      } else if (error.message.includes('inválido')) {
        throw new Error(`Respuesta inválida: ${error.message}`);
      } else {
        throw new Error(`Error de conexión: ${error.message}`);
      }
    }
  }

  /**
   * PUT request a Firebase Functions
   */
  async put(endpoint = '', data = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const url = this.buildURL(endpoint);

      console.log(`🔥 Firebase PUT: ${url}`, data);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Firebase PUT HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`✅ Firebase PUT Response:`, responseData);
      
      return this.handleFirebaseResponse(responseData);
    } catch (error) {
      console.error(`❌ Firebase PUT Error (${endpoint}):`, error);
      throw error;
    }
  }
   /**
 * PATCH request a Firebase Functions
 */
	async patch(endpoint = '', data = {}) {
	  try {
		const headers = await this.getAuthHeaders();
		const url = this.buildURL(endpoint);

		console.log(`🔥 Firebase PATCH: ${url}`, data);
		
		const response = await fetch(url, {
		  method: 'PATCH',
		  headers,
		  body: JSON.stringify(data)
		});

		if (!response.ok) {
		  const errorText = await response.text();
		  console.error(`❌ Firebase PATCH HTTP Error: ${response.status} - ${errorText}`);
		  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const responseData = await response.json();
		console.log(`✅ Firebase PATCH Response:`, responseData);
		
		return this.handleFirebaseResponse(responseData);
	  } catch (error) {
		console.error(`❌ Firebase PATCH Error (${endpoint}):`, error);
		throw error;
	  }
	}
  /**
   * DELETE request a Firebase Functions
   */
  async delete(endpoint = '', data = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const url = this.buildURL(endpoint);

      console.log(`🔥 Firebase DELETE: ${url}`, data);
      
      const requestOptions = {
        method: 'DELETE',
        headers
      };
      
      // Agregar body si hay datos
      if (Object.keys(data).length > 0) {
        requestOptions.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Firebase DELETE HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`✅ Firebase DELETE Response:`, responseData);
      
      return this.handleFirebaseResponse(responseData);
    } catch (error) {
      console.error(`❌ Firebase DELETE Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Método seguro para asegurar que siempre devuelve array
   */
  ensureArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  /**
   * Método seguro para asegurar que siempre devuelve objeto
   */
  ensureObject(data) {
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    if (data && data.data && typeof data.data === 'object') return data.data;
    return {};
  }

  /**
   * 🆕 NUEVO: Obtiene el ID del usuario actual autenticado
   * @returns {string|null} ID del usuario o null si no está autenticado
   */
  getCurrentUserId() {
    return auth.currentUser?.uid || null;
  }
}

export default FirebaseService;