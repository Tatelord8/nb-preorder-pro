import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSizes, getSizeInfo, type ProductSizeInfo } from "@/utils/sizeGenerator";
import { getCurvesForGender, getCurveInfo, applyCurveToProduct, type CurveOption } from "@/utils/predefinedCurves";
import { sortQuantitiesBySizeOrder } from "@/utils/sizeOrdering";
import { canUserAccessTier, getAccessDeniedMessage } from "@/utils/tierAccess";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  categoria: string;
  rubro?: string;
  genero: string;
  game_plan: boolean;
  imagen_url: string | null;
  tier?: string;
}

interface Curva {
  id: string;
  nombre: string;
  talles: Record<string, number>;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rubroFromUrl = searchParams.get('rubro');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [curvas, setCurvas] = useState<Curva[]>([]);
  const [selectedCurva, setSelectedCurva] = useState<string>("");
  const [cantidadCurvas, setCantidadCurvas] = useState<number>(1);
  const [customTalles, setCustomTalles] = useState<Record<string, number>>({});
  const [curvaType, setCurvaType] = useState<"predefined" | "custom">("predefined");
  const { addItem, removeItem, isProductInCart: checkIsInCart } = useSupabaseCart();
  const [isInCart, setIsInCart] = useState(false);
  const [validSizes, setValidSizes] = useState<string[]>([]);
  
