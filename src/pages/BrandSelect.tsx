import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Marca {
  id: string;
  nombre: string;
  logo_url?: string | null;
  color_primario?: string | null;
}

const BrandSelect = () => {
  const navigate = useNavigate();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRoleAndLoad();
  }, []);

  const checkRoleAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (userRole?.role !== "cliente") {
      navigate("/catalog");
      return;
    }

    const { data } = await supabase
      .from("marcas")
      .select("id, nombre, logo_url, color_primario")
      .eq("activa", true)
      .order("nombre");

    setMarcas(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Selecciona una marca</h1>
          <p className="text-muted-foreground">Elige la marca que deseas explorar en este catálogo</p>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {marcas.map((marca) => (
            <button
              key={marca.id}
              onClick={() => navigate(`/catalog?marca=${marca.id}`)}
              className="group flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl border-2 border-transparent hover:border-black shadow-sm hover:shadow-md transition-all w-40 h-40"
            >
              {marca.logo_url ? (
                <img
                  src={marca.logo_url}
                  alt={marca.nombre}
                  className="h-16 w-full object-contain"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {marca.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm text-center leading-tight">{marca.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandSelect;
