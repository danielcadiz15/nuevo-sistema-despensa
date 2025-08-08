/**
 * Controlador de usuarios
 * 
 * Gestiona todas las operaciones relacionadas con usuarios,
 * recibe peticiones HTTP y utiliza el modelo para interactuar con la base de datos.
 * 
 * @module controllers/usuarios.controller
 * @requires ../models/usuario.model
 * @related_files ../routes/usuarios.routes.js, ../models/usuario.model.js
 */

const usuarioModel = require('../models/usuario.model');
const bcrypt = require('bcrypt');

const usuariosController = {
  /**
   * Obtiene todos los usuarios
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerTodos: async (req, res) => {
    try {
      const usuarios = await usuarioModel.obtenerTodos();
      
      // No enviar información sensible
      const usuariosFiltrados = usuarios.map(usuario => {
        const { password, ...usuarioSinPassword } = usuario;
        return usuarioSinPassword;
      });
      
      res.json({
        success: true,
        data: usuariosFiltrados
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene un usuario por su ID
   * @param {Object} req - Objeto de solicitud con parámetro id
   * @param {Object} res - Objeto de respuesta
   */
  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = await usuarioModel.obtenerPorId(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // No enviar información sensible
      const { password, ...usuarioSinPassword } = usuario;
      
      res.json({
        success: true,
        data: usuarioSinPassword
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  },
  
  /**
   * Busca usuarios por término
   * @param {Object} req - Objeto de solicitud con query termino
   * @param {Object} res - Objeto de respuesta
   */
  buscar: async (req, res) => {
    try {
      const { termino } = req.query;
      
      if (!termino) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }
      
      const usuarios = await usuarioModel.buscar(termino);
      
      res.json({
        success: true,
        data: usuarios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al buscar usuarios',
        error: error.message
      });
    }
  },
  
  /**
   * Crea un nuevo usuario
   * @param {Object} req - Objeto de solicitud con datos del usuario en body
   * @param {Object} res - Objeto de respuesta
   */
  crear: async (req, res) => {
    try {
      const { 
        nombre, apellido, email, password, rol_id, activo
      } = req.body;
      
      // Validaciones básicas
      if (!nombre || !email || !password || !rol_id) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }
      
      // Verificar que el email no esté en uso
      const usuarioExistente = await usuarioModel.obtenerPorEmail(email);
      
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
      
      const usuario = {
        nombre,
        apellido,
        email,
        password,
        rol_id,
        activo
      };
      
      const usuarioCreado = await usuarioModel.crear(usuario);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: usuarioCreado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error.message
      });
    }
  },
  
  /**
   * Actualiza un usuario existente
   * @param {Object} req - Objeto de solicitud con id en params y datos en body
   * @param {Object} res - Objeto de respuesta
   */
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nombre, apellido, email, password, rol_id, activo
      } = req.body;
      
      // Validaciones básicas
      if (!nombre || !email || !rol_id) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios'
        });
      }
      
      // Verificar que el usuario existe
      const usuarioExistente = await usuarioModel.obtenerPorId(id);
      
      if (!usuarioExistente) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar que el email no esté en uso por otro usuario
      if (email !== usuarioExistente.email) {
        const emailEnUso = await usuarioModel.obtenerPorEmail(email);
        
        if (emailEnUso) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está registrado por otro usuario'
          });
        }
      }
      
      const usuario = {
        nombre,
        apellido,
        email,
        password,
        rol_id,
        activo
      };
      
      const actualizado = await usuarioModel.actualizar(id, usuario);
      
      if (!actualizado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el usuario'
        });
      }
      
      res.json({
        success: true,
        message: 'Usuario actualizado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario',
        error: error.message
      });
    }
  },
  
  /**
   * Cambia la contraseña de un usuario
   * @param {Object} req - Objeto de solicitud con id en params y contraseñas en body
   * @param {Object} res - Objeto de respuesta
   */
  cambiarPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { password_actual, password_nueva } = req.body;
      
      // Validaciones básicas
      if (!password_actual || !password_nueva) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren ambas contraseñas'
        });
      }
      
      // Verificar que el usuario existe
      const usuario = await usuarioModel.obtenerPorId(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar si es auto-cambio o un admin cambiando a otro usuario
      const esAutoCambio = parseInt(id) === parseInt(req.usuario.id);
      const esAdmin = req.usuario.rol === 'Administrador';
      
      // Si es auto-cambio, verificar contraseña actual
      if (esAutoCambio) {
        // Obtener usuario con contraseña
        const usuarioCompleto = await usuarioModel.obtenerPorEmail(usuario.email);
        
        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(password_actual, usuarioCompleto.password);
        
        if (!passwordValida) {
          return res.status(400).json({
            success: false,
            message: 'La contraseña actual no es correcta'
          });
        }
      } else if (!esAdmin) {
        // Si no es auto-cambio y no es admin, no permitir el cambio
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar la contraseña de otro usuario'
        });
      }
      
      // Cambiar contraseña
      const cambiada = await usuarioModel.cambiarPassword(id, password_nueva);
      
      if (!cambiada) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo cambiar la contraseña'
        });
      }
      
      res.json({
        success: true,
        message: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  },
  
  /**
   * Cambia el estado activo/inactivo de un usuario
   * @param {Object} req - Objeto de solicitud con id en params y activo en body
   * @param {Object} res - Objeto de respuesta
   */
  cambiarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      
      // Validaciones básicas
      if (activo === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere especificar el estado'
        });
      }
      
      // Verificar que el usuario existe
      const usuario = await usuarioModel.obtenerPorId(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // No permitir desactivar al usuario actual
      if (parseInt(id) === parseInt(req.usuario.id) && !activo) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propio usuario'
        });
      }
      
      const actualizado = await usuarioModel.cambiarEstado(id, activo);
      
      if (!actualizado) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo cambiar el estado del usuario'
        });
      }
      
      res.json({
        success: true,
        message: activo ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del usuario',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene todos los roles disponibles
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  obtenerRoles: async (req, res) => {
    try {
      const roles = await usuarioModel.obtenerRoles();
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener roles',
        error: error.message
      });
    }
  }
};

module.exports = usuariosController;