// src/services/productos.service.js - VERSIÓN CORREGIDA COMPLETA CON MÉTODOS FALTANTES
import FirebaseService from './firebase.service';

// Datos de respaldo para productos (por si Firebase falla)
const PRODUCTOS_RESPALDO = [
  {
    id: '1',
    codigo: 'PROD001',
    nombre: 'Producto General',
    descripcion: 'Producto de ejemplo',
    precio_costo: 10.00,
    precio_venta: 15.00,
    stock_actual: 0,
    stock_minimo: 5,
    categoria_id: '1',
    proveedor_id: '1',
    activo: true,
    fechaCreacion: new Date().toISOString()
  }
];

/**
 * Servicio para gestión de productos con Firebase
 * ✅ VERSIÓN CORREGIDA - Incluye métodos faltantes para stock por sucursal
 * Mantiene EXACTAMENTE la misma interfaz que el servicio original
 */
class ProductosService extends FirebaseService {
  constructor() {
    super('/productos'); // Módulo en Firebase Functions
  }

  /**
   * Obtiene todos los productos
   * @returns {Promise<Array>} Lista de productos
   */
  async obtenerTodos() {
    try {
      console.log('🔄 Obteniendo todos los productos...');
      const productos = await this.get('');
      
      // Asegurar que siempre sea un array
      const productosArray = this.ensureArray(productos);
      
      if (productosArray.length === 0) {
        console.log('⚠️ No hay productos, usando datos de respaldo');
        return PRODUCTOS_RESPALDO;
      }
      
      console.log(`✅ Productos cargados: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      console.log('🔄 Usando datos de respaldo');
      return PRODUCTOS_RESPALDO;
    }
  }

  /**
   * Alias para compatibilidad con código existente
   */
  async obtenerTodas() {
    return this.obtenerTodos();
  }

  /**
   * Obtiene productos activos
   * @returns {Promise<Array>} Lista de productos activos
   */
  async obtenerActivos() {
    try {
      console.log('🔄 Obteniendo productos activos...');
      const productos = await this.get('/activos');
      
      const productosArray = this.ensureArray(productos);
      
      if (productosArray.length === 0) {
        // Filtrar los activos de los datos de respaldo
        const activos = PRODUCTOS_RESPALDO.filter(p => p.activo);
        console.log('⚠️ Usando productos activos de respaldo');
        return activos;
      }
      
      console.log(`✅ Productos activos: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al obtener productos activos:', error);
      return PRODUCTOS_RESPALDO.filter(p => p.activo);
    }
  }

  /**
   * Obtiene un producto por su ID
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Datos del producto
   */
  async obtenerPorId(id) {
    try {
      console.log(`🔄 Obteniendo producto ID: ${id}`);
      const producto = await this.get(`/${id}`);
      
      const productoObj = this.ensureObject(producto);
      
      if (!productoObj || Object.keys(productoObj).length === 0) {
        // Buscar en datos de respaldo
        const productoRespaldo = PRODUCTOS_RESPALDO.find(p => p.id === id);
        if (productoRespaldo) {
          console.log('⚠️ Usando producto de respaldo');
          return productoRespaldo;
        }
        throw new Error(`Producto ${id} no encontrado`);
      }
      
      console.log(`✅ Producto obtenido:`, productoObj);
      return productoObj;
      
    } catch (error) {
      console.error(`❌ Error al obtener producto ${id}:`, error);
      
      // Buscar en datos de respaldo antes de lanzar error
      const productoRespaldo = PRODUCTOS_RESPALDO.find(p => p.id === id);
      if (productoRespaldo) {
        console.log('⚠️ Usando producto de respaldo');
        return productoRespaldo;
      }
      
      throw error;
    }
  }

  /**
   * ✅ MÉTODO FALTANTE AGREGADO: Buscar productos con stock por sucursal
   * @param {string} termino - Término de búsqueda
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Productos con stock por sucursal
   */
  async buscarConStockPorSucursal(termino, sucursalId) {
    try {
      console.log(`🔍 [PRODUCTOS SERVICE] Buscando productos en sucursal ${sucursalId} con término: "${termino}"`);
      
      if (!sucursalId) {
        throw new Error('ID de sucursal es requerido');
      }
      
      // Construir URL con o sin término de búsqueda
      let url = `/buscar-con-stock/${sucursalId}`;
      if (termino && termino.trim()) {
        url += `?termino=${encodeURIComponent(termino.trim())}`;
      }
      
      const response = await this.get(url);
      
      // DEBUG: Ver qué exactamente devuelve el servicio
      console.log('📥 [PRODUCTOS SERVICE] Response recibido:', response);
      console.log('📥 [PRODUCTOS SERVICE] Tipo de response:', typeof response);
      console.log('📥 [PRODUCTOS SERVICE] Es array?:', Array.isArray(response));
      
      // El handleFirebaseResponse ya procesó la respuesta y devolvió el array
      const productos = Array.isArray(response) ? response : [];
      
      console.log(`✅ [PRODUCTOS SERVICE] ${productos.length} productos encontrados con stock por sucursal`);
      
      return productos;
      
    } catch (error) {
      console.error('❌ [PRODUCTOS SERVICE] Error al buscar productos con stock por sucursal:', error);
      
      // FALLBACK: Si el endpoint no existe, usar búsqueda normal + consulta de stock
      console.log('🔄 [PRODUCTOS SERVICE] Fallback: usando búsqueda normal + consulta stock');
      return await this.buscarConStockFallback(termino, sucursalId);
    }
  }

  /**
   * ✅ MÉTODO FALLBACK: Buscar productos y consultar stock por separado
   * @param {string} termino - Término de búsqueda
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Productos con stock por sucursal
   */
  async buscarConStockFallback(termino, sucursalId) {
    try {
      console.log(`🔄 [PRODUCTOS SERVICE] Fallback: buscando productos y consultando stock por separado`);
      
      // 1. Buscar productos normalmente
      const productos = await this.buscar(termino);
      
      if (productos.length === 0) {
        return [];
      }
      
      // 2. Para cada producto, consultar su stock en la sucursal específica
      const productosConStock = await Promise.all(
        productos.map(async (producto) => {
          try {
            // Intentar obtener stock de la sucursal usando stock-sucursal service
            const stockSucursal = await this.consultarStockEnSucursal(producto.id, sucursalId);
            
            return {
              ...producto,
              stock_actual: stockSucursal.cantidad || 0, // Stock específico de la sucursal
              stock_sucursal: stockSucursal.cantidad || 0,
              stock_minimo: stockSucursal.stock_minimo || producto.stock_minimo || 5,
              sucursal_id: sucursalId
            };
          } catch (error) {
            console.warn(`⚠️ [PRODUCTOS SERVICE] No se pudo obtener stock de sucursal para producto ${producto.id}:`, error.message);
            
            // Si no se puede obtener stock de sucursal, usar stock global como fallback
            return {
              ...producto,
              stock_actual: parseInt(producto.stock_actual || 0),
              stock_sucursal: parseInt(producto.stock_actual || 0),
              sucursal_id: sucursalId
            };
          }
        })
      );
      
      console.log(`✅ [PRODUCTOS SERVICE] Fallback completado: ${productosConStock.length} productos con stock`);
      return productosConStock;
      
    } catch (error) {
      console.error('❌ [PRODUCTOS SERVICE] Error en fallback:', error);
      return [];
    }
  }

  /**
   * ✅ MÉTODO AUXILIAR: Consultar stock en sucursal específica
   * @param {string} productoId - ID del producto
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Object>} Datos de stock en sucursal
   */
  async consultarStockEnSucursal(productoId, sucursalId) {
    try {
      console.log(`🔍 [STOCK SERVICE] Consultando stock para producto ${productoId} en sucursal ${sucursalId}`);
      
      // Intentar usar el servicio de stock-sucursal
      const stockService = new FirebaseService('/stock-sucursal');
      const stock = await stockService.get(`/producto/${productoId}/sucursal/${sucursalId}`);
      
      const stockData = this.ensureObject(stock);
      console.log(`📦 [STOCK SERVICE] Stock obtenido:`, stockData);
      
      // Asegurar que devuelva tanto stock como cantidad para compatibilidad
      return {
        stock: stockData.cantidad || stockData.stock || 0,
        cantidad: stockData.cantidad || stockData.stock || 0,
        stock_minimo: stockData.stock_minimo || 5
      };
    } catch (error) {
      console.error(`❌ [STOCK SERVICE] Error al consultar stock:`, error);
      // Si falla, devolver stock vacío
      return {
        stock: 0,
        cantidad: 0,
        stock_minimo: 5
      };
    }
  }

  /**
   * ✅ MÉTODO ORIGINAL RESTAURADO: Obtener producto por código con stock por sucursal
   * @param {string} codigo - Código del producto
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Object|null>} Producto con stock por sucursal
   */
  async obtenerPorCodigoConStock(codigo, sucursalId) {
    try {
      console.log(`🔍 [PRODUCTOS SERVICE] Buscando producto código "${codigo}" en sucursal ${sucursalId}`);
      
      if (!codigo || !sucursalId) {
        throw new Error('Código de producto y ID de sucursal son requeridos');
      }
      
      // Intentar usar el endpoint específico primero
      try {
        const url = `/codigo/${encodeURIComponent(codigo)}/sucursal/${sucursalId}`;
        const response = await this.get(url);
        
        console.log(`✅ [PRODUCTOS SERVICE] Producto encontrado por endpoint específico:`, response.data?.nombre || 'Sin nombre');
        return response.data || response;
      } catch (endpointError) {
        console.log(`ℹ️ [PRODUCTOS SERVICE] Endpoint específico no disponible, usando fallback`);
        
        // Fallback: buscar por código normal y luego consultar stock
        const producto = await this.obtenerPorCodigo(codigo);
        
        if (!producto) {
          return null;
        }
        
        // Consultar stock en sucursal específica
        const stockSucursal = await this.consultarStockEnSucursal(producto.id, sucursalId);
        
        return {
          ...producto,
          stock_actual: stockSucursal.cantidad || 0,
          stock_sucursal: stockSucursal.cantidad || 0,
          stock_minimo: stockSucursal.stock_minimo || producto.stock_minimo || 5,
          sucursal_id: sucursalId
        };
      }
      
    } catch (error) {
      console.error('❌ [PRODUCTOS SERVICE] Error al buscar producto por código con stock:', error);
      return null;
    }
  }

  /**
   * Busca productos por término
   * @param {string} termino - Término de búsqueda
   * @param {string} sucursalId - ID de la sucursal (opcional)
   * @returns {Promise<Array>} Lista de productos
   */
  async buscar(termino, sucursalId = null) {
    try {
      console.log(`🔍 Buscando productos: "${termino}"${sucursalId ? ` en sucursal ${sucursalId}` : ''}`);
      
      const params = { 
        search: termino,
        limit: 20
      };
      
      if (sucursalId) {
        params.sucursal_id = sucursalId;
      }
      
      const productos = await this.get('', params);
      const productosArray = this.ensureArray(productos);
      
      console.log(`✅ Productos encontrados: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al buscar productos:', error);
      return [];
    }
  }

  /**
   * Busca un producto por código exacto (CRÍTICO para PuntoVenta con código de barras)
   * @param {string} codigo - Código del producto
   * @returns {Promise<Object|null>} Producto encontrado
   */
  async obtenerPorCodigo(codigo) {
    try {
      console.log('🔍 Buscando producto por código exacto:', codigo);
      
      // Intentar buscar por código exacto primero
      const productos = await this.buscar(codigo);
      
      if (productos && productos.length > 0) {
        // Buscar coincidencia exacta del código
        const productoExacto = productos.find(p => 
          p.codigo === codigo || 
          p.codigo_barras === codigo ||
          p.codigo?.toString() === codigo?.toString()
        );
        
        if (productoExacto) {
          console.log(`✅ Producto encontrado por código exacto:`, productoExacto);
          return productoExacto;
        }
        
        // Si no hay coincidencia exacta pero hay resultados, devolver el primero
        console.log(`⚠️ Coincidencia parcial, devolviendo primer resultado:`, productos[0]);
        return productos[0];
      }
      
      console.log(`❌ No se encontró producto con código: ${codigo}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error al buscar por código ${codigo}:`, error);
      return null;
    }
  }

  /**
   * Busca un producto por código de barras (alias para compatibilidad)
   * @param {string} codigo - Código del producto
   * @returns {Promise<Object|null>} Producto encontrado
   */
  async buscarPorCodigo(codigo) {
    return this.obtenerPorCodigo(codigo);
  }

  /**
   * Crea un nuevo producto
   * @param {Object} producto - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  async crear(producto) {
    try {
      console.log('🆕 Creando producto:', producto);
      
      // Formatear datos del producto
      const productoFormateado = {
        ...producto,
        codigo: producto.codigo?.trim() || '',
        nombre: producto.nombre?.trim() || '',
        descripcion: producto.descripcion?.trim() || '',
        precio_costo: parseFloat(producto.precio_costo || 0),
        precio_venta: parseFloat(producto.precio_venta || 0),
        stock_actual: parseInt(producto.stock_actual || producto.stock_inicial || 0),
        stock_minimo: parseInt(producto.stock_minimo || 5),
        categoria_id: producto.categoria_id || '',
        proveedor_id: producto.proveedor_id || '',
        activo: producto.activo !== false // Por defecto true
      };
      
      // Validación básica
      if (!productoFormateado.codigo && !productoFormateado.nombre) {
        throw new Error('El código o nombre del producto es requerido');
      }
      
      const resultado = await this.post('', productoFormateado);
      console.log('✅ Producto creado:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   * @param {string} id - ID del producto
   * @param {Object} producto - Nuevos datos del producto
   * @returns {Promise<Object>} Respuesta de la actualización
   */
  async actualizar(id, producto) {
    try {
      console.log(`🔄 Actualizando producto ${id}:`, producto);
      
      // Formatear datos del producto
      const productoFormateado = {
        ...producto,
        codigo: producto.codigo?.trim(),
        nombre: producto.nombre?.trim(),
        descripcion: producto.descripcion?.trim()
      };
      
      // Formatear campos numéricos solo si están presentes
      if (producto.precio_costo !== undefined) {
        productoFormateado.precio_costo = parseFloat(producto.precio_costo || 0);
      }
      if (producto.precio_venta !== undefined) {
        productoFormateado.precio_venta = parseFloat(producto.precio_venta || 0);
      }
      if (producto.stock_actual !== undefined) {
        productoFormateado.stock_actual = parseInt(producto.stock_actual || 0);
      }
      if (producto.stock_minimo !== undefined) {
        productoFormateado.stock_minimo = parseInt(producto.stock_minimo || 5);
      }
      
      const resultado = await this.put(`/${id}`, productoFormateado);
      console.log('✅ Producto actualizado:', resultado);
      
      return resultado;
    } catch (error) {
      console.error(`❌ Error al actualizar producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un producto
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Respuesta de la eliminación
   */
  async eliminar(id) {
    try {
      console.log(`🗑️ Eliminando producto ${id}`);
      const resultado = await this.delete(`/${id}`);
      console.log('✅ Producto eliminado:', resultado);
      
      return resultado;
    } catch (error) {
      console.error(`❌ Error al eliminar producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene productos con stock bajo
   * @returns {Promise<Array>} Productos con stock bajo
   */
  async obtenerStockBajo() {
    try {
      console.log('🔄 Obteniendo productos con stock bajo...');
      const productos = await this.get('/stock-bajo');
      
      const productosArray = this.ensureArray(productos);
      
      if (productosArray.length === 0) {
        // Filtrar productos con stock bajo de los datos de respaldo
        const stockBajo = PRODUCTOS_RESPALDO.filter(p => 
          p.stock_actual <= (p.stock_minimo || 5)
        );
        console.log('⚠️ Usando productos con stock bajo de respaldo');
        return stockBajo;
      }
      
      console.log(`⚠️ Productos con stock bajo: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al obtener stock bajo:', error);
      return PRODUCTOS_RESPALDO.filter(p => p.stock_actual <= (p.stock_minimo || 5));
    }
  }

  /**
   * Obtiene productos por categoría
   * @param {string} categoriaId - ID de la categoría
   * @returns {Promise<Array>} Productos de la categoría
   */
  async obtenerPorCategoria(categoriaId) {
    try {
      console.log(`🔄 Obteniendo productos de categoría: ${categoriaId}`);
      const productos = await this.get('/categoria', { categoriaId });
      
      const productosArray = this.ensureArray(productos);
      
      if (productosArray.length === 0) {
        // Filtrar por categoría en datos de respaldo
        const productosPorCategoria = PRODUCTOS_RESPALDO.filter(p => 
          p.categoria_id === categoriaId
        );
        console.log('⚠️ Usando productos por categoría de respaldo');
        return productosPorCategoria;
      }
      
      console.log(`✅ Productos de categoría: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error(`❌ Error al obtener productos de categoría ${categoriaId}:`, error);
      return PRODUCTOS_RESPALDO.filter(p => p.categoria_id === categoriaId);
    }
  }

  /**
   * Ajusta el stock de un producto
   * @param {string} id - ID del producto
   * @param {number} cantidad - Nueva cantidad
   * @param {string} motivo - Motivo del ajuste
   * @returns {Promise<Object>} Respuesta del ajuste
   */
  async ajustarStock(id, cantidad, motivo = 'Ajuste manual') {
    try {
      console.log(`🔄 Ajustando stock del producto ${id}: ${cantidad}`);
      
      const ajuste = {
        cantidad: parseInt(cantidad),
        motivo: motivo.trim()
      };
      
      const resultado = await this.put(`/${id}/stock`, ajuste);
      console.log('✅ Stock ajustado:', resultado);
      
      return resultado;
    } catch (error) {
      console.error(`❌ Error al ajustar stock del producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de movimientos de un producto
   * @param {string} id - ID del producto
   * @returns {Promise<Array>} Historial de movimientos
   */
  async obtenerHistorialMovimientos(id) {
    try {
      console.log(`🔄 Obteniendo historial de movimientos del producto ${id}`);
      const movimientos = await this.get(`/${id}/movimientos`);
      
      const movimientosArray = this.ensureArray(movimientos);
      console.log(`📊 Movimientos obtenidos: ${movimientosArray.length}`);
      
      return movimientosArray;
    } catch (error) {
      console.error(`❌ Error al obtener historial del producto ${id}:`, error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de productos
   * @returns {Promise<Object>} Estadísticas de productos
   */
  async obtenerEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de productos...');
      const estadisticas = await this.get('/estadisticas');
      
      const statsObj = this.ensureObject(estadisticas);
      
      if (!statsObj || Object.keys(statsObj).length === 0) {
        // Estadísticas de respaldo
        const estadisticasRespaldo = {
          total: PRODUCTOS_RESPALDO.length,
          activos: PRODUCTOS_RESPALDO.filter(p => p.activo).length,
          stockBajo: PRODUCTOS_RESPALDO.filter(p => p.stock_actual <= (p.stock_minimo || 5)).length,
          sinStock: PRODUCTOS_RESPALDO.filter(p => p.stock_actual === 0).length
        };
        
        console.log('⚠️ Usando estadísticas de respaldo');
        return estadisticasRespaldo;
      }
      
      console.log('✅ Estadísticas obtenidas:', statsObj);
      return statsObj;
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return {
        total: 0,
        activos: 0,
        stockBajo: 0,
        sinStock: 0
      };
    }
  }

  /**
   * Busca productos con filtros avanzados
   * @param {Object} filtros - Filtros de búsqueda
   * @returns {Promise<Array>} Productos filtrados
   */
  async buscarConFiltros(filtros = {}) {
    try {
      console.log('🔍 Búsqueda con filtros:', filtros);
      
      const productos = await this.get('/filtros', filtros);
      const productosArray = this.ensureArray(productos);
      
      console.log(`✅ Productos filtrados: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error en búsqueda con filtros:', error);
      
      // Aplicar filtros básicos en datos de respaldo
      let resultado = [...PRODUCTOS_RESPALDO];
      
      if (filtros.categoria) {
        resultado = resultado.filter(p => p.categoria_id === filtros.categoria);
      }
      if (filtros.proveedor) {
        resultado = resultado.filter(p => p.proveedor_id === filtros.proveedor);
      }
      if (filtros.activo !== undefined) {
        resultado = resultado.filter(p => p.activo === filtros.activo);
      }
      
      console.log(`⚠️ Filtros aplicados en respaldo: ${resultado.length} resultados`);
      return resultado;
    }
  }

  /**
   * Verifica disponibilidad de stock
   * @param {string} id - ID del producto
   * @param {number} cantidad - Cantidad requerida
   * @returns {Promise<Object>} Información de disponibilidad
   */
  async verificarDisponibilidad(id, cantidad) {
    try {
      console.log(`🔄 Verificando disponibilidad del producto ${id}: ${cantidad} unidades`);
      
      const producto = await this.obtenerPorId(id);
      
      if (!producto) {
        return {
          disponible: false,
          mensaje: 'Producto no encontrado',
          stockActual: 0
        };
      }
      
      const stockActual = parseInt(producto.stock_actual || 0);
      const disponible = stockActual >= cantidad;
      
      const resultado = {
        disponible,
        stockActual,
        cantidadSolicitada: cantidad,
        mensaje: disponible 
          ? 'Stock disponible' 
          : `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidad}`
      };
      
      console.log('✅ Verificación de disponibilidad:', resultado);
      return resultado;
      
    } catch (error) {
      console.error(`❌ Error al verificar disponibilidad del producto ${id}:`, error);
      return {
        disponible: false,
        mensaje: 'Error al verificar disponibilidad',
        stockActual: 0
      };
    }
  }

  /**
   * ✅ NUEVO MÉTODO: Importa productos masivamente
   * @param {Array} productos - Array de productos a importar
   * @param {string} sucursalId - ID de la sucursal donde importar
   * @param {Object} opciones - Opciones de importación
   * @returns {Promise<Object>} Resultado detallado de la importación
   */
  async importarMasivo(productos, sucursalId, opciones = {}) {
    try {
      console.log(`🔄 [PRODUCTOS SERVICE] Importando productos masivamente:`, {
        cantidad: productos.length,
        sucursal: sucursalId,
        categoria: opciones.categoria_default
      });
      
      // Validaciones básicas
      if (!Array.isArray(productos) || productos.length === 0) {
        throw new Error('Array de productos es requerido y no puede estar vacío');
      }
      
      if (!sucursalId) {
        throw new Error('ID de sucursal es requerido');
      }
      
      // Preparar datos para enviar al backend
      const datosEnvio = {
        productos: productos.map(producto => ({
          codigo: producto.codigo?.toString().trim() || '',
          nombre: producto.nombre?.toString().trim() || '',
          descripcion: producto.descripcion?.toString().trim() || '',
          precio_costo: parseFloat(producto.precio_costo || 0),
          precio_venta: parseFloat(producto.precio_venta || 0),
          stock_inicial: parseInt(producto.stock_actual || producto.stock_inicial || 0),
          stock_minimo: parseInt(producto.stock_minimo || 5),
          categoria_id: producto.categoria_id || opciones.categoria_default || '',
          unidad_medida: producto.unidad_medida || 'unidad',
          activo: producto.activo !== false
        })),
        sucursal_id: sucursalId,
        opciones: {
          categoria_default: opciones.categoria_default || '',
          evitar_duplicados: opciones.evitar_duplicados || false,
          actualizar_existentes: opciones.actualizar_existentes || true
        }
      };
      
      console.log(`📤 [PRODUCTOS SERVICE] Enviando datos formateados:`, {
        productosCount: datosEnvio.productos.length,
        opciones: datosEnvio.opciones
      });
      
      // Realizar importación
      const resultado = await this.post('/importar-masivo', datosEnvio);
      
      console.log(`✅ [PRODUCTOS SERVICE] Importación completada:`, resultado);
      
      // Validar que la respuesta tenga el formato esperado
      if (!resultado.data || typeof resultado.data !== 'object') {
        // Si la respuesta no tiene el formato esperado, extraer info básica
        const mensaje = resultado.message || 'Importación procesada';
        
        if (mensaje.includes('funcionando correctamente')) {
          // Detectar respuesta genérica incorrecta
          throw new Error('El servidor devolvió una respuesta genérica. La importación puede no haberse procesado correctamente. Verifica el backend.');
        }
        
        // Crear estructura de respuesta básica
        return {
          success: true,
          message: mensaje,
          data: {
            importados: 0,
            actualizados: 0,
            duplicados: 0,
            errores: [],
            total_enviados: productos.length,
            procesamiento_completo: false
          }
        };
      }
      
      // Respuesta con formato correcto
      return {
        success: true,
        message: resultado.message || 'Importación completada',
        data: {
          importados: resultado.data.importados || 0,
          actualizados: resultado.data.actualizados || 0,
          duplicados: resultado.data.duplicados || 0,
          errores: resultado.data.errores || [],
          total_enviados: resultado.data.total_enviados || productos.length,
          procesamiento_completo: true
        }
      };
      
    } catch (error) {
      console.error('❌ [PRODUCTOS SERVICE] Error en importación masiva:', error);
      
      // Mejorar mensaje de error según el tipo
      let mensajeError = 'Error durante la importación masiva';
      
      if (error.message.includes('respuesta genérica')) {
        mensajeError = 'Error del servidor: El endpoint de importación no está funcionando correctamente';
      } else if (error.message.includes('HTTP 500')) {
        mensajeError = 'Error interno del servidor durante la importación';
      } else if (error.message.includes('HTTP 400')) {
        mensajeError = 'Datos de importación inválidos';
      } else if (error.message.includes('conexión')) {
        mensajeError = 'Error de conexión con el servidor';
      }
      
      throw new Error(mensajeError + ': ' + error.message);
    }
  }

  /**
   * Obtiene productos más vendidos
   * @param {number} limite - Número de productos a obtener
   * @returns {Promise<Array>} Productos más vendidos
   */
  async obtenerMasVendidos(limite = 10) {
    try {
      console.log(`📊 Obteniendo productos más vendidos (límite: ${limite})`);
      
      const productos = await this.get('/mas-vendidos', { limite });
      const productosArray = this.ensureArray(productos);
      
      console.log(`✅ Productos más vendidos: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al obtener productos más vendidos:', error);
      return [];
    }
  }

  /**
   * Obtiene un producto por ID
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Producto
   */
  async obtenerPorId(id) {
    try {
      console.log(`🔄 Obteniendo producto ID: ${id}`);
      const producto = await this.get(`/${id}`);
      
      const productoObj = this.ensureObject(producto);
      
      if (!productoObj || Object.keys(productoObj).length === 0) {
        throw new Error(`Producto ${id} no encontrado`);
      }
      
      console.log(`✅ Producto obtenido:`, productoObj);
      return productoObj;
      
    } catch (error) {
      console.error(`❌ Error al obtener producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene productos con stock disponible
   * @param {string} sucursalId - ID de la sucursal (opcional)
   * @returns {Promise<Array>} Lista de productos con stock
   */
  async obtenerConStock(sucursalId = null) {
    try {
      console.log(`📦 Obteniendo productos con stock${sucursalId ? ` en sucursal ${sucursalId}` : ''}`);
      
      const params = { 
        con_stock: true,
        limit: 50
      };
      
      if (sucursalId) {
        params.sucursal_id = sucursalId;
      }
      
      const productos = await this.get('', params);
      const productosArray = this.ensureArray(productos);
      
      console.log(`✅ Productos con stock encontrados: ${productosArray.length}`);
      return productosArray;
      
    } catch (error) {
      console.error('❌ Error al obtener productos con stock:', error);
      return [];
    }
  }
}

export default new ProductosService();

/**
 * Obtiene un producto para venta, manejando códigos con espacios o caracteres especiales
 * @param {string} codigo - Código del producto
 * @param {string} sucursalId - ID de la sucursal
 * @returns {Promise<Object|null>} Producto encontrado
 */
export async function obtenerProductoParaVenta(codigo, sucursalId) {
  // Si el código tiene espacios o caracteres especiales, usa búsqueda general
  if (/\s|\./.test(codigo)) {
    const productosService = new ProductosService(); // Re-instantiate to get the latest instance
    const productos = await productosService.buscar(codigo, sucursalId);
    // Busca coincidencia exacta
    return productos.find(p => p.codigo === codigo) || productos[0] || null;
  } else {
    const productosService = new ProductosService(); // Re-instantiate to get the latest instance
    return await productosService.obtenerPorCodigoConStock(codigo, sucursalId);
  }
}