@echo off
REM clonar-sistema-corregido.bat
REM Script para clonar el sistema para una nueva empresa en Windows

echo ========================================
echo   CLONADOR DE SISTEMA DE GESTION
echo ========================================
echo.

REM Solicitar información
set /p EMPRESA_NOMBRE=Nombre de la nueva empresa: 
set /p PROJECT_ID=ID del proyecto Firebase (ej: mi-empresa-123): 
set /p ADMIN_EMAIL=Email del administrador: 

REM Crear nombre de carpeta
set FOLDER_NAME=sistema-%PROJECT_ID%

REM Verificar si ya existe
if exist "%FOLDER_NAME%" (
    echo.
    echo ERROR: La carpeta %FOLDER_NAME% ya existe!
    echo Por favor elimina la carpeta o usa otro ID
    pause
    exit /b 1
)

echo.
echo Creando estructura de archivos...

REM Crear carpeta principal
mkdir "%FOLDER_NAME%"

REM Volver a la raíz del proyecto (subir un nivel desde scripts)
cd ..

REM Copiar estructura del frontend
echo Copiando frontend...
if exist "src" (
    xcopy /E /I /Y "src" "scripts\%FOLDER_NAME%\src"
) else (
    echo ERROR: No se encuentra la carpeta src
    echo Asegurate de ejecutar este script desde la carpeta scripts
    pause
    exit /b 1
)

REM Copiar archivos públicos
echo Copiando archivos publicos...
if exist "public" (
    xcopy /E /I /Y "public" "scripts\%FOLDER_NAME%\public"
)

REM Copiar archivos de configuración
echo Copiando archivos de configuracion...
if exist "package.json" copy "package.json" "scripts\%FOLDER_NAME%\"
if exist ".gitignore" copy ".gitignore" "scripts\%FOLDER_NAME%\"
if exist "tailwind.config.js" copy "tailwind.config.js" "scripts\%FOLDER_NAME%\"
if exist "postcss.config.js" copy "postcss.config.js" "scripts\%FOLDER_NAME%\"
if exist "jsconfig.json" copy "jsconfig.json" "scripts\%FOLDER_NAME%\"

REM Copiar funciones de Firebase
echo Copiando backend (Firebase Functions)...
if exist "functions" (
    xcopy /E /I /Y "functions" "scripts\%FOLDER_NAME%\functions"
)

REM Volver a la carpeta scripts
cd scripts

REM Crear archivos de configuración
echo Creando archivos de configuracion...

REM Crear .env.example
(
echo # Firebase Configuration
echo REACT_APP_FIREBASE_API_KEY=
echo REACT_APP_FIREBASE_AUTH_DOMAIN=
echo REACT_APP_FIREBASE_PROJECT_ID=%PROJECT_ID%
echo REACT_APP_FIREBASE_STORAGE_BUCKET=
echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
echo REACT_APP_FIREBASE_APP_ID=
echo REACT_APP_FIREBASE_MEASUREMENT_ID=
echo.
echo # API Configuration
echo REACT_APP_FIREBASE_FUNCTIONS_URL=https://api-xxxxx.a.run.app
echo.
echo # App Configuration
echo REACT_APP_EMPRESA_NOMBRE=%EMPRESA_NOMBRE%
echo REACT_APP_ADMIN_EMAIL=%ADMIN_EMAIL%
) > "%FOLDER_NAME%\.env.example"

REM Crear firebase.json
(
echo {
echo   "firestore": {
echo     "rules": "firestore.rules",
echo     "indexes": "firestore.indexes.json"
echo   },
echo   "functions": {
echo     "predeploy": "npm --prefix functions run build",
echo     "source": "functions"
echo   },
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
echo   "storage": {
echo     "rules": "storage.rules"
echo   }
echo }
) > "%FOLDER_NAME%\firebase.json"

REM Crear firestore.rules
(
echo rules_version = '2';
echo service cloud.firestore {
echo   match /databases/{database}/documents {
echo     // Usuarios autenticados pueden leer todo
echo     match /{document=**} {
echo       allow read: if request.auth != null;
echo     }
echo     
echo     // Solo admins pueden escribir
echo     match /{document=**} {
echo       allow write: if request.auth != null 
echo         ^&^& get(/databases/$(database^)/documents/usuarios/$(request.auth.uid^)^).data.rol == 'Administrador';
echo     }
echo   }
echo }
) > "%FOLDER_NAME%\firestore.rules"

REM Crear storage.rules
(
echo rules_version = '2';
echo service firebase.storage {
echo   match /b/{bucket}/o {
echo     match /{allPaths=**} {
echo       allow read: if request.auth != null;
echo       allow write: if request.auth != null;
echo     }
echo   }
echo }
) > "%FOLDER_NAME%\storage.rules"

