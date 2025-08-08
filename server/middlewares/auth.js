/**
 * Middleware de autenticación
 * 
 * Verifica que las solicitudes a rutas protegidas incluyan un token JWT válido.
 * También verifica los permisos del usuario según su rol.
 * 
 * @module middlewares/auth
 * @requires jsonwebtoken, ../config/database
 * @related_files ../models/usuario.model.js, ../controllers/auth.controller.js
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware de autenticación para proteger rutas
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Verificar si existe el token en los headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token requerido en formato: Bearer <token>'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔐 Token recibido:', token ? 'Presente' : 'No presente');
    
    // 2. Verificar y decodificar el token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'una_clave_secreta_larga_y_segura');
      console.log('✅ Token verificado para usuario ID:', decoded.id);
    } catch (jwtError) {
      console.error('❌ Error al verificar JWT:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    // 3. Buscar el usuario en la base de datos
    const usuarios = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, 
              r.nombre as rol_nombre, r.permisos 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = ? AND u.activo = true`,
      [decoded.id]
    );
    
    if (usuarios.length === 0) {
      console.error('❌ Usuario no encontrado o inactivo:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }
    
    const usuario = usuarios[0];
    
    // 4. Parsear permisos desde JSON
    let permisos = {};
    try {
      if (usuario.permisos && usuario.permisos !== "[object Object]") {
        permisos = JSON.parse(usuario.permisos);
      } else {
        // Permisos por defecto para administradores
        if (usuario.rol_nombre === 'Administrador') {
          permisos = {
            "productos": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "compras": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "ventas": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "stock": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "reportes": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "promociones": {"ver": true, "crear": true, "editar": true, "eliminar": true},
            "usuarios": {"ver": true, "crear": true, "editar": true, "eliminar": true}
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al parsear permisos, usando objeto vacío:', error.message);
      permisos = {};
    }
    
    // 5. Preparar objeto usuario para req.usuario
    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rolId: usuario.rol_id,
      rol: usuario.rol_nombre,
      permisos: permisos,
      esSuperUsuario: usuario.email === 'danielcadiz15@gmail.com' || usuario.email === 'adrian@condinea.com'
    };
    
    console.log('✅ Usuario autenticado:', usuario.email, '- Rol:', usuario.rol_nombre);
    
    // 6. Actualizar última sesión
    try {
      await query('UPDATE usuarios SET ultima_sesion = NOW() WHERE id = ?', [usuario.id]);
    } catch (error) {
      console.warn('⚠️ Error al actualizar última sesión:', error.message);
    }
    
    next();
    
  } catch (error) {
    console.error('💥 Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de autenticación'
    });
  }
};

/**
 * Middleware para verificar permisos específicos
 * @param {string} modulo - Nombre del módulo (ej: 'productos')
 * @param {string} accion - Nombre de la acción (ej: 'crear', 'editar')
 */
const checkPermiso = (modulo, accion) => {
  return (req, res, next) => {
    try {
      console.log(`🔍 Verificando permiso: ${modulo}:${accion} para usuario:`, req.usuario.email);
      // Si el usuario es superusuario, permitir acceso completo
      if (req.usuario.esSuperUsuario) {
        console.log('✅ Permiso concedido (SuperUsuario)');
        return next();
      }
      // Si el usuario es administrador, permitir acceso completo
      if (req.usuario.rol === 'Administrador') {
        console.log('✅ Permiso concedido (Administrador)');
        return next();
      }
      // Verificar permiso específico
      const tienePermiso = req.usuario.permisos[modulo]?.[accion];
      if (!tienePermiso) {
        console.log(`❌ Permiso denegado: ${modulo}:${accion}`);
        return res.status(403).json({
          success: false,
          message: `No tiene permiso para ${accion} ${modulo}`
        });
      }
      console.log('✅ Permiso concedido');
      next();
    } catch (error) {
      console.error('💥 Error al verificar permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

module.exports = authMiddleware;
module.exports.checkPermiso = checkPermiso;