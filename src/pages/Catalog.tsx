import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { 
  ShoppingCart, 
  ArrowLeft, 
  Check, 
  Search, 
  Shirt, 
  ShoppingBag, 
  LogOut, 
  Home,
  Package,
  Users,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  categoria: string;
  genero: string;
  game_plan: boolean;
  imagen_url: string | null;
}

const Catalog = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteName, setClienteName] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadCart();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadProductos();
    }
  }, [categoria, loading]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get user role and info
    const { data: userRoleData } = await supabase
      .from("user_roles")
      .select("role, cliente_id, clientes(nombre)")
      .eq("user_id", session.user.id)
      .single();

    if (userRoleData) {
      setUserRole(userRoleData.role);
      if (userRoleData.clientes) {
        setClienteName((userRoleData.clientes as any).nombre);
      }
    }

    setLoading(false);
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const loadProductos = async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("categoria", categoria)
      .order("nombre");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
      return;
    }

    setProductos(data || []);
  };

  const isInCart = (productId: string) => cart.includes(productId);

  const filteredProductos = productos.filter((producto) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      producto.sku.toLowerCase().includes(search) ||
      producto.nombre.toLowerCase().includes(search)
    );
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">NEW BALANCE</span>
              <span className="truncate text-xs">S1 26 Pre Line</span>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Superadmin navigation */}
                {userRole === "superadmin" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => navigate("/dashboard")}
                      >
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => navigate("/users")}
                      >
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => navigate("/marcas")}
                      >
                        <Tag className="h-4 w-4" />
                        <span>Marcas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                
                {/* Common navigation for all users */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/catalog")}
                    isActive={!categoria}
                  >
                    <Home className="h-4 w-4" />
                    <span>Catálogo</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/catalog/prendas")}
                    isActive={categoria === "prendas"}
                  >
                    <Shirt className="h-4 w-4" />
                    <span>Prendas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate("/catalog/calzados")}
                    isActive={categoria === "calzados"}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Calzados</span>
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
                <span>Mi Pedido ({cart.length})</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <header className="border-b sticky top-0 bg-background z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">NEW BALANCE</h1>
                  <p className="text-sm text-muted-foreground">
                    {categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1) : "Catálogo"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{clienteName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 flex-1">
          {!categoria ? (
            // Página de inicio del catálogo
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold tracking-tight">S1 26 PRE LINE</h2>
                <p className="text-xl text-muted-foreground">Selecciona una categoría para comenzar</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por SKU o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <button
                  onClick={() => navigate("/catalog/prendas")}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary active:scale-95 transition-all duration-300 p-8 sm:p-12 bg-card touch-manipulation"
                >
                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Shirt className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">Prendas</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mt-2">Ropa deportiva y casual</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate("/catalog/calzados")}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary active:scale-95 transition-all duration-300 p-8 sm:p-12 bg-card touch-manipulation"
                >
                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">Calzados</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mt-2">Zapatillas y accesorios</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Página de productos de categoría
            <>
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por SKU o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-12">Cargando productos...</div>
              ) : filteredProductos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron productos
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProductos.map((producto) => (
                    <Card
                      key={producto.id}
                      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg relative ${
                        producto.game_plan ? "ring-2 ring-gameplan" : ""
                      }`}
                      onClick={() => navigate(`/product/${producto.id}`)}
                    >
                      {isInCart(producto.id) && (
                        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      
                      {producto.game_plan && (
                        <Badge className="absolute top-2 left-2 z-10 bg-gameplan text-gameplan-foreground">
                          GAME PLAN
                        </Badge>
                      )}

                      <div className="aspect-square bg-muted">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold line-clamp-2">{producto.nombre}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">SKU: {producto.sku}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{producto.linea}</Badge>
                          <Badge variant="outline">{producto.categoria}</Badge>
                          <Badge variant="outline">{producto.genero}</Badge>
                        </div>
                        <p className="text-lg font-bold">USD ${producto.precio_usd}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Catalog;