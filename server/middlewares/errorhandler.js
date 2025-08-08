/**
 * Middleware para manejo de errores
 * 
 * Captura y procesa los errores de la aplicación para devolver
 * respuestas de error coherentes.
 * 
 * @module middlewares/errorHandler
 * @related_files ../server.js
 */

/**
 * Middleware de manejo de errores
 * @param {Error} err - Error capturado
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función siguiente middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Si ya se envió la cabecera, delegar al manejador de errores por defecto
  if (res.headersSent) {
    return next(err);
  }
  
  // Determinar el código de estado apropiado
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Preparar la respuesta de error
  const errorResponse = {
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  };
  
  // Enviar la respuesta de error
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
