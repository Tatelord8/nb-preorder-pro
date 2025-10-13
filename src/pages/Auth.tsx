import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Cliente {
  id: string;
  nombre: string;
  tier: string;
}

const Auth = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/welcome");
      }
    };
    checkSession();

    loadClientes();
  }, [navigate]);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, tier")
      .order("nombre");

    if (error) {
      console.error("Error loading clientes:", error);
      return;
    }

    setClientes(data || []);
  };

  const handleLogin = async () => {
    if (!selectedCliente) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // For demo purposes, we'll create a temporary email based on cliente ID
      const email = `${selectedCliente}@newbalance.local`;
      const password = selectedCliente; // In production, this should be more secure

      // Try to sign in first
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user doesn't exist, create them
      if (signInError?.message?.includes("Invalid")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/welcome`,
          },
        });

        if (signUpError) throw signUpError;
        
        // Create user role
        if (signUpData.user) {
          await supabase.from("user_roles").insert({
            user_id: signUpData.user.id,
            role: "cliente",
            cliente_id: selectedCliente,
          });
        }

        signInData = signUpData;
      }

      if (signInData.session) {
        toast({
          title: "Bienvenido",
          description: "Acceso exitoso",
        });
        navigate("/welcome");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">NEW BALANCE</h1>
          <p className="text-muted-foreground">Pre Line S1 26</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecciona tu cliente</label>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre} (Tier {cliente.tier})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleLogin} 
            disabled={loading || !selectedCliente}
            className="w-full"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
