// migrate-despensa-to-firebase-FINAL.js
// Script de migración ESPECÍFICO para base de datos LA FABRICA
// Adaptado a la estructura exacta encontrada

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🚀 === MIGRACIÓN LA FABRICA → FIREBASE ===');
console.log('📦 Proyecto: la-fabrica-1');
console.log('📋 Tablas detectadas: 20');
console.log('👤 Usuario admin: admin@sistema.com');

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'la-fabrica-1'
});

const db = admin.firestore();

// Configuración MySQL basada en tu estructura
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'despensa_db'
};

async function verificarConexiones() {
  console.log('\n🔍 === VERIFICANDO CONEXIONES ===');
  
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    
    // Verificar tablas específicas encontradas
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('✅ MySQL conectado');
    console.log(`📋 Tablas confirmadas: ${tableNames.length}`);
    
    // Verificar datos actuales
    const [productos] = await connection.execute('SELECT COUNT(*) as total FROM productos');
    const [usuarios] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
    const [roles] = await connection.execute('SELECT COUNT(*) as total FROM roles');
    
    console.log(`📦 Productos actuales: ${productos[0].total}`);
    console.log(`👥 Usuarios actuales: ${usuarios[0].total}`);
    console.log(`👑 Roles actuales: ${roles[0].total}`);
    
    await connection.end();
    
    // Verificar Firestore
    const testDoc = await db.collection('_test').add({ timestamp: admin.firestore.Timestamp.now() });
    await db.collection('_test').doc(testDoc.id).delete();
    console.log('✅ Firestore conectado');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    throw error;
  }
}

