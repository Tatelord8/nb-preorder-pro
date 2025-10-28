// App.tsx temporal para diagnóstico
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import LayoutTemporal from "@/components/LayoutTemporal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Marcas from "./pages/Marcas";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import Setup from "./pages/Setup";
import ManualSetup from "./pages/ManualSetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/manual-setup" element={<ManualSetup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          
          {/* Rutas con Layout simplificado */}
          <Route path="/catalog" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Catalog />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/catalog/:categoria" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Catalog />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/productos" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Productos />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/clientes" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Clientes />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/pedidos" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Pedidos />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/product/:id" element={
            <SidebarProvider>
              <LayoutTemporal>
                <ProductDetail />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/cart" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Cart />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/admin" element={<Admin />} />
          
          {/* Superadmin routes */}
          <Route path="/dashboard" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Dashboard />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/users" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Users />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          <Route path="/marcas" element={
            <SidebarProvider>
              <LayoutTemporal>
                <Marcas />
              </LayoutTemporal>
            </SidebarProvider>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;




