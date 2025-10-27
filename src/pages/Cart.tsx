// Cart.tsx simplificado usando useSupabaseCart
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { useSupabaseCart } from "@/hooks/useSupabaseCart";

interface CartItem {
  productoId: string;
  curvaId: string | null;
  cantidadCurvas: number;
  talles: Record<string, number>;
  type: 'predefined' | 'custom';
  genero?: string;
  opcion?: number;
  precio_usd?: number;
}

interface ProductoDetalle {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea?: string;
  categoria?: string;
  genero?: string;
  imagen_url?: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const { items: cartItems, loading: cartLoading, clearCart, removeItem } = useSupabaseCart();
  const [productos, setProductos] = useState<Record<string, ProductoDetalle>>({});
  const [clienteInfo, setClienteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [cartItems]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Load client info
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("nombre, role, cliente_id")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.cliente_id) {
        const { data: clienteData } = await supabase
          .from("clientes")
          .select("nombre, tier, vendedor_id")
          .eq("id", userRole.cliente_id)
          .single();

        setClienteInfo({
          ...userRole,
          clientes: clienteData
        });
      }

      // Load product details
      const productIds = [...new Set(cartItems.map((item: CartItem) => item.productoId))] as string[];
      if (productIds.length > 0) {
        const { data } = await supabase
          .from("productos")
          .select("id, sku, nombre, precio_usd, linea, categoria, genero, imagen_url")
          .in("id", productIds);

        if (data) {
          const productMap: Record<string, ProductoDetalle> = {};
          data.forEach((p: any) => {
            productMap[p.id] = p;
          });
          setProductos(productMap);
        }
      }

    } catch (error) {
      console.error("Error loading cart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalQuantity = (talles: Record<string, number>, cantidadCurvas: number) => {
    const baseTotal = Object.values(talles).reduce((sum, qty) => sum + qty, 0);
    return baseTotal * cantidadCurvas;
  };

  const calculateSubtotal = (item: CartItem) => {
    const producto = productos[item.productoId];
    if (!producto) return 0;
    const totalQty = calculateTotalQuantity(item.talles, item.cantidadCurvas);
    return producto.precio_usd * totalQty;
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const handleFinalizarPedido = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create order
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: clienteInfo?.cliente_id || session.user.id,
          vendedor_id: clienteInfo?.clientes?.vendedor_id || null,
          estado: "pendiente",
          total_usd: calculateTotal(),
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Create order items
      const itemsToInsert = cartItems.map((item) => ({
        pedido_id: pedido.id,
        producto_id: item.productoId,
        cantidad: calculateTotalQuantity(item.talles, item.cantidadCurvas),
        precio_unitario: productos[item.productoId]?.precio_usd || 0,
        subtotal_usd: calculateSubtotal(item),
        talles_cantidades: item.talles,
      }));

      const { error: itemsError } = await supabase
        .from("items_pedido")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Generate Excel
      generateExcel(pedido.id);

      // Clear cart
      await clearCart();

      toast({
        title: "Pedido creado",
        description: "Tu pedido ha sido creado exitosamente.",
      });

      navigate("/pedidos");

    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el pedido.",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast({
        title: "Carrito vaciado",
        description: "Todos los productos han sido eliminados del carrito.",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "No se pudo vaciar el carrito.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (index: number) => {
    try {
      const itemToRemove = cartItems[index];
      await removeItem(itemToRemove.productoId);
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del carrito.",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
  };

  const generateExcel = (pedidoId: string) => {
    const data = cartItems.map((item, index) => {
      const producto = productos[item.productoId];
      return {
        "N°": index + 1,
        "SKU": producto?.sku || "",
        "Producto": producto?.nombre || "",
        "Cantidad": calculateTotalQuantity(item.talles, item.cantidadCurvas),
        "Precio Unitario": producto?.precio_usd || 0,
        "Subtotal": calculateSubtotal(item),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedido");

    const fileName = `pedido_${pedidoId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading || cartLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/catalog")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catálogo
          </Button>
          <h1 className="text-3xl font-bold">Mi Carrito</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-6">
              Agrega productos desde el catálogo para comenzar tu pedido
            </p>
            <Button onClick={() => navigate("/catalog")}>
              Ir al Catálogo
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const producto = productos[item.productoId];
                if (!producto) return null;

                return (
                  <Card key={`${item.productoId}-${index}`} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {producto.sku}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Cantidad:</span> {calculateTotalQuantity(item.talles, item.cantidadCurvas)} unidades
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Precio unitario:</span> ${producto.precio_usd}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Subtotal:</span> ${calculateSubtotal(item).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleFinalizarPedido}
                    className="flex-1"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Finalizar Pedido
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    size="lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vaciar Carrito
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
