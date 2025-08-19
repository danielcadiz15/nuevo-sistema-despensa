# 🌟 CONDINEA - Sistema de Gestión Empresarial

[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0+-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Sistema integral de gestión empresarial** para CONDINEA, desarrollado con tecnologías modernas y arquitectura escalable.

## 📋 **Tabla de Contenidos**

- [🚀 Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [🏗️ Arquitectura](#️-arquitectura)
- [📱 Módulos del Sistema](#-módulos-del-sistema)
- [🎯 Dashboard Inteligente](#-dashboard-inteligente)
- [⚡ Instalación](#-instalación)
- [🔧 Configuración](#-configuración)
- [🚀 Despliegue](#-despliegue)
- [📊 Estructura del Proyecto](#-estructura-del-proyecto)
- [🤝 Contribución](#-contribución)
- [📞 Soporte](#-soporte)

## 🚀 **Características**

### **✨ Funcionalidades Principales**
- **Gestión completa de inventario** con control de stock
- **Sistema de ventas** con múltiples métodos de pago
- **Gestión de clientes** con historial de compras
- **Control de usuarios** con roles y permisos
- **Reportes y analytics** en tiempo real
- **Dashboard inteligente** con métricas clave

### **🎨 Dashboard Moderno**
- **🌱 Jardín de Tareas** - Gestión visual de tareas como plantas en crecimiento
- **🚀 Muro de Innovación** - Espacio colaborativo para ideas y propuestas
- **📊 Estadísticas en tiempo real** con gráficos interactivos
- **⚡ Acciones rápidas** para operaciones frecuentes

### **🔒 Seguridad y Autenticación**
- **Firebase Authentication** con email/password
- **Control de acceso basado en roles** (RBAC)
- **Protección de rutas** con middleware de autenticación
- **Validación de datos** en frontend y backend

## 🛠️ **Tecnologías**

### **Frontend**
- **React 18** - Biblioteca de interfaz de usuario
- **Tailwind CSS** - Framework CSS utilitario
- **React Router** - Enrutamiento de aplicaciones
- **React Icons** - Iconografía completa
- **LocalStorage** - Persistencia de datos del dashboard

### **Backend & Infraestructura**
- **Firebase 10** - Plataforma de desarrollo de Google
- **Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Functions** - Backend serverless
- **Firebase Storage** - Almacenamiento de archivos
- **Firebase Hosting** - Hosting estático

### **Herramientas de Desarrollo**
- **Vite** - Build tool moderno y rápido
- **ESLint** - Linting de código JavaScript
- **Prettier** - Formateo de código
- **Git** - Control de versiones

## 🏗️ **Arquitectura**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │   Dashboard     │
│   (React)       │◄──►│   Services      │◄──►│   Components    │
│                 │    │                 │    │                 │
│ • Components    │    │ • Firestore     │    │ • Jardín        │
│ • Hooks         │    │ • Functions     │    │ • Muro          │
│ • Utils         │    │ • Storage       │    │ • Estadísticas  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **🎯 Patrones de Diseño**
- **Componentes modulares** con responsabilidades únicas
- **Hooks personalizados** para lógica reutilizable
- **Utilidades separadas** para funciones auxiliares
- **Arquitectura de capas** con separación clara

## 📱 **Módulos del Sistema**

### **🏪 Gestión de Productos**
- ✅ **Inventario completo** con códigos y categorías
- ✅ **Control de stock** con alertas de nivel bajo
- ✅ **Gestión de precios** y costos
- ✅ **Imágenes y descripciones** detalladas

### **💰 Sistema de Ventas**
- ✅ **Punto de venta** intuitivo y rápido
- ✅ **Múltiples métodos de pago** (efectivo, tarjeta, transferencia)
- ✅ **Gestión de deudas** con recordatorios WhatsApp Business
- ✅ **Comprobantes de pago** imprimibles
- ✅ **Historial completo** de transacciones

### **👥 Gestión de Clientes**
- ✅ **Base de datos** completa de clientes
- ✅ **Historial de compras** y preferencias
- ✅ **Sistema de deudas** con seguimiento
- ✅ **Recordatorios automáticos** vía WhatsApp

### **👤 Control de Usuarios**
- ✅ **Sistema de roles** y permisos
- ✅ **Autenticación segura** con Firebase
- ✅ **Auditoría** de acciones del usuario
- ✅ **Gestión de sesiones**

### **📊 Reportes y Analytics**
- ✅ **Ventas por período** con gráficos
- ✅ **Productos más vendidos** y tendencias
- ✅ **Análisis de clientes** y comportamiento
- ✅ **Métricas de rendimiento** en tiempo real

## 🎯 **Dashboard Inteligente**

### **🌱 Jardín de Tareas**
- **Visualización de tareas** como plantas en crecimiento
- **Sistema de prioridades** con colores dinámicos
- **Fechas límite** con alertas visuales
- **Categorización** por tipo de tarea
- **Persistencia local** con localStorage

### **🚀 Muro de Innovación**
- **Espacio colaborativo** para ideas y propuestas
- **Sistema de votación** y likes
- **Estados de implementación** (nueva, evaluando, en proceso, implementada)
- **Categorización por impacto** (bajo, medio, alto)
- **Comentarios** y seguimiento de ideas

### **📈 Estadísticas en Tiempo Real**
- **Métricas clave** del negocio
- **Gráficos interactivos** y visualizaciones
- **Comparativas** por períodos
- **Alertas** de stock bajo y deudas

## ⚡ **Instalación**

### **Prerrequisitos**
- **Node.js** 18.0+ 
- **npm** 9.0+ o **yarn** 1.22+
- **Git** 2.30+
- **Cuenta Firebase** activa

### **Clonar el Repositorio**
```bash
git clone https://github.com/danielcadiz15/nuevo-sistema-despensa.git
cd nuevo-sistema-despensa
```

### **Instalar Dependencias**
```bash
# Dependencias del cliente
cd client
npm install

# Dependencias de Firebase Functions
cd ../functions
npm install

# Volver al directorio raíz
cd ..
```

## 🔧 **Configuración**

### **1. Configurar Firebase**
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Seleccionar proyecto
firebase use la-fabrica-1
```

### **2. Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

**Contenido del .env:**
```env
# Firebase Config
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=la-fabrica-1.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=la-fabrica-1
REACT_APP_FIREBASE_STORAGE_BUCKET=la-fabrica-1.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

### **3. Configurar Firestore**
```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar índices
firebase deploy --only firestore:indexes
```

## 🚀 **Despliegue**

### **Build de Producción**
```bash
# Construir aplicación
cd client
npm run build
```

### **Desplegar a Firebase**
```bash
# Desplegar hosting
firebase deploy --only hosting

# Desplegar functions
firebase deploy --only functions

# Desplegar todo
firebase deploy
```

### **URLs de Despliegue**
- **Producción:** https://la-fabrica-1.web.app
- **Staging:** https://la-fabrica-1.firebaseapp.com

## 📊 **Estructura del Proyecto**

```
nuevo-sistema-despensa/
├── 📁 client/                          # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/              # Componentes reutilizables
│   │   │   ├── 📁 common/              # Componentes base
│   │   │   ├── 📁 layout/              # Layout principal
│   │   │   └── 📁 modules/             # Módulos específicos
│   │   │       ├── 📁 dashboard/       # Dashboard inteligente
│   │   │       │   ├── 📁 components/  # Componentes del dashboard
│   │   │       │   ├── 📁 hooks/       # Hooks personalizados
│   │   │       │   └── 📁 utils/       # Utilidades
│   │   │       ├── 📁 ventas/          # Sistema de ventas
│   │   │       ├── 📁 productos/       # Gestión de inventario
│   │   │       ├── 📁 clientes/        # Gestión de clientes
│   │   │       └── 📁 usuarios/        # Control de usuarios
│   │   ├── 📁 pages/                   # Páginas principales
│   │   ├── 📁 contexts/                # Contextos de React
│   │   ├── 📁 services/                # Servicios de API
│   │   └── 📁 utils/                   # Utilidades generales
│   ├── 📁 public/                      # Archivos estáticos
│   └── 📁 package.json                 # Dependencias del cliente
├── 📁 functions/                       # Firebase Functions
│   ├── 📁 routes/                      # Rutas de la API
│   └── 📁 package.json                 # Dependencias de functions
├── 📁 .firebaserc                      # Configuración de Firebase
├── 📁 firebase.json                    # Configuración de despliegue
├── 📁 firestore.rules                  # Reglas de seguridad
├── 📁 storage.rules                    # Reglas de almacenamiento
└── 📁 README.md                        # Este archivo
```

## 🤝 **Contribución**

### **Cómo Contribuir**
1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### **Estándares de Código**
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional Commits** para mensajes de commit
- **Componentes funcionales** con hooks

## 📞 **Soporte**

### **Información de Contacto**
- **Desarrollador:** Daniel Cadiz
- **Email:** danielcadiz15@gmail.com
- **Empresa:** CONDINEA
- **Proyecto ID:** la-fabrica-1

### **Recursos Adicionales**
- **Documentación:** [Wiki del proyecto](https://github.com/danielcadiz15/nuevo-sistema-despensa/wiki)
- **Issues:** [Reportar problemas](https://github.com/danielcadiz15/nuevo-sistema-despensa/issues)
- **Discusiones:** [Foro de la comunidad](https://github.com/danielcadiz15/nuevo-sistema-despensa/discussions)

### **Estado del Proyecto**
- **Versión:** 2.0.0
- **Última actualización:** Agosto 2025
- **Estado:** 🟢 Activo y en desarrollo
- **Build:** ✅ Exitoso
- **Tests:** 🟡 En desarrollo

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**🌟 Desarrollado con ❤️ para CONDINEA**

*Sistema de gestión empresarial moderno, escalable y fácil de usar*

[![GitHub stars](https://img.shields.io/github/stars/danielcadiz15/nuevo-sistema-despensa?style=social)](https://github.com/danielcadiz15/nuevo-sistema-despensa/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/danielcadiz15/nuevo-sistema-despensa?style=social)](https://github.com/danielcadiz15/nuevo-sistema-despensa/network/members)
[![GitHub issues](https://img.shields.io/github/issues/danielcadiz15/nuevo-sistema-despensa)](https://github.com/danielcadiz15/nuevo-sistema-despensa/issues)

</div>
