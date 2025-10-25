import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
}

const Catalog = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedRubro, setSelectedRubro] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
    // No cargar productos automáticamente, mostrar banners primero
  }, [categoria]);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const loadProductos = async (rubro?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.from("productos").select("*");

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
        return;
      }

      // Filtrar productos en el frontend
      let filteredData = (data as Producto[]) || [];
      
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
    loadProductos(rubro);
  };

  const handleBackToBanners = () => {
    setSelectedRubro(null);
    setProductos([]);
  };

  const addToCart = (producto: Producto) => {
    const newCart = { ...cart };
    newCart[producto.id] = (newCart[producto.id] || 0) + 1;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    
    toast({
      title: "Producto agregado",
      description: `${producto.nombre} agregado al pedido`,
    });
  };

  const removeFromCart = (producto: Producto) => {
    const newCart = { ...cart };
    if (newCart[producto.id] > 1) {
      newCart[producto.id] -= 1;
    } else {
      delete newCart[producto.id];
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const getCartCount = (productoId: string) => {
    return cart[productoId] || 0;
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-xl font-semibold capitalize">{selectedRubro}</h2>
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
        {filteredProductos.map((producto) => (
          <Card 
            key={producto.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/product/${producto.id}`)}
          >
            <div className="aspect-square bg-muted flex items-center justify-center">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
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
                <div className="flex items-center gap-2">
                  {getCartCount(producto.id) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(producto);
                      }}
                    >
                      -
                    </Button>
                  )}
                  {getCartCount(producto.id) > 0 && (
                    <span className="text-sm font-medium min-w-[20px] text-center">
                      {getCartCount(producto.id)}
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(producto);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    {getCartCount(producto.id) > 0 ? "Agregar" : "Agregar"}
                  </Button>
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
    </div>
  );
};

export default Catalog;