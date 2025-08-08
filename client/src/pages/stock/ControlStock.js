/**
 * Página de control de stock/inventario físico
 * 
 * Permite realizar conteos físicos de inventario, comparar con el sistema
 * y generar ajustes automáticos con reporte imprimible.
 * 
 * @module pages/stock/ControlStock
 */

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';

// Servicios
import stockSucursalService from '../../services/stock-sucursal.service';
import controlStockService from '../../services/control-stock.service';
import categoriasService from '../../services/categorias.service';

// Componentes
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Iconos
import { 
  FaClipboardCheck, FaStore, FaPrint, FaSave, FaPlus,
  FaEdit, FaCheckCircle, FaExclamationTriangle, FaArrowLeft,
  FaFileExport, FaBarcode, FaHistory, FaFilter
} from 'react-icons/fa';

const ReporteImpresion = forwardRef((props, ref) => (
  <div ref={ref} className="p-8 bg-white" style={{ width: '100%' }}>
      {/* Encabezado */}
      <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">Control de Inventario</h1>
        <p className="text-lg mt-2">{props.sucursalNombre}</p>
        <p className="text-sm text-gray-600">
          Fecha: {props.fecha} {props.hora}
        </p>
        <p className="text-sm text-gray-600">
          Realizado por: {props.usuarioNombre}
        </p>
      </div>
      
      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="border p-3">
          <h3 className="font-semibold">Resumen del Control</h3>
          <p className="text-sm">Total de productos: {props.estadisticas.totalProductos}</p>
          <p className="text-sm">Productos contados: {props.estadisticas.productosContados}</p>
          <p className="text-sm">Diferencias encontradas: {props.estadisticas.diferenciasEncontradas}</p>
          <p className="text-sm font-semibold">
            Valor de diferencia: ${props.estadisticas.valorDiferencia.toFixed(2)}
          </p>
        </div>
        <div className="border p-3">
          <h3 className="font-semibold">Información del Control</h3>
          <p className="text-sm">Tipo: {props.modoConteo === 'completo' ? 'Inventario Completo' : 'Inventario Parcial'}</p>
          <p className="text-sm">Estado: {props.controlActivo ? 'En proceso' : 'Nuevo'}</p>
          {props.filtroCategoria && (
            <p className="text-sm">Categoría: {props.categorias.find(c => c.id === props.filtroCategoria)?.nombre}</p>
          )}
        </div>
      </div>
      
      {/* Tabla de productos */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left text-sm">Código</th>
            <th className="border p-2 text-left text-sm">Producto</th>
            <th className="border p-2 text-center text-sm">Stock Sistema</th>
            <th className="border p-2 text-center text-sm">Stock Físico</th>
            <th className="border p-2 text-center text-sm">Diferencia</th>
            <th className="border p-2 text-left text-sm">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {props.productosFiltrados.map((item, index) => (
            <tr key={item.producto_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="border p-2 text-sm">{item.producto?.codigo}</td>
              <td className="border p-2 text-sm">{item.producto?.nombre}</td>
              <td className="border p-2 text-center text-sm">{item.stock_sistema}</td>
              <td className="border p-2 text-center text-sm">
                {item.contado ? item.stock_fisico : '-'}
              </td>
              <td className="border p-2 text-center text-sm">
                {item.contado && item.diferencia !== null ? (
                  <span className={item.diferencia > 0 ? 'text-green-600' : item.diferencia < 0 ? 'text-red-600' : ''}>
                    {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                  </span>
                ) : '-'}
              </td>
              <td className="border p-2 text-sm text-xs">{item.observaciones || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pie de página */}
      <div className="mt-8 pt-4 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm">Firma del Responsable</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm">Firma del Supervisor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
));

const ControlStock = () => {
  const navigate = useNavigate();
  const { sucursalSeleccionada, currentUser } = useAuth();
  const esAdmin = currentUser?.rol === 'Administrador';
  const componentRef = useRef();
  
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [productosConteo, setProductosConteo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [controlActivo, setControlActivo] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [modoConteo, setModoConteo] = useState('completo'); // 'completo', 'parcial', 'categoria'
  const [categorias, setCategorias] = useState([]);
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    productosContados: 0,
    diferenciasEncontradas: 0,
    valorDiferencia: 0
  });
  
  // Configuración de impresión
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Control_Stock_${sucursalSeleccionada?.nombre}_${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page { 
        size: A4; 
        margin: 10mm;
      }
      @media print {
        .no-print { display: none !important; }
        .print-break { page-break-after: always; }
      }
    `
  });
  
  useEffect(() => {
    if (sucursalSeleccionada) {
      inicializarControl();
    }
  }, [sucursalSeleccionada]);
  
  /**
   * Inicializa el control de stock
   */
  const inicializarControl = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay un control activo
      const controlEnProgreso = await controlStockService.obtenerControlActivo(sucursalSeleccionada.id);
      
      if (controlEnProgreso) {
        setControlActivo(controlEnProgreso);
        await cargarProductosControl(controlEnProgreso.id);
      } else {
        await cargarProductosParaNuevoControl();
      }
      
      // Cargar categorías para filtros
      try {
        const categoriasData = await categoriasService.obtenerTodos();
        setCategorias(categoriasData);
      } catch (error) {
        console.warn('Error al cargar categorías:', error);
        setCategorias([]); // Continuar sin categorías si falla
      }
      
    } catch (error) {
      console.error('Error al inicializar control:', error);
      toast.error('Error al cargar datos del control');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Carga productos para nuevo control
   */
  const cargarProductosParaNuevoControl = async () => {
    const stockActual = await stockSucursalService.obtenerStockPorSucursal(sucursalSeleccionada.id);
    
    const productosFormateados = stockActual.map(item => ({
      producto_id: item.producto_id,
      producto: item.producto,
      stock_sistema: item.cantidad,
      stock_fisico: null,
      diferencia: null,
      contado: false,
      observaciones: ''
    }));
    
    setProductos(stockActual);
    setProductosConteo(productosFormateados);
    actualizarEstadisticas(productosFormateados);
  };
  
  /**
   * Carga productos de un control existente
   */
  const cargarProductosControl = async (controlId) => {
    const detalles = await controlStockService.obtenerDetallesControl(controlId);
    setProductosConteo(detalles);
    actualizarEstadisticas(detalles);
  };
  
  /**
   * Inicia un nuevo control
   */
  const iniciarNuevoControl = async () => {
    try {
      const nuevoControl = await controlStockService.crearControl({
        sucursal_id: sucursalSeleccionada.id,
        usuario_id: currentUser.id,
        tipo: modoConteo,
        categoria_id: modoConteo === 'categoria' ? filtroCategoria : null
      });
      
      setControlActivo(nuevoControl);
      toast.success('Control de inventario iniciado');
    } catch (error) {
      console.error('Error al iniciar control:', error);
      toast.error('Error al iniciar el control');
    }
  };
  
  /**
   * Actualiza el conteo de un producto
   */
  const actualizarConteo = (productoId, stockFisico) => {
    const stockFisicoNum = parseFloat(stockFisico) || 0;
    
    setProductosConteo(productos => 
      productos.map(p => {
        if (p.producto_id === productoId) {
          const diferencia = stockFisicoNum - p.stock_sistema;
          return {
            ...p,
            stock_fisico: stockFisicoNum,
            diferencia,
            contado: true
          };
        }
        return p;
      })
    );
    
    // Actualizar estadísticas
    actualizarEstadisticas();
  };
  
  /**
   * Actualiza las observaciones de un producto
   */
  const actualizarObservaciones = (productoId, observaciones) => {
    setProductosConteo(productos => 
      productos.map(p => 
        p.producto_id === productoId 
          ? { ...p, observaciones } 
          : p
      )
    );
  };
  
  /**
   * Actualiza las estadísticas del control
   */
  const actualizarEstadisticas = (productosData = productosConteo) => {
    const totalProductos = productosData.length;
    const productosContados = productosData.filter(p => p.contado).length;
    const diferenciasEncontradas = productosData.filter(p => p.diferencia !== 0 && p.diferencia !== null).length;
    
    const valorDiferencia = productosData.reduce((total, p) => {
      if (p.diferencia && p.producto?.precio_costo) {
        return total + (p.diferencia * p.producto.precio_costo);
      }
      return total;
    }, 0);
    
    setEstadisticas({
      totalProductos,
      productosContados,
      diferenciasEncontradas,
      valorDiferencia
    });
  };
  
  /**
   * Aplica los conteos como ajustes de stock
   */
  const aplicarAjustes = async () => {
    try {
      setGuardando(true);
      
      const ajustes = productosConteo
        .filter(p => p.contado && p.diferencia !== 0)
        .map(p => ({
          producto_id: p.producto_id,
          cantidad_ajuste: p.diferencia,
          motivo: `Control de inventario ${new Date().toLocaleDateString()}`,
          observaciones: p.observaciones
        }));
      
      if (ajustes.length === 0) {
        toast.warning('No hay diferencias para ajustar');
        return;
      }
      
      // Aplicar ajustes
      for (const ajuste of ajustes) {
        await stockSucursalService.ajustarStock(
          sucursalSeleccionada.id,
          ajuste.producto_id,
          ajuste.cantidad_ajuste,
          ajuste.motivo
        );
      }
      
      // Finalizar control
      if (controlActivo) {
        await controlStockService.finalizarControl(controlActivo.id, {
          productos_conteo: productosConteo,
          ajustes_aplicados: true
        });
      }
      
      toast.success(`Se aplicaron ${ajustes.length} ajustes de inventario`);
      setShowConfirmDialog(false);
      
      // Recargar página después de aplicar
      setTimeout(() => {
        navigate('/stock', { state: { updated: true } });
      }, 1500);
      
    } catch (error) {
      console.error('Error al aplicar ajustes:', error);
      toast.error('Error al aplicar los ajustes');
    } finally {
      setGuardando(false);
    }
  };
  
  /**
   * Filtra productos según búsqueda y categoría
   */
  const productosFiltrados = productosConteo.filter(item => {
    const coincideBusqueda = !searchTerm || 
      item.producto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producto?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const coincideCategoria = !filtroCategoria || 
      item.producto?.categoria_id === filtroCategoria;
    
    return coincideBusqueda && coincideCategoria;
  });
  
  const fecha = new Date().toLocaleDateString();
  const hora = new Date().toLocaleTimeString();
  const usuarioNombre = currentUser?.nombre || currentUser?.email;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Control de Inventario
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            <FaStore className="inline mr-1" />
            {sucursalSeleccionada.nombre}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            color="secondary"
            onClick={() => navigate('/stock')}
            icon={<FaArrowLeft />}
          >
            Volver
          </Button>
          
          <Button
            color="secondary"
            onClick={handlePrint}
            icon={<FaPrint />}
            disabled={productosConteo.length === 0}
          >
            Imprimir
          </Button>
          
          <Button
            color="primary"
            onClick={() => navigate('/stock/control/historial')}
            icon={<FaHistory />}
          >
            Ver Historial
          </Button>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-blue-800 font-medium">Total Productos</h3>
              <p className="text-2xl font-bold text-blue-900">
                {estadisticas.totalProductos}
              </p>
            </div>
            <FaClipboardCheck className="text-4xl text-blue-300" />
          </div>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-800 font-medium">Contados</h3>
              <p className="text-2xl font-bold text-green-900">
                {estadisticas.productosContados}
              </p>
              <p className="text-xs text-green-600">
                {((estadisticas.productosContados / estadisticas.totalProductos) * 100).toFixed(0)}% completado
              </p>
            </div>
            <FaCheckCircle className="text-4xl text-green-300" />
          </div>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-800 font-medium">Diferencias</h3>
              <p className="text-2xl font-bold text-yellow-900">
                {estadisticas.diferenciasEncontradas}
              </p>
            </div>
            <FaExclamationTriangle className="text-4xl text-yellow-300" />
          </div>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-purple-800 font-medium">Valor Diferencia</h3>
              <p className="text-2xl font-bold text-purple-900">
                ${estadisticas.valorDiferencia.toFixed(2)}
              </p>
            </div>
            <FaFileExport className="text-4xl text-purple-300" />
          </div>
        </Card>
      </div>
      
      {/* Controles y filtros */}
      <Card className="no-print">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Buscar producto por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={() => {}}
              onClear={() => setSearchTerm('')}
            />
          </div>
          
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          
          {esAdmin && (
            <Button
              color="primary"
              onClick={iniciarNuevoControl}
              icon={<FaPlus />}
              disabled={loading || guardando}
            >
              Iniciar Control
            </Button>
          )}
        </div>
      </Card>
      
      {/* Tabla de control */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Stock Sistema
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Stock Físico
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Diferencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase no-print">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map(item => (
                    <tr key={item.producto_id} className={item.contado ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 text-sm">
                        {item.producto?.codigo}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.producto?.nombre}
                          </div>
                          {item.producto?.descripcion && (
                            <div className="text-sm text-gray-500">
                              {item.producto.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium">
                          {item.stock_sistema}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.stock_fisico ?? ''}
                          onChange={e => esAdmin && actualizarConteo(item.producto_id, e.target.value)}
                          disabled={!esAdmin}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md no-print"
                          min="0"
                          step="0.001"
                          placeholder="-"
                        />
                        <span className="hidden print:inline">
                          {item.stock_fisico ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.contado && item.diferencia !== null ? (
                          <span className={`font-medium ${
                            item.diferencia > 0 
                              ? 'text-green-600' 
                              : item.diferencia < 0 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                          }`}>
                            {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 no-print">
                        <input
                          type="text"
                          value={item.observaciones}
                          onChange={(e) => actualizarObservaciones(item.producto_id, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          placeholder="Observaciones..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Acciones */}
            {estadisticas.productosContados > 0 && (
              <div className="mt-6 flex justify-end space-x-3 no-print">
                <Button
                  color="secondary"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de cancelar el control? Se perderán todos los conteos.')) {
                      setProductosConteo([]);
                      setControlActivo(null);
                      inicializarControl();
                    }
                  }}
                >
                  Cancelar Control
                </Button>
                
                {esAdmin && (
                  <Button
                    color="primary"
                    onClick={() => setShowConfirmDialog(true)}
                    icon={<FaSave />}
                    disabled={guardando}
                  >
                    Aplicar Ajustes ({estadisticas.diferenciasEncontradas})
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* Componente de impresión (oculto) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, height: 0, overflow: 'hidden' }}>
        <ReporteImpresion
          ref={componentRef}
          sucursalNombre={sucursalSeleccionada?.nombre}
          fecha={fecha}
          hora={hora}
          usuarioNombre={usuarioNombre}
          controlActivo={controlActivo}
          modoConteo={modoConteo}
          filtroCategoria={filtroCategoria}
          categorias={categorias}
          productosFiltrados={productosFiltrados}
          estadisticas={estadisticas}
        />
      </div>
      
      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Aplicar Ajustes de Inventario"
        message={
          <div>
            <p>¿Estás seguro de aplicar los ajustes de inventario?</p>
            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                Se aplicarán <strong>{estadisticas.diferenciasEncontradas}</strong> ajustes
                con un valor total de <strong>${estadisticas.valorDiferencia.toFixed(2)}</strong>
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </p>
          </div>
        }
        confirmText="Aplicar Ajustes"
        cancelText="Cancelar"
        onConfirm={aplicarAjustes}
        onCancel={() => setShowConfirmDialog(false)}
        confirmColor="primary"
        loading={guardando}
      />
    </div>
  );
};

export default ControlStock;