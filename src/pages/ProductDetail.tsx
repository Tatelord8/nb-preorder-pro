import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Trash2 } from "lucide-react";
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

interface Curva {
  id: string;
  nombre: string;
  talles: Record<string, number>;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [curvas, setCurvas] = useState<Curva[]>([]);
  const [selectedCurva, setSelectedCurva] = useState<string>("");
  const [cantidadCurvas, setCantidadCurvas] = useState<number>(1);
  const [customTalles, setCustomTalles] = useState<Record<string, number>>({});
  const [curvaType, setCurvaType] = useState<"predefined" | "custom">("predefined");
  const [isInCart, setIsInCart] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadProducto();
      checkIfInCart();
    }
  }, [id]);

  const checkIfInCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setIsInCart(cart.includes(id));
  };

  const loadProducto = async () => {
    const { data: productoData, error: productoError } = await supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();

    if (productoError || !productoData) {
      toast({
        title: "Error",
        description: "No se pudo cargar el producto",
        variant: "destructive",
      });
      navigate(-1);
      return;
    }

    setProducto(productoData);

    // Load curvas for this genero
    const { data: curvasData } = await supabase
      .from("curvas")
      .select("*")
      .eq("genero", productoData.genero);

    if (curvasData) {
      const formattedCurvas = curvasData.map(c => ({
        id: c.id,
        nombre: c.nombre,
        talles: c.talles as Record<string, number>,
      }));
      setCurvas(formattedCurvas);
      
      // Initialize custom talles with all sizes from first curva
      if (formattedCurvas.length > 0) {
        const initialTalles: Record<string, number> = {};
        Object.keys(formattedCurvas[0].talles).forEach(talle => {
          initialTalles[talle] = 0;
        });
        setCustomTalles(initialTalles);
      }
    }
  };

  const handleAddToCart = () => {
    if (curvaType === "predefined" && !selectedCurva) {
      toast({
        title: "Error",
        description: "Por favor selecciona una curva",
        variant: "destructive",
      });
      return;
    }

    if (curvaType === "custom") {
      const hasQuantity = Object.values(customTalles).some(q => q > 0);
      if (!hasQuantity) {
        toast({
          title: "Error",
          description: "Por favor ingresa al menos una cantidad",
          variant: "destructive",
        });
        return;
      }
    }

    // Save to cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const newItem = {
      productoId: id,
      curvaId: curvaType === "predefined" ? selectedCurva : null,
      cantidadCurvas: curvaType === "predefined" ? cantidadCurvas : 1,
      talles: curvaType === "custom" ? customTalles : 
        curvas.find(c => c.id === selectedCurva)?.talles || {},
      type: curvaType,
    };

    if (!cart.includes(id)) {
      cart.push(id);
    }
    cartItems.push(newItem);

    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("cartItems", JSON.stringify(cartItems));

    toast({
      title: "Agregado al pedido",
      description: "El producto fue agregado exitosamente",
    });

    navigate(-1);
  };

  const handleRemoveFromCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

    const updatedCart = cart.filter((productId: string) => productId !== id);
    const updatedCartItems = cartItems.filter((item: any) => item.productoId !== id);

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));

    setIsInCart(false);

    toast({
      title: "Eliminado del pedido",
      description: "El producto fue eliminado exitosamente",
    });
  };

  if (!producto) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div>
            <div className={`aspect-square bg-muted rounded-lg overflow-hidden ${
              producto.game_plan ? "ring-4 ring-gameplan" : ""
            }`}>
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
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              {producto.game_plan && (
                <Badge className="bg-gameplan text-gameplan-foreground">GAME PLAN</Badge>
              )}
              <h1 className="text-3xl font-bold">{producto.nombre}</h1>
              <p className="text-muted-foreground">SKU: {producto.sku}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{producto.linea}</Badge>
                <Badge variant="outline">{producto.categoria}</Badge>
                <Badge variant="outline">{producto.genero}</Badge>
              </div>
              <p className="text-3xl font-bold">USD ${producto.precio_usd}</p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label>Tipo de curva</Label>
              <RadioGroup value={curvaType} onValueChange={(v: any) => setCurvaType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="predefined" id="predefined" />
                  <Label htmlFor="predefined">Curva Predefinida</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Curva Personalizada</Label>
                </div>
              </RadioGroup>

              {curvaType === "predefined" ? (
                <>
                  <div className="space-y-2">
                    <Label>Seleccionar curva</Label>
                    <RadioGroup value={selectedCurva} onValueChange={setSelectedCurva}>
                      {curvas.map((curva) => (
                        <div key={curva.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={curva.id} id={curva.id} />
                          <Label htmlFor={curva.id} className="flex-1">
                            <div className="flex justify-between">
                              <span>{curva.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {Object.entries(curva.talles).map(([t, c]) => `${t}:${c}`).join(", ")}
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad de curvas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={cantidadCurvas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCantidadCurvas(val === "" ? 0 : parseInt(val) || 0);
                      }}
                      onBlur={(e) => {
                        if (cantidadCurvas === 0) setCantidadCurvas(1);
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Label>Cantidades por talle</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(customTalles).map((talle) => (
                      <div key={talle} className="space-y-2">
                        <Label>{talle}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={customTalles[talle]}
                          onChange={(e) =>
                            setCustomTalles({
                              ...customTalles,
                              [talle]: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isInCart ? (
              <Button 
                onClick={handleRemoveFromCart} 
                variant="destructive" 
                className="w-full" 
                size="lg"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Eliminar del pedido
              </Button>
            ) : (
              <Button onClick={handleAddToCart} className="w-full" size="lg">
                Agregar a pedido
              </Button>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
