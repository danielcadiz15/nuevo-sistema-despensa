// src/services/api.service.js - REEMPLAZAR COMPLETO
import { auth } from '../firebase/config';

class ApiService {
  constructor(baseURL = '') {
    // URL de tus Cloud Functions
    this.baseURL = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 
                   'https://api-x7ps3erlnq-uc.a.run.app';
    this.fullURL = this.baseURL + baseURL;
  }

  async getAuthHeaders() {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async get(endpoint = '') {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.fullURL + endpoint, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  async post(endpoint = '', data = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.fullURL + endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }
}

export default ApiService;