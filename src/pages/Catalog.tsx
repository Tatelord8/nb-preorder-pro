import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Check } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/welcome")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">NEW BALANCE</h1>
                <p className="text-sm text-muted-foreground capitalize">{categoria}</p>
              </div>
            </div>
            <Button onClick={() => navigate("/cart")} variant="outline">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Mi Pedido ({cart.length})
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => (
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
      </main>
    </div>
  );
};

export default Catalog;
