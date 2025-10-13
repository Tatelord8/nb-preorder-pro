import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shirt, LogOut } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const [clienteName, setClienteName] = useState("");

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
        </div>
      </main>
    </div>
  );
};

export default Welcome;
