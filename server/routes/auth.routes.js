/**
 * Rutas de autenticación
 * 
 * Define las rutas para inicio de sesión, registro y gestión de perfil.
 * 
 * @module routes/auth.routes
 * @requires express, ../controllers/auth.controller, ../middlewares/auth
 * @related_files ../controllers/auth.controller.js
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

/**
 * @route POST /api/auth/login
 * @desc Inicia sesión con email y contraseña
 * @access Público
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/registro
 * @desc Registra un nuevo usuario
 * @access Privado (solo administradores)
 */
router.post('/registro', authMiddleware, authController.registro);

/**
 * @route GET /api/auth/perfil
 * @desc Obtiene información del usuario actual
 * @access Privado
 */
router.get('/perfil', authMiddleware, authController.getProfile);

/**
 * @route PUT /api/auth/perfil/:id
 * @desc Actualiza el perfil del usuario
 * @access Privado (propio usuario o administrador)
 */
router.put('/perfil/:id', authMiddleware, authController.updateProfile);

/**
 * @route PATCH /api/auth/password/:id
 * @desc Cambia la contraseña del usuario
 * @access Privado (solo propio usuario)
 */
router.patch('/password/:id', authMiddleware, authController.changePassword);

module.exports = router;