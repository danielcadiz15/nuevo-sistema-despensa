// functions/routes/busqueda.routes.js
const admin = require('firebase-admin');
const db = admin.firestore();

// Función para manejar todas las rutas de búsqueda
const busquedaRoutes = async (req, res, path) => {
  try {
    // Búsqueda global
    if (path === '/buscar' && req.method === 'GET') {
      const { termino, tipo } = req.query;
      
      if (!termino) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
        return true;
      }
      
      const terminoLower = termino.toLowerCase();
      const resultados = {
        productos: [],
        clientes: [],
        proveedores: [],
        categorias: []
      };
      
      // Búsqueda específica por tipo o global
      if (!tipo || tipo === 'productos') {
        const productosSnapshot = await db.collection('productos').get();
        
        productosSnapshot.forEach(doc => {
          const data = doc.data();
          const nombre = (data.nombre || '').toLowerCase();
          const codigo = (data.codigo || '').toLowerCase();
          
          if (nombre.includes(terminoLower) || codigo.includes(terminoLower)) {
            resultados.productos.push({
              id: doc.id,
              ...data,
              tipo: 'producto'
            });
          }
        });
      }
      
      if (!tipo || tipo === 'clientes') {
        const clientesSnapshot = await db.collection('clientes').get();
        
        clientesSnapshot.forEach(doc => {
          const data = doc.data();
          const nombre = (data.nombre || '').toLowerCase();
          const apellido = (data.apellido || '').toLowerCase();
          const email = (data.email || '').toLowerCase();
          
          if (nombre.includes(terminoLower) || 
              apellido.includes(terminoLower) || 
              email.includes(terminoLower) ||
              `${nombre} ${apellido}`.includes(terminoLower)) {
            resultados.clientes.push({
              id: doc.id,
              ...data,
              tipo: 'cliente'
            });
          }
        });
      }
      
      if (!tipo || tipo === 'proveedores') {
        const proveedoresSnapshot = await db.collection('proveedores').get();
        
        proveedoresSnapshot.forEach(doc => {
          const data = doc.data();
          const nombre = (data.nombre || '').toLowerCase();
          
          if (nombre.includes(terminoLower)) {
            resultados.proveedores.push({
              id: doc.id,
              ...data,
              tipo: 'proveedor'
            });
          }
        });
      }
      
      if (!tipo || tipo === 'categorias') {
        const categoriasSnapshot = await db.collection('categorias').get();
        
        categoriasSnapshot.forEach(doc => {
          const data = doc.data();
          const nombre = (data.nombre || '').toLowerCase();
          
          if (nombre.includes(terminoLower)) {
            resultados.categorias.push({
              id: doc.id,
              ...data,
              tipo: 'categoria'
            });
          }
        });
      }
      
      // Contar resultados
      const totalResultados = 
        resultados.productos.length + 
        resultados.clientes.length + 
        resultados.proveedores.length + 
        resultados.categorias.length;
      
      res.json({
        success: true,
        data: resultados,
        total: totalResultados,
        message: `Búsqueda completada: ${totalResultados} resultados encontrados`
      });
      return true;
    }
    
    // Si ninguna ruta coincide, devolver false
    return false;
    
  } catch (error) {
    console.error('❌ Error en rutas de búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
    return true;
  }
};

module.exports = busquedaRoutes;