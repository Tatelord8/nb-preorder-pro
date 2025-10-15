import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Shirt, LogOut, Search } from "lucide-react";

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

const Welcome = () => {
  const navigate = useNavigate();
  const [clienteName, setClienteName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Get cliente name
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("cliente_id, clientes(nombre)")
      .eq("user_id", session.user.id)
      .single();

    if (userRole?.clientes) {
      setClienteName((userRole.clientes as any).nombre);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const searchProductos = async (term: string) => {
    if (!term.trim()) {
      setProductos([]);
      return;
    }

    const search = term.toLowerCase();
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .or(`sku.ilike.%${search}%,nombre.ilike.%${search}%`)
      .order("nombre");

    if (!error && data) {
      setProductos(data);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProductos(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">NEW BALANCE</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{clienteName}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
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

          {searchTerm && productos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {productos.map((producto) => (
                <Card
                  key={producto.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    producto.game_plan ? "ring-2 ring-gameplan" : ""
                  }`}
                  onClick={() => navigate(`/product/${producto.id}`)}
                >
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
                    <h3 className="font-semibold line-clamp-2">{producto.nombre}</h3>
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
          ) : searchTerm && productos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron productos
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mt-12">
            <button
              onClick={() => navigate("/catalog/prendas")}
              className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300 p-12 bg-card"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shirt className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Prendas</h3>
                  <p className="text-muted-foreground mt-2">Ropa deportiva y casual</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/catalog/calzados")}
              className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300 p-12 bg-card"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ShoppingBag className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Calzados</h3>
                  <p className="text-muted-foreground mt-2">Zapatillas y accesorios</p>
                </div>
              </div>
            </button>
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Welcome;
