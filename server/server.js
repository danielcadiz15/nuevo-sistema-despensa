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

// Importación de rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const comprasRoutes = require('./routes/compras.routes');
const ventasRoutes = require('./routes/ventas.routes');
const stockRoutes = require('./routes/stock.routes');
const reportesRoutes = require('./routes/reportes.routes');
const promocionesRoutes = require('./routes/promociones.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const clientesRoutes = require('./routes/clientes.routes');
// Importar rutas de proveedores
const proveedoresRoutes = require('./routes/proveedores.routes');
// Importar rutas de categorías
const categoriasRoutes = require('./routes/categorias.routes');

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Conexión a la base de datos
connectDB();

// Rutas públicas
app.use('/api/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use('/api', authMiddleware);

// Rutas protegidas
app.use('/api/productos', productosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes', clientesRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;