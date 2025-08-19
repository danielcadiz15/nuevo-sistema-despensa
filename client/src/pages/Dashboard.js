// src/pages/Dashboard.js - VERSIÓN CON RESTRICCIÓN DE GANANCIAS
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Servicios
import productosService from '../services/productos.service';
import reportesService from '../services/reportes.service';
import clientesService from '../services/clientes.service';
import RegistrarPagoDialog from '../components/modules/ventas/RegistrarPagoDialog';
import TicketReciboPago from '../components/modules/ventas/TicketReciboPago';

// Contexto de autenticación
import { useAuth } from '../contexts/AuthContext';

// Componentes
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ClientesConDeuda from '../components/modules/clientes/ClientesConDeuda';
import ClientesSinCompras from '../components/modules/clientes/ClientesSinCompras';
import Modal from '../components/common/Modal';
import JardinTareas from '../components/modules/dashboard/JardinTareas';
import MuroInnovacion from '../components/modules/dashboard/MuroInnovacion';

// Iconos
import { 
  FaShoppingCart, FaBoxOpen, FaExclamationTriangle, 
  FaChartLine, FaDollarSign, FaChartLine as FaTrendingUp, FaPlus,
  FaUser, FaStar, FaFileInvoiceDollar, FaCalendarAlt,
  FaStore, FaArrowUp, FaArrowDown, FaPercent, FaLock
} from 'react-icons/fa';

/**
 * Dashboard principal con restricción de ganancias
 */
