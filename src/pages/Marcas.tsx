import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Marca {
  id: string;
  nombre: string;
  descripcion?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  activa: boolean;
  created_at: string;
}

const Marcas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    logo_url: "",
    color_primario: "#000000",
    color_secundario: "#ffffff",
    activa: true,
  });

  useEffect(() => {
    checkAuth();
    loadMarcas();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is superadmin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "superadmin")
      .single();

    if (!userRole) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos de superadmin",
        variant: "destructive",
      });
      navigate("/catalog");
      return;
    }

    setLoading(false);
  };

  const loadMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from("marcas" as any)
        .select("*")
        .order("nombre");

      if (error) {
        console.error("Error loading marcas:", error);
        setMarcas([]);
        return;
      }

      setMarcas((data as any) || []);
    } catch (error) {
      console.error("Error loading marcas:", error);
      setMarcas([]);
    }
  };

  const handleCreateMarca = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("marcas" as any)
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          logo_url: formData.logo_url || null,
          color_primario: formData.color_primario,
          color_secundario: formData.color_secundario,
          activa: formData.activa,
        });

      if (error) throw error;

      toast({
        title: "Marca creada",
        description: "La marca fue creada exitosamente",
      });

      resetForm();
      loadMarcas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateMarca = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMarca) return;

    try {
      const { error } = await supabase
        .from("marcas" as any)
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          logo_url: formData.logo_url || null,
          color_primario: formData.color_primario,
          color_secundario: formData.color_secundario,
          activa: formData.activa,
        })
        .eq("id", editingMarca.id);

      if (error) throw error;

      toast({
        title: "Marca actualizada",
        description: "La marca fue actualizada exitosamente",
      });

      resetForm();
      loadMarcas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMarca = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta marca?")) return;

    try {
      const { error } = await supabase
        .from("marcas" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Marca eliminada",
        description: "La marca fue eliminada exitosamente",
      });

      loadMarcas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditMarca = (marca: Marca) => {
    setEditingMarca(marca);
    setFormData({
      nombre: marca.nombre,
      descripcion: marca.descripcion || "",
      logo_url: marca.logo_url || "",
      color_primario: marca.color_primario || "#000000",
      color_secundario: marca.color_secundario || "#ffffff",
      activa: marca.activa,
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      logo_url: "",
      color_primario: "#000000",
      color_secundario: "#ffffff",
      activa: true,
    });
    setEditingMarca(null);
    setShowCreateForm(false);
  };

  const filteredMarcas = marcas.filter(marca =>
    marca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (marca.descripcion && marca.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gestión de Marcas</h1>
              <p className="text-muted-foreground">Administra las marcas del sistema</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Marca
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar marcas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Colores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarcas.map((marca) => (
                <TableRow key={marca.id}>
                  <TableCell>
                    {marca.logo_url ? (
                      <img 
                        src={marca.logo_url} 
                        alt={marca.nombre}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <Tag className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{marca.nombre}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {marca.descripcion || "Sin descripción"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: marca.color_primario }}
                        title="Color primario"
                      />
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: marca.color_secundario }}
                        title="Color secundario"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      marca.activa 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {marca.activa ? "Activa" : "Inactiva"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(marca.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditMarca(marca)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteMarca(marca.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Create/Edit Marca Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingMarca ? "Editar Marca" : "Crear Nueva Marca"}
              </h2>
              <form onSubmit={editingMarca ? handleUpdateMarca : handleCreateMarca} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color_primario">Color Primario</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color_primario"
                        type="color"
                        value={formData.color_primario}
                        onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={formData.color_primario}
                        onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color_secundario">Color Secundario</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color_secundario"
                        type="color"
                        value={formData.color_secundario}
                        onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={formData.color_secundario}
                        onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="activa">Marca activa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMarca ? "Actualizar" : "Crear"} Marca
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marcas;
