import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cliente form state
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTier, setClienteTier] = useState("A");
  const [clienteVendedor, setClienteVendedor] = useState("");
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Producto form state
  const [productoSku, setProductoSku] = useState("");
  const [productoNombre, setProductoNombre] = useState("");
  const [productoPrecio, setProductoPrecio] = useState("");
  const [productoLinea, setProductoLinea] = useState("");
  const [productoCategoria, setProductoCategoria] = useState("");
  const [productoGenero, setProductoGenero] = useState("Hombre");
  const [productoTier, setProductoTier] = useState("A");
  const [productoGamePlan, setProductoGamePlan] = useState(false);
  const [productoImagen, setProductoImagen] = useState("");

  useEffect(() => {
    checkAdmin();
    loadVendedores();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos de administrador",
        variant: "destructive",
      });
      navigate("/welcome");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const loadVendedores = async () => {
    const { data } = await supabase
      .from("vendedores")
      .select("*")
      .order("nombre");

    if (data) {
      setVendedores(data);
    }
  };

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("clientes")
      .insert({
        nombre: clienteNombre,
        tier: clienteTier,
        vendedor_id: clienteVendedor || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cliente creado",
      description: "El cliente fue creado exitosamente",
    });

    // Reset form
    setClienteNombre("");
    setClienteTier("A");
    setClienteVendedor("");
  };

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("productos")
      .insert({
        sku: productoSku,
        nombre: productoNombre,
        precio_usd: parseFloat(productoPrecio),
        linea: productoLinea,
        categoria: productoCategoria,
        genero: productoGenero,
        tier: productoTier,
        game_plan: productoGamePlan,
        imagen_url: productoImagen || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Producto creado",
      description: "El producto fue creado exitosamente",
    });

    // Reset form
    setProductoSku("");
    setProductoNombre("");
    setProductoPrecio("");
    setProductoLinea("");
    setProductoCategoria("");
    setProductoGenero("Hombre");
    setProductoTier("A");
    setProductoGamePlan(false);
    setProductoImagen("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"></div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Crear Cliente</h2>
              <form onSubmit={handleCreateCliente} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteNombre">Nombre del Cliente</Label>
                  <Input
                    id="clienteNombre"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteTier">Tier</Label>
                  <Select value={clienteTier} onValueChange={setClienteTier}>
                    <SelectTrigger id="clienteTier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="A">Tier A</SelectItem>
                      <SelectItem value="B">Tier B</SelectItem>
                      <SelectItem value="C">Tier C</SelectItem>
                      <SelectItem value="D">Tier D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clienteVendedor">Vendedor</Label>
                  <Select value={clienteVendedor} onValueChange={setClienteVendedor}>
                    <SelectTrigger id="clienteVendedor">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">Crear Cliente</Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="productos">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Crear Producto</h2>
              <form onSubmit={handleCreateProducto} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productoSku">SKU</Label>
                    <Input
                      id="productoSku"
                      value={productoSku}
                      onChange={(e) => setProductoSku(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoNombre">Nombre</Label>
                    <Input
                      id="productoNombre"
                      value={productoNombre}
                      onChange={(e) => setProductoNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoPrecio">Precio USD</Label>
                    <Input
                      id="productoPrecio"
                      type="number"
                      step="0.01"
                      value={productoPrecio}
                      onChange={(e) => setProductoPrecio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoLinea">Línea</Label>
                    <Input
                      id="productoLinea"
                      value={productoLinea}
                      onChange={(e) => setProductoLinea(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoCategoria">Categoría</Label>
                    <Input
                      id="productoCategoria"
                      value={productoCategoria}
                      onChange={(e) => setProductoCategoria(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoGenero">Género</Label>
                    <Select value={productoGenero} onValueChange={setProductoGenero}>
                      <SelectTrigger id="productoGenero">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Hombre">Hombre</SelectItem>
                        <SelectItem value="Mujer">Mujer</SelectItem>
                        <SelectItem value="Unisex">Unisex</SelectItem>
                        <SelectItem value="Niño">Niño</SelectItem>
                        <SelectItem value="Niña">Niña</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productoTier">Tier</Label>
                    <Select value={productoTier} onValueChange={setProductoTier}>
                      <SelectTrigger id="productoTier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="A">Tier A</SelectItem>
                        <SelectItem value="B">Tier B</SelectItem>
                        <SelectItem value="C">Tier C</SelectItem>
                        <SelectItem value="D">Tier D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <input
                      type="checkbox"
                      id="productoGamePlan"
                      checked={productoGamePlan}
                      onChange={(e) => setProductoGamePlan(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="productoGamePlan">Game Plan</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productoImagen">URL de Imagen</Label>
                  <Input
                    id="productoImagen"
                    value={productoImagen}
                    onChange={(e) => setProductoImagen(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <Button type="submit" className="w-full">Crear Producto</Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
