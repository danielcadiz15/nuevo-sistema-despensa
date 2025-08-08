// limpiar-base-datos.js - Script para eliminar todos los clientes
// ⚠️ SOLO PARA ENTORNO DE PRUEBA - ELIMINA DATOS PERMANENTEMENTE

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Elimina todos los documentos de una colección
 * @param {string} collectionName - Nombre de la colección
 */
async function eliminarColeccion(collectionName) {
  try {
    console.log(`🔄 Eliminando colección: ${collectionName}`);
    
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`⚠️ No hay documentos en ${collectionName}`);
      return 0;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ ${snapshot.size} documentos eliminados de ${collectionName}`);
    
    return snapshot.size;
    
  } catch (error) {
    console.error(`❌ Error eliminando ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Script principal de limpieza
 */
async function limpiarBaseDatos() {
  console.log('🚀 INICIANDO LIMPIEZA DE BASE DE DATOS');
  console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos');
  console.log('');
  
  const inicioTiempo = Date.now();
  let totalEliminados = 0;
  
  try {
    // 1. Eliminar ventas
    console.log('📝 Paso 1: Eliminando ventas...');
    const ventasEliminadas = await eliminarColeccion('ventas');
    totalEliminados += ventasEliminadas;
    
    // 2. Eliminar clientes
    console.log('📝 Paso 2: Eliminando clientes...');
    const clientesEliminados = await eliminarColeccion('clientes');
    totalEliminados += clientesEliminados;
    
    // 3. Eliminar movimientos de stock
    console.log('📝 Paso 3: Eliminando movimientos de stock...');
    const movimientosEliminados = await eliminarColeccion('movimientos_stock');
    totalEliminados += movimientosEliminados;
    
    // 4. Resetear contador de ventas
    console.log('📝 Paso 4: Reseteando contadores...');
    await db.collection('contadores').doc('ventas').set({
      ultimo: 0,
      reseteado_en: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Contador de ventas reseteado');
    
    const tiempoTotal = ((Date.now() - inicioTiempo) / 1000).toFixed(2);
    
    console.log('');
    console.log('🎉 LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log(`📊 Total documentos eliminados: ${totalEliminados}`);
    console.log(`⏱️  Tiempo total: ${tiempoTotal} segundos`);
    console.log('');
    console.log('✅ Datos eliminados:');
    console.log(`   • ${clientesEliminados} clientes`);
    console.log(`   • ${ventasEliminadas} ventas`);
    console.log(`   • ${movimientosEliminados} movimientos de stock`);
    console.log('   • Contadores reseteados');
    console.log('');
    console.log('🚀 Base de datos lista para nueva importación');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA LIMPIEZA:', error);
    console.log('🔧 Revisa la configuración de Firebase Admin SDK');
    process.exit(1);
  }
}

/**
 * Función para confirmar la eliminación
 */
async function confirmarEliminacion() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('¿Estás seguro de eliminar TODOS los clientes y datos relacionados? (escribe "ELIMINAR TODO" para confirmar): ', (respuesta) => {
      rl.close();
      resolve(respuesta === 'ELIMINAR TODO');
    });
  });
}

/**
 * Ejecutar script
 */
async function ejecutar() {
  try {
    console.log('⚠️  SCRIPT DE LIMPIEZA DE BASE DE DATOS ⚠️');
    console.log('');
    console.log('Este script eliminará PERMANENTEMENTE:');
    console.log('• Todos los clientes');
    console.log('• Todas las ventas');
    console.log('• Todos los movimientos de stock');
    console.log('• Reseteará contadores');
    console.log('');
    
    // Confirmar eliminación
    const confirmado = await confirmarEliminacion();
    
    if (!confirmado) {
      console.log('❌ Operación cancelada por el usuario');
      process.exit(0);
    }
    
    // Esperar 3 segundos para que el usuario pueda cancelar
    console.log('⏳ Iniciando en 3 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('⏳ 2...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('⏳ 1...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Ejecutar limpieza
    await limpiarBaseDatos();
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar el script
ejecutar();