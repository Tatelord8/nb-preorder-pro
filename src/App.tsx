import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
import Setup from "./pages/Setup";
import ManualSetup from "./pages/ManualSetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/manual-setup" element={<ManualSetup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/catalog" element={
            <SidebarProvider>
              <SidebarInset>
                <Catalog />
              </SidebarInset>
            </SidebarProvider>
          } />
          <Route path="/catalog/:categoria" element={
            <SidebarProvider>
              <SidebarInset>
                <Catalog />
              </SidebarInset>
            </SidebarProvider>
          } />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<Admin />} />
          {/* Superadmin routes */}
          <Route path="/dashboard" element={
            <SidebarProvider>
              <SidebarInset>
                <Dashboard />
              </SidebarInset>
            </SidebarProvider>
          } />
          <Route path="/users" element={
            <SidebarProvider>
              <SidebarInset>
                <Users />
              </SidebarInset>
            </SidebarProvider>
          } />
          <Route path="/marcas" element={
            <SidebarProvider>
              <SidebarInset>
                <Marcas />
              </SidebarInset>
            </SidebarProvider>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
