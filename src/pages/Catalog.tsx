import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Check, 
  Search, 
  Shirt, 
  ShoppingBag,
  Footprints,
  Watch,
  ArrowRight
} from "lucide-react";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";
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
  rubro?: string;
  tier?: string;
}

const Catalog = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRubro, setSelectedRubro] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const { items: cartItems, loading: cartLoading, isProductInCart } = useSupabaseCart();
  
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage] = useState(24); // 24 productos por página (6x4 grid)
  const hasInitializedPageSync = useRef(false);

  useEffect(() => {
    // Cargar tier del usuario al montar el componente
    const initializeCatalog = async () => {
      const tier = await loadUserTier();
      
      // Verificar si hay un rubro en la URL
      const rubroFromUrl = searchParams.get('rubro');
      if (rubroFromUrl) {
        setSelectedRubro(rubroFromUrl);
        loadProductos(rubroFromUrl, tier);
      }
    };
    
    initializeCatalog();
  }, [categoria, searchParams]);


  // Recargar productos cuando cambie el tier del usuario
  useEffect(() => {
    if (userTier && selectedRubro) {
      loadProductos(selectedRubro, userTier);
    }
  }, [userTier]);


  const loadUserTier = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("🔍 No hay sesión activa");
        return null;
      }

      console.log("🔍 Usuario ID:", session.user.id);

      // Consultar tier desde user_roles y tiers
      try {
        // Obtener tier desde user_roles
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('user_roles')
          .select('tier, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log("🔍 user_roles tier data:", userRoleData);
        console.log("🔍 user_roles error:", userRoleError);
        console.log("🔍 user_roles complete data:", JSON.stringify(userRoleData));

        if (userRoleData && userRoleData.tier !== null) {
          const tier = userRoleData.tier;
          console.log("🔍 Tier obtenido:", tier);
          setUserTier(tier);
          return tier;
        }
      } catch (error) {
        console.error("🔍 Error obteniendo tier:", error);
      }

      console.log("🔍 No se pudo obtener el tier del usuario");
      return null;
    } catch (error) {
      console.error("Error loading user tier:", error);
      return null;
    }
  };


  const loadProductos = async (rubro?: string, tier?: string | null) => {
    try {
      setLoading(true);
      
      // Obtener el total primero
      const { count } = await supabase
        .from("productos")
        .select("*", { count: 'exact', head: true });
      
      console.log(`🔍 Total productos en DB (Catalog): ${count}`);
      
      if (!count) {
        setProductos([]);
        setLoading(false);
        return;
      }
      
      // Cargar en páginas de 1000 (límite de Supabase)
      const pageSize = 1000;
      const totalPages = Math.ceil(count / pageSize);
      let allProductos: Producto[] = [];
      
      for (let page = 0; page < totalPages; page++) {
        const start = page * pageSize;
        const end = start + pageSize - 1;
        
        console.log(`🔄 Cargando página ${page + 1}/${totalPages} (${start}-${end})...`);
        
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .order("created_at", { ascending: true })
          .range(start, end);
        
        if (error) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los productos",
            variant: "destructive",
          });
          return;
        }
        
        allProductos = [...allProductos, ...(data || [])];
        console.log(`✅ Cargados ${data?.length || 0} productos (Total acumulado: ${allProductos.length})`);
      }

      // Filtrar productos en el frontend
      let filteredData = allProductos;
      
      console.log("🔍 Total productos cargados:", filteredData.length);
      console.log("🔍 User tier actual:", userTier);
      console.log("🔍 Tier parameter:", tier);
      
             // Filtrar por tier del usuario (solo para clientes)
       // Jerarquía: 0 (Premium - más alto), 1 (Gold), 2 (Silver), 3 (Bronze - más bajo)
       // Un cliente de tier 0 puede ver productos de tier 0, 1, 2, 3 (todo el catálogo)
       // Un cliente de tier 1 puede ver productos de tier 1, 2, 3
       // Un cliente de tier 2 puede ver productos de tier 2, 3
       // Un cliente de tier 3 solo puede ver productos de tier 3
       const tierToUse = tier || userTier;
       
       // Verificar si el usuario es admin o superadmin
       const { data: { session } } = await supabase.auth.getSession();
       let isAdminOrSuperadmin = false;
       
       if (session) {
         const { data: userRole } = await supabase
           .from("user_roles")
           .select("role")
           .eq("user_id", session.user.id)
           .single();
         
         isAdminOrSuperadmin = userRole?.role === 'admin' || userRole?.role === 'superadmin';
       }
       
                // Solo filtrar por tier si NO es admin ni superadmin
       if (tierToUse && !isAdminOrSuperadmin) {
         const beforeFilter = filteredData.length;
         
         // Convertir tier a número para comparación
         const userTierNum = parseInt(tierToUse);
         const validTiers = [];
         
         // Agregar todos los tiers desde el tier del usuario hasta 3 (inclusive)
         // Por ejemplo: si el usuario es tier 1, puede ver tiers 1, 2, 3
         for (let i = userTierNum; i <= 3; i++) {
           validTiers.push(i.toString());
         }
         
         console.log("🔍 FILTRO DE TIER APLICADO:");
         console.log("  - Usuario Tier:", userTierNum);
         console.log("  - Tiers válidos:", validTiers);
         console.log("  - Total productos ANTES del filtro:", beforeFilter);
         
         // Aplicar el filtro
         filteredData = filteredData.filter(producto => {
           const productoEsValido = validTiers.includes(producto.tier || '');
           if (!productoEsValido && producto.tier) {
             console.log(`  ❌ Producto ${producto.sku} (tier ${producto.tier}) NO es válido para usuario tier ${userTierNum}`);
           }
           return productoEsValido;
         });
         
         console.log("  - Total productos DESPUÉS del filtro:", filteredData.length);
       } else if (isAdminOrSuperadmin) {
         console.log("🔍 Usuario es admin/superadmin, mostrando todos los productos");
       } else {
         console.log("🔍 No hay tier, mostrando todos los productos");
       }
      
      if (rubro) {
        filteredData = filteredData.filter(producto => producto.rubro === rubro);
      }
      
      if (categoria) {
        filteredData = filteredData.filter(producto => producto.categoria === categoria);
      }
      
      setProductos(filteredData);
    } catch (error) {
      console.error("Error loading productos:", error);
      toast({
        title: "Error",
        description: "Error al cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRubroSelect = (rubro: string) => {
    setSelectedRubro(rubro);
    setCurrentPage(1);
    loadProductos(rubro, userTier);
  };

  const handleBackToBanners = () => {
    setSelectedRubro(null);
    setCurrentPage(1);
    setProductos([]);
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación de productos filtrados
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductos = filteredProductos.slice(startIndex, endIndex);
  
  // Reset a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Sincronizar página desde URL (ejemplo: al volver desde ProductDetail)
  useEffect(() => {
    if (!hasInitializedPageSync.current) {
      hasInitializedPageSync.current = true;
      return;
    }

    const pageFromUrl = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams, currentPage]);

  // Mantener currentPage dentro del rango válido
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Persistir estado de navegación (rubro + page) en la URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (selectedRubro) {
      params.set("rubro", selectedRubro);
      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      } else {
        params.delete("page");
      }
    } else {
      params.delete("rubro");
      params.delete("page");
    }

    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedRubro, currentPage, searchParams, setSearchParams]);

  // Mostrar banners de rubros si no hay rubro seleccionado
  if (!selectedRubro) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-muted-foreground">Selecciona una categoría para ver los productos disponibles</p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Banner Calzados */}
            <Card 
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              onClick={() => handleRubroSelect("Calzados")}
            >
              <div className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Footprints className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Calzados</h2>
                  <p className="text-gray-600 mb-4">
                    Descubre nuestra colección de zapatillas deportivas, casuales y de running
                  </p>
                </div>
                <div className="flex items-center justify-center text-blue-600 font-semibold group-hover:text-blue-700">
                  Ver Productos
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>

            {/* Banner Prendas */}
            <Card 
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              onClick={() => handleRubroSelect("Prendas")}
            >
              <div className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Shirt className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Prendas</h2>
                  <p className="text-gray-600 mb-4">
                    Explora nuestra línea de ropa deportiva, casual y accesorios de moda
                  </p>
                </div>
                <div className="flex items-center justify-center text-green-600 font-semibold group-hover:text-green-700">
                  Ver Productos
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar productos del rubro seleccionado
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={handleBackToBanners}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Categorías
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold capitalize">{selectedRubro}</h2>
            <Badge variant="secondary">
              {searchTerm ? 
                `${filteredProductos.length} de ${productos.length}` : 
                `${productos.length} productos`
              }
            </Badge>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedProductos.map((producto) => (
          <Card 
            key={producto.id} 
            className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative ${
              isProductInCart(producto.id) ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedRubro) {
                params.set("rubro", selectedRubro);
              }
              if (currentPage > 1) {
                params.set("page", currentPage.toString());
              }
              const query = params.toString();
              navigate(`/product/${producto.id}${query ? `?${query}` : ""}`);
            }}
          >
            {/* Check indicator */}
            {isProductInCart(producto.id) && (
              <div className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="aspect-square bg-white flex items-center justify-center p-4">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-muted-foreground text-center p-4">
                  <Shirt className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Sin imagen</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2">{producto.nombre}</h3>
                  <p className="text-xs text-muted-foreground">SKU: {producto.sku}</p>
                </div>
                {producto.game_plan && (
                  <Badge variant="secondary" className="text-xs">
                    Game Plan
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Línea:</span> {producto.linea}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Género:</span> {producto.genero}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Categoría:</span> {producto.categoria}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">
                  ${producto.precio_usd} USD
                </div>
                <div className="text-sm text-muted-foreground">
                  Ver detalles →
                </div>
              </div>
            </div>
          </Card>
        ))}
        </div>

        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <Shirt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Intenta con otros términos de búsqueda" : "No hay productos disponibles en esta categoría"}
            </p>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      {filteredProductos.length > itemsPerPage && (
        <div className="p-6 border-t bg-background">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProductos.length)} de {filteredProductos.length} productos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;