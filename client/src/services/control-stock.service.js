// src/services/control-stock.service.js
import FirebaseService from './firebase.service';

/**
 * Servicio para gestión de controles de stock/inventario físico
 */
class ControlStockService extends FirebaseService {
  constructor() {
    super('/control-stock');
  }

  /**
   * Crea un nuevo control de inventario
   * @param {Object} datos - Datos del control
   * @returns {Promise<Object>} Control creado
   */
  async crearControl(datos) {
    try {
      console.log('🔄 Creando nuevo control de inventario:', datos);
      
      const control = {
        sucursal_id: datos.sucursal_id,
        usuario_id: datos.usuario_id,
        fecha_inicio: new Date().toISOString(),
        tipo: datos.tipo || 'completo',
        categoria_id: datos.categoria_id || null,
        estado: 'en_proceso',
        observaciones: datos.observaciones || ''
      };
      
      const resultado = await this.post('', control);
      console.log('✅ Control creado:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error al crear control:', error);
      throw error;
    }
  }

  /**
   * Obtiene el control activo de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Object|null>} Control activo o null
   */
  async obtenerControlActivo(sucursalId) {
    try {
      console.log(`🔄 Buscando control activo para sucursal ${sucursalId}`);
      
      const controles = await this.get('', {
        sucursal_id: sucursalId,
        estado: 'en_proceso'
      });
      
      const controlesArray = this.ensureArray(controles);
      
      // Retornar el más reciente
      if (controlesArray.length > 0) {
        const controlActivo = controlesArray.sort((a, b) => 
          new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
        )[0];
        
        console.log('✅ Control activo encontrado:', controlActivo);
        return controlActivo;
      }
      
      console.log('ℹ️ No hay control activo');
      return null;
      
    } catch (error) {
      console.error('❌ Error al buscar control activo:', error);
      return null;
    }
  }

  /**
   * Obtiene los detalles de un control
   * @param {string} controlId - ID del control
   * @returns {Promise<Array>} Detalles del control
   */
  async obtenerDetallesControl(controlId) {
    try {
      console.log(`🔄 Obteniendo detalles del control ${controlId}`);
      
      const detalles = await this.get(`/${controlId}/detalles`);
      const detallesArray = this.ensureArray(detalles);
      
      console.log(`✅ Detalles obtenidos: ${detallesArray.length} productos`);
      return detallesArray;
      
    } catch (error) {
      console.error('❌ Error al obtener detalles:', error);
      return [];
    }
  }

  /**
   * Actualiza el conteo de un producto en el control
   * @param {string} controlId - ID del control
   * @param {string} productoId - ID del producto
   * @param {Object} datos - Datos del conteo
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async actualizarConteo(controlId, productoId, datos) {
    try {
      console.log(`🔄 Actualizando conteo para producto ${productoId}`);
      
      const conteo = {
        stock_fisico: parseFloat(datos.stock_fisico),
        observaciones: datos.observaciones || '',
        fecha_conteo: new Date().toISOString()
      };
      
      const resultado = await this.put(
        `/${controlId}/productos/${productoId}`,
        conteo
      );
      
      console.log('✅ Conteo actualizado');
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al actualizar conteo:', error);
      throw error;
    }
  }

  /**
   * Finaliza un control de inventario
   * @param {string} controlId - ID del control
   * @param {Object} datos - Datos de finalización
   * @returns {Promise<Object>} Control finalizado
   */
  async finalizarControl(controlId, datos) {
    try {
      console.log(`🔄 Finalizando control ${controlId}`);
      
      const finalizacion = {
        fecha_fin: new Date().toISOString(),
        estado: 'finalizado',
        productos_conteo: datos.productos_conteo,
        ajustes_aplicados: datos.ajustes_aplicados || false,
        observaciones_finales: datos.observaciones_finales || ''
      };
      
      const resultado = await this.put(`/${controlId}/finalizar`, finalizacion);
      
      console.log('✅ Control finalizado');
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al finalizar control:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de controles de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de controles
   */
  async obtenerHistorial(sucursalId, filtros = {}) {
    try {
      console.log(`🔄 Obteniendo historial de controles para sucursal ${sucursalId}`);
      
      const params = {
        sucursal_id: sucursalId,
        ...filtros
      };
      
      const controles = await this.get('/historial', params);
      const controlesArray = this.ensureArray(controles);
      
      console.log(`✅ Historial obtenido: ${controlesArray.length} controles`);
      return controlesArray;
      
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      return [];
    }
  }

  /**
   * Genera un reporte de control
   * @param {string} controlId - ID del control
   * @returns {Promise<Object>} Reporte del control
   */
  async generarReporte(controlId) {
    try {
      console.log(`🔄 Generando reporte para control ${controlId}`);
      
      const reporte = await this.get(`/${controlId}/reporte`);
      
      console.log('✅ Reporte generado');
      return reporte;
      
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de controles
   * @param {string} sucursalId - ID de la sucursal
   * @param {Object} periodo - Periodo de tiempo
   * @returns {Promise<Object>} Estadísticas
   */
  async obtenerEstadisticas(sucursalId, periodo = {}) {
    try {
      console.log(`🔄 Obteniendo estadísticas de controles`);
      
      const params = {
        sucursal_id: sucursalId,
        ...periodo
      };
      
      const estadisticas = await this.get('/estadisticas', params);
      
      console.log('✅ Estadísticas obtenidas');
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        controles_realizados: 0,
        productos_contados: 0,
        ajustes_aplicados: 0,
        valor_ajustes: 0
      };
    }
  }

  /**
   * Exporta un control a Excel
   * @param {string} controlId - ID del control
   * @returns {Promise<Blob>} Archivo Excel
   */
  async exportarExcel(controlId) {
    try {
      console.log(`🔄 Exportando control ${controlId} a Excel`);
      
      const response = await this.get(`/${controlId}/exportar`, {
        formato: 'excel'
      });
      
      console.log('✅ Control exportado');
      return response;
      
    } catch (error) {
      console.error('❌ Error al exportar control:', error);
      throw error;
    }
  }
}

export default new ControlStockService();