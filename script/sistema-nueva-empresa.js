// setup-nueva-empresa.js
// Script para configurar el sistema para una nueva empresa

const inquirer = require('inquirer');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Configuración de módulos disponibles
const MODULOS_DISPONIBLES = {
  core: {
    nombre: 'Core (Productos, Ventas, Stock)',
    requerido: true,
    colecciones: ['productos', 'categorias', 'ventas', 'stock_sucursal', 'sucursales', 'clientes']
  },
  compras: {
    nombre: 'Compras y Proveedores',
    requerido: false,
    colecciones: ['compras', 'proveedores']
  },
  vehiculos: {
    nombre: 'Control de Vehículos',
    requerido: false,
    colecciones: ['vehiculos', 'cargas_combustible', 'servicios_vehiculos', 'gastos_vehiculos']
  },
  produccion: {
    nombre: 'Producción y Recetas',
    requerido: false,
    colecciones: ['recetas', 'produccion', 'recetas_detalles']
  },
  reportes: {
    nombre: 'Reportes Avanzados',
    requerido: false,
    colecciones: []
  }
};

// Estructura inicial de datos
const DATOS_INICIALES = {
  // Configuración de empresa
  configuracion_empresa: {
    nombre: '',
    rut: '',
    direccion: '',
    telefono: '',
    email: '',
    logo_url: '',
    moneda: 'ARS',
    impuesto_porcentaje: 21,
    modulos_activos: [],
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  },
  
  // Usuario administrador inicial
  usuario_admin: {
    nombre: 'Administrador',
    apellido: '',
    email: '',
    rol: 'admin',
    activo: true,
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  },
  
  // Sucursal principal
  sucursal_principal: {
    nombre: 'Sucursal Principal',
    direccion: '',
    telefono: '',
    tipo: 'principal',
    activa: true,
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  },
  
  // Categorías básicas
  categorias_basicas: [
    { nombre: 'General', descripcion: 'Categoría general', activa: true },
    { nombre: 'Bebidas', descripcion: 'Bebidas en general', activa: true },
    { nombre: 'Alimentos', descripcion: 'Productos alimenticios', activa: true }
  ]
};

