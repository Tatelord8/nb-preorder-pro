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
    email: "superadmin@preventa.com",
    password: "admin123"
  });

  const createSuperadmin = async () => {
    try {
      // Crear usuario usando signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: "superadmin@preventa.com",
        password: "admin123"
      });

      if (signUpError) {
        // Si el usuario ya existe, intentar login directo
        if (signUpError.message.includes("User already registered")) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: "superadmin@preventa.com",
            password: "admin123",
          });

          if (loginError) throw loginError;

          if (loginData.session) {
            // Verificar si ya tiene rol
            const { data: existingRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", loginData.session.user.id)
              .single();

            if (!existingRole) {
              // Crear rol si no existe
              await supabase
                .from("user_roles")
                .insert({
                  user_id: loginData.session.user.id,
                  role: "superadmin",
                  nombre: "Superadmin Principal"
                });
            }

            navigate("/catalog");
            return;
          }
        }
        throw signUpError;
      }

      if (signUpData.user) {
        // Confirmar email automáticamente
        await supabase.rpc('confirm_user_email' as any, {
          user_id: signUpData.user.id
        });

        // Asignar rol de superadmin
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signUpData.user.id,
            role: "superadmin",
            nombre: "Superadmin Principal"
          });

        if (roleError) throw roleError;

        toast({
          title: "Superadmin creado",
          description: "El superadmin fue creado exitosamente",
        });

        // Intentar login automático
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: "superadmin@preventa.com",
          password: "admin123",
        });

        if (loginError) throw loginError;

        if (loginData.session) {
          navigate("/catalog");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Si el usuario no existe, intentar crear superadmin
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Usuario no encontrado",
            description: "Creando superadmin automáticamente...",
          });
          await createSuperadmin();
          return;
        }
        throw error;
      }

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
          navigate("/catalog");
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
              <h1 className="text-3xl font-bold">Gestor de Preventas Optima</h1>
              <p className="text-muted-foreground">Guata Pora S.A</p>
            </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="superadmin@preventa.com"
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

      </Card>
    </div>
  );
};

export default Login;
