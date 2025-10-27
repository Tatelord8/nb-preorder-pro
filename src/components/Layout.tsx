import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";
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
  SidebarMenuItem, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ShoppingCart, 
  LogOut, 
  Home,
  Package,
  Users,
  Tag,
  LayoutDashboard,
  UserCheck,
  FileText,
  User,
  Settings,
  ChevronDown,
  BarChart3
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const { items: cartItems, loading: cartLoading, totals } = useSupabaseCart();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    console.log("🔍 Debug Layout - Session user ID:", session.user.id);
    console.log("🔍 Debug Layout - Session user email:", session.user.email);

    // Get user role and name - consulta simplificada sin JOIN
    const { data: userRole, error } = await supabase
      .from("user_roles")
      .select("role, nombre, cliente_id")
      .eq("user_id", session.user.id)
      .single();

    console.log("🔍 Debug Layout - userRole data:", userRole);
    console.log("🔍 Debug Layout - userRole error:", error);

    if (error) {
      console.log("🔍 Debug Layout - Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    if (userRole) {
      console.log("🔍 Debug Layout - Setting userRole to:", userRole.role);
      setUserRole(userRole.role);
      setUserName(userRole.nombre || "Usuario");
      
      // Si hay cliente_id, obtener nombre del cliente por separado
      if (userRole.cliente_id) {
        try {
          const { data: cliente, error: clienteError } = await supabase
            .from("clientes")
            .select("nombre")
            .eq("id", userRole.cliente_id)
            .single();
          
          if (clienteError) {
            console.log("🔍 Debug Layout - Error obteniendo cliente:", clienteError);
          } else if (cliente) {
            setClientName(cliente.nombre);
            console.log("🔍 Debug Layout - Client name set to:", cliente.nombre);
          }
        } catch (err) {
          console.log("🔍 Debug Layout - Exception obteniendo cliente:", err);
        }
      }
    } else {
      console.log("🔍 Debug Layout - No userRole found");
      console.log("🔍 Debug Layout - This means the user is not in user_roles table");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getCartCount = () => {
    return totals.totalItems || 0;
  };

  // Debug log para verificar el userRole en el render
  console.log("🔍 Debug Layout - Current userRole:", userRole);

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">GPO</span>
            </div>
            <div>
              <h2 className="font-semibold">Gestor de Preventas Optima</h2>
              <p className="text-xs text-muted-foreground">Guata Pora S.A</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard - Superadmin and Admin */}
                {(userRole === "superadmin" || userRole === "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/dashboard")}
                      isActive={location.pathname === "/dashboard"}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Productos - Solo Superadmin and Admin */}
                {(() => {
                  const shouldShow = userRole === "superadmin" || userRole === "admin";
                  console.log("🔍 Debug Layout - Should show Productos:", shouldShow, "userRole:", userRole);
                  
                  // NO mostrar Productos para clientes o usuarios sin rol definido
                  if (!userRole) {
                    console.log("🔍 Debug Layout - userRole vacío, NO mostrando Productos");
                    return false;
                  }
                  
                  return shouldShow;
                })() && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/productos")}
                      isActive={location.pathname === "/productos"}
                    >
                      <Package className="h-4 w-4" />
                      <span>Productos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Catálogo - All users */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/catalog")}
                    isActive={location.pathname === "/catalog"}
                  >
                    <Home className="h-4 w-4" />
                    <span>Catálogo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Usuarios - Only Superadmin */}
                {userRole === "superadmin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/users")}
                      isActive={location.pathname === "/users"}
                    >
                      <Users className="h-4 w-4" />
                      <span>Usuarios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Marcas - Superadmin and Admin */}
                {(userRole === "superadmin" || userRole === "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/marcas")}
                      isActive={location.pathname === "/marcas"}
                    >
                      <Tag className="h-4 w-4" />
                      <span>Marcas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Pedidos - All users */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/pedidos")}
                    isActive={location.pathname === "/pedidos"}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Pedidos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Reportes - Solo Superadmin */}
                {userRole === "superadmin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/reportes")}
                      isActive={location.pathname === "/reportes"}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Reportes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate("/cart")}>
                <ShoppingCart className="h-4 w-4" />
                <span>Mi Pedido ({getCartCount() as number})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-col h-full w-full">
        <header className="border-b sticky top-0 bg-background z-10">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                    <div>
                      <h1 className="text-2xl font-bold">Gestor de Preventas Optima</h1>
                      <p className="text-sm text-muted-foreground">
                        {location.pathname === "/catalog" ? "Catálogo" : 
                         location.pathname === "/dashboard" ? "Dashboard" :
                         location.pathname === "/productos" ? "Productos" :
                         location.pathname === "/users" ? "Usuarios" :
                         location.pathname === "/marcas" ? "Marcas" :
                         location.pathname === "/clientes" ? "Clientes" :
                         location.pathname === "/pedidos" ? "Pedidos" :
                         location.pathname === "/reportes" ? "Reportes" : "Sistema"}
                      </p>
                    </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{userName || clientName || 'Usuario'}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2 rounded-full hover:bg-muted transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt="Usuario" />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/cart")}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span>Mi Pedido ({getCartCount() as number})</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto h-full">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