  // Estados para curvas predefinidas
  const [availableCurves, setAvailableCurves] = useState<CurveOption[]>([]);
  const [selectedPredefinedCurve, setSelectedPredefinedCurve] = useState<number>(1);
  const [appliedCurveQuantities, setAppliedCurveQuantities] = useState<Record<string, number>>({});
  const [userTier, setUserTier] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadUserTier();
      loadProducto();
      checkIfInCart();
    }
  }, [id]);

  const loadUserTier = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Obtener el tier del usuario desde user_roles
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("cliente_id, clientes(tier)")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.clientes) {
        setUserTier((userRole.clientes as any).tier);
      }
    } catch (error) {
      console.error("Error loading user tier:", error);
    }
  };

  // Cargar curvas predefinidas cuando cambie el género y rubro del producto
  useEffect(() => {
    if (producto?.genero && producto?.rubro) {
      const curves = getCurvesForGender(producto.genero, producto.rubro);
      setAvailableCurves(curves);
      
      if (curves.length > 0) {
        setSelectedPredefinedCurve(curves[0].opcion);
        updateAppliedCurve();
      }
    }
  }, [producto?.genero, producto?.rubro]);

  // Actualizar curvas aplicadas cuando cambien los parámetros
  useEffect(() => {
    if (producto?.genero && producto?.rubro && selectedPredefinedCurve && cantidadCurvas > 0) {
      updateAppliedCurve();
    }
  }, [producto?.genero, producto?.rubro, selectedPredefinedCurve, cantidadCurvas]);

  // Verificar acceso cuando se carguen tanto el producto como el tier del usuario
  useEffect(() => {
    if (producto && userTier && !canUserAccessTier(userTier, producto.tier || "0")) {
      setAccessDenied(true);
    }
  }, [producto, userTier]);

  // Función para actualizar las curvas aplicadas
  const updateAppliedCurve = () => {
    if (producto?.genero && producto?.rubro && selectedPredefinedCurve && cantidadCurvas > 0) {
      const applied = applyCurveToProduct(producto.genero, producto.rubro, selectedPredefinedCurve, cantidadCurvas);
      setAppliedCurveQuantities(applied);
    }
  };

  const checkIfInCart = async () => {
    if (!id) return;
    
    try {
      const isInCart = checkIsInCart(id);
      setIsInCart(isInCart);
    } catch (error) {
      console.error('Error checking cart:', error);
      setIsInCart(false);
    }
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

    // Verificar acceso por tier (solo para clientes)
    if (userTier && !canUserAccessTier(userTier, productoData.tier || "0")) {
      setAccessDenied(true);
      toast({
        title: "Acceso denegado",
        description: getAccessDeniedMessage(userTier, productoData.tier || "0"),
        variant: "destructive",
      });
      return;
    }

    setProducto(productoData);

    // Generate sizes using the new size generator utility
    const productSizeInfo: ProductSizeInfo = {
      rubro: productoData.rubro || productoData.categoria, // Use rubro if available, fallback to categoria
      genero: productoData.genero
    };
    
    const sizeInfo = getSizeInfo(productSizeInfo);
    setValidSizes(sizeInfo.sizes);

    // Las curvas predefinidas se cargan automáticamente en el useEffect
    // No necesitamos consultar la base de datos para curvas
    
    // Initialize custom talles with valid sizes
    const initialTalles: Record<string, number> = {};
    validSizes.forEach(size => {
      initialTalles[size] = 0;
    });
    setCustomTalles(initialTalles);
  };

  const handleAddToCart = async () => {
    if (curvaType === "predefined" && !selectedPredefinedCurve) {
      toast({
        title: "Error",
        description: "Por favor selecciona una curva predefinida",
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

    // Obtener userId de la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "No hay sesión activa",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      productoId: id!,
      curvaId: curvaType === "predefined" ? `predefined-${selectedPredefinedCurve}` : null,
      cantidadCurvas: curvaType === "predefined" ? cantidadCurvas : 1,
      talles: curvaType === "custom" ? customTalles : appliedCurveQuantities,
      type: curvaType,
      genero: producto?.genero,
      opcion: curvaType === "predefined" ? selectedPredefinedCurve : null,
      precio_usd: producto?.precio_usd,
    };

    // Usar SupabaseCartService para agregar al carrito
    await addItem(newItem);

    setIsInCart(true);

    toast({
      title: "Agregado al pedido",
      description: "El producto fue agregado exitosamente",
    });

    // Navegar de vuelta al catálogo con el rubro correcto
    if (rubroFromUrl) {
      navigate(`/catalog?rubro=${rubroFromUrl}`);
    } else {
      navigate(-1);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!id) return;

    try {
      // Usar SupabaseCartService para eliminar del carrito
      await removeItem(id);

      setIsInCart(false);

      toast({
        title: "Eliminado del pedido",
        description: "El producto fue eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del pedido",
        variant: "destructive",
      });
    }
  };

  if (!producto) {
    return <div className="min-h-screen flex items-center justify-center"></div>;
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (rubroFromUrl) {
                  navigate(`/catalog?rubro=${rubroFromUrl}`);
                } else {
                  navigate('/catalog');
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
              <p className="text-muted-foreground">
                {userTier ? getAccessDeniedMessage(userTier, producto.tier || "0") : "No tienes permisos para ver este producto."}
              </p>
            </div>
            <Button 
              onClick={() => {
                if (rubroFromUrl) {
                  navigate(`/catalog?rubro=${rubroFromUrl}`);
                } else {
                  navigate('/catalog');
                }
              }}
              className="w-full"
            >
              Volver al Catálogo
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (rubroFromUrl) {
                navigate(`/catalog?rubro=${rubroFromUrl}`);
              } else {
                navigate('/catalog');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div>
            <div className={`aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center p-6 ${
              producto.game_plan ? "ring-4 ring-gameplan" : ""
            }`}>
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-contain"
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
                    <RadioGroup value={selectedPredefinedCurve.toString()} onValueChange={(value) => setSelectedPredefinedCurve(parseInt(value))}>
                      {availableCurves.map((curve) => (
                        <div key={curve.opcion} className="flex items-center space-x-2">
                          <RadioGroupItem value={curve.opcion.toString()} id={`curve-${curve.opcion}`} />
                          <Label htmlFor={`curve-${curve.opcion}`} className="flex-1">
                            <div className="flex justify-between">
                              <span>Opción {curve.opcion}</span>
                              <span className="text-xs text-muted-foreground">
                                {curve.total} unidades
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
                      max="10"
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

                  {/* Vista previa de las cantidades aplicadas */}
                  {Object.keys(appliedCurveQuantities).length > 0 && (
                    <div className="space-y-2">
                      <Label>Vista previa de cantidades</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded">
                        {sortQuantitiesBySizeOrder(appliedCurveQuantities, producto?.genero || '').map(({ talla, cantidad }) => (
                          <div key={talla} className="flex justify-between text-sm">
                            <span className="font-medium">{talla}</span>
                            <span className="text-gray-600">{cantidad}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: {Object.values(appliedCurveQuantities).reduce((sum, qty) => sum + qty, 0)} unidades
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <Label>Cantidades por talle</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {validSizes.map((talle) => (
                      <div key={talle} className="space-y-2">
                        <Label>{talle}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={customTalles[talle] || 0}
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
