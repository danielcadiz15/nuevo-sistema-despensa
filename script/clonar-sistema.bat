@echo off
REM clonar-sistema.bat
REM Script para clonar el sistema para una nueva empresa en Windows

echo ========================================
echo   CLONADOR DE SISTEMA DE GESTION
echo ========================================
echo.

REM Solicitar información
set /p EMPRESA_NOMBRE="Nombre de la nueva empresa: "
set /p PROJECT_ID="ID del proyecto Firebase (ej: mi-empresa-123): "
set /p ADMIN_EMAIL="Email del administrador: "

REM Crear directorio para la nueva empresa
set OUTPUT_DIR=sistema-%PROJECT_ID%
mkdir %OUTPUT_DIR% 2>nul

echo.
echo Creando estructura de archivos...

REM Copiar archivos del frontend
xcopy /E /I /Y ..\src %OUTPUT_DIR%\src
xcopy /E /I /Y ..\public %OUTPUT_DIR%\public
copy ..\package.json %OUTPUT_DIR%\
copy ..\.gitignore %OUTPUT_DIR%\

REM Copiar archivos del backend
mkdir %OUTPUT_DIR%\functions
xcopy /E /I /Y ..\functions\routes %OUTPUT_DIR%\functions\routes
copy ..\functions\package.json %OUTPUT_DIR%\functions\
copy ..\functions\index.js %OUTPUT_DIR%\functions\

REM Crear archivo de configuración
(
echo # Firebase Configuration
echo REACT_APP_FIREBASE_API_KEY=your-api-key
echo REACT_APP_FIREBASE_AUTH_DOMAIN=%PROJECT_ID%.firebaseapp.com
echo REACT_APP_FIREBASE_PROJECT_ID=%PROJECT_ID%
echo REACT_APP_FIREBASE_STORAGE_BUCKET=%PROJECT_ID%.appspot.com
echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
echo REACT_APP_FIREBASE_APP_ID=your-app-id
echo.
echo # Empresa Configuration
echo REACT_APP_EMPRESA_NOMBRE=%EMPRESA_NOMBRE%
echo REACT_APP_MODULOS_ACTIVOS=core,compras
) > %OUTPUT_DIR%\.env.example

REM Crear firebase.json
(
echo {
echo   "hosting": {
echo     "public": "build",
echo     "ignore": [
echo       "firebase.json",
echo       "**/.*",
echo       "**/node_modules/**"
echo     ],
echo     "rewrites": [
echo       {
echo         "source": "**",
echo         "destination": "/index.html"
echo       }
echo     ]
echo   },
echo   "functions": {
echo     "source": "functions",
echo     "runtime": "nodejs18"
echo   },
echo   "firestore": {
echo     "rules": "firestore.rules",
echo     "indexes": "firestore.indexes.json"
echo   }
echo }
) > %OUTPUT_DIR%\firebase.json

REM Crear reglas de Firestore
(
echo rules_version = '2';
echo service cloud.firestore {
echo   match /databases/{database}/documents {
echo     // Permitir lectura/escritura a usuarios autenticados
echo     match /{document=**} {
echo       allow read, write: if request.auth != null;
echo     }
echo   }
echo }
) > %OUTPUT_DIR%\firestore.rules

REM Crear script de inicialización
(
echo const admin = require('firebase-admin'^);
echo const serviceAccount = require('./serviceAccountKey.json'^);
echo.
echo admin.initializeApp({
echo   credential: admin.credential.cert(serviceAccount^),
echo   projectId: '%PROJECT_ID%'
echo }^);
echo.
echo const db = admin.firestore(^);
echo.
echo async function inicializar(^) {
echo   console.log('Inicializando sistema para %EMPRESA_NOMBRE%...'^);
echo   
echo   // Configuracion de empresa
echo   await db.collection('configuracion'^).doc('empresa'^).set({
echo     nombre: '%EMPRESA_NOMBRE%',
echo     email: '%ADMIN_EMAIL%',
echo     modulos_activos: ['core', 'compras'],
echo     fecha_creacion: admin.firestore.FieldValue.serverTimestamp(^)
echo   }^);
echo   
echo   // Usuario administrador
echo   await db.collection('usuarios'^).add({
echo     email: '%ADMIN_EMAIL%',
echo     nombre: 'Administrador',
echo     rol: 'admin',
echo     activo: true,
echo     fecha_creacion: admin.firestore.FieldValue.serverTimestamp(^)
echo   }^);
echo   
echo   // Sucursal principal
echo   await db.collection('sucursales'^).add({
echo     nombre: 'Sucursal Principal',
echo     tipo: 'principal',
echo     activa: true,
echo     fecha_creacion: admin.firestore.FieldValue.serverTimestamp(^)
echo   }^);
echo   
echo   // Categorias basicas
echo   const categorias = ['General', 'Bebidas', 'Alimentos', 'Limpieza'];
echo   for (const cat of categorias^) {
echo     await db.collection('categorias'^).add({
echo       nombre: cat,
echo       activa: true,
echo       fecha_creacion: admin.firestore.FieldValue.serverTimestamp(^)
echo     }^);
echo   }
echo   
echo   console.log('Sistema inicializado correctamente'^);
echo }
echo.
echo inicializar(^).catch(console.error^);
) > %OUTPUT_DIR%\init-nueva-empresa.js

REM Crear README
(
echo # Sistema de Gestion - %EMPRESA_NOMBRE%
echo.
echo ## Instalacion Rapida
echo.
echo ### 1. Crear proyecto en Firebase
echo 1. Ve a [Firebase Console](https://console.firebase.google.com^)
echo 2. Crea un nuevo proyecto con ID: `%PROJECT_ID%`
echo 3. Activa:
echo    - Authentication ^(Email/Password^)
echo    - Firestore Database
echo    - Storage
echo.
echo ### 2. Configurar credenciales
echo 1. Copia `.env.example` a `.env`
echo 2. Completa las credenciales de Firebase
echo 3. Descarga serviceAccountKey.json
echo.
echo ### 3. Instalar y desplegar
echo ```bash
echo # Instalar dependencias
echo npm install
echo cd functions ^&^& npm install ^&^& cd ..
echo.
echo # Inicializar base de datos
echo node init-nueva-empresa.js
echo.
echo # Desplegar
echo firebase deploy --project %PROJECT_ID%
echo.
echo # Iniciar localmente
echo npm start
echo ```
echo.
echo ## Modulos incluidos
echo - Core ^(Productos, Ventas, Stock^)
echo - Compras y Proveedores
echo - [ ] Vehiculos ^(desactivado^)
echo - [ ] Produccion ^(desactivado^)
echo - [ ] Reportes Avanzados ^(desactivado^)
) > %OUTPUT_DIR%\README.md

echo.
echo ========================================
echo   Sistema clonado exitosamente!
echo   Ubicacion: %OUTPUT_DIR%
echo ========================================
echo.
echo Proximos pasos:
echo 1. cd %OUTPUT_DIR%
echo 2. Crear proyecto en Firebase Console
echo 3. Configurar .env con las credenciales
echo 4. npm install
echo 5. firebase init (seleccionar el proyecto)
echo 6. node init-nueva-empresa.js
echo 7. firebase deploy
echo.
pause