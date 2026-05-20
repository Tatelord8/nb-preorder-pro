import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getCurvesForGender, applyCurveToProduct, type CurveOption } from "@/utils/predefinedCurves";
import { sortQuantitiesBySizeOrder } from "@/utils/sizeOrdering";
import { canUserAccessTier, getAccessDeniedMessage } from "@/utils/tierAccess";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";
import { CartStatus } from "@/components/CartStatus";

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
  look?: number | null;
  marca_nombre?: string;
}

interface LookProducto {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  imagen_url: string | null;
  rubro: string;
  genero: string;
  tier?: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rubroFromUrl = searchParams.get('rubro');
  const pageFromUrl = searchParams.get('page') || '1';
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidadCurvas, setCantidadCurvas] = useState<number>(1);
  const [cantidadAccesorios, setCantidadAccesorios] = useState<number>(1);
  const {
    addItem,
    removeItem,
    isProductInCart: checkIsInCart,
    items: cartItems,
    loading: cartLoading,
    saveStatus,
    lastSyncTime,
    totals
  } = useSupabaseCart();
  const [isInCart, setIsInCart] = useState(false);
  // Estados para curvas predefinidas
  const [availableCurves, setAvailableCurves] = useState<CurveOption[]>([]);
  const [selectedPredefinedCurve, setSelectedPredefinedCurve] = useState<number>(1);
  const [appliedCurveQuantities, setAppliedCurveQuantities] = useState<Record<string, number>>({});
  const [specialSizes, setSpecialSizes] = useState<Record<string, boolean>>({
    '13': false,
    '14': false,
    '15': false
  });
  const [userTier, setUserTier] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [lookProductos, setLookProductos] = useState<LookProducto[]>([]);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const { toast } = useToast();

  // Reset all product-specific state when navigating to a different product
  useEffect(() => {
    setProducto(null);
    setCantidadCurvas(1);
    setSelectedPredefinedCurve(1);
    setSpecialSizes({ '13': false, '14': false, '15': false });
    setAppliedCurveQuantities({});
    setIsInCart(false);
    setAccessDenied(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadUserTier();
      loadProducto();
      checkIfInCart();
    }
  }, [id]);

  useEffect(() => {
    if (producto?.look != null) {
      loadLookProductos(producto.look, producto.id);
    } else {
      setLookProductos([]);
    }
  }, [producto?.look, producto?.id, userTier]);

  // Sync cart state: restore quantities/curve from the saved cart item
  useEffect(() => {
    if (id && !cartLoading) {
      const inCart = checkIsInCart(id);
      setIsInCart(inCart);

      if (inCart) {
        const cartItem = cartItems.find(item => item.productoId === id);
        if (cartItem) {
          if (cartItem.talles?.Unic !== undefined) {
            setCantidadAccesorios(cartItem.talles.Unic);
          }
          if (cartItem.cantidadCurvas !== undefined) {
            setCantidadCurvas(cartItem.cantidadCurvas);
          }
          if (cartItem.opcion !== undefined) {
            setSelectedPredefinedCurve(cartItem.opcion);
          }
        }
      }
    }
  }, [cartItems, cartLoading, id, checkIsInCart]);

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
      const curves = getCurvesForGender(producto.genero, producto.rubro, producto.marca_nombre);
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
  }, [producto?.genero, producto?.rubro, selectedPredefinedCurve, cantidadCurvas, specialSizes]);

  // Verificar acceso cuando se carguen tanto el producto como el tier del usuario
  useEffect(() => {
    if (producto && userTier && !canUserAccessTier(userTier, producto.tier || "0")) {
      setAccessDenied(true);
    }
  }, [producto, userTier]);

  // Función para actualizar las curvas aplicadas
  const updateAppliedCurve = () => {
    if (producto?.genero && producto?.rubro && selectedPredefinedCurve && cantidadCurvas > 0) {
      const applied = applyCurveToProduct(producto.genero, producto.rubro, selectedPredefinedCurve, cantidadCurvas, producto.marca_nombre);
      
      // Agregar tallas especiales si están seleccionadas
      const finalQuantities = { ...applied };
      Object.keys(specialSizes).forEach(size => {
        if (specialSizes[size]) {
          finalQuantities[size] = (finalQuantities[size] || 0) + 6;
        }
      });
      
      setAppliedCurveQuantities(finalQuantities);
    }
  };

  const checkIfInCart = async () => {
    if (!id) return;
    
    try {
      console.log('🔍 Debug checkIfInCart - ID del producto:', id);
      const isInCart = checkIsInCart(id);
      setIsInCart(isInCart);
      console.log('🛒 Verificando carrito - Producto:', id, 'En carrito:', isInCart);
      
    } catch (error) {
      console.error('❌ Error checking cart:', error);
      setIsInCart(false);
    }
  };

  const loadLookProductos = async (look: number, currentId: string) => {
    const { data } = await supabase
      .from("productos")
      .select("id, sku, nombre, precio_usd, imagen_url, rubro, genero, tier")
      .eq("look", look)
      .neq("id", currentId);
    if (data) {
      const accessible = (data as LookProducto[]).filter(
        (p) => canUserAccessTier(userTier ?? "0", p.tier ?? "0")
      );
      setLookProductos(accessible);
    }
  };

  const loadProducto = async () => {
    const { data: productoData, error: productoError } = await supabase
      .from("productos")
      .select("*, marcas(nombre)")
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

    setProducto({
      ...productoData,
      marca_nombre: (productoData as any).marcas?.nombre ?? undefined,
      look: (productoData as any).look ?? null,
    });
  };

  const handleAddToCart = async () => {
    const isAccesorios = producto?.rubro?.toLowerCase() === 'accesorios';

    if (!isAccesorios && !selectedPredefinedCurve) {
      toast({
        title: "Error",
        description: "Por favor selecciona una curva predefinida",
        variant: "destructive",
      });
      return;
    }

    if (isAccesorios && cantidadAccesorios < 1) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
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

    const newItem = isAccesorios
      ? {
          productoId: id!,
          curvaId: "accesorios-unic",
          cantidadCurvas: 1,
          talles: { Unic: cantidadAccesorios },
          type: "predefined" as const,
          genero: producto?.genero,
          opcion: 1,
          precio_usd: producto?.precio_usd,
        }
      : {
          productoId: id!,
          curvaId: `predefined-${selectedPredefinedCurve}`,
          cantidadCurvas,
          talles: appliedCurveQuantities,
          type: "predefined" as const,
          genero: producto?.genero,
          opcion: selectedPredefinedCurve,
          precio_usd: producto?.precio_usd,
        };

    // Usar SupabaseCartService para agregar al carrito
    await addItem(newItem);

    setIsInCart(true);

    toast({
      title: "Agregado al pedido",
      description: "El producto fue agregado exitosamente",
    });
  };

  const handleRemoveFromCart = async () => {
    if (!id) return;

    try {
      // Use the actual stored values from the cart item to guarantee the filter matches
      const cartItem = cartItems.find(item => item.productoId === id);
      if (!cartItem) {
        setIsInCart(false);
        return;
      }

      await removeItem(id, cartItem.curvaId, cartItem.type, cartItem.opcion);

      setIsInCart(false);

      toast({
        title: "Eliminado del pedido",
        description: "El producto fue eliminado exitosamente",
      });
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
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
                  navigate(`/catalog?rubro=${rubroFromUrl}&page=${pageFromUrl}`);
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
                  navigate(`/catalog?rubro=${rubroFromUrl}&page=${pageFromUrl}`);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (rubroFromUrl) {
                navigate(`/catalog?rubro=${rubroFromUrl}&page=${pageFromUrl}`);
              } else {
                navigate('/catalog');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Indicador de estado de guardado */}
          <CartStatus
            status={saveStatus}
            lastSyncTime={lastSyncTime}
            itemCount={totals.totalItems}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
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
              {producto?.rubro?.toLowerCase() === 'accesorios' ? (
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidadAccesorios}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCantidadAccesorios(val);
                    }}
                    onBlur={() => {
                      if (cantidadAccesorios < 1) setCantidadAccesorios(1);
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Talla única · {cantidadAccesorios} {cantidadAccesorios === 1 ? 'unidad' : 'unidades'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* Left column: curve selection + special sizes */}
                  <div className="space-y-4">
                    <Label>Curva predefinida</Label>
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
                        onBlur={() => {
                          if (cantidadCurvas === 0) setCantidadCurvas(1);
                        }}
                      />
                    </div>

                    {producto?.rubro?.toLowerCase() === 'calzados' && producto?.genero?.toLowerCase() === 'mens' && (
                      <div className="space-y-2">
                        <Label>Seleccionar Tallas Especiales</Label>
                        <div className="text-sm text-gray-600 mb-2">
                          Agregar 6 unidades de las tallas seleccionadas a tu curva predefinida
                        </div>
                        <div className="space-y-2">
                          {['13', '14', '15'].map((size) => (
                            <div key={size} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`special-${size}`}
                                checked={specialSizes[size]}
                                onChange={(e) => {
                                  setSpecialSizes({
                                    ...specialSizes,
                                    [size]: e.target.checked,
                                  });
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`special-${size}`} className="text-sm">
                                Talla {size} (+6 unidades)
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right column: quantities preview */}
                  {Object.keys(appliedCurveQuantities).length > 0 && (
                    <div className="space-y-2">
                      <Label>Vista previa de cantidades</Label>
                      <div className="space-y-1">
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
                </div>
              )}
            </div>

            {isInCart ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Producto agregado al pedido
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Puedes eliminar este producto del pedido usando el botón de abajo
                  </p>
                </div>
                <Button
                  onClick={() => setShowRemoveDialog(true)}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Eliminar del pedido
                </Button>
              </div>
            ) : (
              <Button onClick={handleAddToCart} className="w-full" size="lg">
                Agregar a pedido
              </Button>
            )}

            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desea eliminar el artículo del pedido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción quitará el artículo de tu carrito.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setShowRemoveDialog(false); handleRemoveFromCart(); }}>
                    Sí
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </div>
        {lookProductos.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">
              Completa el look
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 items-start">
              {lookProductos.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    navigate(
                      `/product/${item.id}?rubro=${rubroFromUrl || ""}&page=${pageFromUrl}`
                    )
                  }
                  className="flex-none w-40 text-left group relative"
                >
                  {checkIsInCart(item.id) && (
                    <div className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className={`aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center p-3 transition-colors ${
                    checkIsInCart(item.id) ? 'border-2 border-green-500' : 'border group-hover:border-primary'
                  }`}>
                    {item.imagen_url ? (
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                  <p className="text-sm font-semibold">USD ${item.precio_usd}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
