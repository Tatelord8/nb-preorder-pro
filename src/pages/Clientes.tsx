import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  Users,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  tier: string;
  vendedor_id: string;
  marca_id: string;
  created_at?: string;
  vendedores?: {
    id: string;
    nombre: string;
  };
  marcas?: {
    id: string;
    nombre: string;
  };
}

interface Vendedor {
  id: string;
  nombre: string;
  email: string;
}

interface Marca {
  id: string;
  nombre: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVendedor, setFilterVendedor] = useState("all");
  const [filterMarca, setFilterMarca] = useState("all");
  
  // Estados para formularios
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  
  // Estados para carga masiva
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para eliminar todo
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    tier: "",
    vendedor_id: "",
    marca_id: ""
  });

  useEffect(() => {
    loadClientes();
    loadVendedores();
    loadMarcas();
  }, []);

  const loadClientes = async () => {
    try {
      console.log("🔄 Loading clientes from database...");
      
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("❌ Error loading clientes:", error);
        toast({
          title: "Error de base de datos",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Clientes loaded successfully:", data?.length || 0);
      
      // Cargar todas las relaciones de una vez
      const clientesWithRelations = await Promise.all((data || []).map(async (cliente) => {
        const [vendedorResult, marcaResult] = await Promise.all([
          cliente.vendedor_id ? supabase
            .from("vendedores")
            .select("id, nombre")
            .eq("id", cliente.vendedor_id)
            .single() : Promise.resolve({ data: null }),
          cliente.marca_id ? supabase
            .from("marcas")
            .select("id, nombre")
            .eq("id", cliente.marca_id)
            .single() : Promise.resolve({ data: null })
        ]);
        
        return {
          ...cliente,
          vendedores: vendedorResult.data,
          marcas: marcaResult.data
        };
      }));
      
      setClientes(clientesWithRelations);
    } catch (error) {
      console.error("❌ Error loading clientes:", error);
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from("vendedores")
        .select("id, nombre, email")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error loading vendedores:", error);
        return;
      }

      setVendedores(data || []);
    } catch (error) {
      console.error("Error loading vendedores:", error);
    }
  };

  const loadMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from("marcas")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error loading marcas:", error);
        return;
      }

      setMarcas(data || []);
    } catch (error) {
      console.error("Error loading marcas:", error);
    }
  };

  const handleCreateCliente = async () => {
    try {
      const clienteData: any = {
        nombre: formData.nombre,
        tier: formData.tier,
        vendedor_id: formData.vendedor_id,
        marca_id: formData.marca_id
      };

      const { data, error } = await supabase
        .from("clientes")
        .insert(clienteData)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear el cliente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente creado",
        description: "El cliente fue creado exitosamente",
      });

      setShowCreateDialog(false);
      setFormData({ nombre: "", tier: "", vendedor_id: "", marca_id: "" });
      loadClientes();
    } catch (error) {
      console.error("Error creating cliente:", error);
      toast({
        title: "Error",
        description: "Error al crear el cliente",
        variant: "destructive",
      });
    }
  };

  const handleEditCliente = async () => {
    if (!editingCliente) return;

    try {
      const clienteData: any = {
        nombre: formData.nombre,
        tier: formData.tier,
        vendedor_id: formData.vendedor_id,
        marca_id: formData.marca_id
      };

      const { error } = await supabase
        .from("clientes")
        .update(clienteData)
        .eq("id", editingCliente.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el cliente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente actualizado",
        description: "El cliente fue actualizado exitosamente",
      });

      setShowEditDialog(false);
      setEditingCliente(null);
      setFormData({ nombre: "", tier: "", vendedor_id: "", marca_id: "" });
      loadClientes();
    } catch (error) {
      console.error("Error updating cliente:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCliente = async () => {
    if (!deletingCliente) return;

    try {
      console.log("🔄 Deleting cliente:", deletingCliente.id);
      
      const { data, error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", deletingCliente.id)
        .select();

      if (error) {
        console.error("❌ Error deleting cliente:", error);
        toast({
          title: "Error",
          description: `No se pudo eliminar el cliente: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Cliente deleted successfully:", data);
      
      toast({
        title: "Cliente eliminado",
        description: `El cliente "${deletingCliente.nombre}" fue eliminado exitosamente`,
      });

      setShowDeleteDialog(false);
      setDeletingCliente(null);
      
      // Recargar la lista de clientes
      await loadClientes();
    } catch (error) {
      console.error("❌ Error deleting cliente:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllClientes = async () => {
    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron eliminar todos los clientes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Todos los clientes eliminados",
        description: "Se eliminaron todos los clientes exitosamente",
      });

      setShowDeleteAllDialog(false);
      loadClientes();
    } catch (error) {
      console.error("Error deleting all clientes:", error);
      toast({
        title: "Error",
        description: "Error al eliminar todos los clientes",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      tier: cliente.tier,
      vendedor_id: cliente.vendedor_id,
      marca_id: cliente.marca_id
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (cliente: Cliente) => {
    setDeletingCliente(cliente);
    setShowDeleteDialog(true);
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      "premium": "bg-purple-100 text-purple-800",
      "standard": "bg-blue-100 text-blue-800",
      "basic": "bg-green-100 text-green-800",
      "1": "bg-purple-100 text-purple-800",
      "2": "bg-blue-100 text-blue-800",
      "3": "bg-green-100 text-green-800",
      "4": "bg-orange-100 text-orange-800"
    };
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        Tier {tier}
      </Badge>
    );
  };

  // Funciones para carga masiva
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadResults(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const downloadTemplate = () => {
    const headers = ["Nombre", "Tier", "Vendedor", "Marca"];
    const sampleData = [
      ["Cliente Premium", "premium", "Vendedor Principal", "New Balance"],
      ["Cliente Standard", "standard", "Vendedor Secundario", "CAT"],
      ["Cliente Basic", "basic", "Vendedor Principal", "New Balance"]
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla-carga-clientes.csv";
    link.click();
  };

  const processExcelFile = async (file: File) => {
    return new Promise<{ clientes: any[], errors: string[] }>((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            resolve({ clientes: [], errors: ['El archivo debe tener al menos una fila de encabezados y una fila de datos'] });
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const clientes = [];
          const errors = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            try {
              const values = parseCSVLine(line);
              const cliente: any = {};
              
              headers.forEach((header, index) => {
                const value = values[index] ? values[index].trim() : '';
                
                if (header.toLowerCase().includes('nombre')) cliente.nombre = value;
                else if (header.toLowerCase().includes('tier')) cliente.tier = value;
                else if (header.toLowerCase().includes('vendedor')) cliente.vendedor = value;
                else if (header.toLowerCase().includes('marca')) cliente.marca = value;
              });
              
              // Validar campos requeridos
              if (!cliente.nombre) {
                errors.push(`Fila ${i + 1}: Nombre es requerido`);
                continue;
              }
              
              if (!cliente.tier) {
                errors.push(`Fila ${i + 1}: Tier es requerido`);
                continue;
              }
              
              if (!cliente.vendedor) {
                errors.push(`Fila ${i + 1}: Vendedor es requerido`);
                continue;
              }
              
              if (!cliente.marca) {
                errors.push(`Fila ${i + 1}: Marca es requerida`);
                continue;
              }
              
              // Validar tier
              const tiersValidos = ['0', '1', '2', '3'];
              if (!tiersValidos.includes(cliente.tier)) {
                errors.push(`Fila ${i + 1}: Tier debe ser uno de: ${tiersValidos.join(', ')}`);
                continue;
              }
              
              clientes.push(cliente);
            } catch (lineError) {
              errors.push(`Fila ${i + 1}: Error procesando línea - ${(lineError as Error).message}`);
            }
          }
          
          resolve({ clientes, errors });
        } catch (error) {
          resolve({ clientes: [], errors: [`Error al procesar el archivo: ${(error as Error).message}`] });
        }
      };
      
      reader.readAsText(file);
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleMassUpload = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);
    
    try {
      const { clientes, errors } = await processExcelFile(uploadedFile);
      
      let successCount = 0;
      const uploadErrors = [...errors];
      
      for (let i = 0; i < clientes.length; i++) {
        try {
          const cliente = clientes[i];
          
          // Buscar vendedor por nombre
          let vendedorId = null;
          if (cliente.vendedor) {
            const vendedor = vendedores.find(v => v.nombre.toLowerCase() === cliente.vendedor.toLowerCase());
            if (vendedor) {
              vendedorId = vendedor.id;
            } else {
              uploadErrors.push(`Cliente ${cliente.nombre}: Vendedor "${cliente.vendedor}" no encontrado`);
              continue;
            }
          }
          
          // Buscar marca por nombre
          let marcaId = null;
          if (cliente.marca) {
            const marca = marcas.find(m => m.nombre.toLowerCase() === cliente.marca.toLowerCase());
            if (marca) {
              marcaId = marca.id;
            } else {
              uploadErrors.push(`Cliente ${cliente.nombre}: Marca "${cliente.marca}" no encontrada`);
              continue;
            }
          }
          
          const clienteData: any = {
            nombre: cliente.nombre,
            tier: cliente.tier.toLowerCase(),
            vendedor_id: vendedorId,
            marca_id: marcaId
          };
          
          const { error } = await supabase
            .from("clientes")
            .insert(clienteData);
          
          if (error) {
            uploadErrors.push(`Cliente ${cliente.nombre}: ${error.message}`);
            continue;
          }
          
          successCount++;
          setUploadProgress((i + 1) / clientes.length * 100);
        } catch (error) {
          uploadErrors.push(`Cliente ${clientes[i].nombre}: ${(error as Error).message}`);
        }
      }
      
      setUploadResults({
        success: successCount,
        errors: uploadErrors
      });
      
      if (successCount > 0) {
        toast({
          title: "Carga masiva completada",
          description: `${successCount} clientes creados exitosamente`,
        });
        loadClientes();
      }
      
    } catch (error) {
      console.error("Error in mass upload:", error);
      toast({
        title: "Error en carga masiva",
        description: "Error al procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.tier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendedor = filterVendedor === "all" || cliente.vendedor_id === filterVendedor;
    const matchesMarca = filterMarca === "all" || cliente.marca_id === filterMarca;
    return matchesSearch && matchesVendedor && matchesMarca;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">Gestión de Clientes</h1>
        <p className="text-muted-foreground">
          Aquí podrás gestionar los clientes del sistema.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lista de Clientes
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Carga Masiva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filterVendedor} onValueChange={setFilterVendedor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos los Vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Vendedores</SelectItem>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterMarca} onValueChange={setFilterMarca}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas las Marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Marcas</SelectItem>
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
                
                <Button 
                  onClick={() => setShowDeleteAllDialog(true)}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Todo
                </Button>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                      <DialogDescription>
                        Completa los datos del nuevo cliente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          placeholder="Nombre del cliente"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tier">Tier</Label>
                        <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="1">Tier 1</SelectItem>
                            <SelectItem value="2">Tier 2</SelectItem>
                            <SelectItem value="3">Tier 3</SelectItem>
                            <SelectItem value="4">Tier 4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="vendedor">Vendedor</Label>
                        <Select value={formData.vendedor_id} onValueChange={(value) => setFormData({ ...formData, vendedor_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar vendedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendedores.map((vendedor) => (
                              <SelectItem key={vendedor.id} value={vendedor.id}>
                                {vendedor.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marca">Marca</Label>
                        <Select value={formData.marca_id} onValueChange={(value) => setFormData({ ...formData, marca_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {marcas.map((marca) => (
                              <SelectItem key={marca.id} value={marca.id}>
                                {marca.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateCliente}>
                        Crear Cliente
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell>{getTierBadge(cliente.tier)}</TableCell>
                      <TableCell>
                        {cliente.vendedores ? (cliente.vendedores as any).nombre : "Sin vendedor"}
                      </TableCell>
                      <TableCell>
                        {cliente.marcas ? (cliente.marcas as any).nombre : "Sin marca"}
                      </TableCell>
                      <TableCell>
                        {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(cliente)}
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

            {filteredClientes.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "No hay clientes registrados"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Carga Masiva de Clientes</h3>
                
                {!uploadedFile ? (
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Arrastra tu archivo CSV aquí</h3>
                    <p className="text-muted-foreground mb-4">O haz clic para seleccionar un archivo</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Formato soportado: .csv (máximo 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null);
                          setUploadResults(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>

                    {!isUploading && !uploadResults && (
                      <div className="flex gap-2">
                        <Button onClick={handleMassUpload} className="flex-1">
                          <Upload className="h-4 w-4 mr-2" />
                          Procesar Archivo
                        </Button>
                        <Button onClick={downloadTemplate} variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Plantilla
                        </Button>
                      </div>
                    )}

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Procesando archivo...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadResults && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">{uploadResults.success} clientes creados</span>
                          </div>
                          {uploadResults.errors.length > 0 && (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-5 w-5" />
                              <span className="font-medium">{uploadResults.errors.length} errores</span>
                            </div>
                          )}
                        </div>

                        {uploadResults.errors.length > 0 && (
                          <div className="max-h-48 overflow-y-auto">
                            <h4 className="font-medium mb-2">Errores encontrados:</h4>
                            <div className="space-y-1">
                              {uploadResults.errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                  {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadResults(null);
                          }}
                          className="w-full"
                        >
                          Cargar Otro Archivo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para editar cliente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Tier</Label>
              <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-vendedor">Vendedor</Label>
              <Select value={formData.vendedor_id} onValueChange={(value) => setFormData({ ...formData, vendedor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-marca">Marca</Label>
              <Select value={formData.marca_id} onValueChange={(value) => setFormData({ ...formData, marca_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCliente}>
              Actualizar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar cliente */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el cliente "{deletingCliente?.nombre}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCliente}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para eliminar todos los clientes */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará TODOS los clientes de la base de datos. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllClientes}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clientes;
