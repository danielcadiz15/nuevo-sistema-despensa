/**
 * Componente Header mejorado
 * Muestra el nombre de la empresa desde la configuración
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import configuracionService from '../../services/configuracion.service';
import SucursalSelector from '../common/SucursalSelector';

import { 
  FaBars, FaTimes, FaUser, FaSignOutAlt, FaStore,
  FaCog, FaBuilding
} from 'react-icons/fa';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout, sucursalSeleccionada } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Determinar qué nombre mostrar
  const nombreEmpresa = empresaConfig?.nombre_fantasia || 
                       empresaConfig?.razon_social || 
                       'Sistema de Gestión';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Botón de menú y logo/nombre */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            >
              {isSidebarOpen ? <FaTimes size={20} className="sm:w-6" /> : <FaBars size={20} className="sm:w-6" />}
            </button>
            
            <div className="flex items-center ml-2 sm:ml-4">
              {/* Logo si existe */}
              {empresaConfig?.mostrar_logo && empresaConfig?.logo_url && (
                <img 
                  src={empresaConfig.logo_url} 
                  alt="Logo" 
                  className="h-6 w-auto mr-2 sm:h-8 sm:mr-3"
                  style={{ maxHeight: '32px' }}
                />
              )}
              
              {/* Nombre de la empresa */}
              <Link to="/" className="flex items-center">
				<span className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-none">
                  {cargandoConfig ? (
                    <span className="animate-pulse">Cargando...</span>
                  ) : (
                    nombreEmpresa
                  )}
                </span>
              </Link>
            </div>
          </div>

          {/* Información de usuario y sucursal */}
			<div className="flex items-center space-x-4">
			  {/* Selector de sucursal */}
			  <SucursalSelector />

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {currentUser?.nombre ? currentUser.nombre[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden ml-3 text-gray-700 text-sm font-medium lg:block">
                  {currentUser?.nombre || currentUser?.email}
                </span>
              </button>

              {/* Dropdown del usuario */}
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b">
                    {currentUser?.email}
                  </div>
                  
                  <Link
                    to="/perfil"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FaUser className="inline mr-2" />
                    Mi Perfil
                  </Link>
                  
                  <Link
                    to="/configuracion/empresa"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FaCog className="inline mr-2" />
                    Configuración
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;