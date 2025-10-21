import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSuperadmin, checkSuperadminExists } from "@/utils/createSuperadmin";
import { createSuperadminDirect } from "@/utils/createSuperadminSQL";

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [superadminExists, setSuperadminExists] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const { exists, error } = await checkSuperadminExists();
      if (error) {
        console.error("Error checking superadmin:", error);
        // Continue with setup if there's an error
        setSuperadminExists(false);
        setChecking(false);
        return;
      }

      setSuperadminExists(exists);
      if (exists) {
        // Redirect to login if superadmin already exists
        toast({
          title: "Superadmin ya existe",
          description: "El superadmin ya está configurado. Redirigiendo al login...",
        });
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking setup:", error);
      setSuperadminExists(false);
    } finally {
      setChecking(false);
    }
  };

  const handleCreateSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Try the direct method first
      let result = await createSuperadminDirect(formData.email, formData.password);
      
      // If direct method fails, try the original method
      if (!result.success) {
        result = await createSuperadmin(formData.email, formData.password);
      }

      if (result.success) {
        toast({
          title: "Superadmin creado",
          description: "El superadmin fue creado exitosamente. Ahora puedes iniciar sesión.",
        });
        // Wait a moment before redirecting
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el superadmin",
          variant: "destructive",
        });
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando configuración del sistema...</p>
        </div>
      </div>
    );
  }

  if (superadminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sistema ya configurado</h1>
          <p className="text-muted-foreground mb-4">El superadmin ya existe en el sistema</p>
          <Button onClick={() => navigate("/auth")}>
            Ir al Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">NEW BALANCE</h1>
          <p className="text-muted-foreground">Configuración inicial del sistema</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta es la configuración inicial. Crea el primer superadmin para comenzar a usar el sistema.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleCreateSuperadmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del Superadmin</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@newbalance.com"
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
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repetir contraseña"
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
                Creando Superadmin...
              </>
            ) : (
              "Crear Superadmin"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Una vez creado el superadmin, podrás:</p>
          <ul className="mt-2 space-y-1">
            <li>• Gestionar usuarios del sistema</li>
            <li>• Crear y administrar marcas</li>
            <li>• Configurar productos y pedidos</li>
            <li>• Acceder a reportes ejecutivos</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate("/manual-setup")}
            className="text-sm"
          >
            ¿El método automático no funciona? Usa la configuración manual
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Setup;
