/**
 * Componente Sidebar actualizado
 * Muestra el nombre de la empresa desde la configuración
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import configuracionService from '../../services/configuracion.service';
import {
  FaHome, FaBox, FaShoppingCart, FaUsers, FaChartBar,
  FaTag, FaCog, FaStore, FaClipboardList, FaTruck,
  FaWarehouse, FaMoneyBillWave, FaExchangeAlt, FaUndo,
  FaDollarSign, FaClipboardCheck, FaUserShield, FaFlask,
  FaBook, FaIndustry, FaChevronDown, FaCar, FaChevronRight,
  FaBuilding, FaTimes
} from 'react-icons/fa';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { currentUser, hasPermission } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [empresaConfig, setEmpresaConfig] = useState(null);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  // Cargar configuración de empresa
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const config = await configuracionService.obtener();
        setEmpresaConfig(config);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setCargandoConfig(false);
      }
    };

    cargarConfiguracion();
  }, []);

  // Determinar qué nombre mostrar
  const nombreEmpresa = empresaConfig?.nombre_fantasia || 
                       empresaConfig?.razon_social || 
                       'Sistema';

  const toggleSubmenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const menuItems = [
    { 
      path: '/', 
      icon: FaHome, 
      label: 'Dashboard',
      permission: null
    },
    {
      icon: FaBox,
      label: 'Productos',
      permission: 'productos',
      submenu: [
        { path: '/productos', label: 'Lista de Productos', permission: 'productos.ver' },
        { path: '/productos/nuevo', label: 'Nuevo Producto', permission: 'productos.crear' },
        { path: '/categorias', label: 'Categorías', permission: 'categorias.ver' },
        { path: '/listas-precios', label: 'Listas de Precios', permission: 'listas_precios.ver' }
      ]
    },
    {
      icon: FaFlask,
      label: 'Producción',
      permission: 'produccion',
      submenu: [
        { path: '/materias-primas', label: 'Materias Primas', permission: 'materias_primas.ver' },
        { path: '/recetas', label: 'Recetas', permission: 'recetas.ver' },
        { path: '/produccion', label: 'Órdenes de Producción', permission: 'produccion.ver' }
      ]
    },
    {
      icon: FaShoppingCart,
      label: 'Ventas',
      permission: 'ventas',
      submenu: [
        { path: '/punto-venta', label: 'Punto de Venta', permission: 'ventas.crear' },
        { path: '/ventas', label: 'Lista de Ventas', permission: 'ventas.ver' },
        { path: '/devoluciones', label: 'Devoluciones', permission: 'devoluciones.ver' },
        { path: '/ventas-eliminadas', label: 'Ventas Eliminadas', permission: 'ventas.ver', adminOnly: true }
      ]
    },
    {
      icon: FaTruck,
      label: 'Compras',
      permission: 'compras',
      submenu: [
        { path: '/compras', label: 'Lista de Compras', permission: 'compras.ver' },
        { path: '/compras/nueva', label: 'Nueva Compra', permission: 'compras.crear' },
        { path: '/proveedores', label: 'Proveedores', permission: 'proveedores.ver' }
      ]
    },
    {
      icon: FaWarehouse,
      label: 'Inventario',
      permission: 'stock',
      submenu: [
        { path: '/stock', label: 'Stock por Sucursal', permission: 'stock.ver' },
        { path: '/stock/transferencias', label: 'Transferencias', permission: 'transferencias.ver' },
        { path: '/stock/ajustes', label: 'Ajustes de Stock', permission: 'stock.ajustar' },
        // NUEVO: Control de Stock visible para todos
        { path: '/stock/control', label: 'Control de Stock', permission: null }
      ]
    },
    {
      icon: FaMoneyBillWave,
      label: 'Finanzas',
      permission: null, // <-- Quitar restricción de permiso para mostrar a todos
      submenu: [
        { path: '/caja', label: 'Caja', permission: null }, // <-- Quitar restricción de permiso
        { path: '/gastos', label: 'Gastos', permission: 'gastos.ver' },
        { path: '/transferencias', label: 'Transferencias', permission: 'transferencias.ver' }
      ]
    },
    {
      icon: FaUsers,
      label: 'Clientes',
      permission: 'clientes',
      submenu: [
        { path: '/clientes', label: 'Lista de Clientes', permission: 'clientes.ver' },
        { path: '/clientes/nuevo', label: 'Nuevo Cliente', permission: 'clientes.crear' }
      ]
    },
    {
      icon: FaTag,
      label: 'Promociones',
      permission: 'promociones',
      submenu: [
        { path: '/promociones', label: 'Lista de Promociones', permission: 'promociones.ver' },
        { path: '/promociones/nueva', label: 'Nueva Promoción', permission: 'promociones.crear' }
      ]
    },
    {
      icon: FaChartBar,
      label: 'Reportes',
      permission: 'reportes',
      submenu: [
        { path: '/reportes/ventas', label: 'Reporte de Ventas', permission: 'reportes.ventas' },
        { path: '/reportes/compras', label: 'Reporte de Compras', permission: 'reportes.compras' },
        { path: '/reportes/ganancias', label: 'Reporte de Ganancias', permission: 'reportes.ganancias' }
      ]
    },
    {
      icon: FaUserShield,
      label: 'Usuarios',
      permission: 'usuarios',
      submenu: [
        { path: '/usuarios', label: 'Lista de Usuarios', permission: 'usuarios.ver' },
        { path: '/usuarios/nuevo', label: 'Nuevo Usuario', permission: 'usuarios.crear' },
        { path: '/usuarios/permisos', label: 'Gestión de Permisos', permission: 'usuarios.editar' }
      ]
    },
    {
      path: '/vehiculos',
      label: 'Vehículos',
      icon: FaCar,
      roles: ['admin', 'empleado']
    },
    {
      icon: FaCog,
      label: 'Configuración',
      permission: 'configuracion',
      submenu: [
        { path: '/sucursales', label: 'Sucursales', permission: 'sucursales.ver' },
        { path: '/configuracion/empresa', label: 'Datos Empresa', permission: 'configuracion.ver' },
        { path: '/auditoria', label: 'Auditoría', permission: 'auditoria.ver' }
      ]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    if (currentUser?.rol === 'Administrador') return true;
    
    if (item.submenu) {
      return item.submenu.some(subitem => 
        hasPermission(subitem.permission.split('.')[0], subitem.permission.split('.')[1])
      );
    }
    
    return hasPermission(item.permission, 'ver');
  });

  const isActive = (path) => location.pathname === path;
  const isParentActive = (submenu) => submenu?.some(item => location.pathname === item.path);

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header del Sidebar con nombre de empresa */}
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              {empresaConfig?.mostrar_logo && empresaConfig?.logo_url ? (
                <img 
                  src={empresaConfig.logo_url} 
                  alt="Logo" 
                  className="h-6 w-auto mr-2 sm:h-8 sm:mr-3"
                  style={{ maxHeight: '32px', filter: 'brightness(0) invert(1)' }}
                />
              ) : (
                <FaBuilding className="text-indigo-400 mr-2 sm:mr-3" size={20} />
              )}
              <span className="text-lg sm:text-xl font-semibold truncate">
                {cargandoConfig ? (
                  <span className="animate-pulse">Cargando...</span>
                ) : (
                  nombreEmpresa
                )}
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <FaTimes size={18} className="sm:w-5" />
            </button>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 overflow-y-auto py-4">
            {filteredMenuItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`
                        w-full flex items-center justify-between px-4 py-2
                        hover:bg-gray-800 transition-colors duration-200
                        ${isParentActive(item.submenu) ? 'bg-gray-800 border-l-4 border-indigo-500' : ''}
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3" size={20} />
                        <span>{item.label}</span>
                      </div>
                      {expandedMenus[item.label] ? 
                        <FaChevronDown size={12} /> : 
                        <FaChevronRight size={12} />
                      }
                    </button>
                    
                    {expandedMenus[item.label] && (
                      <div className="bg-gray-800">
                        {item.submenu.map((subitem, subindex) => (
                          <Link
                            key={subindex}
                            to={subitem.path}
                            className={`
                              block pl-12 pr-4 py-2 text-sm
                              hover:bg-gray-700 transition-colors duration-200
                              ${isActive(subitem.path) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}
                            `}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-4 py-2
                      hover:bg-gray-800 transition-colors duration-200
                      ${isActive(item.path) ? 'bg-gray-800 border-l-4 border-indigo-500' : ''}
                    `}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <item.icon className="mr-3" size={20} />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              {empresaConfig?.slogan && (
                <p className="mb-2 italic">{empresaConfig.slogan}</p>
              )}
              <p>© 2024 {nombreEmpresa}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;