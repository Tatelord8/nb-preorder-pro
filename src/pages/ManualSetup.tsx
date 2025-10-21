import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ManualSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const sqlCommand = `-- Ejecuta este SQL en el SQL Editor de Supabase
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario que quieres hacer superadmin

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'superadmin')
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCommand);
      setCopied(true);
      toast({
        title: "Copiado",
        description: "Comando SQL copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">NEW BALANCE</h1>
          <p className="text-muted-foreground">Configuración manual del superadmin</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Si el método automático falló, puedes crear el superadmin manualmente siguiendo estos pasos.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Paso 1: Crear usuario en Supabase</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Ve a tu panel de Supabase</li>
              <li>Navega a Authentication → Users</li>
              <li>Haz clic en "Add user"</li>
              <li>Ingresa el email y contraseña del superadmin</li>
              <li>Haz clic en "Create user"</li>
              <li>Copia el User ID del usuario creado</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Paso 2: Ejecutar SQL</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ejecuta el siguiente comando SQL en el SQL Editor de Supabase:
            </p>
            <div className="bg-muted p-4 rounded-lg relative">
              <pre className="text-sm overflow-x-auto">{sqlCommand}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reemplaza 'USER_ID_AQUI' con el User ID que copiaste en el paso anterior.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Paso 3: Verificar</h3>
            <p className="text-sm text-muted-foreground">
              Una vez ejecutado el SQL, regresa a la aplicación y verifica que puedas iniciar sesión como superadmin.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={() => navigate("/setup")} variant="outline">
            Volver al Setup Automático
          </Button>
          <Button onClick={() => navigate("/auth")}>
            Ir al Login
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Si necesitas ayuda, consulta la documentación de Supabase:</p>
          <a 
            href="https://supabase.com/docs/guides/auth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Documentación de Supabase Auth
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Card>
    </div>
  );
};

export default ManualSetup;
