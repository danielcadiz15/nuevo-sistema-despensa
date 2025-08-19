// src/contexts/AuthContext.js - VERSION MEJORADA CON PERMISOS GRANULARES

import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getIdToken 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'react-toastify';
import sucursalesService from '../services/sucursales.service';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estado para sucursal seleccionada
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // NUEVO: Estado para permisos efectivos
  const [permisosEfectivos, setPermisosEfectivos] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener custom claims (roles)
          const tokenResult = await firebaseUser.getIdTokenResult();
          const customClaims = tokenResult.claims;
          
          // Obtener datos adicionales del usuario desde Firestore
          let userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            nombre: customClaims.nombre || firebaseUser.displayName || 'Usuario',
            apellido: customClaims.apellido || '',
            rol: customClaims.rol || 'Usuario',
            rolId: customClaims.rolId || '1',
            permisos: customClaims.permisos || {},
            activo: customClaims.activo !== false,
            customClaims: customClaims,
            sucursales: customClaims.sucursales || []
          };

          // MEJORADO: Intentar obtener datos mas completos desde Firestore
          try {
            const userDoc = await doc(db, 'usuarios', firebaseUser.uid);
            const userSnapshot = await getDoc(userDoc);
            
            if (userSnapshot.exists()) {
              const firestoreData = userSnapshot.data();
              console.log('?? [AUTH] Datos de Firestore:', firestoreData);
              
              // Combinar datos de custom claims con Firestore
              userData = {
                ...userData,
                nombre: firestoreData.nombre || userData.nombre,
                apellido: firestoreData.apellido || userData.apellido,
                rol: firestoreData.rol || userData.rol,
                rolId: firestoreData.rol_id || userData.rolId,
                permisos: firestoreData.permisos || userData.permisos,
                sucursales: firestoreData.sucursales || userData.sucursales,
                activo: firestoreData.activo !== false
              };
            }
          } catch (firestoreError) {
            console.warn('?? [AUTH] No se pudieron obtener datos de Firestore:', firestoreError.message);
          }
          
          console.log('? [AUTH] Usuario autenticado:', {
            id: userData.id,
            email: userData.email,
            nombre: userData.nombre,
            rol: userData.rol,
            permisosCount: Object.keys(userData.permisos).length
          });
          
          setCurrentUser(userData);
          setIsAuthenticated(true);
          
          // Calcular permisos efectivos
          calcularPermisosEfectivos(userData);
          
          // Cargar sucursales disponibles para el usuario
          await cargarSucursalesUsuario(userData);
          
        } catch (error) {
          console.error('? [AUTH] Error obteniendo datos de usuario:', error);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setPermisosEfectivos({});
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setSucursalSeleccionada(null);
        setSucursalesDisponibles([]);
        setPermisosEfectivos({});
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Calcula los permisos efectivos del usuario
   * @param {Object} usuario - Datos del usuario
   */
  const calcularPermisosEfectivos = (usuario) => {
    try {
      console.log('🔐 [AUTH] Calculando permisos efectivos para usuario:', {
        id: usuario?.id,
        email: usuario?.email,
        rol: usuario?.rol,
        rolId: usuario?.rolId
      });
      
      // Permisos base segun el rol
      let permisosBase = {};
      
      if (usuario.rol === 'Administrador' || usuario.rol === 'admin' || usuario.rolId === 'admin') {
        console.log('🔐 [AUTH] Usuario es administrador, asignando todos los permisos');
        // Administrador tiene todos los permisos
        permisosBase = {
          productos: { ver: true, crear: true, editar: true, eliminar: true },
          categorias: { ver: true, crear: true, editar: true, eliminar: true },
          compras: { ver: true, crear: true, editar: true, eliminar: true },
          ventas: { ver: true, crear: true, editar: true, eliminar: true },
          stock: { ver: true, crear: true, editar: true, eliminar: true },
          reportes: { ver: true, crear: true, editar: true, eliminar: true },
          promociones: { ver: true, crear: true, editar: true, eliminar: true },
          usuarios: { ver: true, crear: true, editar: true, eliminar: true },
          sucursales: { ver: true, crear: true, editar: true, eliminar: true },
          materias_primas: { ver: true, crear: true, editar: true, eliminar: true },
          recetas: { ver: true, crear: true, editar: true, eliminar: true },
          produccion: { ver: true, crear: true, editar: true, eliminar: true },
          // NUEVOS MODULOS
          clientes: { ver: true, crear: true, editar: true, eliminar: true },
          caja: { ver: true, crear: true, editar: true, eliminar: true },
          gastos: { ver: true, crear: true, editar: true, eliminar: true },
          devoluciones: { ver: true, crear: true, editar: true, eliminar: true },
          listas_precios: { ver: true, crear: true, editar: true, eliminar: true },
          transferencias: { ver: true, crear: true, editar: true, eliminar: true },
          auditoria: { ver: true, crear: false, editar: false, eliminar: false },
          configuracion: { ver: true, crear: true, editar: true, eliminar: true }
        };
      } else if (usuario.rol === 'Gerente' || usuario.rolId === 'gerente') {
        console.log('🔐 [AUTH] Usuario es gerente, asignando permisos limitados');
        // Gerente tiene permisos limitados
        permisosBase = {
          productos: { ver: true, crear: true, editar: true, eliminar: false },
          categorias: { ver: true, crear: true, editar: true, eliminar: false },
          compras: { ver: true, crear: true, editar: true, eliminar: false },
          ventas: { ver: true, crear: true, editar: true, eliminar: false },
          stock: { ver: true, crear: true, editar: true, eliminar: false },
          reportes: { ver: true, crear: true, editar: true, eliminar: false },
          promociones: { ver: true, crear: true, editar: true, eliminar: false },
          usuarios: { ver: true, crear: false, editar: false, eliminar: false },
          sucursales: { ver: true, crear: false, editar: false, eliminar: false },
          materias_primas: { ver: true, crear: true, editar: true, eliminar: false },
          recetas: { ver: true, crear: true, editar: true, eliminar: false },
          produccion: { ver: true, crear: true, editar: true, eliminar: false },
          // NUEVOS MODULOS
          clientes: { ver: true, crear: true, editar: true, eliminar: false },
          caja: { ver: true, crear: true, editar: true, eliminar: false },
          gastos: { ver: true, crear: true, editar: false, eliminar: false },
          devoluciones: { ver: true, crear: true, editar: true, eliminar: false },
          listas_precios: { ver: true, crear: false, editar: false, eliminar: false },
          transferencias: { ver: true, crear: true, editar: false, eliminar: false },
          auditoria: { ver: true, crear: false, editar: false, eliminar: false },
          configuracion: { ver: true, crear: false, editar: false, eliminar: false }
        };
      } else {
        console.log('🔐 [AUTH] Usuario es empleado, asignando permisos básicos');
                 // Empleado tiene permisos basicos
         permisosBase = {
           productos: { ver: true, crear: false, editar: false, eliminar: false },
           categorias: { ver: true, crear: false, editar: false, eliminar: false },
           compras: { ver: false, crear: false, editar: false, eliminar: false },
           ventas: { ver: true, crear: true, editar: false, eliminar: false },
           stock: { ver: true, crear: false, editar: false, eliminar: false, control: { ver: true, crear: true, editar: false, eliminar: false } },
           reportes: { ver: false, crear: false, editar: false, eliminar: false },
           promociones: { ver: true, crear: false, editar: false, eliminar: false },
           usuarios: { ver: false, crear: false, editar: false, eliminar: false },
           sucursales: { ver: false, crear: false, editar: false, eliminar: false },
           materias_primas: { ver: true, crear: false, editar: false, eliminar: false },
           recetas: { ver: true, crear: false, editar: false, eliminar: false },
           produccion: { ver: true, crear: true, editar: false, eliminar: false },
           // NUEVOS MODULOS
           clientes: { ver: true, crear: true, editar: true, eliminar: false },
           caja: { ver: true, crear: true, editar: false, eliminar: false },
           gastos: { ver: false, crear: false, editar: false, eliminar: false },
           devoluciones: { ver: true, crear: false, editar: false, eliminar: false },
           listas_precios: { ver: true, crear: false, editar: false, eliminar: false },
           transferencias: { ver: false, crear: false, editar: false, eliminar: false },
           auditoria: { ver: false, crear: false, editar: false, eliminar: false },
           configuracion: { ver: false, crear: false, editar: false, eliminar: false }
         };
      }
      
      // Combinar con permisos personalizados
      const permisosPersonalizados = usuario.permisos || {};
      const permisosFinales = { ...permisosBase };
      
      // Los permisos personalizados sobrescriben los del rol
      Object.keys(permisosPersonalizados).forEach(modulo => {
        if (permisosPersonalizados[modulo]) {
          permisosFinales[modulo] = {
            ...permisosFinales[modulo],
            ...permisosPersonalizados[modulo]
          };
        }
      });
      
      console.log('🔐 [AUTH] Permisos efectivos calculados:', permisosFinales);
      setPermisosEfectivos(permisosFinales);
      
    } catch (error) {
      console.error('❌ [AUTH] Error al calcular permisos efectivos:', error);
      // En caso de error, asignar permisos mínimos
      setPermisosEfectivos({
        productos: { ver: true, crear: false, editar: false, eliminar: false },
        ventas: { ver: true, crear: true, editar: false, eliminar: false }
      });
    }
  };

  /**
   * Cargar sucursales disponibles para el usuario
   */
  const cargarSucursalesUsuario = async (usuario) => {
    try {
      setLoadingSucursales(true);
      
      let sucursales = [];
      
      if (usuario.rol === 'Administrador' || usuario.rol === 'admin' || usuario.rol === 'Admin' || usuario.rolId === 'admin') {
        // Administrador puede ver todas las sucursales
        sucursales = await sucursalesService.obtenerActivas();
      } else if (usuario.sucursales && usuario.sucursales.length > 0) {
        // Usuario normal solo ve sus sucursales asignadas
        sucursales = await sucursalesService.obtenerPorUsuario(usuario.id);
      }
      
      setSucursalesDisponibles(sucursales);
      
      // Seleccionar la primera sucursal por defecto o la guardada en localStorage
      const sucursalGuardada = localStorage.getItem('sucursalSeleccionada');
      if (sucursalGuardada) {
        const sucursal = sucursales.find(s => s.id === sucursalGuardada);
        if (sucursal) {
          setSucursalSeleccionada(sucursal);
        } else if (sucursales.length > 0) {
          setSucursalSeleccionada(sucursales[0]);
          localStorage.setItem('sucursalSeleccionada', sucursales[0].id);
        }
      } else if (sucursales.length > 0) {
        setSucursalSeleccionada(sucursales[0]);
        localStorage.setItem('sucursalSeleccionada', sucursales[0].id);
      }
      
    } catch (error) {
      console.error('? [AUTH] Error al cargar sucursales del usuario:', error);
      toast.error('Error al cargar sucursales');
    } finally {
      setLoadingSucursales(false);
    }
  };

  /**
   * Cambiar sucursal seleccionada
   */
  const cambiarSucursal = (sucursalId) => {
    const sucursal = sucursalesDisponibles.find(s => s.id === sucursalId);
    if (sucursal) {
      setSucursalSeleccionada(sucursal);
      localStorage.setItem('sucursalSeleccionada', sucursalId);
      toast.success(`Cambiado a ${sucursal.nombre}`);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("?? [AUTH] Iniciando login con:", email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Obtener token con custom claims
      const tokenResult = await firebaseUser.getIdTokenResult();
      const customClaims = tokenResult.claims;
      
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        nombre: customClaims.nombre || firebaseUser.displayName || 'Usuario',
        apellido: customClaims.apellido || '',
        rol: customClaims.rol || 'Usuario',
        rolId: customClaims.rolId || '1',
        permisos: customClaims.permisos || {},
        activo: customClaims.activo !== false,
        customClaims: customClaims,
        sucursales: customClaims.sucursales || []
      };
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Calcular permisos efectivos
      calcularPermisosEfectivos(user);
      
      // Cargar sucursales despues del login
      await cargarSucursalesUsuario(user);
      
      toast.success(`Bienvenido ${user.rol}: ${user.email}`);
      return user;
      
    } catch (error) {
      console.error("? [AUTH] ERROR EN LOGIN:", error);
      
      let message = 'Error al iniciar sesion';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Contrasena incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email invalido';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Intenta mas tarde';
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSucursalSeleccionada(null);
      setSucursalesDisponibles([]);
      setPermisosEfectivos({});
      localStorage.removeItem('sucursalSeleccionada');
      toast.info('Sesion cerrada correctamente');
    } catch (error) {
      console.error('? [AUTH] Error cerrando sesion:', error);
      toast.error('Error al cerrar sesion');
    }
  };

  // Funcion para obtener token de acceso
  const getAccessToken = async () => {
    if (auth.currentUser) {
      return await getIdToken(auth.currentUser);
    }
    return null;
  };

  /**
   * MEJORADO: Verificar permisos con mejor logica
   * @param {string} modulo - Modulo a verificar
   * @param {string} accion - Accion a verificar
   * @returns {boolean} Tiene permiso
   */
     const hasPermission = (modulo, accion) => {
     try {
       console.log(`🔐 [AUTH] Verificando permiso: ${modulo}.${accion}`);
       console.log(`🔐 [AUTH] Usuario actual:`, {
         id: currentUser?.id,
         email: currentUser?.email,
         rol: currentUser?.rol,
         rolId: currentUser?.rolId
       });
       
       // Administrador siempre tiene todos los permisos
       if (currentUser?.rol === 'Administrador' || 
           currentUser?.rol === 'admin' || 
           currentUser?.rol === 'Admin' ||
           currentUser?.rolId === 'admin') {
         console.log(`🔐 [AUTH] Usuario es administrador, permiso concedido: ${modulo}.${accion}`);
         return true;
       }
       
       // Verificar en permisos efectivos
       let tienePermiso = false;
       
       // Manejar permisos anidados (ej: stock.control.ver)
       if (accion.includes('.')) {
         const [submodulo, subaccion] = accion.split('.');
         tienePermiso = permisosEfectivos?.[modulo]?.[submodulo]?.[subaccion] || false;
       } else {
         tienePermiso = permisosEfectivos?.[modulo]?.[accion] || false;
       }
       
       console.log(`🔐 [AUTH] Permiso ${modulo}.${accion}: ${tienePermiso}`);
       console.log(`🔐 [AUTH] Permisos efectivos para ${modulo}:`, permisosEfectivos?.[modulo]);
       
       return tienePermiso;
       
     } catch (error) {
       console.error('❌ [AUTH] Error al verificar permisos:', error);
       return false;
     }
   };

  /**
   * NUEVO: Verificar si el usuario puede acceder a una sucursal especifica
   * @param {string} sucursalId - ID de la sucursal
   * @returns {boolean} Puede acceder
   */
  const canAccessSucursal = (sucursalId) => {
    try {
      // Administrador puede acceder a todas las sucursales
      if (currentUser?.rol === 'Administrador' || currentUser?.rol === 'admin' || currentUser?.rol === 'Admin') {
        return true;
      }
      
      // Verificar si la sucursal esta en la lista de sucursales disponibles
      return sucursalesDisponibles.some(s => s.id === sucursalId);
      
    } catch (error) {
      console.error('? [AUTH] Error al verificar acceso a sucursal:', error);
      return false;
    }
  };

  /**
   * NUEVO: Obtener informacion completa del usuario para debugging
   */
  const getUserInfo = () => {
    return {
      user: currentUser,
      permissions: permisosEfectivos,
      sucursales: sucursalesDisponibles,
      sucursalActual: sucursalSeleccionada
    };
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    getAccessToken,
    hasPermission,
    sucursalSeleccionada,
    sucursalesDisponibles,
    loadingSucursales,
    cambiarSucursal,
    canAccessSucursal,
    permisosEfectivos,
    getUserInfo
  };

  // Exportar al objeto global para debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.hasPermission = hasPermission;
      window.authContext = value;
      console.log('🔐 [AUTH] Funciones exportadas al objeto global para debugging');
    }
  }, [value]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};