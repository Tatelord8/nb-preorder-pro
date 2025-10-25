# 🏢 GESTOR DE PREVENTAS OPTIMA - GUATA PORA S.A

Una aplicación web desarrollada en **React + Vite + Tailwind CSS**, con **Supabase** como backend, diseñada para la gestión de preventas de múltiples marcas con un sistema de roles jerárquico.

Este README proporciona instrucciones completas para levantar el proyecto, estructura del sistema, reglas de negocio y comportamiento esperado de la aplicación.

---

## 📦 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **Exportables**: Archivos Excel generados desde el frontend
- **Estado**: React Query + localStorage
- **Routing**: React Router v6 con navegación dinámica
- **UI Components**: shadcn/ui con componentes accesibles
- **Database**: PostgreSQL con Row Level Security (RLS)
- **Authentication**: Supabase Auth con verificación automática
- **State Management**: React Query para cache y sincronización
- **Icons**: Lucide React para iconografía consistente

---

## 👥 Sistema de Roles y Permisos

### 🔴 **SUPERADMIN** (Máximo nivel de acceso)
**Privilegios completos del sistema:**
- ✅ **Gestión de Usuarios**: Crear, editar, eliminar Admins y Clientes
- ✅ **Gestión de Marcas**: Crear, editar, eliminar marcas (Nike, Adidas, Puma, etc.)
- ✅ **Gestión de Productos**: CRUD completo de productos de todas las marcas
- ✅ **Gestión de Pedidos**: Ver, editar, eliminar todos los pedidos
- ✅ **Reportes**: Acceso a todos los reportes del sistema
- ✅ **Configuración**: Configurar parámetros globales del sistema

**Sidebar del Superadmin:**
- 🏠 Dashboard
- 👥 Usuarios (Admins + Clientes)
- 🏷️ Marcas
- 📦 Productos
- 🛒 Pedidos
- 📊 Reportes
- ⚙️ Configuración

### 🟡 **ADMIN** (Gerente de Marca)
**Privilegios limitados a su marca asignada:**
- ✅ **Gestión de Productos**: Crear, editar, eliminar productos de su marca asignada
- ✅ **Gestión de Clientes**: Crear, editar, eliminar clientes asignados
- ✅ **Gestión de Pedidos**: Autorizar, modificar, eliminar pedidos de sus clientes
- ✅ **Reportes**: Reportes de su marca y clientes asignados
- ❌ **No puede**: Crear otros admins, gestionar otras marcas

**Sidebar del Admin:**
- 🏠 Dashboard
- 👥 Mis Clientes
- 📦 Mis Productos
- 🛒 Pedidos de Mis Clientes
- 📊 Mis Reportes

### 🟢 **CLIENTE** (Usuario final)
**Privilegios básicos de compra:**
- ✅ **Catálogo**: Ver productos disponibles según su tier y marca asignada
- ✅ **Pedidos**: Crear, ver, modificar sus propios pedidos
- ✅ **Historial**: Ver historial de pedidos realizados
- ❌ **No puede**: Gestionar productos, ver otros clientes, acceder a reportes

**Sidebar del Cliente:**
- 🏠 Catálogo
- 🛒 Mis Pedidos
- 📋 Historial

---

## 🔐 Autenticación y Registro

### **Registro de Superadmin:**
- Solo puede ser creado manualmente en la base de datos
- Acceso completo al sistema desde el primer login

### **Registro de Admins:**
- Solo el **Superadmin** puede crear nuevos admins
- Se asigna una marca específica al admin (Nike, Adidas, Puma, etc.)
- Se definen los clientes que puede gestionar

### **Registro de Clientes:**
- Los **Admins** pueden crear clientes de su marca asignada
- Se asigna un tier (0, 1, 2, 3) y vendedor
- Acceso limitado al catálogo según su tier y marca
- **Tiers**: 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)

### **🎯 Sistema de Visibilidad por Tier:**
El filtrado de productos se basa en una jerarquía de tiers donde los clientes pueden ver productos de su tier o tiers inferiores:

- **Tier 0 (Premium)**: Puede ver productos de tiers 0, 1, 2 y 3 (acceso completo al catálogo)
- **Tier 1 (Gold)**: Puede ver productos de tiers 1, 2 y 3
- **Tier 2 (Silver)**: Puede ver productos de tiers 2 y 3
- **Tier 3 (Bronze)**: Solo puede ver productos de tier 3
- **Superadmin y Admin**: Ven todos los productos sin restricción de tier

**Ejemplo:**
- Un cliente Bronze (tier 3) solo verá productos con tier 3
- Un cliente Premium (tier 0) verá todos los productos del catálogo
- Los administradores y superadministradores siempre ven todo el catálogo completo

---

## 🧭 Flujos por Rol de Usuario