const Dashboard = () => {
  const { currentUser, sucursalSeleccionada, hasPermission } = useAuth();
  
  // ✅ NUEVO: Verificar si el usuario es administrador
  const esAdministrador = () => {
    // Verificar por múltiples criterios
    if (!currentUser) return false;
    
    // Verificar por rol (diferentes formas en que puede estar almacenado)
    if (currentUser.rol === 'Administrador' || currentUser.rol === 'admin') return true;
    if (currentUser.role === 'Administrador' || currentUser.role === 'admin') return true;
    
    // Verificar por ID de rol si existe
    if (currentUser.rolId === 'admin' || currentUser.rol_id === 'admin') return true;
    
    // Verificar por flag isAdmin
    if (currentUser.isAdmin === true) return true;
    
    // Verificar por permisos específicos (si tiene permisos de usuarios, probablemente es admin)
    if (hasPermission && hasPermission('usuarios', 'editar')) return true;
    
    return false;
  };

  const puedeVerGanancias = esAdministrador();
  
  // Estados con inicializaciones seguras
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [clientesDestacados, setClientesDestacados] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    ventasHoy: 0,
    cantidadVentasHoy: 0,
    gananciasHoy: 0,
    stockBajo: 0,
    ticketPromedio: 0,
    margenPromedio: 0
  });
  
  // Estado para comparativos
  const [comparativos, setComparativos] = useState({
    ventasAyer: 0,
    gananciasAyer: 0,
    ventasSemanaAnterior: 0
  });

  // Estado para clientes con deuda > 20 días
  const [clientesDeuda, setClientesDeuda] = useState([]);
  const [loadingDeuda, setLoadingDeuda] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mensajeWA, setMensajeWA] = useState('');
  const [clienteWA, setClienteWA] = useState(null);

  // Estado para el modal de pago
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para ticket de pago
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [pagoRegistrado, setPagoRegistrado] = useState(null);

  // Estado para selección múltiple de deudas
  const [deudasSeleccionadas, setDeudasSeleccionadas] = useState([]);
  const [modalConfirmarPagos, setModalConfirmarPagos] = useState(false);
  const [procesandoPagos, setProcesandoPagos] = useState(false);

  // Estado para paginación de clientes con deuda
  const [lastClienteId, setLastClienteId] = useState(null);
  const [hayMasClientes, setHayMasClientes] = useState(false);

  /**
   * Carga datos con manejo robusto de errores
   */
  useEffect(() => {
    cargarDatos();
  }, [sucursalSeleccionada]);

  /**
   * Función principal de carga de datos
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos del dashboard...');
      console.log('👤 Usuario:', currentUser?.email, '- Es admin:', puedeVerGanancias);
      
      // Determinar sucursal para reportes
      const sucursalId = sucursalSeleccionada?.id || null;
      
      // Cargar datos en paralelo de forma segura
      const [
        dashboardData,
        productosData,
        stockBajoData
      ] = await Promise.allSettled([
        reportesService.obtenerDatosDashboard(sucursalId),
        productosService.obtenerTodos(),
        productosService.obtenerStockBajo()
      ]);

      // Procesar datos de dashboard
      let datosReales = {
        ventasHoy: 0,
        cantidadVentasHoy: 0,
        gananciasHoy: 0,
        productosDestacados: [],
        clientesDestacados: []
      };

      if (dashboardData.status === 'fulfilled' && dashboardData.value) {
        datosReales = dashboardData.value;
        console.log('✅ Datos dashboard obtenidos:', datosReales);
      } else {
        console.warn('⚠️ Error en datos dashboard:', dashboardData.reason);
      }

      // Procesar productos de forma segura
      let productosArray = [];
      if (productosData.status === 'fulfilled' && productosData.value) {
        productosArray = Array.isArray(productosData.value) ? productosData.value : [];
      } else {
        console.warn('⚠️ Error en productos:', productosData.reason);
      }

      // Procesar stock bajo de forma segura
      let stockBajoArray = [];
      if (stockBajoData.status === 'fulfilled' && stockBajoData.value) {
        stockBajoArray = Array.isArray(stockBajoData.value) ? stockBajoData.value : [];
      } else {
        console.warn('⚠️ Error en stock bajo:', stockBajoData.reason);
      }

      // Asegurar que los datos destacados sean arrays
      const productosDestacadosSeguro = Array.isArray(datosReales.productosDestacados) 
        ? datosReales.productosDestacados 
        : [];
      
      const clientesDestacadosSeguro = Array.isArray(datosReales.clientesDestacados)
        ? datosReales.clientesDestacados
        : [];

      // Calcular ticket promedio real
      const ticketPromedio = datosReales.cantidadVentasHoy > 0 
        ? datosReales.ventasHoy / datosReales.cantidadVentasHoy 
        : 0;

      // Calcular margen promedio real (solo si es admin)
      const margenPromedio = puedeVerGanancias && datosReales.ventasHoy > 0 
        ? (datosReales.gananciasHoy / datosReales.ventasHoy) * 100 
        : 0;

      // Actualizar estados con datos reales
      setProductos(productosArray);
      setProductosDestacados(productosDestacadosSeguro);
      setClientesDestacados(clientesDestacadosSeguro);
      
      setStats({
        totalProductos: productosArray.length,
        ventasHoy: datosReales.ventasHoy || 0,
        cantidadVentasHoy: datosReales.cantidadVentasHoy || 0,
        // ✅ IMPORTANTE: Solo mostrar ganancias si es admin
        gananciasHoy: puedeVerGanancias ? (datosReales.gananciasHoy || 0) : 0,
        stockBajo: stockBajoArray.length,
        ticketPromedio: ticketPromedio,
        margenPromedio: puedeVerGanancias ? margenPromedio : 0
      });

      // Cargar datos comparativos (solo si es admin)
      if (puedeVerGanancias) {
        await cargarComparativos(sucursalId);
      }
      
      console.log('✅ Dashboard cargado exitosamente');

    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
      
      // Valores por defecto en caso de error
      setStats({
        totalProductos: 0,
        ventasHoy: 0,
        cantidadVentasHoy: 0,
        gananciasHoy: 0,
        stockBajo: 0,
        ticketPromedio: 0,
        margenPromedio: 0
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar datos comparativos para mostrar tendencias
   */
  const cargarComparativos = async (sucursalId) => {
    try {
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      const semanaAnterior = new Date(hoy);
      semanaAnterior.setDate(semanaAnterior.getDate() - 7);

      // Obtener datos de ayer
      const datosAyer = await reportesService.obtenerReporteVentas({
        fechaInicio: ayer.toISOString().split('T')[0],
        fechaFin: ayer.toISOString().split('T')[0],
        sucursal_id: sucursalId
      });

      // Obtener datos de la semana anterior
      const datosSemanaAnterior = await reportesService.obtenerReporteVentas({
        fechaInicio: semanaAnterior.toISOString().split('T')[0],
        fechaFin: semanaAnterior.toISOString().split('T')[0],
        sucursal_id: sucursalId
      });

      setComparativos({
        ventasAyer: datosAyer?.resumen?.totalVentas || 0,
        gananciasAyer: datosAyer?.resumen?.ganancia || 0,
        ventasSemanaAnterior: datosSemanaAnterior?.resumen?.totalVentas || 0
      });

    } catch (error) {
      console.warn('⚠️ Error cargando comparativos:', error);
      // No mostrar error al usuario, usar valores por defecto
    }
  };

  // Modificar cargarClientesDeuda para ocultar el botón 'Cargar más' si ya no hay más resultados
  const cargarClientesDeuda = async (reset = false) => {
    setLoadingDeuda(true);
    try {
      const filtros = { limit: 100 };
      if (!reset && lastClienteId) filtros.startAfter = lastClienteId;
      const { clientes, lastClienteId: nuevoLastId } = await clientesService.obtenerClientesConDeuda(filtros);
      const clientesFiltrados = clientes.filter(cliente => {
        if (!cliente.deudas || !Array.isArray(cliente.deudas)) return false;
        return cliente.deudas.some(deuda => deuda.importe > 0);
      });
      if (reset) {
        setClientesDeuda(clientesFiltrados);
      } else {
        setClientesDeuda(prev => [...prev, ...clientesFiltrados]);
      }
      setLastClienteId(nuevoLastId);
      // Si la cantidad recibida es menor al límite, ya no hay más para cargar
      setHayMasClientes(!!nuevoLastId && clientesFiltrados.length === 100);
      if (clientesFiltrados.length < 100) setHayMasClientes(false);
    } catch (error) {
      setClientesDeuda([]);
      setLastClienteId(null);
      setHayMasClientes(false);
      console.error('[DEBUG] Error al cargar clientes con deuda:', error);
    } finally {
      setLoadingDeuda(false);
    }
  };

  const abrirModalWA = (cliente, deuda) => {
    const mensaje = `Hola ${cliente.nombre || ''}, tienes una deuda pendiente de $${deuda.importe} desde el ${new Date(deuda.fecha).toLocaleDateString('es-AR')}. Por favor, regulariza tu situación. ¡Gracias!`;
    setMensajeWA(mensaje);
    setClienteWA({ ...cliente, deuda });
    setModalOpen(true);
  };

  const enviarWA = () => {
    if (!clienteWA) return;
    const telefono = clienteWA.telefono ? clienteWA.telefono.replace(/[^\d]/g, '') : '';
    if (!telefono) {
      toast.error('El cliente no tiene teléfono válido');
      return;
    }
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeWA)}`;
    window.open(url, '_blank');
    setModalOpen(false);
  };

  // Función para abrir el modal de pago
  const abrirModalPago = async (cliente, deuda) => {
    try {
      // Obtener datos completos de la venta
      const ventasService = await import('../services/ventas.service');
      const ventaId = deuda.venta_id || deuda.id_venta;
      
      if (ventaId) {
        const ventaCompleta = await ventasService.default.obtenerPorId(ventaId);
        setClienteSeleccionado(cliente);
        setDeudaSeleccionada({ ...deuda, ventaCompleta });
        setModalPagoOpen(true);
      } else {
        toast.error('No se puede obtener los datos de la venta');
      }
    } catch (error) {
      console.error('Error al obtener datos de venta:', error);
      toast.error('Error al cargar datos de la venta');
    }
  };

  // Función para registrar el pago (delega a ventasService)
  const registrarPago = async (pagoData) => {
    try {
      // Log robusto para depuración
      console.log('[DEBUG] Deuda seleccionada al registrar pago:', deudaSeleccionada);
      console.log('[DEBUG] Cliente seleccionado al registrar pago:', clienteSeleccionado);
      // Usar ambos campos para máxima compatibilidad
      const idVenta = deudaSeleccionada?.venta_id || deudaSeleccionada?.id_venta;
      if (!idVenta) {
        toast.error('No se puede registrar el pago: falta el ID de la venta asociada a la deuda.');
        return;
      }
      await import('../services/ventas.service').then(({ default: ventasService }) =>
        ventasService.registrarPago(idVenta, pagoData)
      );
      toast.success('Pago registrado correctamente');
      
      // Obtener los datos ACTUALIZADOS de la venta después del pago
      console.log('🔄 Obteniendo datos actualizados de la venta después del pago en Dashboard...');
      const ventasService = await import('../services/ventas.service');
      const ventaActualizada = await ventasService.default.obtenerPorId(idVenta);
      console.log('✅ Venta actualizada obtenida en Dashboard:', ventaActualizada);
      
      // Actualizar deudaSeleccionada con los datos actualizados
      setDeudaSeleccionada(prev => ({
        ...prev,
        ventaCompleta: ventaActualizada
      }));
      
      // Guardar datos del pago para mostrar el ticket
      console.log('🎫 Activando ticket de pago en Dashboard:', pagoData);
      setPagoRegistrado(pagoData);
      setMostrarTicket(true);
      console.log('🎫 Estado mostrarTicket establecido en true');
      
      // NO cerrar el modal automáticamente - dejar que el ticket se muestre
      // setModalPagoOpen(false);
      // setDeudaSeleccionada(null);
      // setClienteSeleccionado(null);
      cargarClientesDeuda();
    } catch (error) {
      toast.error(error.message || 'Error al registrar el pago');
    }
  };

  /**
   * Cierra el ticket de pago
   */
  const cerrarTicket = () => {
    console.log('🎫 Cerrando ticket de pago en Dashboard');
    setMostrarTicket(false);
    setPagoRegistrado(null);
    // Cerrar también el modal de registro
    setModalPagoOpen(false);
    setDeudaSeleccionada(null);
    setClienteSeleccionado(null);
  };

  // Manejar selección/deselección de una deuda
  const toggleSeleccionDeuda = (cliente, deuda) => {
    const key = `${cliente.id}_${deuda.id_venta || deuda.venta_id}`;
    const yaSeleccionada = deudasSeleccionadas.find(d => d.key === key);
    if (yaSeleccionada) {
      setDeudasSeleccionadas(deudasSeleccionadas.filter(d => d.key !== key));
    } else {
      setDeudasSeleccionadas([
        ...deudasSeleccionadas,
        { key, cliente, deuda }
      ]);
    }
  };

  // Procesar pagos completos en lote
  const registrarPagosCompletosLote = async () => {
    setProcesandoPagos(true);
    try {
      let exitos = 0, errores = 0;
      for (const item of deudasSeleccionadas) {
        const idVenta = item.deuda.venta_id || item.deuda.id_venta;
        if (!idVenta) {
          errores++;
          continue;
        }
        try {
          await import('../services/ventas.service').then(({ default: ventasService }) =>
            ventasService.registrarPago(idVenta, {
              monto: item.deuda.importe,
              metodo_pago: 'efectivo',
              referencia: 'Pago masivo',
              concepto: 'Pago completo (masivo)',
              nota: 'Pago marcado en limpieza masiva'
            })
          );
          exitos++;
        } catch (err) {
          errores++;
        }
      }
      toast.success(`Pagos registrados: ${exitos}. Errores: ${errores}`);
      setDeudasSeleccionadas([]);
      setModalConfirmarPagos(false);
      cargarClientesDeuda();
    } catch (error) {
      toast.error('Error al registrar pagos masivos');
    } finally {
      setProcesandoPagos(false);
    }
  };

  /**
   * Calcular porcentaje de cambio
   */
  const calcularCambio = (actual, anterior) => {
    if (anterior === 0) return { porcentaje: 0, esPositivo: true };
    
    const cambio = ((actual - anterior) / anterior) * 100;
    return {
      porcentaje: Math.abs(cambio).toFixed(1),
      esPositivo: cambio >= 0
    };
  };

  /**
   * Función para formatear moneda mejorada
   */
  const formatMoney = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    return '$' + amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  /**
   * Componente para mostrar cambios con iconos
   */
  const CambioIndicador = ({ actual, anterior, esMoneda = false }) => {
    const cambio = calcularCambio(actual, anterior);
    
    return (
      <div className={`text-xs flex items-center mt-1 ${
        cambio.esPositivo ? 'text-green-600' : 'text-red-600'
      }`}>
        {cambio.esPositivo ? <FaArrowUp /> : <FaArrowDown />}
        <span className="ml-1">
          {cambio.porcentaje}% vs ayer
        </span>
      </div>
    );
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <p className="ml-4 text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🏪 Dashboard {sucursalSeleccionada?.nombre || 'La Fábrica'}
          </h1>
          <p className="text-gray-600 flex items-center">
            <FaCalendarAlt className="mr-2" />
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {sucursalSeleccionada && (
              <span className="ml-4 flex items-center">
                <FaStore className="mr-1" />
                {sucursalSeleccionada.nombre}
              </span>
            )}
          </p>
        </div>
        
        <Link to="/punto-venta">
          <Button
            color="primary"
            size="lg"
            icon={<FaShoppingCart />}
          >
            Punto de Venta
          </Button>
        </Link>
      </div>

      {/* Métricas principales con restricción de ganancias */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${puedeVerGanancias ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {/* Ventas de hoy */}
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaDollarSign size={24} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(stats.ventasHoy)}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-500">
                  {stats.cantidadVentasHoy} ventas
                </p>
                <CambioIndicador 
                  actual={stats.ventasHoy} 
                  anterior={comparativos.ventasAyer}
                  esMoneda={true}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Ganancias de hoy - SOLO VISIBLE PARA ADMINISTRADORES */}
		{puedeVerGanancias && (
		  <Card>
			<div className="flex items-center">
			  <div className="p-3 rounded-full bg-green-100 text-green-600">
				<FaTrendingUp size={24} />
			  </div>
			  <div className="ml-4 flex-1">
				<p className="text-sm font-medium text-gray-600">Ganancias Hoy</p>
				<p className="text-2xl font-bold text-gray-900">
				  {formatMoney(stats.gananciasHoy)}
				</p>
				<div className="flex items-center justify-between">
				  <p className="text-sm text-green-500 flex items-center">
					<FaPercent className="mr-1" size={10} />
					{stats.margenPromedio.toFixed(1)}% margen
				  </p>
				  <CambioIndicador 
					actual={stats.gananciasHoy} 
					anterior={comparativos.gananciasAyer}
					esMoneda={true}
				  />
				</div>
			  </div>
			</div>
		  </Card>
		)}

        {/* Ticket promedio */}
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaFileInvoiceDollar size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(stats.ticketPromedio)}
              </p>
              <p className="text-sm text-purple-500">
                {stats.cantidadVentasHoy > 0 
                  ? `${stats.cantidadVentasHoy} ventas hoy`
                  : 'Sin ventas hoy'
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Total productos y stock bajo */}
        <Card>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              stats.stockBajo > 0 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <FaBoxOpen size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProductos}
              </p>
              <p className={`text-sm ${
                stats.stockBajo > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {stats.stockBajo > 0 
                  ? `${stats.stockBajo} con stock bajo`
                  : 'Stock OK'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 🆕 NUEVO: Jardín de Tareas y Muro de Innovación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jardín de Tareas */}
        <JardinTareas />

        {/* Muro de Innovación */}
        <MuroInnovacion />
      </div>

      {/* Acciones rápidas compactas */}
      <Card title="⚡ Acciones Rápidas" icon={<FaPlus />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/punto-venta">
            <div className="bg-green-50 hover:bg-green-100 p-3 rounded-lg flex flex-col items-center transition-colors cursor-pointer text-center">
              <FaShoppingCart className="text-green-600 mb-2" size={20} />
              <p className="text-sm font-medium text-green-800">Nueva Venta</p>
              <p className="text-xs text-green-600">{stats.cantidadVentasHoy} hoy</p>
            </div>
          </Link>
          
          <Link to="/productos/nuevo">
            <div className="bg-blue-50 hover:bg-blue-100 p-3 rounded-lg flex flex-col items-center transition-colors cursor-pointer text-center">
              <FaBoxOpen className="text-blue-600 mb-2" size={20} />
              <p className="text-sm font-medium text-blue-800">Agregar Producto</p>
              <p className="text-xs text-blue-600">{stats.totalProductos} total</p>
            </div>
          </Link>
          
          <Link to="/reportes/ventas">
            <div className="bg-purple-50 hover:bg-purple-100 p-3 rounded-lg flex flex-col items-center transition-colors cursor-pointer text-center">
              <FaChartLine className="text-purple-600 mb-2" size={20} />
              <p className="text-sm font-medium text-purple-800">Reportes</p>
              <p className="text-xs text-purple-600">📊</p>
            </div>
          </Link>

          {stats.stockBajo > 0 && (
            <Link to="/productos?filtro=stock_bajo">
              <div className="bg-red-50 hover:bg-red-100 p-3 rounded-lg flex flex-col items-center transition-colors cursor-pointer text-center">
                <FaExclamationTriangle className="text-red-600 mb-2" size={20} />
                <p className="text-sm font-medium text-red-800">Stock Bajo</p>
                <p className="text-xs text-red-600">{stats.stockBajo}</p>
              </div>
            </Link>
          )}
        </div>
      </Card>

      {/* Clientes destacados con datos reales */}
      <Card title="👥 Mejores Clientes del Día" icon={<FaUser />}>
        {clientesDestacados.length === 0 ? (
          <div className="text-center py-8">
            <FaUser className="mx-auto text-4xl text-gray-400 mb-2" />
            <p className="text-gray-500">No hay clientes con compras hoy</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesDestacados.slice(0, 6).map((cliente, index) => (
              <div key={cliente.id || index} className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-800">
                  {`${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Cliente General'}
                </h3>
                <p className="text-sm text-gray-500">{cliente.email || 'Sin email'}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm text-blue-600">
                    {cliente.compras || 0} compras
                  </span>
                  <span className="font-bold text-green-600">
                    {formatMoney(cliente.total || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 🆕 NUEVO: Sección de análisis de clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <ClientesSinCompras /> */}
      </div>

      {/* Bloque de advertencia de clientes con deuda mayor a 20 días */}
      <div className="mb-6">
        <Card title="Clientes con deudas" icon={<FaExclamationTriangle />}>
          <div className="mb-2 text-blue-800 text-sm font-medium text-center">
            Solo se muestran clientes con deudas mayores a 15 días. Mostrando los primeros 100 clientes.
          </div>
          <div className="mb-4 flex justify-center">
            <Button color="primary" onClick={() => cargarClientesDeuda(true)} disabled={loadingDeuda}>
              {loadingDeuda ? 'Buscando...' : 'Buscar clientes con deuda'}
            </Button>
          </div>
          {loadingDeuda ? (
            <div className="flex items-center py-4"><Spinner size="md" /><span className="ml-2">Cargando...</span></div>
          ) : clientesDeuda.length === 0 ? (
            <div className="text-center py-4 text-green-700 font-medium">Sin clientes con deuda</div>
          ) : (
            <>
            <div className="space-y-4">
              {clientesDeuda.map(cliente => (
                <div key={cliente.id} className="border-b pb-2 mb-2">
                  <div className="font-bold text-gray-800">{cliente.nombre} {cliente.apellido}</div>
                  <div className="text-sm text-gray-600">Tel: {cliente.telefono || 'N/A'}</div>
                  {cliente.deudas.map((deuda, idx) => {
                    const key = `${cliente.id}_${deuda.id_venta || deuda.venta_id}`;
                    const checked = deudasSeleccionadas.some(d => d.key === key);
                    return (
                      <div key={idx} className="flex items-center justify-between mt-1 gap-2 bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSeleccionDeuda(cliente, deuda)}
                          />
                          <span>
                            <span className="text-red-700 font-semibold">${deuda.importe}</span> | 
                            <span className="text-gray-700">{new Date(deuda.fecha).toLocaleDateString('es-AR')}</span> | 
                            <span className="text-xs text-gray-500">{deuda.dias_atraso} días</span> | 
                            <span className="text-xs text-gray-700 font-bold">{deuda.estado ? deuda.estado : 'Pendiente'}</span>
                            {deuda.id_venta && (
                              <a
                                href={`/ventas/${deuda.id_venta}`}
                                className="ml-2 text-blue-700 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ver factura
                              </a>
                            )}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" color="green" onClick={() => abrirModalWA(cliente, deuda)}>
                            WhatsApp
                          </Button>
                          <Button size="sm" color="primary" onClick={() => abrirModalPago(cliente, deuda)}>
                            Registrar Pago
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Botón global para pagos masivos */}
            <div className="mt-4 flex flex-col items-end gap-2">
              <Button
                color="primary"
                disabled={deudasSeleccionadas.length === 0 || procesandoPagos}
                onClick={() => setModalConfirmarPagos(true)}
              >
                Registrar Pagos Completos ({deudasSeleccionadas.length})
              </Button>
              {hayMasClientes && (
                <Button color="secondary" onClick={() => cargarClientesDeuda(false)} disabled={loadingDeuda}>
                  {loadingDeuda ? 'Cargando...' : 'Cargar más'}
                </Button>
              )}
            </div>
            </>
          )}
        </Card>
      </div>
      {/* Modal para editar mensaje de WhatsApp */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar mensaje de WhatsApp">
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={4}
          value={mensajeWA}
          onChange={e => setMensajeWA(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <Button color="gray" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button color="green" onClick={enviarWA}>Enviar WhatsApp</Button>
        </div>
      </Modal>
      {/* Modal para registrar pago */}
      <RegistrarPagoDialog
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        venta={deudaSeleccionada?.ventaCompleta || (deudaSeleccionada ? {
          id: deudaSeleccionada.venta_id || deudaSeleccionada.id_venta,
          numero: deudaSeleccionada.numero_venta || deudaSeleccionada.venta_id || deudaSeleccionada.id_venta || '',
          cliente_id: clienteSeleccionado?.id,
          cliente_info: clienteSeleccionado ? {
            id: clienteSeleccionado.id,
            nombre: clienteSeleccionado.nombre,
            apellido: clienteSeleccionado.apellido,
            nombre_completo: `${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`.trim(),
            telefono: clienteSeleccionado.telefono,
            email: clienteSeleccionado.email
          } : {},
          total: deudaSeleccionada.total || deudaSeleccionada.importe,
          saldo_pendiente: deudaSeleccionada.importe,
        } : null)}
        onPagoRegistrado={registrarPago}
      />
      
      {/* Modal del ticket de recibo */}
      {console.log('🎫 Renderizando ticket en Dashboard, mostrarTicket:', mostrarTicket, 'pagoRegistrado:', pagoRegistrado)}
      {mostrarTicket && (
        <TicketReciboPago
          isOpen={mostrarTicket}
          onClose={cerrarTicket}
          pagoData={pagoRegistrado}
          venta={deudaSeleccionada?.ventaCompleta || (deudaSeleccionada ? {
            id: deudaSeleccionada.venta_id || deudaSeleccionada.id_venta,
            numero: deudaSeleccionada.numero_venta || deudaSeleccionada.venta_id || deudaSeleccionada.id_venta || '',
            cliente_id: clienteSeleccionado?.id,
            cliente_info: clienteSeleccionado ? {
              id: clienteSeleccionado.id,
              nombre: clienteSeleccionado.nombre,
              apellido: clienteSeleccionado.apellido,
              nombre_completo: `${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`.trim(),
              telefono: clienteSeleccionado.telefono,
              email: clienteSeleccionado.email
            } : {},
            total: deudaSeleccionada.total || deudaSeleccionada.importe,
            saldo_pendiente: deudaSeleccionada.importe,
          } : null)}
          cliente={clienteSeleccionado}
        />
      )}
      {/* Modal de confirmación de pagos masivos */}
      <Modal open={modalConfirmarPagos} onClose={() => setModalConfirmarPagos(false)} title="Confirmar pagos completos">
        <div className="mb-4">
          <p>¿Seguro que deseas registrar el pago completo de las siguientes deudas?</p>
          <ul className="list-disc pl-5 mt-2">
            {deudasSeleccionadas.map((item, idx) => (
              <li key={item.key}>
                <b>{item.cliente.nombre} {item.cliente.apellido}</b> - ${item.deuda.importe} ({item.deuda.estado}) - {new Date(item.deuda.fecha).toLocaleDateString('es-AR')}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2">
          <Button color="gray" onClick={() => setModalConfirmarPagos(false)} disabled={procesandoPagos}>Cancelar</Button>
          <Button color="primary" onClick={registrarPagosCompletosLote} loading={procesandoPagos} disabled={procesandoPagos}>
            Confirmar y Registrar Pagos
          </Button>
        </div>
      </Modal>
     </div>
  );
};

export default Dashboard;