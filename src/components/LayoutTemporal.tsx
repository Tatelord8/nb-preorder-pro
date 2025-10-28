// Layout temporal simplificado para diagnóstico
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  LogOut,
  User,
  Building2
} from "lucide-react";

const LayoutTemporal = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GPO</span>
            </div>
            <div>
              <h2 className="font-semibold">Gestor de Preventas New Balance</h2>
              <p className="text-xs text-muted-foreground">Optima S.A</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/dashboard")}
                    isActive={location.pathname === "/dashboard"}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/catalog")}
                    isActive={location.pathname === "/catalog"}
                  >
                    <Package className="h-4 w-4" />
                    <span>Catálogo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/pedidos")}
                    isActive={location.pathname === "/pedidos"}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Pedidos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/users")}
                    isActive={location.pathname === "/users"}
                  >
                    <Users className="h-4 w-4" />
                    <span>Usuarios</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutTemporal;







