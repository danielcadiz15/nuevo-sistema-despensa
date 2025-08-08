/**
 * Configuración de la conexión a la base de datos
 * Diseñado con una estructura adaptable para futura migración a Firebase
 * 
 * @module config/database
 * @requires mysql2/promise, dotenv
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',  // NO incluir la contraseña directamente aquí
  database: process.env.DB_NAME || 'despensa_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool(dbConfig);

// Verificar la conexión al iniciar
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
  }
})();

/**
 * Ejecuta una consulta SQL
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta (opcional)
 * @returns {Promise<Array>} Resultados de la consulta
 */
const query = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Ejecutando consulta:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en consulta SQL:', error.message);
    console.error('SQL:', sql);
    console.error('Parámetros:', JSON.stringify(params));
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Inicia una transacción
 * @returns {Promise<mysql.Connection>} Conexión con la transacción iniciada
 */
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Ejecuta una consulta dentro de una transacción
 * @param {mysql.Connection} connection - Conexión con transacción activa
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Object>} Resultados de la consulta
 */
const transactionQuery = async (connection, sql, params = []) => {
  try {
    console.log('Ejecutando consulta de transacción:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    const [result] = await connection.query(sql, params);
    return result;
  } catch (error) {
    console.error('Error en consulta de transacción:', sql);
    console.error('Parámetros:', params);
    console.error('Error completo:', error);
    throw error;
  }
};

/**
 * Confirma una transacción
 * @param {mysql.Connection} connection - Conexión con transacción activa
 * @returns {Promise<void>}
 */
const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

/**
 * Revierte una transacción
 * @param {mysql.Connection} connection - Conexión con transacción activa
 * @returns {Promise<void>}
 */
const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

/**
 * Abstracción de acceso a datos compatible con Firebase
 * Esta clase se puede reemplazar en el futuro por una implementación de Firebase
 */
class DataAccess {
  /**
   * Obtiene todos los documentos de una colección
   * @param {string} collection - Nombre de la tabla/colección
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} - Resultados
   */
  static async getAll(collection, options = {}) {
    try {
      let sql = `SELECT * FROM ${collection}`;
      const params = [];
      
      // Agregar condiciones WHERE si existen
      if (options.where) {
        const conditions = [];
        Object.entries(options.where).forEach(([key, value]) => {
          conditions.push(`${key} = ?`);
          params.push(value);
        });
        
        if (conditions.length > 0) {
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // Agregar ORDER BY si existe
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }
      
      // Agregar LIMIT si existe
      if (options.limit) {
        sql += ` LIMIT ${parseInt(options.limit)}`;
      }
      
      return await query(sql, params);
    } catch (error) {
      console.error(`Error en DataAccess.getAll(${collection}):`, error);
      // Este patrón permite migrar fácilmente a Firebase
      return options.fallbackData || [];
    }
  }
  
  /**
   * Obtiene un documento por ID
   * @param {string} collection - Nombre de la tabla/colección
   * @param {number|string} id - ID del documento
   * @returns {Promise<Object>} - Resultado
   */
  static async getById(collection, id, options = {}) {
    try {
      const sql = `SELECT * FROM ${collection} WHERE id = ?`;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error en DataAccess.getById(${collection}, ${id}):`, error);
      return options.fallbackData || null;
    }
  }
  
  /**
   * Crea un nuevo documento
   * @param {string} collection - Nombre de la tabla/colección
   * @param {Object} data - Datos a insertar
   * @returns {Promise<Object>} - Resultado con ID
   */
  static async create(collection, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = Array(keys.length).fill('?').join(', ');
      
      const sql = `INSERT INTO ${collection} (${keys.join(', ')}) VALUES (${placeholders})`;
      const result = await query(sql, values);
      
      return {
        id: result.insertId,
        ...data
      };
    } catch (error) {
      console.error(`Error en DataAccess.create(${collection}):`, error);
      throw error;
    }
  }
  
  /**
   * Actualiza un documento
   * @param {string} collection - Nombre de la tabla/colección
   * @param {number|string} id - ID del documento
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<boolean>} - True si se actualizó correctamente
   */
  static async update(collection, id, data) {
    try {
      const entries = Object.entries(data);
      const setStatements = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = entries.map(([, value]) => value);
      values.push(id);
      
      const sql = `UPDATE ${collection} SET ${setStatements} WHERE id = ?`;
      const result = await query(sql, values);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error en DataAccess.update(${collection}, ${id}):`, error);
      throw error;
    }
  }
  
  /**
   * Elimina un documento
   * @param {string} collection - Nombre de la tabla/colección
   * @param {number|string} id - ID del documento
   * @returns {Promise<boolean>} - True si se eliminó correctamente
   */
  static async delete(collection, id) {
    try {
      const sql = `DELETE FROM ${collection} WHERE id = ?`;
      const result = await query(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error en DataAccess.delete(${collection}, ${id}):`, error);
      throw error;
    }
  }
}

module.exports = {
  pool,
  connectDB: async () => {
    try {
      const connection = await pool.getConnection();
      console.log('Conexión a la base de datos establecida correctamente');
      connection.release();
      return true;
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error.message);
      return false;
    }
  },
  query,
  beginTransaction,
  transactionQuery,
  commitTransaction,
  rollbackTransaction,
  DataAccess
};