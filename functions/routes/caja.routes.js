const admin = require('firebase-admin');
const db = admin.firestore();
const { configurarCORS, manejarPreflight } = require('../utils/cors');

// Colección de movimientos de caja
const COLECCION_CAJA = 'movimientos_caja';
const COLECCION_SALDO_CAJA = 'saldo_caja';

const cajaRoutes = async (req, res, path) => {
  try {
    if (manejarPreflight && manejarPreflight(req, res)) return true;
    configurarCORS && configurarCORS(res);

    console.log(`💰 [CAJA] Procesando ruta: ${req.method} ${path}`);

    // POST /caja/movimiento - Agregar movimiento
    if (path === '/caja/movimiento' && req.method === 'POST') {
      console.log('💰 [CAJA] Agregando movimiento:', req.body);
      
      const { tipo, monto, concepto, usuario, observaciones, fecha } = req.body;
      if (!tipo || !monto || !concepto) {
        console.log('❌ [CAJA] Faltan datos obligatorios');
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
      }
      
      const fechaMovimiento = fecha || new Date().toISOString();
      const movimiento = {
        tipo, // 'ingreso' o 'egreso'
        monto: parseFloat(monto),
        concepto,
        usuario: usuario || null,
        observaciones: observaciones || '',
        fecha: fechaMovimiento,
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('💰 [CAJA] Guardando movimiento:', movimiento);
      const docRef = await db.collection(COLECCION_CAJA).add(movimiento);
      
      // Actualizar saldo acumulado
      await actualizarSaldoAcumulado(tipo, parseFloat(monto));
      
      console.log('✅ [CAJA] Movimiento guardado con ID:', docRef.id);
      res.json({ success: true, id: docRef.id, movimiento });
      return true;
    }

    // GET /caja/movimientos?fecha=YYYY-MM-DD - Listar movimientos de un día
    if (path === '/caja/movimientos' && req.method === 'GET') {
      const { fecha } = req.query;
      console.log('💰 [CAJA] Consultando movimientos para fecha:', fecha);
      
      if (!fecha) {
        console.log('❌ [CAJA] No se proporcionó fecha');
        return res.status(400).json({ success: false, message: 'Debe indicar la fecha (YYYY-MM-DD)' });
      }
      
      try {
        // Primero, vamos a ver todos los movimientos para debug
        const todosLosMovimientos = await db.collection(COLECCION_CAJA).get();
        console.log('💰 [CAJA] Total de movimientos en la colección:', todosLosMovimientos.size);
        
        todosLosMovimientos.forEach(doc => {
          const data = doc.data();
          console.log('💰 [CAJA] Movimiento encontrado:', {
            id: doc.id,
            fecha: data.fecha,
            tipo: data.tipo,
            monto: data.monto,
            concepto: data.concepto
          });
        });
        
        // CORREGIDO: Consultar por string de fecha en lugar de timestamps
        const movimientosSnapshot = await db.collection(COLECCION_CAJA)
          .where('fecha', '==', fecha)
          .orderBy('fechaCreacion', 'asc')
          .get();
        
        const movimientos = [];
        movimientosSnapshot.forEach(doc => {
          movimientos.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ [CAJA] Encontrados ${movimientos.length} movimientos`);
        res.json({ success: true, data: movimientos, total: movimientos.length });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error consultando movimientos:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al consultar movimientos',
          error: error.message,
          stack: error.stack // Agregado para depuración
        });
        return true;
      }
    }

    // GET /caja/movimientos-acumulados - Listar todos los movimientos (caja chica)
    if (path === '/caja/movimientos-acumulados' && req.method === 'GET') {
      console.log('💰 [CAJA] Consultando movimientos acumulados (caja chica)');
      
      try {
        const movimientosSnapshot = await db.collection(COLECCION_CAJA)
          .orderBy('fechaCreacion', 'desc')
          .limit(100) // Últimos 100 movimientos
          .get();
        
        const movimientos = [];
        movimientosSnapshot.forEach(doc => {
          movimientos.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ [CAJA] Encontrados ${movimientos.length} movimientos acumulados`);
        res.json({ success: true, data: movimientos, total: movimientos.length });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error consultando movimientos acumulados:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al consultar movimientos acumulados',
          error: error.message
        });
        return true;
      }
    }

    // GET /caja/resumen?fecha=YYYY-MM-DD - Totales del día
    if (path === '/caja/resumen' && req.method === 'GET') {
      const { fecha } = req.query;
      console.log('💰 [CAJA] Calculando resumen para fecha:', fecha);
      
      if (!fecha) {
        console.log('❌ [CAJA] No se proporcionó fecha para resumen');
        return res.status(400).json({ success: false, message: 'Debe indicar la fecha (YYYY-MM-DD)' });
      }
      
      try {
        // CORREGIDO: Consultar por string de fecha en lugar de timestamps
        const movimientosSnapshot = await db.collection(COLECCION_CAJA)
          .where('fecha', '==', fecha)
          .get();
        
        let ingresos = 0;
        let egresos = 0;
        
        movimientosSnapshot.forEach(doc => {
          const mov = doc.data();
          if (mov.tipo === 'ingreso') ingresos += parseFloat(mov.monto);
          if (mov.tipo === 'egreso') egresos += parseFloat(mov.monto);
        });
        
        const saldo = ingresos - egresos;
        console.log(`✅ [CAJA] Resumen - Ingresos: ${ingresos}, Egresos: ${egresos}, Saldo: ${saldo}`);
        
        res.json({ success: true, ingresos, egresos, saldo });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error calculando resumen:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al calcular resumen',
          error: error.message 
        });
        return true;
      }
    }

    // GET /caja/saldo-acumulado - Saldo total de caja chica
    if (path === '/caja/saldo-acumulado' && req.method === 'GET') {
      console.log('💰 [CAJA] Calculando saldo acumulado de caja chica');
      
      try {
        // Obtener saldo desde la colección de saldo
        const saldoDoc = await db.collection(COLECCION_SALDO_CAJA).doc('actual').get();
        
        let saldoAcumulado = 0;
        if (saldoDoc.exists) {
          saldoAcumulado = saldoDoc.data().saldo || 0;
        } else {
          // Si no existe, calcular desde todos los movimientos
          const todosLosMovimientos = await db.collection(COLECCION_CAJA).get();
          
          todosLosMovimientos.forEach(doc => {
            const mov = doc.data();
            if (mov.tipo === 'ingreso') saldoAcumulado += parseFloat(mov.monto);
            if (mov.tipo === 'egreso') saldoAcumulado -= parseFloat(mov.monto);
          });
          
          // Guardar el saldo calculado
          await db.collection(COLECCION_SALDO_CAJA).doc('actual').set({
            saldo: saldoAcumulado,
            fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        console.log(`✅ [CAJA] Saldo acumulado: ${saldoAcumulado}`);
        res.json({ success: true, saldoAcumulado });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error calculando saldo acumulado:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al calcular saldo acumulado',
          error: error.message 
        });
        return true;
      }
    }

    // POST /caja/verificar-saldo - Verificar saldo físico vs saldo del sistema
    if (path === '/caja/verificar-saldo' && req.method === 'POST') {
      const { saldoFisico } = req.body;
      console.log('💰 [CAJA] Verificando saldo físico:', saldoFisico);
      
      if (saldoFisico === undefined || saldoFisico === null) {
        return res.status(400).json({ success: false, message: 'Debe proporcionar el saldo físico' });
      }
      
      try {
        // Obtener saldo del sistema
        const saldoDoc = await db.collection(COLECCION_SALDO_CAJA).doc('actual').get();
        const saldoSistema = saldoDoc.exists ? saldoDoc.data().saldo || 0 : 0;
        
        const diferencia = parseFloat(saldoFisico) - saldoSistema;
        
        // Guardar verificación
        await db.collection(COLECCION_SALDO_CAJA).doc('verificaciones').collection('registros').add({
          saldoFisico: parseFloat(saldoFisico),
          saldoSistema,
          diferencia,
          fechaVerificacion: admin.firestore.FieldValue.serverTimestamp(),
          usuario: req.body.usuario || 'sistema'
        });
        
        console.log(`✅ [CAJA] Verificación guardada - Físico: ${saldoFisico}, Sistema: ${saldoSistema}, Diferencia: ${diferencia}`);
        res.json({ 
          success: true, 
          saldoFisico: parseFloat(saldoFisico),
          saldoSistema,
          diferencia,
          coinciden: diferencia === 0
        });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error verificando saldo:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al verificar saldo',
          error: error.message 
        });
        return true;
      }
    }

    // DELETE /caja/movimiento/:id - Eliminar movimiento
    if (path.match(/^\/caja\/movimiento\/[^\/]+$/) && req.method === 'DELETE') {
      const movimientoId = path.split('/').pop();
      console.log('💰 [CAJA] Eliminando movimiento:', movimientoId);
      
      try {
        const movimientoDoc = await db.collection(COLECCION_CAJA).doc(movimientoId).get();
        
        if (!movimientoDoc.exists) {
          console.log('❌ [CAJA] Movimiento no encontrado:', movimientoId);
          return res.status(404).json({ 
            success: false, 
            message: 'Movimiento no encontrado' 
          });
        }
        
        const movimiento = movimientoDoc.data();
        
        // Actualizar saldo acumulado (revertir el movimiento)
        const montoRevertir = movimiento.tipo === 'ingreso' ? -parseFloat(movimiento.monto) : parseFloat(movimiento.monto);
        await actualizarSaldoAcumulado(movimiento.tipo === 'ingreso' ? 'egreso' : 'ingreso', Math.abs(montoRevertir));
        
        await db.collection(COLECCION_CAJA).doc(movimientoId).delete();
        
        console.log('✅ [CAJA] Movimiento eliminado:', movimientoId);
        res.json({ 
          success: true, 
          message: 'Movimiento eliminado correctamente',
          id: movimientoId
        });
        return true;
        
      } catch (error) {
        console.error('❌ [CAJA] Error al eliminar movimiento:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error al eliminar movimiento',
          error: error.message 
        });
        return true;
      }
    }

    console.log('❌ [CAJA] Ruta no encontrada:', path);
    return false;
    
  } catch (error) {
    console.error('❌ [CAJA] Error general en caja.routes:', error);
    res.status(500).json({ success: false, message: 'Error en caja', error: error.message });
    return true;
  }
};

// Función helper para actualizar saldo acumulado
const actualizarSaldoAcumulado = async (tipo, monto) => {
  try {
    const saldoRef = db.collection(COLECCION_SALDO_CAJA).doc('actual');
    const saldoDoc = await saldoRef.get();
    
    let saldoActual = 0;
    if (saldoDoc.exists) {
      saldoActual = saldoDoc.data().saldo || 0;
    }
    
    // Actualizar saldo
    const nuevoSaldo = tipo === 'ingreso' ? saldoActual + monto : saldoActual - monto;
    
    await saldoRef.set({
      saldo: nuevoSaldo,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`💰 [CAJA] Saldo actualizado - Anterior: ${saldoActual}, Nuevo: ${nuevoSaldo}`);
  } catch (error) {
    console.error('❌ [CAJA] Error actualizando saldo acumulado:', error);
  }
};

module.exports = cajaRoutes; 