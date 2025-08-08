// src/components/common/SucursalSelector.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaStore } from 'react-icons/fa';

/**
 * Componente selector de sucursal
 */
const SucursalSelector = () => {
  const { 
    sucursalSeleccionada, 
    sucursalesDisponibles, 
    cambiarSucursal, 
    loadingSucursales 
  } = useAuth();

  // Si no hay sucursales o está cargando, no mostrar nada
  if (loadingSucursales || sucursalesDisponibles.length === 0) {
    return null;
  }

  // MODIFICADO: Siempre mostrar el selector, incluso con una sola sucursal
  // Esto te permitirá ver si hay un problema con la carga de sucursales
  return (
    <div className="flex items-center">
      <FaStore className="mr-2 text-gray-500" />
      <select
        value={sucursalSeleccionada?.id || ''}
        onChange={(e) => cambiarSucursal(e.target.value)}
        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">Seleccionar sucursal...</option>
        {sucursalesDisponibles.map(sucursal => (
          <option key={sucursal.id} value={sucursal.id}>
            {sucursal.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SucursalSelector;