// functions/utils/auth.js - Middleware de autenticación Firebase
const admin = require('firebase-admin');

/**
 * Middleware para verificar autenticación Firebase
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
async function authenticateUser(req, res, next) {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AUTH] No se encontró token de autorización');
      req.user = null;
      return next();
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      console.log('❌ [AUTH] Token vacío');
      req.user = null;
      return next();
    }
    
    try {
      // Verificar el token con Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      console.log('✅ [AUTH] Token verificado para usuario:', decodedToken.email);
      
      // Obtener información adicional del usuario desde Firestore
      const userDoc = await admin.firestore()
        .collection('usuarios')
        .where('email', '==', decodedToken.email)
        .limit(1)
        .get();
      
      let userData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        rol: 'usuario' // valor por defecto
      };
      
      if (!userDoc.empty) {
        const user = userDoc.docs[0].data();
        userData = {
          ...userData,
          ...user,
          id: userDoc.docs[0].id
        };
      }
      
      console.log('👤 [AUTH] Datos del usuario:', {
        email: userData.email,
        rol: userData.rol,
        uid: userData.uid
      });
      
      req.user = userData;
      
    } catch (verifyError) {
      console.error('❌ [AUTH] Error al verificar token:', verifyError.message);
      req.user = null;
    }
    
  } catch (error) {
    console.error('❌ [AUTH] Error en middleware de autenticación:', error);
    req.user = null;
  }
  
  next();
}

/**
 * Middleware para requerir autenticación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }
  next();
}

/**
 * Middleware para verificar permisos de administrador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }
  
  const esAdmin = req.user.email === 'danielcadiz15@gmail.com' ||
                  req.user.rol === 'Administrador' ||
                  req.user.rol === 'admin' ||
                  req.user.rol === 'Admin';
  
  if (!esAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Se requieren permisos de administrador'
    });
  }
  
  next();
}

module.exports = {
  authenticateUser,
  requireAuth,
  requireAdmin
}; 