REM Crear script de inicialización
(
echo // init-nueva-empresa.js
echo // Script para inicializar datos base en Firestore
echo.
echo const admin = require('firebase-admin'^);
echo const serviceAccount = require('./serviceAccountKey.json'^);
echo.
echo admin.initializeApp({
echo   credential: admin.credential.cert(serviceAccount^)
echo }^);
echo.
echo const db = admin.firestore(^);
echo.
echo async function inicializarEmpresa(^) {
echo   console.log('Inicializando datos de %EMPRESA_NOMBRE%...'^);
echo   
echo   try {
echo     // Crear configuración de empresa
echo     await db.collection('configuracion'^).doc('empresa'^).set({
echo       razon_social: '%EMPRESA_NOMBRE%',
echo       nombre_fantasia: '%EMPRESA_NOMBRE%',
echo       email: '%ADMIN_EMAIL%',
echo       activo: true,
echo       fecha_creacion: new Date(^).toISOString(^),
echo       modulos_activos: ['core', 'ventas', 'stock', 'clientes', 'productos']
echo     }^);
echo     
echo     // Crear usuario administrador
echo     const userRecord = await admin.auth(^).getUserByEmail('%ADMIN_EMAIL%'^);
echo     await db.collection('usuarios'^).doc(userRecord.uid^).set({
echo       email: '%ADMIN_EMAIL%',
echo       nombre: 'Administrador',
echo       apellido: 'Sistema',
echo       rol: 'Administrador',
echo       activo: true,
echo       fecha_creacion: new Date(^).toISOString(^)
echo     }^);
echo     
echo     // Crear sucursal principal
echo     await db.collection('sucursales'^).add({
echo       nombre: 'Sucursal Principal',
echo       direccion: 'Sin definir',
echo       telefono: '',
echo       tipo: 'principal',
echo       activa: true
echo     }^);
echo     
echo     console.log('✅ Inicialización completada!'^);
echo   } catch (error^) {
echo     console.error('❌ Error:', error^);
echo   }
echo   
echo   process.exit(0^);
echo }
echo.
echo inicializarEmpresa(^);
) > "%FOLDER_NAME%\init-nueva-empresa.js"

REM Crear README
(
echo # %EMPRESA_NOMBRE% - Sistema de Gestión
echo.
echo ## Información del Proyecto
echo - **Empresa**: %EMPRESA_NOMBRE%
echo - **Project ID**: %PROJECT_ID%
echo - **Admin Email**: %ADMIN_EMAIL%
echo - **Fecha de creación**: %date%
echo.
echo ## Pasos para configurar
echo.
echo 1. **Crear proyecto en Firebase Console**
echo    - Ir a https://console.firebase.google.com
echo    - Crear proyecto con ID: `%PROJECT_ID%`
echo    - Activar Authentication ^(Email/Password^)
echo    - Activar Firestore Database
echo    - Activar Storage
echo.
echo 2. **Obtener credenciales**
echo    - En Firebase Console → Configuración → General
echo    - Agregar app web
echo    - Copiar configuración
echo    - Descargar serviceAccountKey.json
echo.
echo 3. **Configurar proyecto**
echo    ```bash
echo    # Copiar .env.example a .env y completar con credenciales
echo    copy .env.example .env
echo    
echo    # Copiar serviceAccountKey.json al proyecto
echo    # Instalar dependencias
echo    npm install
echo    cd functions
echo    npm install
echo    cd ..
echo    ```
echo.
echo 4. **Inicializar Firebase**
echo    ```bash
echo    firebase login
echo    firebase use %PROJECT_ID%
echo    ```
echo.
echo 5. **Inicializar datos**
echo    ```bash
echo    node init-nueva-empresa.js
echo    ```
echo.
echo 6. **Desplegar**
echo    ```bash
echo    npm run build
echo    firebase deploy
echo    ```
echo.
echo ## Módulos incluidos
echo - ✅ Productos
echo - ✅ Ventas
echo - ✅ Stock
echo - ✅ Clientes
echo - ✅ Usuarios
echo.
echo ## Soporte
echo Contacto: %ADMIN_EMAIL%
) > "%FOLDER_NAME%\README.md"

echo.
echo ========================================
echo   Sistema clonado exitosamente!
echo   Ubicacion: scripts\%FOLDER_NAME%
echo ========================================
echo.
echo Proximos pasos:
echo 1. cd %FOLDER_NAME%
echo 2. Crear proyecto en Firebase Console
echo 3. Configurar .env con las credenciales
echo 4. npm install
echo 5. firebase init (seleccionar el proyecto)
echo 6. node init-nueva-empresa.js
echo 7. firebase deploy
echo.
pause