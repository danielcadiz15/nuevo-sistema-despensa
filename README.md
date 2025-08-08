# CONDINEA - Sistema de Gestión

## Información del Proyecto
- **Empresa**: CONDINEA
- **Project ID**: condinea
- **Admin Email**: danielcadiz15@gmail.com
- **Fecha de creación**: 30-06-2025

## Pasos para configurar

1. **Crear proyecto en Firebase Console**
   - Ir a https://console.firebase.google.com
   - Crear proyecto con ID: `condinea`
   - Activar Authentication (Email/Password)
   - Activar Firestore Database
   - Activar Storage

2. **Obtener credenciales**
   - En Firebase Console → Configuración → General
   - Agregar app web
   - Copiar configuración
   - Descargar serviceAccountKey.json

3. **Configurar proyecto**
   ```bash
   # Copiar .env.example a .env y completar con credenciales
   copy .env.example .env
ECHO est� desactivado.
   # Copiar serviceAccountKey.json al proyecto
   # Instalar dependencias
   npm install
   cd functions
   npm install
   cd ..
   ```

4. **Inicializar Firebase**
   ```bash
   firebase login
   firebase use condinea
   ```

5. **Inicializar datos**
   ```bash
   node init-nueva-empresa.js
   ```

6. **Desplegar**
   ```bash
   npm run build
   firebase deploy
   ```

## Módulos incluidos
- ✅ Productos
- ✅ Ventas
- ✅ Stock
- ✅ Clientes
- ✅ Usuarios

## Soporte
Contacto: danielcadiz15@gmail.com
