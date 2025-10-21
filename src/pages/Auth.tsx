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
  const [setupComplete, setSetupComplete] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user role to redirect accordingly
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (userRole?.role === "superadmin") {
          navigate("/dashboard");
        } else {
          navigate("/catalog");
        }
      }
    };

    // Check if superadmin exists
    const checkSuperadmin = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "superadmin")
        .limit(1);

      if (error) {
        console.error("Error checking superadmin:", error);
        // Continue with normal flow if there's an error
        setSetupComplete(true);
        return;
      }

      if (!data || data.length === 0) {
        setSetupComplete(false);
        // Show a brief message before redirecting
        toast({
          title: "Configuración requerida",
          description: "No se encontró un superadmin. Redirigiendo a la configuración...",
        });
        setTimeout(() => {
          navigate("/setup");
        }, 1500);
        return;
      }

      setSetupComplete(true);
    };

    checkSuperadmin();
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
        // Get user role to redirect accordingly
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.session.user.id)
          .single();

        toast({
          title: "Bienvenido",
          description: "Acceso exitoso",
        });

        // Redirect based on role
        if (userRole?.role === "superadmin") {
          navigate("/dashboard");
        } else {
          navigate("/catalog");
        }
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
          {setupComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-green-800">
                ✅ Sistema configurado correctamente. Puedes iniciar sesión.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                ⚙️ Configurando sistema... Redirigiendo a la configuración inicial.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecciona tu cliente</label>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[100] max-h-[300px] overflow-y-auto" position="popper" sideOffset={5}>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id} className="cursor-pointer">
                    {cliente.nombre}
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
