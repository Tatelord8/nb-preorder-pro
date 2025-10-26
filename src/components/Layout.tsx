import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronDown
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
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadCart();
    
    // Escuchar cambios en localStorage para actualizar el carrito
    const handleStorageChange = () => {
      loadCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar cambios locales del carrito
    const handleCartChange = () => {
      loadCart();
    };
    
    // Agregar un listener personalizado para cambios en el carrito
    window.addEventListener('cartUpdated', handleCartChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartChange);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Limpiar el carrito si no hay sesión activa
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");
      setCart([]);
      navigate("/login");
      return;
    }

    // Get user role and name
    const { data: userRole, error } = await supabase
      .from("user_roles")
      .select("role, nombre, clientes(nombre)")
      .eq("user_id", session.user.id)
      .single();

    console.log("🔍 Debug Layout - userRole data:", userRole);
    console.log("🔍 Debug Layout - userRole error:", error);

    if (userRole) {
      console.log("🔍 Debug Layout - Setting userRole to:", userRole.role);
      setUserRole(userRole.role);
      setUserName(userRole.nombre || "Usuario");
      if (userRole.clientes) {
        setClientName((userRole.clientes as any).nombre);
      }
    } else {
      console.log("🔍 Debug Layout - No userRole found");
    }
  };

  const loadCart = () => {
    // El carrito se guarda como "cartItems" en localStorage
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      const cartItems = JSON.parse(savedCartItems);
      setCart(cartItems);
    } else {
      // Si no hay items en el carrito, limpiar el estado
      setCart([]);
    }
  };

  const handleLogout = async () => {
    // Guardar carrito actual del usuario antes de cerrar sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const currentCartItems = localStorage.getItem("cartItems");
      const currentCart = localStorage.getItem("cart");
      
      if (currentCartItems || currentCart) {
        const userCartItemsKey = `cartItems_${session.user.id}`;
        const userCartKey = `cart_${session.user.id}`;
        
        if (currentCartItems) {
          localStorage.setItem(userCartItemsKey, currentCartItems);
        }
        if (currentCart) {
          localStorage.setItem(userCartKey, currentCart);
        }
      }
    }
    
    // Limpiar el carrito del localStorage general
    localStorage.removeItem("cart");
    localStorage.removeItem("cartItems");
    setCart([]);
    
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getCartCount = () => {
    // Si cart es un array de CartItems, contar los SKUs únicos
    if (Array.isArray(cart)) {
      // Verificar que el array no esté vacío
      if (cart.length === 0) {
        console.log("🔍 Debug Cart - Cart is empty");
        return 0;
      }
      
      // Obtener SKUs únicos del carrito
      const uniqueSkus = new Set(cart.map((item: any) => item.productoId));
      console.log("🔍 Debug Cart - Cart items:", cart);
      console.log("🔍 Debug Cart - Unique SKUs:", Array.from(uniqueSkus));
      console.log("🔍 Debug Cart - Count:", uniqueSkus.size);
      return uniqueSkus.size; // Cantidad de SKUs diferentes en el carrito
    }
    // Si cart es un objeto, usar la lógica anterior
    if (cart && typeof cart === 'object') {
      return Object.values(cart).reduce((sum: number, count: any) => sum + (count as number), 0);
    }
    // Si no hay cart o es null/undefined, retornar 0
    return 0;
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

                {/* Clientes - Only Superadmin */}
                {userRole === "superadmin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate("/clientes")}
                      isActive={location.pathname === "/clientes"}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Clientes</span>
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
                         location.pathname === "/pedidos" ? "Pedidos" : "Sistema"}
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
