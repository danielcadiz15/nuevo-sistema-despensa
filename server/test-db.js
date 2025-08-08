// test-db.js
const { connectDB, query } = require('./config/database');

async function testConnection() {
  try {
    console.log('Intentando conectar a la base de datos...');
    await connectDB();
    
    console.log('Intentando ejecutar una consulta simple...');
    const result = await query('SELECT 1 as test');
    console.log('Resultado de prueba:', result);
    
    console.log('Intentando consultar usuarios...');
    const usuarios = await query('SELECT id, nombre, email FROM usuarios LIMIT 3');
    console.log('Usuarios encontrados:', usuarios);
    
    console.log('¡Conexión y consultas exitosas!');
  } catch (error) {
    console.error('Error en la prueba de conexión:', error);
  }
}

testConnection();