### 🔴 **Flujo SUPERADMIN**
1. **Login** con credenciales de superadmin
2. **Dashboard** con métricas globales del sistema
3. **Gestión de Usuarios**: Crear/editar admins y clientes
4. **Gestión de Marcas**: Crear/editar marcas del sistema
5. **Gestión de Productos**: CRUD completo de todos los productos
6. **Gestión de Pedidos**: Ver todos los pedidos del sistema
7. **Reportes**: Generar reportes globales y por marca
8. **Configuración**: Parámetros globales del sistema

### 🟡 **Flujo ADMIN**
1. **Login** con credenciales de admin
2. **Dashboard** con métricas de su marca asignada
3. **Gestión de Productos**: CRUD de productos de su marca (Nike, Adidas, etc.)
4. **Gestión de Clientes**: Crear/editar clientes asignados
5. **Gestión de Pedidos**: Autorizar/modificar pedidos de sus clientes
6. **Reportes**: Reportes de su marca y clientes

### 🟢 **Flujo CLIENTE**
1. **Login** mediante selector de cliente predefinido
2. **Catálogo** con productos disponibles según su tier y marca asignada
3. **Selección de rubro**: `Prendas` o `Calzados`
4. **Visualización del catálogo** (filtrado por Tier y Marca)
5. **Selección de producto**:
   - Imagen, SKU, precio USD, línea, categoría, género, marca
   - Si es "Game Plan" → recuadro dorado
   - Selección de curva: predefinida o personalizada
   - Cantidad de curvas a aplicar
   - Botón: `Agregar a pedido`
6. **Producto se marca con ✔️** en el catálogo
7. **Acceso permanente** al botón `Ver mi pedido`
8. **Pantalla resumen** con cantidades por talla y total
9. **Botón `Finalizar pedido`** + Confirmación
10. **Descarga automática** de reporte Excel del pedido

---

## 🛒 Estructura del Pedido

Cada producto agregado al pedido incluye:

- SKU
- Nombre del producto
- Género
- Línea
- Categoría
- Precio unitario (USD)
- Tipo de curva
- Cantidades por talla (multiplicadas por número de curvas)
- Subtotal del producto

### Archivo Excel generado para el Cliente:
| Cliente | Vendedor | Marca | SKU | Nombre | Género | Línea | Categoría | Talla | Cantidad | Precio | Subtotal |
|--------|----------|-------|-----|--------|--------|-------|-----------|-------|----------|--------|----------|

### Campos ocultos solo para ADMIN:
- `XFD`: Fecha en que el producto está disponible en fábrica
- `Fecha de despacho`: Estimación de llegada a tienda

---

## ⚙️ Gestión de Productos por Rol

### 🔴 **SUPERADMIN**
- **Carga masiva**: Importar productos desde Excel para cualquier marca
- **CRUD completo**: Crear, editar, eliminar productos de todas las marcas
- **Asignación de marca**: Asignar productos a marcas específicas
- **Configuración global**: Definir categorías, géneros, líneas del sistema

### 🟡 **ADMIN**
- **Carga masiva**: Importar productos desde Excel para su marca asignada
- **CRUD limitado**: Crear, editar, eliminar solo productos de su marca
- **Gestión de inventario**: Controlar stock y disponibilidad
- **Configuración de marca**: Definir parámetros específicos de su marca

### 🟢 **CLIENTE**
- **Solo visualización**: Ver productos disponibles según su tier
- **No puede**: Crear, editar o eliminar productos

### **Formato Excel para carga masiva:**
| SKU | Nombre | Marca | Precio_USD | Línea | Rubro | Categoría | Género | Tier | Game_Plan | Imagen_URL | XFD | Fecha_Despacho |
|-----|--------|-------|------------|-------|-------|-----------|--------|------|-----------|------------|-----|----------------|
| NB001 | Classic 574 | New Balance | 89.99 | Classic | Calzados | Deportivo | Unisex | 0 | FALSE | https://... | 2024-03-15 | 2024-04-01 |

**📋 Campos Requeridos:**
- **SKU**: Código único del producto (obligatorio, único)
- **Nombre**: Nombre del producto (obligatorio)
- **Marca**: Marca del producto - debe existir en el sistema (obligatorio)
- **Precio_USD**: Precio en dólares (obligatorio, > 0)
- **Línea**: Línea del producto (obligatorio)
- **Rubro**: Prendas, Calzados, Accesorios (obligatorio)
- **Categoría**: Categoría del producto (obligatorio)
- **Género**: Hombre, Mujer, Unisex, Niño, Niña (obligatorio)
- **Tier**: 0, 1, 2, 3 (obligatorio) - 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)

**📋 Campos Opcionales:**
- **Game_Plan**: TRUE/FALSE (por defecto: FALSE)
- **Imagen_URL**: URL de imagen del producto
- **XFD**: Fecha de disponibilidad en fábrica (YYYY-MM-DD)
- **Fecha_Despacho**: Fecha estimada de despacho (YYYY-MM-DD)