// Función principal
async function setupNuevaEmpresa() {
  console.log('🏢 CONFIGURACIÓN DE SISTEMA PARA NUEVA EMPRESA\n');
  
  try {
    // 1. Solicitar información de la empresa
    const respuestas = await inquirer.prompt([
      {
        type: 'input',
        name: 'nombreEmpresa',
        message: 'Nombre de la empresa:',
        validate: input => input.length > 0 || 'El nombre es requerido'
      },
      {
        type: 'input',
        name: 'rutEmpresa',
        message: 'RUT/CUIT de la empresa:'
      },
      {
        type: 'input',
        name: 'emailAdmin',
        message: 'Email del administrador:',
        validate: input => /\S+@\S+\.\S+/.test(input) || 'Email inválido'
      },
      {
        type: 'input',
        name: 'projectId',
        message: 'ID del proyecto Firebase (nuevo):',
        validate: input => /^[a-z0-9-]+$/.test(input) || 'Solo letras minúsculas, números y guiones'
      },
      {
        type: 'checkbox',
        name: 'modulos',
        message: 'Selecciona los módulos a activar:',
        choices: Object.entries(MODULOS_DISPONIBLES)
          .filter(([key, mod]) => !mod.requerido)
          .map(([key, mod]) => ({
            name: mod.nombre,
            value: key,
            checked: key === 'compras' // Compras activado por defecto
          }))
      }
    ]);
    
    // 2. Generar configuración
    console.log('\n📝 Generando configuración...\n');
    
    const configuracion = {
      empresa: {
        ...DATOS_INICIALES.configuracion_empresa,
        nombre: respuestas.nombreEmpresa,
        rut: respuestas.rutEmpresa,
        modulos_activos: ['core', ...respuestas.modulos]
      },
      admin: {
        ...DATOS_INICIALES.usuario_admin,
        email: respuestas.emailAdmin
      },
      projectId: respuestas.projectId
    };
    
    // 3. Generar archivos de configuración
    await generarArchivosConfiguracion(configuracion);
    
    // 4. Generar script de inicialización de Firestore
    await generarScriptFirestore(configuracion);
    
    // 5. Generar documentación
    await generarDocumentacion(configuracion);
    
    console.log('\n✅ ¡Configuración completada!\n');
    console.log('📋 Próximos pasos:');
    console.log(`1. Crea un nuevo proyecto en Firebase: ${configuracion.projectId}`);
    console.log('2. Descarga las credenciales del nuevo proyecto');
    console.log('3. Ejecuta: npm run init:empresa');
    console.log('4. Configura las variables de entorno (.env)');
    console.log('5. Despliega con: npm run deploy:all\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Generar archivos de configuración
async function generarArchivosConfiguracion(config) {
  const outputDir = `./nueva-empresa-${config.projectId}`;
  
  // Crear directorio
  await fs.mkdir(outputDir, { recursive: true });
  
  // 1. Generar .env
  const envContent = `
# Configuración Firebase
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=${config.projectId}.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=${config.projectId}
REACT_APP_FIREBASE_STORAGE_BUCKET=${config.projectId}.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=

# Configuración de la empresa
REACT_APP_EMPRESA_NOMBRE=${config.empresa.nombre}
REACT_APP_MODULOS_ACTIVOS=${config.empresa.modulos_activos.join(',')}
`;
  
  await fs.writeFile(path.join(outputDir, '.env.template'), envContent);
  
  // 2. Generar configuración de módulos
  const modulosConfig = {
    modulosActivos: config.empresa.modulos_activos,
    configuracion: {}
  };
  
  for (const modulo of config.empresa.modulos_activos) {
    if (MODULOS_DISPONIBLES[modulo]) {
      modulosConfig.configuracion[modulo] = {
        activo: true,
        colecciones: MODULOS_DISPONIBLES[modulo].colecciones
      };
    }
  }
  
  await fs.writeFile(
    path.join(outputDir, 'modulos.config.json'),
    JSON.stringify(modulosConfig, null, 2)
  );
  
  console.log(`✅ Archivos de configuración creados en: ${outputDir}`);
}

// Generar script de inicialización de Firestore
async function generarScriptFirestore(config) {
  const outputDir = `./nueva-empresa-${config.projectId}`;
  
  const scriptContent = `
// init-firestore.js
// Script de inicialización para ${config.empresa.nombre}

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: '${config.projectId}'
});

const db = admin.firestore();

async function inicializarEmpresa() {
  console.log('🚀 Inicializando Firestore para ${config.empresa.nombre}...');
  
  try {
    // 1. Crear configuración de empresa
    await db.collection('configuracion').doc('empresa').set(${JSON.stringify(config.empresa, null, 4)});
    
    // 2. Crear usuario administrador
    await db.collection('usuarios').add(${JSON.stringify(config.admin, null, 4)});
    
    // 3. Crear sucursal principal
    await db.collection('sucursales').add(${JSON.stringify(DATOS_INICIALES.sucursal_principal, null, 4)});
    
    // 4. Crear categorías básicas
    for (const categoria of ${JSON.stringify(DATOS_INICIALES.categorias_basicas)}) {
      await db.collection('categorias').add({
        ...categoria,
        fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('✅ Inicialización completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inicializarEmpresa();
`;
  
  await fs.writeFile(path.join(outputDir, 'init-firestore.js'), scriptContent);
}

// Generar documentación
async function generarDocumentacion(config) {
  const outputDir = `./nueva-empresa-${config.projectId}`;
  
  const readmeContent = `
# Sistema de Gestión - ${config.empresa.nombre}

## Información del Proyecto
- **Empresa**: ${config.empresa.nombre}
- **Project ID**: ${config.projectId}
- **Módulos Activos**: ${config.empresa.modulos_activos.join(', ')}

## Instalación

### 1. Configurar Firebase
1. Crea un nuevo proyecto en [Firebase Console](https://console.firebase.google.com)
2. Nombre del proyecto: \`${config.projectId}\`
3. Activa Authentication (Email/Password)
4. Activa Firestore Database
5. Activa Storage

### 2. Obtener Credenciales
1. Ve a Configuración del proyecto > General
2. Crea una nueva aplicación web
3. Copia las credenciales al archivo \`.env\`
4. Descarga la clave de servicio (serviceAccountKey.json)

### 3. Inicializar el Sistema
\`\`\`bash
# Instalar dependencias
npm install

# Inicializar Firestore
node init-firestore.js

# Crear índices necesarios
./create-indexes.sh

# Desplegar funciones
cd functions && npm run deploy

# Iniciar aplicación
npm start
\`\`\`

## Módulos Incluidos

${config.empresa.modulos_activos.map(mod => {
  const modInfo = MODULOS_DISPONIBLES[mod];
  return modInfo ? `### ${modInfo.nombre}\n- Colecciones: ${modInfo.colecciones.join(', ')}` : '';
}).join('\n\n')}

## Personalización

### Cambiar Logo
1. Sube el logo a Firebase Storage
2. Actualiza la URL en Configuración > Empresa

### Activar/Desactivar Módulos
1. Edita \`modulos.config.json\`
2. Actualiza las rutas en \`App.js\`
3. Actualiza el menú en \`Sidebar.js\`

## Soporte
Para soporte técnico, contactar al desarrollador.
`;
  
  await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupNuevaEmpresa();
}

module.exports = { setupNuevaEmpresa, MODULOS_DISPONIBLES };

/*
INSTRUCCIONES DE USO:

1. Instala las dependencias:
   npm install inquirer

2. Ejecuta el script:
   node setup-nueva-empresa.js

3. Sigue las instrucciones generadas

El script creará:
- Archivos de configuración
- Script de inicialización
- Documentación personalizada
- Estructura de carpetas lista para deploy
*/