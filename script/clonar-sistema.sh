#!/bin/bash
# clonar-sistema.sh
# Script para clonar el sistema para una nueva empresa

echo "🚀 CLONADOR DE SISTEMA DE GESTIÓN"
echo "================================="
echo ""

# Solicitar información
read -p "Nombre de la nueva empresa: " EMPRESA_NOMBRE
read -p "ID del proyecto Firebase (ej: mi-empresa-123): " PROJECT_ID
read -p "Email del administrador: " ADMIN_EMAIL

# Crear directorio para la nueva empresa
OUTPUT_DIR="sistema-$PROJECT_ID"
mkdir -p $OUTPUT_DIR

echo ""
echo "📁 Creando estructura de archivos..."

# Copiar archivos del frontend
cp -r src $OUTPUT_DIR/
cp -r public $OUTPUT_DIR/
cp package.json $OUTPUT_DIR/
cp .gitignore $OUTPUT_DIR/

# Copiar archivos del backend
mkdir -p $OUTPUT_DIR/functions
cp -r functions/routes $OUTPUT_DIR/functions/
cp functions/package.json $OUTPUT_DIR/functions/
cp functions/index.js $OUTPUT_DIR/functions/

# Crear archivo de configuración
cat > $OUTPUT_DIR/.env.example << EOF
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=$PROJECT_ID.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=$PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=$PROJECT_ID.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Empresa Configuration
REACT_APP_EMPRESA_NOMBRE=$EMPRESA_NOMBRE
REACT_APP_MODULOS_ACTIVOS=core,compras,vehiculos
EOF

# Crear firebase.json
cat > $OUTPUT_DIR/firebase.json << EOF
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
EOF

# Crear reglas de Firestore
cat > $OUTPUT_DIR/firestore.rules << EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
EOF

# Crear script de inicialización
cat > $OUTPUT_DIR/init-nueva-empresa.js << EOF
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: '$PROJECT_ID'
});

const db = admin.firestore();

async function inicializar() {
  console.log('🚀 Inicializando sistema para $EMPRESA_NOMBRE...');
  
  // Configuración de empresa
  await db.collection('configuracion').doc('empresa').set({
    nombre: '$EMPRESA_NOMBRE',
    email: '$ADMIN_EMAIL',
    modulos_activos: ['core', 'compras', 'vehiculos'],
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Usuario administrador
  await db.collection('usuarios').add({
    email: '$ADMIN_EMAIL',
    nombre: 'Administrador',
    rol: 'admin',
    activo: true,
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Sucursal principal
  await db.collection('sucursales').add({
    nombre: 'Sucursal Principal',
    tipo: 'principal',
    activa: true,
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Categorías básicas
  const categorias = ['General', 'Bebidas', 'Alimentos', 'Limpieza'];
  for (const cat of categorias) {
    await db.collection('categorias').add({
      nombre: cat,
      activa: true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  console.log('✅ Sistema inicializado correctamente');
}

inicializar().catch(console.error);
EOF

# Crear README
cat > $OUTPUT_DIR/README.md << EOF
# Sistema de Gestión - $EMPRESA_NOMBRE

## Instalación Rápida

### 1. Crear proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto con ID: \`$PROJECT_ID\`
3. Activa:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage

### 2. Configurar credenciales
1. Copia \`.env.example\` a \`.env\`
2. Completa las credenciales de Firebase
3. Descarga serviceAccountKey.json

### 3. Instalar y desplegar
\`\`\`bash
# Instalar dependencias
npm install
cd functions && npm install && cd ..

# Inicializar base de datos
node init-nueva-empresa.js

# Desplegar
firebase deploy --project $PROJECT_ID

# Iniciar localmente
npm start
\`\`\`

## Módulos incluidos
- ✅ Core (Productos, Ventas, Stock)
- ✅ Compras y Proveedores
- ✅ Control de Vehículos
- ⬜ Producción (desactivado)
- ⬜ Reportes Avanzados (desactivado)
EOF

echo ""
echo "✅ Sistema clonado exitosamente en: $OUTPUT_DIR"
echo ""
echo "📋 Próximos pasos:"
echo "1. cd $OUTPUT_DIR"
echo "2. Crear proyecto en Firebase Console"
echo "3. Configurar .env con las credenciales"
echo "4. npm install"
echo "5. firebase init (seleccionar el proyecto)"
echo "6. node init-nueva-empresa.js"
echo "7. firebase deploy"
echo ""