// src/components/common/ProtectedRoute.js - VERSIÓN CON SEGURIDAD MEJORADA

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from './Spinner';

/**
 * Componente para proteger rutas que requieren autenticación
 * Versión mejorada con validaciones de seguridad adicionales
 */
const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // VALIDACIÓN CRÍTICA 1: Usuario no autenticado
  if (!isAuthenticated || !currentUser) {
    console.log('🚫 ProtectedRoute: Usuario no autenticado, redirigiendo a login');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // VALIDACIÓN CRÍTICA 2: Usuario sin datos válidos
  if (!currentUser.id || !currentUser.email) {
    console.log('🚫 ProtectedRoute: Usuario sin datos válidos, redirigiendo a login');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // VALIDACIÓN CRÍTICA 3: Usuario inactivo
  if (currentUser.activo === false) {
    console.log('🚫 ProtectedRoute: Usuario inactivo');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cuenta Inactiva</h1>
          <p className="text-gray-600 mb-4">
            Su cuenta ha sido desactivada. Por favor, contacte al administrador del sistema.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  // VALIDACIÓN OPCIONAL: Rol requerido
  if (requiredRole && currentUser.rol !== requiredRole) {
    console.log(`🚫 ProtectedRoute: Rol insuficiente. Requerido: ${requiredRole}, Actual: ${currentUser.rol}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">
            No tiene permisos suficientes para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Rol requerido: <strong>{requiredRole}</strong><br />
            Su rol actual: <strong>{currentUser.rol}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // VALIDACIÓN OPCIONAL: Permiso específico requerido
  if (requiredPermission) {
    const [modulo, accion] = requiredPermission.split('.');
    const tienePermiso = currentUser.rol === 'Administrador' || 
                        currentUser.permisos?.[modulo]?.[accion];
    
    if (!tienePermiso) {
      console.log(`🚫 ProtectedRoute: Permiso insuficiente. Requerido: ${requiredPermission}`);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Permiso Requerido</h1>
            <p className="text-gray-600 mb-4">
              No tiene permisos para realizar esta acción.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Permiso requerido: <strong>{requiredPermission}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  // DEPURACIÓN: Log de acceso exitoso
  console.log(`✅ ProtectedRoute: Acceso autorizado para ${currentUser.email} (${currentUser.rol})`);

  // Si todas las validaciones pasan, renderizar el contenido protegido
  return children;
};

export default ProtectedRoute;