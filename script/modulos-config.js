// src/config/ModulosConfig.js
// Configuración dinámica de módulos por empresa

import { 
  FaBox, FaShoppingCart, FaUsers, FaTruck, FaCar, 
  FaIndustry, FaChartBar, FaCog, FaExchangeAlt
} from 'react-icons/fa';

// Configuración de todos los módulos disponibles
export const MODULOS_SISTEMA = {
  // Módulos Core (siempre activos)
  core: {
    id: 'core',
    nombre: 'Core',
    descripcion: 'Funcionalidades básicas del sistema',
    requerido: true,
    rutas: [
      { path: '/', nombre: 'Dashboard' },
      { path: '/productos', nombre: 'Productos', icono: FaBox },
      { path: '/ventas', nombre: 'Ventas', icono: FaShoppingCart },
      { path: '/punto-venta', nombre: 'Punto de Venta', icono: FaShoppingCart },
      { path: '/clientes', nombre: 'Clientes', icono: FaUsers },
      { path: '/stock', nombre: 'Stock', icono: FaBox }
    ]
  },
  
  // Módulos Opcionales
  compras: {
    id: 'compras',
    nombre: 'Compras y Proveedores',
    descripcion: 'Gestión de compras y proveedores',
    requerido: false,
    rutas: [
      { path: '/compras', nombre: 'Compras', icono: FaShoppingCart },
      { path: '/proveedores', nombre: 'Proveedores', icono: FaTruck }
    ],
    configuracion: {
      manejaGastos: true,
      requiereAprobacion: false
    }
  },
  
  vehiculos: {
    id: 'vehiculos',
    nombre: 'Control de Vehículos',
    descripcion: 'Gestión de flota vehicular',
    requerido: false,
    rutas: [
      { path: '/vehiculos', nombre: 'Vehículos', icono: FaCar }
    ],
    configuracion: {
      controlaSeguro: true,
      controlaMantenimiento: true
    }
  },
  
  produccion: {
    id: 'produccion',
    nombre: 'Producción',
    descripcion: 'Control de producción y recetas',
    requerido: false,
    rutas: [
      { path: '/materias-primas', nombre: 'Materias Primas', icono: FaBox },
      { path: '/recetas', nombre: 'Recetas', icono: FaIndustry },
      { path: '/produccion', nombre: 'Producción', icono: FaIndustry }
    ],
    configuracion: {
      controlaLotes: false,
      calculaCostos: true
    }
  },
  
  reportes: {
    id: 'reportes',
    nombre: 'Reportes Avanzados',
    descripcion: 'Reportes y análisis detallados',
    requerido: false,
    rutas: [
      { path: '/reportes', nombre: 'Reportes', icono: FaChartBar }
    ]
  },
  
  transferencias: {
    id: 'transferencias',
    nombre: 'Transferencias',
    descripcion: 'Transferencias entre sucursales',
    requerido: false,
    rutas: [
      { path: '/transferencias', nombre: 'Transferencias', icono: FaExchangeAlt }
    ],
    dependencias: ['core'] // Requiere múltiples sucursales
  }
};

// Clase para gestionar los módulos activos
export class GestorModulos {
  constructor(modulosActivos = ['core']) {
    this.modulosActivos = new Set(modulosActivos);
    this.configuracion = {};
  }
  
  // Verificar si un módulo está activo
  estaActivo(moduloId) {
    return this.modulosActivos.has(moduloId);
  }
  
  // Obtener rutas activas para el menú
  obtenerRutasMenu() {
    const rutas = [];
    
    for (const [moduloId, modulo] of Object.entries(MODULOS_SISTEMA)) {
      if (this.estaActivo(moduloId)) {
        rutas.push(...modulo.rutas);
      }
    }
    
    return rutas;
  }
  
  // Obtener configuración de un módulo
  obtenerConfiguracion(moduloId) {
    return this.configuracion[moduloId] || MODULOS_SISTEMA[moduloId]?.configuracion || {};
  }
  
  // Activar un módulo
  activarModulo(moduloId) {
    if (MODULOS_SISTEMA[moduloId]) {
      this.modulosActivos.add(moduloId);
      
      // Activar dependencias si las hay
      const dependencias = MODULOS_SISTEMA[moduloId].dependencias || [];
      dependencias.forEach(dep => this.activarModulo(dep));
    }
  }
  
  // Desactivar un módulo
  desactivarModulo(moduloId) {
    // No permitir desactivar módulos requeridos
    if (MODULOS_SISTEMA[moduloId]?.requerido) {
      return false;
    }
    
    this.modulosActivos.delete(moduloId);
    return true;
  }
  
  // Obtener lista de módulos disponibles para activar
  obtenerModulosDisponibles() {
    return Object.entries(MODULOS_SISTEMA)
      .filter(([id, modulo]) => !modulo.requerido && !this.estaActivo(id))
      .map(([id, modulo]) => ({ id, ...modulo }));
  }
  
  // Exportar configuración
  exportarConfiguracion() {
    return {
      modulosActivos: Array.from(this.modulosActivos),
      configuracion: this.configuracion
    };
  }
  
  // Importar configuración
  importarConfiguracion(config) {
    this.modulosActivos = new Set(config.modulosActivos || ['core']);
    this.configuracion = config.configuracion || {};
  }
}

// Hook para usar en componentes React
import { useState, useEffect } from 'react';

export function useModulos() {
  const [gestor, setGestor] = useState(null);
  
  useEffect(() => {
    // Cargar configuración desde localStorage o API
    const modulosGuardados = localStorage.getItem('modulosActivos');
    const modulos = modulosGuardados ? JSON.parse(modulosGuardados) : ['core', 'compras'];
    
    const nuevoGestor = new GestorModulos(modulos);
    setGestor(nuevoGestor);
  }, []);
  
  const guardarModulos = (nuevosModulos) => {
    localStorage.setItem('modulosActivos', JSON.stringify(nuevosModulos));
  };
  
  return {
    gestor,
    estaActivo: (moduloId) => gestor?.estaActivo(moduloId) || false,
    rutasMenu: gestor?.obtenerRutasMenu() || [],
    activarModulo: (moduloId) => {
      if (gestor) {
        gestor.activarModulo(moduloId);
        guardarModulos(Array.from(gestor.modulosActivos));
        setGestor(new GestorModulos(Array.from(gestor.modulosActivos)));
      }
    },
    desactivarModulo: (moduloId) => {
      if (gestor && gestor.desactivarModulo(moduloId)) {
        guardarModulos(Array.from(gestor.modulosActivos));
        setGestor(new GestorModulos(Array.from(gestor.modulosActivos)));
      }
    }
  };
}