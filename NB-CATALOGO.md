# 🏃‍♂️ NEW BALANCE PREVENTA APP

Una aplicación web desarrollada en **React + Vite + Tailwind CSS**, con **Supabase** como backend, diseñada para clientes mayoristas que realizan preventas de productos NEW BALANCE.

Este README proporciona instrucciones completas para levantar el proyecto, estructura del sistema, reglas de negocio y comportamiento esperado de la aplicación.

---

## 📦 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database + Storage)
- **Exportables**: Archivos Excel generados desde el frontend

---

## 🔐 Autenticación de Usuarios

### Registro de Clientes:
- El **admin** cargará previamente:
  - Lista de clientes (nombre, email, tier)
  - Asignación de vendedor (Silvio Lencina, Cesar Zarate, Arturo Fernandez)

### Login del Cliente:
- Pantalla inicial con **menú desplegable** para seleccionar nombre de cliente
- No se permite acceso al catálogo sin autenticación

---

## 🧭 Flujo del Usuario

1. **Login** mediante selector de cliente predefinido
2. Pantalla de bienvenida: `NEW BALANCE S1 26 PRE LINE`
3. Selección de rubro: `Prendas` o `Calzados`
4. Visualización del catálogo (filtrado por Tier)
5. Selección de un producto:
   - Imagen, SKU, precio USD, línea, categoría, género
   - Si es "Game Plan" → recuadro dorado
   - Selección de curva: predefinida o personalizada
   - Cantidad de curvas a aplicar
   - Botón: `Agregar a pedido`
6. Producto se marca con ✔️ en el catálogo
7. Acceso permanente al botón `Ver mi pedido`
8. Pantalla resumen con cantidades por talla y total
9. Botón `Finalizar pedido` + Confirmación
10. Descarga automática de **reporte Excel** del pedido

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

## ⚙️ Alta de Productos

Los productos se cargarán desde una planilla Excel por el **Administrador**, que debe incluir:

| SKU | Nombre Producto | Género | Línea | Categoría | Tier | Game Plan | Imagen URL | Precio | XFD | Fecha Despacho |
|-----|------------------|--------|-------|-----------|------|------------|-------------|--------|-----|-----------------|

- El sistema leerá esta planilla y creará los productos disponibles para el catálogo

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

## 📊 Reporte Global para el Admin

Desde el panel de administración se podrá generar:
- Reporte por pedido individual
- Reporte general consolidado
  - Agrupado por SKU, género, talla, tier
  - Incluye XFD y Fecha de despacho
  - Exportable a Excel

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

## ✅ ToDo Inicial del Proyecto

- [x] Definir variables y segmentación del catálogo
- [x] Estructura del flujo de usuario
- [x] Mockup visual del proceso de compra
- [ ] Programar componente de catálogo filtrado por Tier
- [ ] Programar selector de curvas con multiplicador
- [ ] Conectar con Supabase para autenticación + almacenamiento de pedidos
- [ ] Exportador de Excel
- [ ] Panel Admin (upload Excel, ver pedidos, reportes)

---