*Ver archivo `CARGAMASIVA-PRODUCTOS.md` para especificación completa.*

---

## 🎛️ Curvas y Talles

Cada curva predefinida tendrá una estructura de talles según género. El cliente puede elegir:
- Curva 1
- Curva 2
- Curva personalizada
- Cantidad de curvas a aplicar (el sistema multiplica los talles base)

Ejemplo para `Mens`:
- Tallas: 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13

---

## 📊 Sistema de Reportes por Rol

### 🔴 **SUPERADMIN - Reportes Globales**
- **Dashboard ejecutivo**: Métricas globales del sistema
- **Reporte por marca**: Análisis de performance por marca (Nike, Adidas, Puma, etc.)
- **Reporte de usuarios**: Actividad de admins y clientes
- **Reporte de productos**: Inventario global y movimientos por marca
- **Reporte financiero**: Ingresos por marca y período
- **Exportación**: Todos los reportes exportables a Excel

### 🟡 **ADMIN - Reportes de Marca**
- **Dashboard de marca**: Métricas de su marca asignada
- **Reporte de clientes**: Actividad y pedidos de sus clientes
- **Reporte de productos**: Inventario y movimientos de su marca
- **Reporte de pedidos**: Análisis de pedidos por período
- **Reporte financiero**: Ingresos de su marca
- **Exportación**: Reportes de su marca exportables a Excel

### 🟢 **CLIENTE - Reportes Personales**
- **Historial de pedidos**: Lista de pedidos realizados
- **Detalle de pedido**: Información completa de cada pedido
- **Exportación**: Sus propios pedidos exportables a Excel

### **Formato de Reportes:**
- **Por pedido individual**: Cliente, vendedor, marca, productos, cantidades, totales
- **Consolidado**: Agrupado por SKU, género, talla, tier, marca
- **Incluye campos**: XFD, Fecha de despacho, estado del pedido, marca

---

## ▶️ Instalación Local

```bash
# Clonar proyecto
git clone https://github.com/tu_usuario/preventa-nb-app.git
cd preventa-nb-app

# Instalar dependencias
npm install

# Ejecutar app local
npm run dev
```

---

## 📁 Estructura de Archivos Actual

```
src/
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   └── Layout.tsx        # Layout persistente con sidebar
├── hooks/
│   ├── use-toast.ts      # Hook para notificaciones
│   └── use-mobile.tsx    # Hook para detección móvil
├── integrations/
│   └── supabase/
│       ├── client.ts     # Cliente Supabase
│       └── types.ts      # Tipos TypeScript
├── pages/
│   ├── Login.tsx         # Página de login
│   ├── Catalog.tsx       # Catálogo principal
│   ├── Dashboard.tsx     # Dashboard ejecutivo
│   ├── Users.tsx         # Gestión de usuarios
│   ├── Marcas.tsx        # Gestión de marcas
│   ├── Productos.tsx     # Gestión de productos
│   ├── Clientes.tsx      # Gestión de clientes
│   ├── Pedidos.tsx       # Gestión de pedidos
│   └── ...               # Otras páginas
├── lib/
│   └── utils.ts          # Utilidades generales
├── App.tsx               # Enrutamiento principal
└── main.tsx              # Punto de entrada
```

### **Componentes Clave Implementados**
- **Layout.tsx**: Sidebar persistente con navegación por roles
- **Dashboard.tsx**: Métricas ejecutivas para Superadmin
- **Users.tsx**: CRUD completo de usuarios con roles
- **Marcas.tsx**: Gestión de marcas del sistema
- **Catalog.tsx**: Catálogo simplificado sin tabs

---

## ✅ Roadmap del Proyecto

### **Fase 1 - Sistema Base (Completado)**
- [x] Definir variables y segmentación del catálogo
- [x] Estructura del flujo de usuario
- [x] Mockup visual del proceso de compra
- [x] Implementar sidebar y navegación básica

### **Fase 2 - Sistema de Roles (✅ COMPLETADO)**
- [x] **Autenticación por roles**: Superadmin, Admin, Cliente
- [x] **Dashboard diferenciado** por rol
- [x] **Gestión de usuarios**: CRUD de admins y clientes
- [x] **Gestión de marcas**: CRUD de marcas del sistema
- [x] **Sidebar dinámico** según rol del usuario
- [x] **Layout persistente** con páginas dinámicas
- [x] **Avatar de usuario** con dropdown de configuraciones
- [x] **Verificación automática** de usuarios creados

### **Fase 3 - Gestión de Productos**
- [ ] **CRUD de productos** con restricciones por rol
- [ ] **Carga masiva** desde Excel por marca
- [ ] **Gestión de inventario** y disponibilidad
- [ ] **Filtros avanzados** por marca, categoría, tier

