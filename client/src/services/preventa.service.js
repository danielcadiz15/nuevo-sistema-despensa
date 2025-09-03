// src/services/preventa.service.js - Servicio para flujo de Pre-venta / Levantar Pedidos
import FirebaseService from './firebase.service';

class PreVentaService extends FirebaseService {
  constructor() {
    super('/pre-venta');
  }

  // Cache local de zonas (fallback si el backend devuelve healthcheck)
  getLocalZonas() {
    try {
      const raw = localStorage.getItem('preventa_zonas');
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  saveLocalZonas(zonas) {
    try {
      localStorage.setItem('preventa_zonas', JSON.stringify(Array.isArray(zonas) ? zonas : []));
    } catch (e) {}
  }

  upsertLocalZona(zona) {
    if (!zona) return;
    const zonas = this.getLocalZonas();
    const idx = zonas.findIndex(z => (z.id && zona.id ? z.id === zona.id : (z.nombre || '').toLowerCase() === (zona.nombre || '').toLowerCase()));
    if (idx >= 0) {
      zonas[idx] = { ...zonas[idx], ...zona };
    } else {
      zonas.push(zona);
    }
    this.saveLocalZonas(zonas);
  }

  removeLocalZona(zonaId) {
    const zonas = this.getLocalZonas().filter(z => z.id !== zonaId);
    this.saveLocalZonas(zonas);
  }

  // Catálogos básicos
  async obtenerZonas() {
    try {
      const zonas = await this.get('/zonas');
      const arr = this.ensureArray(zonas?.data ?? zonas?.zonas ?? zonas);
      // Merge con cache local
      const locales = this.getLocalZonas();
      const porNombre = (z) => (z?.nombre || '').toLowerCase();
      const merge = [...arr];
      for (const z of locales) {
        if (!merge.some(m => (m.id && z.id ? m.id === z.id : porNombre(m) === porNombre(z)))) {
          merge.push(z);
        }
      }
      return merge;
    } catch (error) {
      console.error('❌ Error al obtener zonas:', error);
      return this.getLocalZonas();
    }
  }

  async crearZona({ nombre, descripcion = '' }) {
    try {
      const payload = { nombre, descripcion };
      const resp = await this.post('/zonas', payload);
      // Intentar devolver objeto zona usable aunque el backend devuelva healthcheck
      const zona = this.ensureObject(resp?.data ?? resp);
      const zonaFinal = {
        id: zona.id || zona.zona_id || `loc-${Date.now()}`,
        nombre: zona.nombre || nombre,
        descripcion: zona.descripcion || descripcion
      };
      this.upsertLocalZona(zonaFinal);
      return zonaFinal;
    } catch (error) {
      console.error('❌ Error al crear zona:', error);
      throw error;
    }
  }

  async actualizarZona(zonaId, data) {
    try {
      if (!zonaId) throw new Error('zonaId requerido');
      const res = await this.put(`/zonas/${zonaId}`, data);
      this.upsertLocalZona({ id: zonaId, ...data });
      return res;
    } catch (error) {
      console.error('❌ Error al actualizar zona:', error);
      throw error;
    }
  }

  async eliminarZona(zonaId) {
    try {
      if (!zonaId) throw new Error('zonaId requerido');
      const res = await this.delete(`/zonas/${zonaId}`);
      this.removeLocalZona(zonaId);
      return res;
    } catch (error) {
      console.error('❌ Error al eliminar zona:', error);
      throw error;
    }
  }

  async obtenerLocalidadesPorZona(zonaId) {
    try {
      if (!zonaId) return [];
      const localidades = await this.get(`/zonas/${zonaId}/localidades`);
      return Array.isArray(localidades) ? localidades : [];
    } catch (error) {
      console.error('❌ Error al obtener localidades por zona:', error);
      return [];
    }
  }

  async obtenerClientesPorZona(zonaId, localidadId = null) {
    try {
      const params = {};
      if (zonaId) params.zona_id = zonaId;
      if (localidadId) params.localidad_id = localidadId;
      const clientes = await this.get('/clientes-por-zona', params);
      return Array.isArray(clientes) ? clientes : [];
    } catch (error) {
      console.error('❌ Error al obtener clientes por zona:', error);
      return [];
    }
  }

  // Asignación persistente clientes-zona
  async obtenerAsignacionZona(zonaId, localidadId = null) {
    try {
      if (!zonaId) return [];
      const params = {};
      if (localidadId) params.localidad_id = localidadId;
      const resp = await this.get(`/zonas/${zonaId}/asignacion`, params);
      const lista = this.ensureArray(resp);
      // Acepta tanto array de ids como de objetos {cliente_id}
      return lista.map(x => (typeof x === 'string' ? x : (x?.cliente_id || x?.id))).filter(Boolean);
    } catch (error) {
      console.warn('⚠️ No se pudo obtener asignación de zona (usando vacío):', error);
      return [];
    }
  }

  async guardarAsignacionZona(zonaId, { localidad_id = null, clients_ids = [] }) {
    try {
      if (!zonaId) throw new Error('zonaId requerido');
      const payload = { localidad_id, clients_ids };
      const resp = await this.post(`/zonas/${zonaId}/asignacion`, payload);
      return resp?.success !== false;
    } catch (error) {
      console.error('❌ Error al guardar asignación de zona:', error);
      return false;
    }
  }

  // Sesiones de pre-venta
  async crearSesion({ zona_id, localidad_id = null, usuario_id = null, notas = '', clients_ids = [] }) {
    try {
      const payload = { zona_id, localidad_id, usuario_id, notas, clients_ids };
      const sesion = await this.post('/sessions', payload);
      return sesion;
    } catch (error) {
      console.error('❌ Error al crear sesión de pre-venta:', error);
      throw error;
    }
  }

  async obtenerSesion(sesionId) {
    try {
      return await this.get(`/sessions/${sesionId}`);
    } catch (error) {
      console.error('❌ Error al obtener sesión de pre-venta:', error);
      throw error;
    }
  }

  async actualizarEstadoContacto(sesionId, clienteId, { estado_contacto, notas = '' }) {
    try {
      const payload = { estado_contacto, notas };
      return await this.post(`/sessions/${sesionId}/clientes/${clienteId}/contacto`, payload);
    } catch (error) {
      console.error('❌ Error al actualizar estado de contacto:', error);
      throw error;
    }
  }

  // Pedidos (borrador)
  async crearOActualizarPedido({ sesion_id, cliente_id, sucursal_id, items = [], notas = '' }) {
    try {
      const payload = { sesion_id, cliente_id, sucursal_id, items, notas };
      return await this.post('/pedidos', payload);
    } catch (error) {
      console.error('❌ Error al crear/actualizar pedido de pre-venta:', error);
      throw error;
    }
  }

  async confirmarPedido(pedidoId) {
    try {
      return await this.post(`/pedidos/${pedidoId}/confirmar`, {});
    } catch (error) {
      console.error('❌ Error al confirmar pedido de pre-venta:', error);
      throw error;
    }
  }

  async obtenerResumenSesion(sesionId) {
    try {
      return await this.get(`/sessions/${sesionId}/resumen`);
    } catch (error) {
      console.error('❌ Error al obtener resumen de sesión:', error);
      throw error;
    }
  }
}

export default new PreVentaService();


