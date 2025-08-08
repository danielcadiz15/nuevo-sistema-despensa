// scripts/create-admin-user.js - Con service account key

const admin = require('firebase-admin');
const path = require('path');

// OPCIÓN: Usar service account key
try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin inicializado con service account');
} catch (error) {
  console.log('⚠️ No se encontró serviceAccountKey.json, intentando credenciales por defecto...');
  try {
    admin.initializeApp();
    console.log('✅ Firebase Admin inicializado con credenciales por defecto');
  } catch (defaultError) {
    console.error('❌ Error al inicializar Firebase Admin:', defaultError.message);
    console.log('\n🔧 SOLUCIONES:');
    console.log('1. Ejecuta: firebase login && firebase use tu-proyecto-id');
    console.log('2. O descarga serviceAccountKey.json desde Firebase Console');
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    console.log('🔄 Creando usuario administrador...');
    
    const adminEmail = 'admin@sistema.com';
    const adminPassword = 'Admin123!';
    
    // Verificar si el usuario ya existe
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      console.log('👤 Usuario ya existe:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Administrador del Sistema',
          disabled: false
        });
        console.log('✅ Usuario creado en Firebase Auth:', userRecord.uid);
      } else {
        throw error;
      }
    }
    
    // Crear documento en Firestore
    const userData = {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: adminEmail,
      rol: 'Administrador',
      rol_id: '1',
      activo: true,
      permisos: {
        productos: { ver: true, crear: true, editar: true, eliminar: true },
        compras: { ver: true, crear: true, editar: true, eliminar: true },
        ventas: { ver: true, crear: true, editar: true, eliminar: true },
        stock: { ver: true, crear: true, editar: true, eliminar: true },
        reportes: { ver: true, crear: true, editar: true, eliminar: true },
        promociones: { ver: true, crear: true, editar: true, eliminar: true },
        usuarios: { ver: true, crear: true, editar: true, eliminar: true }
      },
      sucursales: [],
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('usuarios').doc(userRecord.uid).set(userData, { merge: true });
    console.log('✅ Documento actualizado en Firestore');
    
    // Establecer Custom Claims
    const customClaims = {
      rol: 'Administrador',
      rolId: '1',
      permisos: userData.permisos,
      activo: true,
      sucursales: []
    };
    
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    console.log('✅ Custom claims establecidos');
    
    console.log('\n🎉 USUARIO ADMINISTRADOR LISTO');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 UID:', userRecord.uid);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Código de error:', error.code);
    
    // Mensajes de ayuda específicos
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️ El usuario ya existe, pero se actualizaron los permisos');
    } else if (error.code === 'permission-denied') {
      console.log('\n🔧 Error de permisos. Verifica:');
      console.log('1. Que tengas permisos de administrador en Firebase');
      console.log('2. Que las reglas de Firestore permitan escritura');
    } else if (error.code === 'app/no-app') {
      console.log('\n🔧 Firebase no está inicializado correctamente');
      console.log('Ejecuta: firebase login && firebase use tu-proyecto-id');
    }
  } finally {
    process.exit(0);
  }
}

// Ejecutar script
createAdminUser();