/**
 * Controlador de autenticación
 * 
 * Gestiona las operaciones de autenticación y registro de usuarios.
 * 
 * @module controllers/auth.controller
 * @requires ../models/usuario.model
 * @related_files ../routes/auth.routes.js
 */

const usuarioModel = require('../models/usuario.model');

const authController = {
  /**
   * Inicia sesión con correo y contraseña
   * @param {Object} req - Objeto de solicitud con email y password en body
   * @param {Object} res - Objeto de respuesta
   */
  login: async (req, res) => {
	  try {
		const { email, password } = req.body;
		
		console.log('📥 BACKEND: Datos recibidos:', { email, password: '***' });
		
		if (!email || !password) {
		  console.log('❌ BACKEND: Faltan datos');
		  return res.status(400).json({
			success: false,
			message: 'Se requiere correo y contraseña'
		  });
		}
		
		console.log('🔍 BACKEND: Llamando a usuarioModel.login...');
		const resultado = await usuarioModel.login(email, password);
		
		if (!resultado) {
		  console.log('❌ BACKEND: Login falló - credenciales incorrectas');
		  return res.status(401).json({
			success: false,
			message: 'Credenciales incorrectas'
		  });
		}
		
		console.log('✅ BACKEND: Login exitoso, preparando respuesta...');
		console.log('📦 BACKEND: Resultado del modelo:', resultado);
		
		const respuesta = {
		  success: true,
		  data: resultado
		};
		
		console.log('📤 BACKEND: Enviando respuesta:', respuesta);
		
		res.json(respuesta);
		
	  } catch (error) {
		console.error('💥 BACKEND: Error en login:', error);
		
		if (error.message === 'Usuario inactivo') {
		  return res.status(403).json({
			success: false,
			message: 'Usuario inactivo. Contacte al administrador.'
		  });
		}
		
		res.status(500).json({
		  success: false,
		  message: 'Error al iniciar sesión',
		  error: error.message
		});
	  }
	},
  
  /**
   * Registra un nuevo usuario
   * @param {Object} req - Objeto de solicitud con datos del usuario en body
   * @param {Object} res - Objeto de respuesta
   */
  registro: async (req, res) => {
    try {
      const { nombre, apellido, email, password, rol_id } = req.body;
      
      // Validaciones básicas
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }
      
      // Verificar si el usuario que realiza la solicitud es administrador
      if (!req.usuario || req.usuario.rol !== 'Administrador') {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para registrar usuarios'
        });
      }
      
      // Crear usuario
      const usuario = {
        nombre,
        apellido,
        email,
        password,
        rol_id: rol_id || 2, // Por defecto, rol de Empleado (2)
        activo: true
      };
      
      const usuarioCreado = await usuarioModel.crear(usuario);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
          id: usuarioCreado.id,
          nombre: usuarioCreado.nombre,
          email: usuarioCreado.email
        }
      });
    } catch (error) {
      if (error.message === 'El correo electrónico ya está registrado') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene información del usuario actual
   * @param {Object} req - Objeto de solicitud con datos del usuario en req.usuario
   * @param {Object} res - Objeto de respuesta
   */
  getProfile: async (req, res) => {
    try {
      // Los datos del usuario ya están en req.usuario (middleware auth)
      res.json({
        success: true,
        data: req.usuario
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  },
  
  /**
   * Actualiza la información del perfil del usuario
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, email } = req.body;
      
      // Verificar si es el propio usuario o un administrador
      if (req.usuario.id != id && req.usuario.rol !== 'Administrador') {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para actualizar este perfil'
        });
      }
      
      // Actualizar usuario
      const usuario = {
        nombre,
        apellido,
        email
      };
      
      const actualizado = await usuarioModel.actualizar(id, usuario);
      
      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Obtener usuario actualizado
      const usuarioActualizado = await usuarioModel.buscarPorId(id);
      
      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: {
          id: usuarioActualizado.id,
          nombre: usuarioActualizado.nombre,
          apellido: usuarioActualizado.apellido,
          email: usuarioActualizado.email,
          rol: usuarioActualizado.rol,
          permisos: usuarioActualizado.permisos
        }
      });
    } catch (error) {
      if (error.message === 'El correo electrónico ya está registrado por otro usuario') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  },
  
  /**
   * Cambia la contraseña del usuario
   * @param {Object} req - Objeto de solicitud con id en params y contraseñas en body
   * @param {Object} res - Objeto de respuesta
   */
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      
      // Verificar si es el propio usuario
      if (req.usuario.id != id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para cambiar esta contraseña'
        });
      }
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren contraseña actual y nueva'
        });
      }
      
      // Validar longitud de la nueva contraseña
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }
      
      // Cambiar contraseña
      const cambiada = await usuarioModel.cambiarPassword(id, oldPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      if (error.message === 'Contraseña actual incorrecta') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  }
};

module.exports = authController;