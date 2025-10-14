import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface CartItem {
  productoId: string;
  curvaId: string | null;
  cantidadCurvas: number;
  talles: Record<string, number>;
  type: string;
}

interface ProductoDetalle {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  categoria: string;
  genero: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productos, setProductos] = useState<Record<string, ProductoDetalle>>({});
  const [clienteInfo, setClienteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load cliente info
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("cliente_id, clientes(nombre, tier, vendedor_id, vendedores(nombre))")
      .eq("user_id", session.user.id)
      .single();

    if (userRole) {
      setClienteInfo(userRole);
    }

    const items = JSON.parse(localStorage.getItem("cartItems") || "[]");
    setCartItems(items);

    // Load product details
    const productIds = [...new Set(items.map((item: CartItem) => item.productoId))] as string[];
    if (productIds.length > 0) {
      const { data } = await supabase
        .from("productos")
        .select("id, sku, nombre, precio_usd, linea, categoria, genero")
        .in("id", productIds);

      if (data) {
        const productMap: Record<string, ProductoDetalle> = {};
        data.forEach((p: any) => {
          productMap[p.id] = p;
        });
        setProductos(productMap);
      }
    }

    setLoading(false);
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

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("cliente_id")
        .eq("user_id", session.user.id)
        .single();

      if (!userRole) return;

      // Create order
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: userRole.cliente_id,
          vendedor_id: clienteInfo?.clientes?.vendedor_id,
          total_usd: calculateTotal(),
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Create order items
      const itemsToInsert = cartItems.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.productoId,
        curva_id: item.curvaId,
        cantidad_curvas: item.cantidadCurvas,
        talles_cantidades: item.talles,
        subtotal_usd: calculateSubtotal(item),
      }));

      const { error: itemsError } = await supabase
        .from("items_pedido")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Generate Excel
      generateExcel(pedido.id);

      // Clear cart
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");

      toast({
        title: "Pedido finalizado",
        description: "Tu pedido ha sido registrado exitosamente",
      });

      navigate("/welcome");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateExcel = (pedidoId: string) => {
    const excelData = cartItems.map(item => {
      const producto = productos[item.productoId];
      const row: any = {
        "Cliente": clienteInfo?.clientes?.nombre || "",
        "Vendedor": clienteInfo?.clientes?.vendedores?.nombre || "",
        "SKU": producto.sku,
        "Producto": producto.nombre,
        "Género": producto.genero,
        "Línea": producto.linea,
        "Categoría": producto.categoria,
        "Precio Unitario USD": producto.precio_usd,
      };

      // Add size columns
      Object.entries(item.talles).forEach(([talle, cantidad]) => {
        const totalCantidad = cantidad * item.cantidadCurvas;
        row[`Talle ${talle}`] = totalCantidad;
      });

      row["Subtotal USD"] = calculateSubtotal(item);
      
      return row;
    });

    // Add total row
    excelData.push({
      "Cliente": "",
      "Vendedor": "",
      "SKU": "",
      "Producto": "TOTAL",
      "Subtotal USD": calculateTotal(),
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedido");
    
    XLSX.writeFile(wb, `Pedido_${clienteInfo?.clientes?.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRemoveItem = (index: number) => {
    const updatedCartItems = [...cartItems];
    const removedItem = updatedCartItems.splice(index, 1)[0];
    
    // Update cart array (product IDs)
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const remainingItemsForProduct = updatedCartItems.filter(
      item => item.productoId === removedItem.productoId
    );
    
    let updatedCart = cart;
    if (remainingItemsForProduct.length === 0) {
      updatedCart = cart.filter((id: string) => id !== removedItem.productoId);
    }
    
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
    
    setCartItems(updatedCartItems);
    
    toast({
      title: "Producto eliminado",
      description: "El producto fue eliminado del pedido",
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Mi Pedido</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {cartItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No hay productos en tu pedido</p>
            <Button onClick={() => navigate("/welcome")} className="mt-4">
              Volver al inicio
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Información del Cliente</h2>
              <p className="text-sm text-muted-foreground">
                {clienteInfo?.clientes?.nombre} - Vendedor: {clienteInfo?.clientes?.vendedores?.nombre}
              </p>
            </Card>

            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const producto = productos[item.productoId];
                if (!producto) return null;

                return (
                  <Card key={index} className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{producto.nombre}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {producto.sku}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold">USD ${producto.precio_usd}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm space-y-2">
                        <p className="text-muted-foreground">Talles:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(item.talles).map(([talle, cantidad]) => {
                            const total = cantidad * item.cantidadCurvas;
                            if (total === 0) return null;
                            return (
                              <div key={talle} className="flex justify-between">
                                <span>{talle}:</span>
                                <span className="font-medium">{total}</span>
                              </div>
                            );
                          })}
                        </div>
                        {item.type === "predefined" && (
                          <p className="text-muted-foreground">
                            Cantidad de curvas: {item.cantidadCurvas}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between border-t pt-4">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold">USD ${calculateSubtotal(item).toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span>USD ${calculateTotal().toFixed(2)}</span>
              </div>
            </Card>

            <Button onClick={handleFinalizarPedido} className="w-full" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Finalizar Pedido y Descargar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
