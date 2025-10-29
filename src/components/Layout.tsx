import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";
import { usePedidosPendientesCount } from "@/hooks/usePedidosPendientesCount";
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
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  ShieldCheck
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
  const { data: pedidosPendientesCount = 0 } = usePedidosPendientesCount();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Get user role and name - consulta simplificada sin JOIN
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role, nombre, cliente_id")
      .eq("user_id", session.user.id)
      .single();

    if (userRole) {
      setUserRole(userRole.role);
      setUserName(userRole.nombre || "Usuario");

      // Si hay cliente_id, obtener nombre del cliente por separado
      if (userRole.cliente_id) {
        try {
          const { data: cliente } = await supabase
            .from("clientes")
            .select("nombre")
            .eq("id", userRole.cliente_id)
            .single();

          if (cliente) {
            setClientName(cliente.nombre);
          }
        } catch (err) {
          // Error silencioso
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Obtener el count del carrito directamente desde totals
  const cartCount = totals.totalItems || 0;

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-2">
            <img 
              src="https://www.pngmart.com/files/23/New-Balance-Logo-PNG-Isolated-HD.png" 
              alt="New Balance Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h2 className="font-semibold">New Balance</h2>
              <p className="text-xs text-muted-foreground">Optima S.A</p>
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
                {(userRole === "superadmin" || userRole === "admin") && (
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

                {/* Autorización - Solo Superadmin */}
                {userRole === "superadmin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/autorizacion")}
                      isActive={location.pathname === "/autorizacion"}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Autorización</span>
                      {pedidosPendientesCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {pedidosPendientesCount}
                        </Badge>
                      )}
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
              <SidebarMenuButton onClick={() => navigate("/cart")} className="relative">
                <ShoppingCart className="h-4 w-4" />
                <span>Mi Pedido</span>
                {cartCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 min-w-[20px] px-1.5 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
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
                      <h1 className="text-2xl font-bold">Preventa New Balance</h1>
                      <p className="text-sm text-muted-foreground">
                        {location.pathname === "/catalog" ? "Catálogo" : 
                         location.pathname === "/dashboard" ? "Dashboard" :
                         location.pathname === "/productos" ? "Productos" :
                         location.pathname === "/users" ? "Usuarios" :
                         location.pathname === "/marcas" ? "Marcas" :
                         location.pathname === "/clientes" ? "Clientes" :
                         location.pathname === "/autorizacion" ? "Autorización" :
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
                      <span>Mi Pedido</span>
                      {cartCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 min-w-[20px] px-1.5 text-xs"
                        >
                          {cartCount}
                        </Badge>
                      )}
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
