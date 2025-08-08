/**
 * Archivo principal del servidor
 * 
 * Este archivo configura y arranca el servidor Express con todas sus dependencias.
 * Es el punto de entrada de la aplicación backend.
 * 
 * @module server
 * @requires express, cors, morgan, dotenv, ./config/database, ./routes
 */

// Importación de dependencias
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importación de módulos propios
const { connectDB } = require('./config/database');
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta básica para probar que el servidor funciona
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Gestión para Despensa',
    status: 'online'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
