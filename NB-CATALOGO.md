# 🏃‍♂️ NEW BALANCE PREVENTA APP

Una aplicación web desarrollada en **React + Vite + Tailwind CSS**, con **Supabase** como backend, diseñada para la gestión de preventas de productos NEW BALANCE con un sistema de roles jerárquico.

Este README proporciona instrucciones completas para levantar el proyecto, estructura del sistema, reglas de negocio y comportamiento esperado de la aplicación.

---

## 📦 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **Exportables**: Archivos Excel generados desde el frontend
- **Estado**: React Query + localStorage

---

## 👥 Sistema de Roles y Permisos

### 🔴 **SUPERADMIN** (Máximo nivel de acceso)
**Privilegios completos del sistema:**
- ✅ **Gestión de Usuarios**: Crear, editar, eliminar Admins y Clientes
- ✅ **Gestión de Marcas**: Crear, editar, eliminar marcas
- ✅ **Gestión de Productos**: CRUD completo de productos
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
- ✅ **Gestión de Productos**: Crear, editar, eliminar productos de su marca
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
- ✅ **Catálogo**: Ver productos disponibles según su tier
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
- Se asigna una marca específica al admin
- Se definen los clientes que puede gestionar

### **Registro de Clientes:**
- Los **Admins** pueden crear clientes de su marca
- Se asigna un tier (A, B, C, D) y vendedor
- Acceso limitado al catálogo según su tier

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
2. **Dashboard** con métricas de su marca
3. **Gestión de Productos**: CRUD de productos de su marca
4. **Gestión de Clientes**: Crear/editar clientes asignados
5. **Gestión de Pedidos**: Autorizar/modificar pedidos de sus clientes
6. **Reportes**: Reportes de su marca y clientes

### 🟢 **Flujo CLIENTE**
1. **Login** mediante selector de cliente predefinido
2. **Catálogo** con productos disponibles según su tier
3. **Selección de rubro**: `Prendas` o `Calzados`
4. **Visualización del catálogo** (filtrado por Tier)
5. **Selección de producto**:
   - Imagen, SKU, precio USD, línea, categoría, género
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
| Cliente | Vendedor | SKU | Nombre | Género | Línea | Categoría | Talla | Cantidad | Precio | Subtotal |
|--------|----------|-----|--------|--------|-------|-----------|-------|----------|--------|----------|

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
| SKU | Nombre Producto | Género | Línea | Categoría | Tier | Game Plan | Imagen URL | Precio | Marca | XFD | Fecha Despacho |
|-----|------------------|--------|-------|-----------|------|------------|-------------|--------|-------|-----|-----------------|

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
- **Reporte por marca**: Análisis de performance por marca
- **Reporte de usuarios**: Actividad de admins y clientes
- **Reporte de productos**: Inventario global y movimientos
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
- **Por pedido individual**: Cliente, vendedor, productos, cantidades, totales
- **Consolidado**: Agrupado por SKU, género, talla, tier, marca
- **Incluye campos**: XFD, Fecha de despacho, estado del pedido

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

## 📁 Estructura de Carpetas Sugerida

```
src/
├── assets/               # Imágenes y logos
├── components/           # Componentes reutilizables (Header, Card, etc.)
├── features/             # Módulos de negocio: login, catalogo, carrito
├── hooks/                # Custom Hooks
├── pages/                # Vistas principales: Home, Login, Pedido
├── services/             # Conexión Supabase y lógica API
├── utils/                # Helpers, formateadores, validadores
└── App.jsx               # Enrutamiento principal
```

---

## ✅ Roadmap del Proyecto

### **Fase 1 - Sistema Base (Completado)**
- [x] Definir variables y segmentación del catálogo
- [x] Estructura del flujo de usuario
- [x] Mockup visual del proceso de compra
- [x] Implementar sidebar y navegación básica

### **Fase 2 - Sistema de Roles (En desarrollo)**
- [ ] **Autenticación por roles**: Superadmin, Admin, Cliente
- [ ] **Dashboard diferenciado** por rol
- [ ] **Gestión de usuarios**: CRUD de admins y clientes
- [ ] **Gestión de marcas**: CRUD de marcas del sistema
- [ ] **Sidebar dinámico** según rol del usuario

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
- `user_roles` - Sistema de roles (superadmin, admin, cliente)
- `clientes` - Gestión de clientes con tiers
- `vendedores` - Gestión de vendedores
- `productos` - Catálogo de productos
- `marcas` - Gestión de marcas
- `pedidos` - Órdenes de compra
- `items_pedido` - Items de cada pedido
- `curvas` - Curvas de tallas

### **Migraciones Aplicadas**
- ✅ Tablas principales creadas
- ✅ Políticas RLS configuradas
- ✅ Funciones SQL implementadas
- ✅ Datos iniciales insertados

---


