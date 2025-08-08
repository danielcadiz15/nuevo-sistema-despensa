/**
 * Página de gestión de stock por sucursal
 * 
 * Muestra el listado de productos con su inventario en la sucursal seleccionada
 * y permite realizar ajustes, transferencias y consultar movimientos.
 * 
 * @module pages/stock/Stock
 * @requires react, react-router-dom, ../../services/stock-sucursal.service
 * @related_files ./AjusteStock.js, ./TransferenciaStock.js
 */
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';

// Servicios
import stockSucursalService from '../../services/stock-sucursal.service';
import productosService from '../../services/productos.service';

// Componentes
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Table from '../../components/common/Table';
import SearchBar from '../../components/common/SearchBar';

// Iconos
import { 
  FaBoxOpen, FaSearch, FaEdit, FaHistory, 
  FaExclamationTriangle, FaFilter, FaStore,
  FaExchangeAlt, FaPlus, FaSyncAlt, FaMoneyBillWave
} from 'react-icons/fa';

// Componente de impresión para el listado de stock
const ReporteStockSucursal = React.forwardRef(({ sucursal, productos }, ref) => {
  console.log('[DEBUG] ReporteStockSucursal render, ref:', ref, 'sucursal:', sucursal, 'productos:', productos?.length);
  return (
    <div ref={ref} className="p-8 bg-white" style={{ width: '100%' }}>
      <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-bold">Listado de Stock</h1>
        <p className="text-lg mt-2">{sucursal?.nombre || 'Sucursal'}</p>
        <p className="text-sm text-gray-600">Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
      </div>
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left text-sm">Código</th>
            <th className="border p-2 text-left text-sm">Producto</th>
            <th className="border p-2 text-center text-sm">Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((item, idx) => (
            <tr key={item.producto_id || idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="border p-2 text-sm">{item.producto?.codigo || item.codigo}</td>
              <td className="border p-2 text-sm">{item.producto?.nombre || item.nombre}</td>
              <td className="border p-2 text-center text-sm">{item.cantidad ?? item.stock ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8 pt-4 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm">Firma del Responsable</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm">Firma del Vendedor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Componente de página para gestión de stock por sucursal
 * @returns {JSX.Element} Componente Stock
 */
const Stock = () => {
  const navigate = useNavigate();
  const { sucursalSeleccionada, sucursalesDisponibles } = useAuth();
  const location = useLocation();

  // Mover hooks aquí, al inicio del componente
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const componentRef = useRef();
  console.log('[DEBUG] componentRef inicial:', componentRef);
  const handlePrint = useReactToPrint({
    content: () => {
      console.log('[DEBUG] handlePrint content ref:', componentRef.current);
      return componentRef.current;
    },
    documentTitle: `Stock_${sucursalSeleccionada?.nombre || 'Sucursal'}_${new Date().toLocaleDateString()}`,
    onAfterPrint: () => setMostrarReporte(false)
  });
  const onImprimirClick = () => {
    console.log('[DEBUG] onImprimirClick: mostrarReporte antes:', mostrarReporte);
    setMostrarReporte(true);
    setTimeout(() => {
      console.log('[DEBUG] onImprimirClick: llamando handlePrint, ref:', componentRef.current);
      handlePrint();
    }, 100);
  };

  // Estado
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockBajoFiltro, setStockBajoFiltro] = useState(false);
  const [resumenStock, setResumenStock] = useState(null);
  
  /**
   * Carga inicial de datos cuando cambia la sucursal
   */
  useEffect(() => {
  if (sucursalSeleccionada) {
    cargarStock();
    cargarResumenStock();
  }
}, [sucursalSeleccionada]);
	useEffect(() => {
	  if (productos.length > 0) {
		cargarResumenStock();
	  }
	}, [productos, sucursalSeleccionada]);

// Agregar este nuevo useEffect para detectar actualizaciones
	useEffect(() => {
	  if (location.state?.updated) {
		cargarStock();
		cargarResumenStock();
		// Limpiar el state para evitar recargas innecesarias
		window.history.replaceState({}, document.title);
	  }
	}, [location.state]);
  
  /**
   * Carga el stock de la sucursal actual
   */
  const cargarStock = async () => {
    try {
      setLoading(true);
      const data = await stockSucursalService.obtenerStockPorSucursal(sucursalSeleccionada.id);
      setProductos(data);
      setStockBajoFiltro(false);
    } catch (error) {
      console.error('Error al cargar stock:', error);
      toast.error('Error al cargar el inventario de la sucursal');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Carga resumen de stock de la sucursal
   */
  const cargarResumenStock = async () => {
    try {
      // Obtener stock bajo
      const stockBajo = await stockSucursalService.obtenerStockBajo(sucursalSeleccionada.id);
      
      setResumenStock({
        totalProductos: productos.length,
        stockBajo: stockBajo.length,
        valorTotal: productos.reduce((total, p) => total + (p.cantidad * p.producto?.precio_costo || 0), 0)
      });
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };
  
  /**
   * Carga solo productos con stock bajo
   */
  const cargarStockBajo = async () => {
    try {
      setLoading(true);
      const data = await stockSucursalService.obtenerStockBajo(sucursalSeleccionada.id);
      setProductos(data);
      setStockBajoFiltro(true);
    } catch (error) {
      console.error('Error al cargar productos con stock bajo:', error);
      toast.error('Error al cargar los productos con stock bajo');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Busca productos por término en la sucursal actual
   */
  const buscarProductos = async () => {
    try {
      setLoading(true);
      
      if (!searchTerm.trim()) {
        await cargarStock();
        return;
      }
      
      // Primero obtener todos los productos del stock
      const stockCompleto = await stockSucursalService.obtenerStockPorSucursal(sucursalSeleccionada.id);
      
      // Filtrar localmente por término de búsqueda
      const terminoLower = searchTerm.toLowerCase();
      const productosFiltrados = stockCompleto.filter(item => 
        item.producto?.nombre?.toLowerCase().includes(terminoLower) ||
        item.producto?.codigo?.toLowerCase().includes(terminoLower)
      );
      
      setProductos(productosFiltrados);
      setStockBajoFiltro(false);
    } catch (error) {
      console.error('Error al buscar productos:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Alterna el filtro de stock bajo
   */
  const toggleStockBajoFilter = () => {
    if (stockBajoFiltro) {
      cargarStock();
    } else {
      cargarStockBajo();
    }
  };
  
  /**
   * Navega a la página de ajuste de stock
   * @param {Object} stockItem - Item de stock con producto
   */
  const irAjustarStock = (stockItem) => {
    navigate(`/stock/ajuste/${stockItem.producto_id}`, {
      state: { 
        stockItem,
        sucursalId: sucursalSeleccionada.id 
      }
    });
  };
  
  /**
   * Navega a la página de transferencia entre sucursales
   */
  const irATransferencias = () => {
    navigate('/stock/transferencias');
  };
  
  /**
   * Ver historial de movimientos de un producto
   * @param {string} productoId - ID del producto
   */
  const verHistorialMovimientos = (productoId) => {
    navigate(`/stock/movimientos/${productoId}`, {
      state: { sucursalId: sucursalSeleccionada.id }
    });
  };
  
  /**
   * Inicializa stock para productos nuevos
   */
  const inicializarStock = () => {
    navigate('/stock/inicializar');
  };
  
  /**
   * Columnas para la tabla de stock
   */
  const columns = [
    {
      header: 'Código',
      accessor: 'producto.codigo',
      cell: (row) => (
        <span className="font-medium">{row.producto?.codigo || 'N/A'}</span>
      )
    },
    {
      header: 'Producto',
      accessor: 'producto.nombre',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.producto?.nombre || 'Producto no encontrado'}</div>
          <div className="text-sm text-gray-500">
            {row.producto?.descripcion || ''}
          </div>
        </div>
      )
    },
    {
      header: 'Stock Actual',
      accessor: 'cantidad',
      cell: (row) => {
        // Determinar color según nivel de stock
        let stockClass = 'text-green-600 bg-green-100';
        
        if (row.cantidad <= row.stock_minimo) {
          stockClass = 'text-red-600 bg-red-100';
        } else if (row.cantidad <= row.stock_minimo * 1.5) {
          stockClass = 'text-yellow-600 bg-yellow-100';
        }
        
        return (
          <div className="text-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockClass}`}>
              {row.cantidad}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Stock Mínimo',
      accessor: 'stock_minimo',
      cell: (row) => (
        <div className="text-center">
          <span className="text-gray-600">
            {row.stock_minimo}
          </span>
        </div>
      )
    },
    {
      header: 'Valor',
      accessor: 'valor',
      cell: (row) => (
        <div className="text-right">
          <span className="text-gray-600">
            ${((row.cantidad || 0) * (row.producto?.precio_costo || 0)).toFixed(2)}
          </span>
        </div>
      )
    },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => irAjustarStock(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Ajustar stock"
          >
            <FaEdit />
          </button>
          
          <button
            onClick={() => verHistorialMovimientos(row.producto_id)}
            className="text-purple-600 hover:text-purple-800"
            title="Ver historial de movimientos"
          >
            <FaHistory />
          </button>
        </div>
      )
    }
  ];

  // Si no hay sucursal seleccionada
  if (!sucursalSeleccionada) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <FaStore className="mx-auto text-4xl text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            No hay sucursal seleccionada
          </h3>
          <p className="text-gray-500">
            Por favor, selecciona una sucursal desde el menú superior
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Inventario
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            <FaStore className="inline mr-1" />
            {sucursalSeleccionada.nombre}
          </p>
        </div>
        
        <div className="flex space-x-2">
          
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      {resumenStock && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-800 font-medium">Total Productos</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {resumenStock.totalProductos}
                </p>
              </div>
              <FaBoxOpen className="text-4xl text-blue-300" />
            </div>
          </Card>
          
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-800 font-medium">Stock Bajo</h3>
                <p className="text-2xl font-bold text-red-900">
                  {resumenStock.stockBajo}
                </p>
              </div>
              <FaExclamationTriangle className="text-4xl text-red-300" />
            </div>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-800 font-medium">Valor Total</h3>
                <p className="text-2xl font-bold text-green-900">
                  ${resumenStock.valorTotal.toFixed(2)}
                </p>
              </div>
              <FaMoneyBillWave className="text-4xl text-green-300" />
            </div>
          </Card>
        </div>
      )}
      
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <SearchBar
              placeholder="Buscar productos en esta sucursal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={buscarProductos}
              onClear={() => {
                setSearchTerm('');
                cargarStock();
              }}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              color="secondary"
              onClick={cargarStock}
              icon={<FaSyncAlt />}
            >
              Actualizar
            </Button>
            
            <Button
              color={stockBajoFiltro ? "primary" : "secondary"}
              onClick={toggleStockBajoFilter}
              icon={<FaExclamationTriangle />}
            >
              {stockBajoFiltro ? "Ver todos" : "Stock bajo"}
            </Button>
            <Button color="primary" onClick={onImprimirClick} className="mb-4">
              Imprimir listado
            </Button>
          </div>
        </div>
      </Card>
      
      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {productos.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <FaBoxOpen className="mx-auto text-4xl text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  {searchTerm 
                    ? 'No se encontraron productos'
                    : stockBajoFiltro
                      ? 'No hay productos con stock bajo'
                      : 'No hay productos en esta sucursal'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? 'Intenta con otros términos de búsqueda'
                    : stockBajoFiltro
                      ? 'Todos los productos tienen stock suficiente'
                      : 'Inicializa el stock de productos para esta sucursal'}
                </p>
                
                {!searchTerm && !stockBajoFiltro && (
                  <div className="mt-4">
                    <Button
                      color="primary"
                      icon={<FaPlus />}
                      onClick={inicializarStock}
                    >
                      Inicializar Stock
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={productos}
                pagination={true}
                itemsPerPage={15}
              />
            )}
          </>
        )}
      </Card>
      {mostrarReporte && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, height: 0, overflow: 'hidden' }}>
          <ReporteStockSucursal ref={componentRef} sucursal={sucursalSeleccionada} productos={productos} />
        </div>
      )}
    </div>
  );
};

export default Stock;