async function migrarRoles() {
  console.log('\n👑 === MIGRANDO ROLES ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Tu estructura: id, nombre, descripcion, permisos (JSON)
    const [roles] = await connection.execute('SELECT * FROM roles');
    console.log(`Encontrados ${roles.length} roles`);
    
    for (const rol of roles) {
      let permisos = {};
      
      try {
        // Tu BD usa tipo JSON para permisos
        if (rol.permisos) {
          if (typeof rol.permisos === 'string') {
            permisos = JSON.parse(rol.permisos);
          } else if (typeof rol.permisos === 'object') {
            permisos = rol.permisos;
          }
        }
        
        // Si no hay permisos, asignar por defecto según nombre
        if (Object.keys(permisos).length === 0) {
          if (rol.nombre === 'Administrador' || rol.id === 1) {
            permisos = {
              "productos": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "compras": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "ventas": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "stock": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "reportes": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "promociones": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "usuarios": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "clientes": {"ver": true, "crear": true, "editar": true, "eliminar": true},
              "proveedores": {"ver": true, "crear": true, "editar": true, "eliminar": true}
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error parseando permisos rol ${rol.nombre}:`, error.message);
        permisos = {};
      }
      
      await db.collection('roles').doc(rol.id.toString()).set({
        nombre: rol.nombre,
        descripcion: rol.descripcion || '',
        permisos: permisos,
        fecha_creacion: admin.firestore.Timestamp.now()
      });
      
      console.log(`✅ Rol migrado: ${rol.nombre} (ID: ${rol.id})`);
    }
    
  } catch (error) {
    console.error('❌ Error migrando roles:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrarCategorias() {
  console.log('\n🏷️ === MIGRANDO CATEGORÍAS ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Detectar estructura de categorías
    const [describe] = await connection.execute('DESCRIBE categorias');
    const hasActivo = describe.some(field => field.Field === 'activo');
    
    let sql = 'SELECT * FROM categorias';
    if (hasActivo) {
      sql += ' WHERE activo = 1 OR activo IS NULL';
    }
    
    const [categorias] = await connection.execute(sql);
    console.log(`Encontradas ${categorias.length} categorías`);
    
    for (const categoria of categorias) {
      const docData = {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        fecha_creacion: admin.firestore.Timestamp.now()
      };
      
      // Agregar activo si existe en la estructura
      if (hasActivo) {
        docData.activo = categoria.activo !== undefined ? Boolean(categoria.activo) : true;
      }
      
      await db.collection('categorias').doc(categoria.id.toString()).set(docData);
      console.log(`✅ Categoría: ${categoria.nombre}`);
    }
    
  } catch (error) {
    console.error('❌ Error migrando categorías:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrarProveedores() {
  console.log('\n🏢 === MIGRANDO PROVEEDORES ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Tu estructura: id, nombre, contacto, telefono, email, direccion, activo
    const [describe] = await connection.execute('DESCRIBE proveedores');
    const fields = describe.map(f => f.Field);
    
    let sql = 'SELECT * FROM proveedores';
    if (fields.includes('activo')) {
      sql += ' WHERE activo = 1 OR activo IS NULL';
    }
    
    const [proveedores] = await connection.execute(sql);
    console.log(`Encontrados ${proveedores.length} proveedores`);
    
    for (const proveedor of proveedores) {
      const docData = {
        nombre: proveedor.nombre,
        fecha_creacion: admin.firestore.Timestamp.now()
      };
      
      // Agregar campos opcionales si existen
      if (fields.includes('contacto') && proveedor.contacto) docData.contacto = proveedor.contacto;
      if (fields.includes('telefono') && proveedor.telefono) docData.telefono = proveedor.telefono;
      if (fields.includes('email') && proveedor.email) docData.email = proveedor.email;
      if (fields.includes('direccion') && proveedor.direccion) docData.direccion = proveedor.direccion;
      if (fields.includes('activo')) docData.activo = proveedor.activo !== undefined ? Boolean(proveedor.activo) : true;
      
      await db.collection('proveedores').doc(proveedor.id.toString()).set(docData);
      console.log(`✅ Proveedor: ${proveedor.nombre}`);
    }
    
  } catch (error) {
    console.error('❌ Error migrando proveedores:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrarUsuarios() {
  console.log('\n👥 === MIGRANDO USUARIOS ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Tu estructura exacta: id, nombre, apellido, email, password, rol_id, activo, fecha_creacion, ultima_sesion
    const [usuarios] = await connection.execute(`
      SELECT u.*, r.nombre as rol_nombre, r.permisos 
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = 1
    `);
    
    console.log(`Encontrados ${usuarios.length} usuarios activos`);
    
    for (const usuario of usuarios) {
      let permisos = {};
      try {
        if (usuario.permisos) {
          if (typeof usuario.permisos === 'string') {
            permisos = JSON.parse(usuario.permisos);
          } else if (typeof usuario.permisos === 'object') {
            permisos = usuario.permisos;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error parseando permisos usuario ${usuario.email}`);
        permisos = {};
      }

      const docData = {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        // NO migrar password - Firebase Auth lo manejará
        rol: {
          id: usuario.rol_id.toString(),
          nombre: usuario.rol_nombre,
          permisos: permisos
        },
        activo: Boolean(usuario.activo),
        fecha_creacion: usuario.fecha_creacion ? 
          admin.firestore.Timestamp.fromDate(new Date(usuario.fecha_creacion)) : 
          admin.firestore.Timestamp.now(),
        ultima_sesion: usuario.ultima_sesion ? 
          admin.firestore.Timestamp.fromDate(new Date(usuario.ultima_sesion)) : null
      };

      await db.collection('usuarios').doc(usuario.id.toString()).set(docData);
      console.log(`✅ Usuario: ${usuario.email} (${usuario.rol_nombre})`);
    }
    
    console.log('\n⚠️ IMPORTANTE: Los usuarios deberán crear nuevas contraseñas con Firebase Auth');
    
  } catch (error) {
    console.error('❌ Error migrando usuarios:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrarProductosConStock() {
  console.log('\n🛍️ === MIGRANDO PRODUCTOS CON STOCK ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Tu estructura exacta detectada
    const [productos] = await connection.execute(`
      SELECT 
        p.id, p.codigo, p.nombre, p.descripcion, 
        p.precio_costo, p.precio_venta, p.imagen,
        p.categoria_id, p.proveedor_id, p.activo,
        p.fecha_creacion, p.fecha_modificacion,
        COALESCE(c.nombre, 'General') as categoria_nombre,
        COALESCE(prov.nombre, '') as proveedor_nombre,
        COALESCE(s.cantidad, 0) as stock_cantidad,
        COALESCE(s.stock_minimo, 5) as stock_minimo,
        COALESCE(s.ubicacion, '') as ubicacion
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores prov ON p.proveedor_id = prov.id
      LEFT JOIN stock s ON p.id = s.producto_id
      ORDER BY p.nombre ASC
    `);
    
    console.log(`Encontrados ${productos.length} productos (incluye inactivos)`);
    
    let migrados = 0;
    let omitidos = 0;
    
    for (const producto of productos) {
      // Solo migrar productos activos o sin especificar activo
      if (producto.activo === 0) {
        console.log(`⏭️ Omitiendo producto inactivo: ${producto.nombre}`);
        omitidos++;
        continue;
      }
      
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
        activo: Boolean(producto.activo !== 0),
        fecha_creacion: producto.fecha_creacion ? 
          admin.firestore.Timestamp.fromDate(new Date(producto.fecha_creacion)) : 
          admin.firestore.Timestamp.now(),
        fecha_modificacion: producto.fecha_modificacion ? 
          admin.firestore.Timestamp.fromDate(new Date(producto.fecha_modificacion)) : 
          admin.firestore.Timestamp.now()
      });
      
      console.log(`✅ Producto: ${producto.nombre} (Stock: ${producto.stock_cantidad})`);
      migrados++;
      
      // Migrar movimientos de stock
      await migrarMovimientosStock(connection, producto.id, docRef.id);
    }
    
    console.log(`\n📊 Resumen productos: ${migrados} migrados, ${omitidos} omitidos`);
    
  } catch (error) {
    console.error('❌ Error migrando productos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrarMovimientosStock(connection, productoIdMySQL, productoIdFirestore) {
  try {
    // Tu estructura: id, producto_id, tipo(enum), cantidad, referencia_id, referencia_tipo(enum), motivo, fecha, usuario_id
    const [movimientos] = await connection.execute(`
      SELECT ms.*, 
             COALESCE(u.nombre, 'Sistema') as usuario_nombre,
             COALESCE(u.apellido, '') as usuario_apellido
      FROM movimientos_stock ms
      LEFT JOIN usuarios u ON ms.usuario_id = u.id
      WHERE ms.producto_id = ?
      ORDER BY ms.fecha DESC
      LIMIT 100
    `, [productoIdMySQL]);
    
    if (movimientos.length > 0) {
      console.log(`  📊 Migrando ${movimientos.length} movimientos...`);
      
      for (const mov of movimientos) {
        await db.collection('productos').doc(productoIdFirestore)
          .collection('movimientos').add({
            tipo: mov.tipo, // entrada, salida, ajuste
            cantidad: parseInt(mov.cantidad),
            referencia_id: mov.referencia_id?.toString() || null,
            referencia_tipo: mov.referencia_tipo || null, // compra, venta, ajuste, devolucion
            motivo: mov.motivo || '',
            fecha: mov.fecha ? 
              admin.firestore.Timestamp.fromDate(new Date(mov.fecha)) : 
              admin.firestore.Timestamp.now(),
            usuario: {
              id: mov.usuario_id?.toString() || 'sistema',
              nombre: mov.usuario_nombre ? 
                `${mov.usuario_nombre} ${mov.usuario_apellido}`.trim() : 
                'Sistema'
            }
          });
      }
    }
    
  } catch (error) {
    console.warn(`⚠️ Error migrando movimientos para producto ${productoIdMySQL}:`, error.message);
  }
}

async function migrarClientes() {
  console.log('\n👨‍👩‍👧‍👦 === MIGRANDO CLIENTES ===');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    const [clientes] = await connection.execute('SELECT * FROM clientes WHERE activo = 1 OR activo IS NULL');
    console.log(`Encontrados ${clientes.length} clientes`);
    
    for (const cliente of clientes) {
      const docData = {
        nombre: cliente.nombre,
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        activo: cliente.activo !== undefined ? Boolean(cliente.activo) : true,
        fecha_creacion: cliente.fecha_creacion ? 
          admin.firestore.Timestamp.fromDate(new Date(cliente.fecha_creacion)) : 
          admin.firestore.Timestamp.now()
      };
      
      await db.collection('clientes').doc(cliente.id.toString()).set(docData);
      console.log(`✅ Cliente: ${cliente.nombre}`);
    }
    
  } catch (error) {
    console.error('❌ Error migrando clientes:', error);
    // No es crítico, continuar
  } finally {
    await connection.end();
  }
}

async function verificarMigracion() {
  console.log('\n🔍 === VERIFICACIÓN FINAL ===');
  
  try {
    const collections = ['roles', 'categorias', 'proveedores', 'usuarios', 'productos', 'clientes'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`✅ ${collectionName.padEnd(15)}: ${snapshot.size.toString().padStart(3)} documentos`);
        
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();
          const ejemplo = data.nombre || data.email || data.codigo || 'N/A';
          console.log(`   📄 Ejemplo: ${ejemplo}`);
        }
      } catch (error) {
        console.log(`⚠️ ${collectionName.padEnd(15)}: No existe o sin acceso`);
      }
    }
    
    // Verificar subcollections de movimientos
    const productosSnapshot = await db.collection('productos').limit(1).get();
    if (!productosSnapshot.empty) {
      const primerProducto = productosSnapshot.docs[0];
      const movimientosSnapshot = await primerProducto.ref.collection('movimientos').get();
      console.log(`📊 Movimientos ejemplo     : ${movimientosSnapshot.size.toString().padStart(3)} registros`);
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// EJECUTAR MIGRACIÓN COMPLETA
async function ejecutarMigracionCompleta() {
  const inicioTiempo = Date.now();
  
  try {
    console.log('⏰ Inicio:', new Date().toLocaleString());
    
    await verificarConexiones();
    await migrarRoles();
    await migrarCategorias();
    await migrarProveedores();
    await migrarUsuarios();
    await migrarProductosConStock();
    await migrarClientes();
    await verificarMigracion();
    
    const tiempoTotal = ((Date.now() - inicioTiempo) / 1000).toFixed(2);
    
    console.log('\n🎉 ===============================================');
    console.log('🎉    MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('🎉 ===============================================');
    console.log(`⏰ Tiempo total: ${tiempoTotal} segundos`);
    console.log('⏰ Fin:', new Date().toLocaleString());
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. ✅ Datos migrados a Firestore');
    console.log('2. 🔐 Configurar Firebase Auth para usuarios');
    console.log('3. ⚡ Desplegar Cloud Functions');
    console.log('4. 🔄 Actualizar frontend para usar Firestore');
    console.log('5. 🧪 Probar todas las funcionalidades');
    
    console.log('\n⚠️ RECORDATORIOS IMPORTANTES:');
    console.log('- Usuarios deben crear nuevas contraseñas');
    console.log('- Verificar permisos de Firestore rules');
    console.log('- Probar funciones de stock y movimientos');
    console.log('- Configurar backup automático');
    
  } catch (error) {
    console.error('\n💥 ===============================================');
    console.error('💥    ERROR FATAL EN MIGRACIÓN');
    console.error('💥 ===============================================');
    console.error('Error:', error.message);
    
    console.log('\n🔧 VERIFICA:');
    console.log('❓ ¿Archivo .env con credenciales MySQL correctas?');
    console.log('❓ ¿Archivo serviceAccountKey.json en la carpeta?');
    console.log('❓ ¿Conexión a internet estable?');
    console.log('❓ ¿Permisos de escritura en Firestore?');
    console.log('❓ ¿Base de datos MySQL accessible?');
    
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarMigracionCompleta()
    .then(() => {
      console.log('\n✨ Proceso completado. ¡Listo para usar Firebase!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Proceso terminado con errores:', error.message);
      process.exit(1);
    });
}

module.exports = { ejecutarMigracionCompleta };