### **Fase 4 - Gestión de Pedidos**
- [ ] **Flujo de pedidos** con autorización por admin
- [ ] **Estados de pedido**: Pendiente, Autorizado, Rechazado
- [ ] **Notificaciones** de cambios de estado
- [ ] **Historial completo** de pedidos

### **Fase 5 - Reportes y Analytics**
- [ ] **Dashboard ejecutivo** para Superadmin
- [ ] **Dashboard de marca** para Admin
- [ ] **Reportes personalizados** por rol
- [ ] **Exportación avanzada** a Excel

### **Fase 6 - Optimizaciones**
- [ ] **Performance** y optimización de consultas
- [ ] **Responsive design** completo
- [ ] **Testing** automatizado
- [ ] **Deployment** en producción

---

## 🚀 Features Implementadas

### **✅ Sistema de Autenticación Completo**
- **Login automático**: Redirección inteligente según rol
- **Verificación automática**: Usuarios creados automáticamente verificados
- **Gestión de sesiones**: Persistencia de sesión con localStorage
- **Protección de rutas**: Acceso restringido por rol

### **✅ Layout y Navegación Avanzada**
- **Sidebar persistente**: Navegación fija con contenido dinámico
- **Layout responsivo**: Ocupa todo el espacio disponible
- **Navegación por roles**: Sidebar adaptativo según permisos
- **Avatar de usuario**: Dropdown con configuraciones de cuenta
- **React Router**: Enrutamiento dinámico sin recargas

### **✅ Gestión de Usuarios (Superadmin)**
- **CRUD completo**: Crear, editar, eliminar usuarios
- **Roles múltiples**: Superadmin, Admin, Cliente
- **Campos personalizados**: Nombre, Tier (1-4), asignaciones
- **Validación automática**: Verificación de email automática
- **Funciones SQL**: Operaciones directas en base de datos

### **✅ Gestión de Marcas (Superadmin)**
- **CRUD de marcas**: Crear, editar, eliminar marcas
- **Búsqueda y filtros**: Sistema de búsqueda avanzada
- **Validación de datos**: Campos únicos y requeridos
- **Interfaz intuitiva**: Formularios con validación en tiempo real

### **✅ Dashboard Ejecutivo (Superadmin)**
- **Métricas globales**: Estadísticas del sistema completo
- **Tarjetas informativas**: Usuarios, marcas, productos, pedidos
- **Acciones rápidas**: Navegación directa a secciones
- **Estado del sistema**: Monitoreo en tiempo real

### **✅ Sistema de Roles Robusto**
- **Superadmin**: Acceso total al sistema
- **Admin**: Gestión limitada a su marca
- **Cliente**: Acceso solo al catálogo
- **Políticas RLS**: Seguridad a nivel de fila en Supabase
- **Funciones SQL**: Operaciones seguras con SECURITY DEFINER

### **✅ Interfaz de Usuario Optimizada**
- **shadcn/ui**: Componentes modernos y accesibles
- **Tailwind CSS**: Estilos consistentes y responsivos
- **Estados de carga**: Spinners y feedback visual
- **Mensajes de error**: Toast notifications informativas
- **Navegación fluida**: Transiciones suaves entre páginas

---

## 🗄️ Configuración de Base de Datos

### **Supabase Configuration**
- **URL**: `https://oszmlmscckrbfnjrveet.supabase.co`
- **Database**: PostgreSQL con Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage para imágenes

### **Variables de Entorno**
```env
VITE_SUPABASE_URL=https://oszmlmscckrbfnjrveet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98
```

### **Tablas Principales**
- `user_roles` - Sistema de roles (superadmin, admin, cliente) ✅
- `clientes` - Gestión de clientes con tiers ✅
- `vendedores` - Gestión de vendedores ✅
- `productos` - Catálogo de productos ✅
- `marcas` - Gestión de marcas ✅
- `tiers` - Sistema de tiers (0, 1, 2, 3) ✅ - 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)
- `pedidos` - Órdenes de compra ✅
- `items_pedido` - Items de cada pedido ✅
- `curvas` - Curvas de tallas ✅

### **Migraciones Aplicadas**
- ✅ Tablas principales creadas
- ✅ Políticas RLS configuradas
- ✅ Funciones SQL implementadas
- ✅ Datos iniciales insertados
- ✅ Sistema de roles completo
- ✅ Gestión de usuarios con verificación automática
- ✅ Gestión de marcas con CRUD completo
- ✅ Sistema de tiers (0, 1, 2, 3) implementado - 0 (Premium), 1 (Gold), 2 (Silver), 3 (Bronze)
- ✅ Funciones de seguridad (is_superadmin, is_admin, is_client)
- ✅ Funciones de gestión (create_user_with_role, get_users_with_roles, delete_user)

---


