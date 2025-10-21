import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Users as UsersIcon, 
  UserCheck, 
  UserX,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  clientes?: {
    nombre: string;
    tier: string;
  };
  marcas?: {
    nombre: string;
  };
}

interface Marca {
  id: string;
  nombre: string;
  descripcion?: string;
}

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "cliente",
    cliente_id: "",
    marca_id: "",
  });

  useEffect(() => {
    checkAuth();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      // Usar función SQL para obtener usuarios
      const { data, error } = await supabase.rpc('get_users_with_roles' as any);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
        return;
      }

      // Obtener información adicional de clientes y marcas
      const usersWithDetails = await Promise.all(
        ((data as any[]) || []).map(async (user: any) => {
          let clienteInfo = null;
          let marcaInfo = null;

          if (user.cliente_id) {
            const { data: cliente } = await supabase
              .from("clientes")
              .select("nombre, tier")
              .eq("id", user.cliente_id)
              .single();
            clienteInfo = cliente;
          }

          if (user.marca_id) {
            const { data: marca } = await supabase
              .from("marcas")
              .select("nombre")
              .eq("id", user.marca_id)
              .single();
            marcaInfo = marca;
          }

          return {
            ...user,
            clientes: clienteInfo,
            marcas: marcaInfo
          };
        })
      );

      setUsers(usersWithDetails as any);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Usar función SQL para crear usuario
      const { data, error } = await supabase.rpc('create_user_with_role' as any, {
        user_email: formData.email,
        user_password: formData.password,
        user_role: formData.role,
        cliente_id: formData.role === "cliente" ? formData.cliente_id : null,
        marca_id: formData.role === "admin" ? formData.marca_id : null,
      });

      if (error) throw error;

      toast({
        title: "Usuario creado",
        description: "El usuario fue creado exitosamente",
      });

      // Reset form and reload
      setFormData({
        email: "",
        password: "",
        role: "cliente",
        cliente_id: "",
        marca_id: "",
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      // Delete user role first
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast({
        title: "Usuario eliminado",
        description: "El usuario fue eliminado exitosamente",
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const variants = {
      superadmin: "destructive",
      admin: "default",
      cliente: "secondary"
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"}>
        {role.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Administra usuarios del sistema</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="marcas">Marcas</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Asignación</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.role === "cliente" && user.clientes && (
                          <div>
                            <div className="font-medium">{user.clientes.nombre}</div>
                            <div className="text-sm text-muted-foreground">Tier {user.clientes.tier}</div>
                          </div>
                        )}
                        {user.role === "admin" && user.marcas && (
                          <div className="font-medium">{user.marcas.nombre}</div>
                        )}
                        {user.role === "admin" && !user.marcas && (
                          <div className="text-muted-foreground">Sin marca asignada</div>
                        )}
                        {user.role === "superadmin" && (
                          <div className="text-muted-foreground">Acceso completo</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteUser(user.user_id)}
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
          </TabsContent>

          <TabsContent value="marcas">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Gestión de Marcas</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Marca
                </Button>
              </div>
              <p className="text-muted-foreground">Funcionalidad de marcas en desarrollo...</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Crear Nuevo Usuario</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "cliente" && (
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente</Label>
                    <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Load clientes here */}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="marca_id">Marca</Label>
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
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Usuario</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Users;
