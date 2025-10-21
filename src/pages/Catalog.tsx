import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  ShoppingBag
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
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadCart();
    loadProductos();
  }, [categoria]);

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const loadProductos = async () => {
    try {
      setLoading(true);
      let query = supabase.from("productos").select("*");

      if (categoria) {
        query = query.eq("categoria", categoria);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
        return;
      }

      setProductos(data || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p></p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
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
          <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      onClick={() => removeFromCart(producto)}
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
                    onClick={() => addToCart(producto)}
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