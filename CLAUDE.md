# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pre-order management system for New Balance (Optima / Guata Pora S.A). Allows clients to browse a product catalog filtered by tier, build a cart, and submit orders. Admins and superadmins manage products, brands, clients, vendors, and authorize pending orders.

## Commands

```bash
npm run dev        # Start dev server (Vite, port 5173)
npm run build      # Production build (TypeScript check + Vite)
npm run build:dev  # Dev build (no minification)
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

There is no test runner configured. TypeScript type-checking happens as part of `npm run build`.

## Environment Setup

Copy `env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The Supabase client (`src/integrations/supabase/client.ts`) throws at startup if these are missing.

## Architecture

### Layered data flow

```
Pages → Hooks (React Query) → Services (plain classes) → Supabase client
```

- **`src/services/`** — Static service classes with all Supabase logic. One class per domain: `AuthService`, `PedidosService`, `ProductosService`, `ClientesService`, `VendedoresService`, `ReportsService`. Cart has multiple service files (`cart-storage.service.ts`, `cart-sync.service.ts`, `supabase-cart.service.ts`).
- **`src/hooks/`** — React Query wrappers over the services. Export `useQuery`/`useMutation` hooks. `useAuth.ts` is the canonical hook for auth state. `useSupabaseCart.ts` is the cart hook used everywhere.
- **`src/pages/`** — Route-level components. Each maps 1:1 to a route in `App.tsx`.
- **`src/components/`** — Layout plus domain components (`pedidos/`, `autorizacion/`). `src/components/ui/` contains shadcn/ui primitives — do not hand-edit them.
- **`src/integrations/supabase/`** — Auto-generated Supabase client and TypeScript types. `types.ts` is the source of truth for DB schema types.
- **`src/lib/queryClient.ts`** — Single `QueryClient` instance + the `queryKeys` object (all query key arrays live here) + `invalidateQueries` helpers.
- **`src/utils/`** — Pure utilities: tier access logic, size generation per rubro/gender, predefined size curves.

### Routing and auth guard

`App.tsx` defines all routes. Every protected route wraps its page in `<SidebarProvider><Layout>`. `Layout.tsx` calls `supabase.auth.getSession()` on mount and redirects to `/login` if no session — it is the de-facto auth guard.

Public routes: `/login`, `/setup`, `/manual-setup`, `/auth`, `/welcome`.

### Role system

Roles are stored in the `user_roles` table: `superadmin | admin | vendedor | cliente`. The sidebar in `Layout.tsx` renders navigation items conditionally based on `userRole` fetched from that table. Access rules:

| Feature | superadmin | admin | vendedor | cliente |
|---|---|---|---|---|
| Dashboard, Productos, Marcas, Clientes | ✓ | ✓ | — | — |
| Usuarios, Autorización, Reportes | ✓ | — | — | — |
| Catálogo, Pedidos, Cart | ✓ | ✓ | ✓ | ✓ |

### Tier system

Clients have a tier (`0`–`3`). Products are assigned a tier. Lower number = higher access:

- **Tier 0 (Premium)** — sees all products
- **Tier 1 (Gold)** — sees tiers 1, 2, 3
- **Tier 2 (Silver)** — sees tiers 2, 3
- **Tier 3 (Bronze)** — sees only tier 3

Logic lives in `src/utils/tierAccess.ts` (`canUserAccessTier`) and `src/utils/tierHierarchy.ts` (constants and comparison helpers). The catalog enforces this client-side by filtering products before rendering.

### Cart architecture (Dual Storage)

`useSupabaseCart` (`src/hooks/useSupabaseCart.ts`) is the single source of truth for cart state:

1. **localStorage** is the primary store — writes are synchronous and instant.
2. **Supabase `carritos_pendientes` table** is the cloud backup, auto-synced every 5 seconds via `CartSyncService`.
3. On load: localStorage wins if it has items; Supabase is checked in background and wins only if it has more items.
4. On auth state change, the cart reloads.
5. Snapshots are saved automatically at 10/20/50/100 items as recovery points.

`CartStorageService` (`src/services/cart-storage.service.ts`) handles localStorage reads/writes. `CartSyncService` (`src/services/cart-sync.service.ts`) handles the Supabase sync interval.

### Size generation

`src/utils/sizeGenerator.ts` derives available size arrays from a product's `rubro` + `genero`:
- `rubro = "Calzados"` → shoe sizes (men 7–15, women 6–10, unisex 4–12 with halves)
- All other rubros → clothing sizes (XS–XXL based on gender)

`src/utils/predefinedCurves.ts` defines preset size distributions (e.g., "Normal", "Punta Alta") that users can apply to fill in quantities automatically.

### Key database tables

`user_roles`, `clientes` (with `tier`, `vendedor_id`), `vendedores`, `productos` (with `rubro`, `genero`, `tier`, `precio_usd`, `fecha_despacho`), `marcas`, `pedidos`, `items_pedido`, `curvas`, `curvas_predefinidas`, `carritos_pendientes`.

### React Query conventions

- All query keys are defined in `queryKeys` in `src/lib/queryClient.ts` — always use these, never inline arrays.
- Default `staleTime` is 5 minutes; cart queries use 30 seconds.
- `refetchOnWindowFocus` and `refetchOnMount` are disabled globally — trigger refetches explicitly via `invalidateQueries`.
- Use `invalidateQueries.productos()`, `.pedidos()`, etc. after mutations.
