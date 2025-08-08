// scripts/migrate-mysql-to-firestore.js
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Inicializar Firebase Admin
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateFromYourMySQL() {
  // Conectar a tu MySQL actual
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'despensa_db'
  });

  console.log('🔄 Iniciando migración de tu base de datos...');

  try {
    // 1. Migrar roles primero
    console.log('📋 Migrando roles...');
    const [roles] = await connection.execute('SELECT * FROM roles');
    
    for (const rol of roles) {
      let permisos = {};
      try {
        permisos = typeof rol.permisos === 'string' ? JSON.parse(rol.permisos) : rol.permisos;
      } catch (e) {
        // Usar permisos por defecto si no se puede parsear
        permisos = rol.nombre === 'Administrador' ? {
          "productos": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "compras": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "ventas": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "stock": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "reportes": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "promociones": {"ver": true, "crear": true, "editar": true, "eliminar": true},
          "usuarios": {"ver": true, "crear": true, "editar": true, "eliminar": true}
        } : {};
      }
      
      await db.collection('roles').doc(rol.id.toString()).set({
        nombre: rol.nombre,
        descripcion: rol.descripcion || '',
        permisos: permisos
      });
    }

    // 2. Migrar usuarios
    console.log('👥 Migrando usuarios...');
    const [usuarios] = await connection.execute(`
      SELECT u.*, r.nombre as rol_nombre, r.permisos 
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id
    `);
    
    for (const usuario of usuarios) {
      let permisos = {};
      try {
        permisos = typeof usuario.permisos === 'string' ? JSON.parse(usuario.permisos) : usuario.permisos;
      } catch (e) {
        permisos = {};
      }

      await db.collection('usuarios').doc(usuario.id.toString()).set({
        nombre: usuario.nombre,
        apellido: usuario.apellido || '',
        email: usuario.email,
        // NO migrar password - se manejará con Firebase Auth
        rol: {
          id: usuario.rol_id.toString(),
          nombre: usuario.rol_nombre,
          permisos: permisos
        },
        activo: Boolean(usuario.activo),
        fecha_creacion: admin.firestore.Timestamp.fromDate(new Date(usuario.fecha_creacion)),
        ultima_sesion: usuario.ultima_sesion ? admin.firestore.Timestamp.fromDate(new Date(usuario.ultima_sesion)) : null
      });
    }

    // 3. Migrar categorías y proveedores
    console.log('📦 Migrando categorías...');
    const [categorias] = await connection.execute('SELECT * FROM categorias WHERE activo = 1');
    for (const categoria of categorias) {
      await db.collection('categorias').doc(categoria.id.toString()).set({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || ''
      });
    }

    console.log('🏢 Migrando proveedores...');
    const [proveedores] = await connection.execute('SELECT * FROM proveedores WHERE activo = 1');
    for (const proveedor of proveedores) {
      await db.collection('proveedores').doc(proveedor.id.toString()).set({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || ''
      });
    }

    // 4. Migrar productos con stock
    console.log('📱 Migrando productos con stock...');
    const [productos] = await connection.execute(`
      SELECT 
        p.*, 
        COALESCE(c.nombre, 'General') as categoria_nombre,
        COALESCE(prov.nombre, '') as proveedor_nombre,
        COALESCE(s.cantidad, 0) as stock_cantidad,
        COALESCE(s.stock_minimo, 5) as stock_minimo,
        COALESCE(s.ubicacion, '') as ubicacion
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
      LEFT JOIN stock s ON p.id = s.producto_id
      WHERE p.activo = 1
    `);

    for (const producto of productos) {
      const docRef = await db.collection('productos').add({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio_costo: parseFloat(producto.precio_costo) || 0,
        precio_venta: parseFloat(producto.precio_venta) || 0,
        categoria: {
          id: producto.categoria_id?.toString() || null,
          nombre: producto.categoria_nombre
        },
        proveedor: {
          id: producto.proveedor_id?.toString() || null,
          nombre: producto.proveedor_nombre
        },
        stock: {
          cantidad: parseInt(producto.stock_cantidad) || 0,
          stock_minimo: parseInt(producto.stock_minimo) || 5,
          ubicacion: producto.ubicacion || ''
        },
        imagen: producto.imagen || null,
        activo: Boolean(producto.activo),
        fecha_creacion: admin.firestore.Timestamp.fromDate(new Date(producto.fecha_creacion)),
        fecha_modificacion: admin.firestore.Timestamp.fromDate(new Date(producto.fecha_modificacion))
      });

      // 5. Migrar movimientos de stock para este producto
      const [movimientos] = await connection.execute(`
        SELECT ms.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
        FROM movimientos_stock ms
        LEFT JOIN usuarios u ON ms.usuario_id = u.id
        WHERE ms.producto_id = ?
        ORDER BY ms.fecha DESC
      `, [producto.id]);

      for (const movimiento of movimientos) {
        await docRef.collection('movimientos').add({
          tipo: movimiento.tipo,
          cantidad: parseInt(movimiento.cantidad),
          motivo: movimiento.motivo || '',
          fecha: admin.firestore.Timestamp.fromDate(new Date(movimiento.fecha)),
          usuario: {
            id: movimiento.usuario_id?.toString() || 'sistema',
            nombre: movimiento.usuario_nombre ? `${movimiento.usuario_nombre} ${movimiento.usuario_apellido || ''}`.trim() : 'Sistema'
          },
          referencia_tipo: movimiento.referencia_tipo || null,
          referencia_id: movimiento.referencia_id?.toString() || null
        });
      }
    }

    console.log('✅ ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar migración
migrateFromYourMySQL()
  .then(() => {
    console.log('🎉 Proceso de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal en migración:', error);
    process.exit(1);
  });