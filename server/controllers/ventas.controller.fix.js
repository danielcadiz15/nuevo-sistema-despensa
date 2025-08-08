/**
 * Cambia el estado de una venta
 * @param {Object} req - Objeto de solicitud con id en params y datos en body
 * @param {Object} res - Objeto de respuesta
 */
cambiarEstado: async (req, res) => {
  const connection = await beginTransaction();
  
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;
    
    console.log(`Intentando cambiar estado de venta ${id} a ${estado}, motivo: ${motivo}`);
    
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el estado'
      });
    }
    
    // Verificar que la venta existe
    const ventaExistente = await query(
      'SELECT * FROM ventas WHERE id = ?',
      [id],
      connection
    );
    
    if (ventaExistente.length === 0) {
      await rollbackTransaction(connection);
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }
    
    const venta = ventaExistente[0];
    
    // Validar transición de estado
    const estadosValidos = {
      'pendiente': ['completada', 'cancelada'],
      'completada': ['devuelta'],
      'cancelada': [],
      'devuelta': []
    };
    
    if (!estadosValidos[venta.estado] || !estadosValidos[venta.estado].includes(estado)) {
      await rollbackTransaction(connection);
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de estado ${venta.estado} a ${estado}`
      });
    }
    
    // Si se está cancelando, comprobar si ya hay movimientos de stock
    if (estado === 'cancelada') {
      // Actualizar estado de la venta
      await transactionQuery(
        connection,
        'UPDATE ventas SET estado = ?, notas = CONCAT(IFNULL(notas, ""), ?) WHERE id = ?',
        [estado, motivo ? `\nMotivo de cancelación: ${motivo}` : '\nCancelada sin motivo especificado', id]
      );
      
      // Obtener detalles de la venta para restaurar stock
      const detalles = await transactionQuery(
        connection,
        'SELECT * FROM detalle_venta WHERE venta_id = ?',
        [id]
      );
      
      // Restaurar stock para cada producto
      for (const detalle of detalles) {
        // Actualizar stock
        await transactionQuery(
          connection,
          'UPDATE stock SET cantidad = cantidad + ? WHERE producto_id = ?',
          [detalle.cantidad, detalle.producto_id]
        );
        
        // Registrar movimiento de stock
        await transactionQuery(
          connection,
          `INSERT INTO movimientos_stock 
          (producto_id, tipo, cantidad, referencia_id, referencia_tipo, motivo, usuario_id)
          VALUES (?, 'entrada', ?, ?, 'cancelacion', ?, ?)`,
          [
            detalle.producto_id, 
            detalle.cantidad, 
            id, 
            `Cancelación de venta ${venta.numero || id}`, 
            req.usuario.id
          ]
        );
      }
    } else {
      // Para otros cambios de estado, solo actualizar la venta
      await transactionQuery(
        connection,
        'UPDATE ventas SET estado = ? WHERE id = ?',
        [estado, id]
      );
    }
    
    await commitTransaction(connection);
    
    res.json({
      success: true,
      message: `Venta ${estado === 'cancelada' ? 'cancelada' : 'actualizada'} correctamente`
    });
  } catch (error) {
    await rollbackTransaction(connection);
    console.error('Error al cambiar estado de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de venta',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}