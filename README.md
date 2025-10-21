# Gestor de Preventas Optima - Guata Pora S.A

## Project Overview

Sistema de gestión de preventas para múltiples marcas (Nike, Adidas, Puma, New Balance, etc.) con gestión de roles, catálogo de productos y sistema de pedidos.

**URL**: https://lovable.dev/projects/96dc87cf-1f81-46be-9930-8390137cb9bb

## Database Configuration

Este proyecto utiliza Supabase como backend con la siguiente configuración:

- **URL**: `https://oszmlmscckrbfnjrveet.supabase.co`
- **Database**: PostgreSQL con Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage para imágenes

## Environment Configuration

Para configurar el proyecto localmente, crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://oszmlmscckrbfnjrveet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98

# Project Configuration
VITE_APP_NAME=Gestor de Preventas Optima - Guata Pora S.A
VITE_APP_VERSION=1.0.0
```

## Database Schema

El sistema incluye las siguientes tablas principales:

- `user_roles` - Sistema de roles (superadmin, admin, cliente)
- `clientes` - Gestión de clientes con tiers
- `vendedores` - Gestión de vendedores
- `productos` - Catálogo de productos
- `marcas` - Gestión de marcas
- `pedidos` - Órdenes de compra
- `items_pedido` - Items de cada pedido
- `curvas` - Curvas de tallas

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/96dc87cf-1f81-46be-9930-8390137cb9bb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/96dc87cf-1f81-46be-9930-8390137cb9bb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
