import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "superadmin@newbalance.com",
    password: "admin123"
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        // Get user role to redirect accordingly
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
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
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">NEW BALANCE</h1>
          <p className="text-muted-foreground">Sistema de Pre-órdenes</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-green-800">
              ✅ Superadmin creado. Usa las credenciales pre-configuradas.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="superadmin@newbalance.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="admin123"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Credenciales pre-configuradas:</p>
          <p className="font-mono text-xs mt-2">
            Email: superadmin@newbalance.com<br />
            Contraseña: admin123
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
