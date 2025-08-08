// functions/index.js - VERSIÓN MODIFICADA PARA MIGRACIÓN + CONFIGURACIÓN
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// ==================== INICIALIZAR FIREBASE PRIMERO ====================
admin.initializeApp();

// Obtener referencia a Firestore
const db = admin.firestore();

// ==================== IMPORTAR MIGRACIÓN ====================
const { 
  ejecutarMigracionCompleta, 
  verificarEstadoMigracion,
  obtenerMateriasPrimasCompatibilidad,
  procesarProduccionUnificada
} = require('./migration_complete');

// ==================== IMPORTAR TODOS LOS MÓDULOS ====================
const listasPreciosRoutes = require('./routes/listas-precios.routes');
const productosRoutes = require('./routes/productos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const clientesRoutes = require('./routes/clientes.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const sucursalesRoutes = require('./routes/sucursales.routes');
const stockSucursalRoutes = require('./routes/stock-sucursal.routes');
const comprasRoutes = require('./routes/compras.routes');
const ventasRoutes = require('./routes/ventas.routes');
const transferenciasRoutes = require('./routes/transferencias.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const busquedaRoutes = require('./routes/busqueda.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const reportesRoutes = require('./routes/reportes.routes');
// ELIMINADO: const materiasPrimasRoutes = require('./routes/materiasPrimas.routes');
const recetasRoutes = require('./routes/recetas.routes');
const produccionRoutes = require('./routes/produccion.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const promocionesRoutes = require('./routes/promociones.routes');
// ✅ NUEVO: Configuración empresarial
const configuracionRoutes = require('./routes/configuracion.routes');
// En functions/index.js, agregar después de las otras importaciones:
const vehiculosRoutes = require('./routes/vehiculos.routes');
const combustibleRoutes = require('./routes/combustible.routes');
const serviciosVehiculosRoutes = require('./routes/servicios.vehiculos.routes');
// ✅ NUEVO: Rutas de Caja
const cajaRoutes = require('./routes/caja.routes');

const { configurarCORS, manejarPreflight } = require('./utils/cors');
const { authenticateUser } = require('./utils/auth');

// ==================== FUNCIONES AUXILIARES COMPARTIDAS ====================

/**
 * Función auxiliar para enriquecer ventas con información de clientes
 */
async function enriquecerVentasConClientes(ventas) {
  if (!ventas || !Array.isArray(ventas) || ventas.length === 0) {
    return ventas;
  }

  try {
    const clientesIds = [...new Set(
      ventas
        .map(venta => venta.cliente_id)
        .filter(id => id)
    )];

    console.log(`🔄 Cargando datos de ${clientesIds.length} clientes para enriquecer ventas...`);

    const clientesData = {};
    
    await Promise.all(clientesIds.map(async (clienteId) => {
      try {
        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        if (clienteDoc.exists) {
          clientesData[clienteId] = {
            id: clienteId,
            ...clienteDoc.data()
          };
        }
      } catch (error) {
        console.warn(`⚠️ No se pudo cargar cliente ${clienteId}:`, error.message);
      }
    }));

    return ventas.map(venta => {
      const cliente = venta.cliente_id ? clientesData[venta.cliente_id] : null;
      
      return {
        ...venta,
        cliente_info: cliente ? {
          id: cliente.id,
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          nombre_completo: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Cliente sin nombre',
          telefono: cliente.telefono || '',
          email: cliente.email || ''
        } : venta.cliente_info || {
          id: null,
          nombre: '',
          apellido: '',
          nombre_completo: 'Cliente sin registrar',
          telefono: '',
          email: ''
        }
      };
    });

  } catch (error) {
    console.error('❌ Error al enriquecer ventas con clientes:', error);
    return ventas;
  }
}

// ==================== API PRINCIPAL (CONSOLIDADA Y CORREGIDA) ====================

exports.api = functions.https.onRequest(async (req, res) => {
  try {
    // Configurar CORS una sola vez
    configurarCORS(res);
    
    // Manejar preflight OPTIONS
    if (manejarPreflight(req, res)) {
      return;
    }

    // Obtener la ruta
    const path = req.path.replace('/api', '') || '/';
    
    // Autenticar usuario (solo para rutas que lo requieren, excluyendo rutas específicas)
    if ((path.startsWith('/ventas') && path !== '/ventas/eliminadas') || 
        path.startsWith('/usuarios') || 
        path.startsWith('/productos')) {
      await authenticateUser(req, res, () => {});
    }
    console.log(`🔥 Firebase Function Request: ${req.method} ${path}`);
    
    // Variable para controlar si ya se envió respuesta
    let responseEnviada = false;
    
    
    // ==================== ENDPOINTS DE MIGRACIÓN EXISTENTES ====================
    
    // 🚀 MIGRACIÓN COMPLETA (usar solo una vez)
    if (!responseEnviada && path === '/migrar-sistema' && req.method === 'POST') {
      try {
        console.log('🚀 [MIGRACIÓN] Iniciando migración completa del sistema...');
        
        const resultado = await ejecutarMigracionCompleta();
        
        console.log('✅ [MIGRACIÓN] Migración completada exitosamente');
        res.json({
          success: true,
          ...resultado,
          message: 'Sistema migrado exitosamente a modo unificado',
          timestamp: new Date().toISOString()
        });
        responseEnviada = true;
        return;
        
      } catch (error) {
        console.error('❌ [MIGRACIÓN] Error en migración:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Error al migrar sistema',
          timestamp: new Date().toISOString()
        });
        responseEnviada = true;
        return;
      }
    }
    
    // 📊 VERIFICAR ESTADO DE MIGRACIÓN
    if (!responseEnviada && path === '/verificar-migracion' && req.method === 'GET') {
      try {
        console.log('🔍 [MIGRACIÓN] Verificando estado de migración...');
        
        const estado = await verificarEstadoMigracion();
        
        res.json({
          success: true,
          data: estado,
          message: 'Estado de migración obtenido correctamente',
          timestamp: new Date().toISOString()
        });
        responseEnviada = true;
        return;
        
      } catch (error) {
        console.error('❌ [MIGRACIÓN] Error al verificar migración:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Error al verificar estado de migración',
          timestamp: new Date().toISOString()
        });
        responseEnviada = true;
        return;
      }
    }
    
    // 🧪 PRUEBA DE MIGRACIÓN (sin ejecutar)
    if (!responseEnviada && path === '/test-migracion' && req.method === 'GET') {
      try {
        // Contar elementos a migrar
        const materiasPrimasSnapshot = await db.collection('materias_primas').get();
        const stockMateriasPrimasSnapshot = await db.collection('stock_materias_primas').get();
        const recetasDetallesSnapshot = await db.collection('recetas_detalles').get();
        
        const preview = {
          materias_primas_a_migrar: materiasPrimasSnapshot.size,
          registros_stock_a_migrar: stockMateriasPrimasSnapshot.size,
          recetas_detalles_a_actualizar: recetasDetallesSnapshot.size,
          estimacion_tiempo: '2-5 minutos',
          acciones: [
            'Crear productos tipo="materia_prima"',
            'Migrar stock a stock_sucursal',
            'Actualizar recetas_detalles',
            'Mantener datos originales como backup'
          ]
        };
        
        res.json({
          success: true,
          data: preview,
          message: 'Vista previa de migración - no se ejecutaron cambios'
        });
        responseEnviada = true;
        return;
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
        responseEnviada = true;
        return;
      }
    }
    
    // 🧪 MATERIAS PRIMAS UNIFICADAS
    if (!responseEnviada && path === '/materias-primas-unificadas' && req.method === 'GET') {
      try {
        console.log('🧪 [UNIFICADO] Obteniendo materias primas del sistema unificado...');
        
        const materiasPrimas = await obtenerMateriasPrimasCompatibilidad();
        
        res.json({
          success: true,
          data: materiasPrimas,
          total: materiasPrimas.length,
          message: 'Materias primas unificadas obtenidas correctamente',
          sistema: 'unificado'
        });
        responseEnviada = true;
        return;
        
      } catch (error) {
        console.error('❌ [UNIFICADO] Error al obtener materias primas:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Error al obtener materias primas unificadas'
        });
        responseEnviada = true;
        return;
      }
    }
    
    // 🏭 PRODUCCIÓN UNIFICADA
    if (!responseEnviada && path === '/produccion-unificada' && req.method === 'POST') {
      try {
        const { receta_id, cantidad, sucursal_id, usuario_id } = req.body;
        
        console.log(`🏭 [PRODUCCIÓN UNIFICADA] Procesando: Receta ${receta_id}, Cantidad: ${cantidad}`);
        
        if (!receta_id || !cantidad || !sucursal_id) {
          res.status(400).json({
            success: false,
            message: 'Faltan datos: receta_id, cantidad y sucursal_id son obligatorios'
          });
          responseEnviada = true;
          return;
        }
        
        const resultado = await procesarProduccionUnificada(
          receta_id, 
          parseInt(cantidad), 
          sucursal_id, 
          usuario_id || 'sistema'
        );
        
        res.json({
          success: true,
          ...resultado,
          message: 'Producción completada con descuento automático de materias primas'
        });
        responseEnviada = true;
        return;
        
      } catch (error) {
        console.error('❌ [PRODUCCIÓN UNIFICADA] Error en producción:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Error en producción unificada'
        });
        responseEnviada = true;
        return;
      }
    }
    
    // ==================== ENRUTAR A MÓDULOS CON CONTROL DE RESPUESTA ====================
    
    try {
      // ✅ NUEVO: CONFIGURACIÓN EMPRESARIAL (AGREGAR PRIMERO)
      if (!responseEnviada && path.startsWith('/configuracion')) {
        console.log('🏢 [CONFIGURACION] Enrutando a configuración empresarial:', path);
        const configuracionHandled = await configuracionRoutes(req, res, path);
        console.log('🏢 [CONFIGURACION] Handled:', configuracionHandled);
        
        if (configuracionHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // **USUARIOS**
      if (!responseEnviada && path.startsWith('/usuarios')) {
        console.log('🔍 DEBUGGING PATH:', {
          originalPath: req.path,
          cleanPath: path,
          method: req.method,
          startsWithUsuarios: path.startsWith('/usuarios')
        });
        
        console.log('✅ ENRUTANDO A USUARIOS');
        const usuariosHandled = await usuariosRoutes(req, res, path);
        console.log('📋 USUARIOS HANDLED:', usuariosHandled);
        
        if (usuariosHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // ELIMINADO: Materias Primas
      // Ya no se enruta a materiasPrimasRoutes
      
      // Notificaciones
      if (!responseEnviada && (path.startsWith('/notificaciones') || path.startsWith('/api/notificaciones'))) {
        const notificacionesHandled = await notificacionesRoutes(req, res, path);
        if (notificacionesHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Recetas
      if (!responseEnviada && path.startsWith('/recetas')) {
        console.log('📋 [RECETAS] Enrutando a recetas:', path);
        const recetasHandled = await recetasRoutes(req, res, path);
        console.log('📋 [RECETAS] Handled:', recetasHandled);
        
        if (recetasHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Producción
      if (!responseEnviada && path.startsWith('/produccion')) {
        console.log('🏭 [PRODUCCIÓN] Enrutando a producción:', path);
        const produccionHandled = await produccionRoutes(req, res, path);
        console.log('🏭 [PRODUCCIÓN] Handled:', produccionHandled);
        
        if (produccionHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Productos
      if (!responseEnviada && path.startsWith('/productos')) {
        const productosHandled = await productosRoutes(req, res, path);
        if (productosHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Categorías
      if (!responseEnviada && path.startsWith('/categorias')) {
        const categoriasHandled = await categoriasRoutes(req, res, path);
        if (categoriasHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Clientes
      if (!responseEnviada && path.startsWith('/clientes')) {
        const clientesHandled = await clientesRoutes(req, res, path);
        if (clientesHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Proveedores
      if (!responseEnviada && path.startsWith('/proveedores')) {
        const proveedoresHandled = await proveedoresRoutes(req, res, path);
        if (proveedoresHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Sucursales
      if (!responseEnviada && path.startsWith('/sucursales')) {
        const sucursalesHandled = await sucursalesRoutes(req, res, path);
        if (sucursalesHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Stock por Sucursal
      if (!responseEnviada && path.startsWith('/stock-sucursal')) {
        const stockHandled = await stockSucursalRoutes(req, res, path);
        if (stockHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Compras
      if (!responseEnviada && path.startsWith('/compras')) {
        const comprasHandled = await comprasRoutes(req, res, path);
        if (comprasHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Ventas (pasa la función helper como parámetro)
      if (!responseEnviada && path.startsWith('/ventas')) {
        const ventasHandled = await ventasRoutes(req, res, path, enriquecerVentasConClientes);
        if (ventasHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Promociones
      if (!responseEnviada && path.startsWith('/promociones')) {
        const promocionesHandled = await promocionesRoutes(req, res, path);
        if (promocionesHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Transferencias
      if (!responseEnviada && path.startsWith('/transferencias')) {
        const transferenciasHandled = await transferenciasRoutes(req, res, path);
        if (transferenciasHandled) {
          responseEnviada = true;
          return;
        }
      }
      
      // Dashboard
      if (!responseEnviada && path.startsWith('/dashboard')) {
        const dashboardHandled = await dashboardRoutes(req, res, path);
        if (dashboardHandled) {
          responseEnviada = true;
          return;
        }
      }
      // Reportes
      if (!responseEnviada && path.startsWith('/reportes')) {
        const reportesHandled = await reportesRoutes(req, res, path);
        if (reportesHandled) {
          responseEnviada = true;
          return;
        }
      }
	  // Vehículos
		if (!responseEnviada && path.startsWith('/vehiculos')) {
		  const vehiculosHandled = await vehiculosRoutes(req, res, path);
		  if (vehiculosHandled) {
			responseEnviada = true;
			return;
		  }
		}

		// Combustible
		if (!responseEnviada && path.startsWith('/combustible')) {
		  const combustibleHandled = await combustibleRoutes(req, res, path);
		  if (combustibleHandled) {
			responseEnviada = true;
			return;
		  }
		}

		// Servicios y Gastos de Vehículos
		if (!responseEnviada && (path.startsWith('/servicios-vehiculos') || path.startsWith('/gastos-vehiculos'))) {
		  const serviciosHandled = await serviciosVehiculosRoutes(req, res, path);
		  if (serviciosHandled) {
			responseEnviada = true;
			return;
		  }
		}
		
		// ✅ NUEVO: Caja
		if (!responseEnviada && path.startsWith('/caja')) {
		  const cajaHandled = await cajaRoutes(req, res, path);
		  if (cajaHandled) {
			responseEnviada = true;
			return;
		  }
		}
		
      // Búsqueda Global
      if (!responseEnviada && path.startsWith('/buscar')) {
        const busquedaHandled = await busquedaRoutes(req, res, path);
        if (busquedaHandled) {
          responseEnviada = true;
          return;
        }
      }
     // Listas de Precios
      if (!responseEnviada && path.startsWith('/listas-precios')) {
        const listasHandled = await listasPreciosRoutes(req, res, path);
        if (listasHandled) {
          responseEnviada = true;
          return;
        }
      }
 
    } catch (routeError) {
      console.error('❌ Error en ruta específica:', routeError);
      
      if (!responseEnviada && !res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error en el procesamiento de la ruta',
          error: routeError.message
        });
        responseEnviada = true;
        return;
      }
    }
    // ==================== RUTA POR DEFECTO (solo si no hay respuesta) ====================
    if (!responseEnviada && !res.headersSent) {
      res.json({
        success: true,
        message: 'API de LA FABRICA funcionando correctamente',
        version: '2.3.0',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        endpoints_migracion: [
          // ENDPOINTS DE MIGRACIÓN
          'POST /api/migrar-materias-primas - Migrar materias primas a productos',
          'GET /api/test-migracion - Vista previa de migración',
          'POST /api/migrar-sistema - Ejecutar migración (SOLO UNA VEZ)',
          'GET /api/verificar-migracion - Verificar estado de migración',
          'GET /api/materias-primas-unificadas - Materias primas del sistema unificado',
          'POST /api/produccion-unificada - Producción con descuento automático'
        ],
        endpoints_disponibles: [
          // ✅ NUEVO: Configuración empresarial
          'GET /api/configuracion/empresa - Obtener configuración empresarial',
          'POST /api/configuracion/empresa - Crear configuración empresarial',
          'PUT /api/configuracion/empresa - Actualizar configuración empresarial',
          'POST /api/configuracion/upload-logo - Subir logo de empresa',
          'DELETE /api/configuracion/logo - Eliminar logo de empresa',
          
          // Usuarios
          'GET /api/usuarios - Todos los usuarios',
          'GET /api/usuarios/:id - Usuario específico',
          'GET /api/usuarios/buscar?termino=X - Buscar usuarios',
          'GET /api/usuarios/:id/sucursales - Sucursales de un usuario',
          'GET /api/usuarios/roles - Roles disponibles',
          'POST /api/usuarios - Crear usuario',
          'PUT /api/usuarios/:id - Actualizar usuario',
          'PATCH /api/usuarios/:id/password - Cambiar contraseña',
          'PATCH /api/usuarios/:id/estado - Cambiar estado (activo/inactivo)',
          
          // Productos (incluye materias primas como categoría)
          'GET /api/productos - Todos los productos',
          'GET /api/productos/activos - Solo productos activos', 
          'GET /api/productos/buscar?termino=X - Buscar productos',
          'GET /api/productos/stock-bajo - Productos con stock bajo',
          'GET /api/productos/:id - Producto específico',
          'POST /api/productos - Crear producto',
          'PUT /api/productos/:id - Actualizar producto',
          'DELETE /api/productos/:id - Eliminar producto',
          // Reportes
          'GET /api/reportes/dashboard - Datos para el dashboard',
          'GET /api/reportes/ventas?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD - Reporte de ventas',
          'GET /api/reportes/compras?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD - Reporte de compras',
          'GET /api/reportes/ganancias?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&agrupacion=dia - Reporte de ganancias',
          // Y todos los demás endpoints existentes...
          'GET /api/compras - Todas las compras',
          'GET /api/ventas - Todas las ventas',
          'GET /api/sucursales - Todas las sucursales',
          'GET /api/recetas - Recetas',
          'GET /api/produccion - Órdenes de producción',
          '... y muchos más'
        ]
      });
    }
    
  } catch (error) {
    console.error('❌ Error crítico en Firebase Function:', error);
    
    // Solo enviar respuesta de error si no se ha enviado ya
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Eliminar la función limpiarSucursalesDuplicadas

// Exportar funciones auxiliares
module.exports.helpers = {
  enriquecerVentasConClientes
};