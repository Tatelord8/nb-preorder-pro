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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  nombre?: string;
  tier_id?: number;
  tier_nombre?: string;
  marca_id?: string;
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

interface Tier {
  id: number;
  numero: number;
  nombre: string;
  descripcion?: string;
}

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    role: "cliente",
    tier_id: "none",
    marca_id: "none",
  });

  useEffect(() => {
    checkAuth();
    loadUsers();
    loadMarcas();
    loadTiers();
  }, []);

  // Reset form when create form is opened
  useEffect(() => {
    if (showCreateForm) {
      setFormData({
        email: "",
        password: "",
        nombre: "",
        role: "cliente",
        tier_id: "none",
        marca_id: "none",
      });
    }
  }, [showCreateForm]);

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
          console.log("🔍 Processing user:", user.email, "tier_id:", user.tier_id);
          
          let clienteInfo = null;
          let marcaInfo = null;
          let tierNombre = null;

          // Obtener nombre del tier si existe tier_id
          if (user.tier_id !== null && user.tier_id !== undefined) {
            console.log("🔍 Looking up tier_id:", user.tier_id);
            const { data: tierData, error: tierError } = await supabase
              .from("tiers")
              .select("numero, nombre")
              .eq("numero", user.tier_id)
              .single();
            
            if (tierError) {
              console.error("❌ Error fetching tier:", tierError);
            } else {
              console.log("✅ Tier found:", tierData);
              tierNombre = tierData?.nombre || null;
            }
          }

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
            tier_nombre: tierNombre,
            clientes: clienteInfo,
            marcas: marcaInfo
          };
        })
      );

      console.log("🔍 Final users with details:", usersWithDetails);
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

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("tiers" as any)
        .select("*")
        .order("numero");

      if (error) {
        console.error("Error loading tiers:", error);
        setTiers([]);
        return;
      }

      setTiers((data as any) || []);
    } catch (error) {
      console.error("Error loading tiers:", error);
      setTiers([]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.nombre || formData.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    // Solo validar tier_id si el rol no es admin o superadmin
    if ((formData.role !== "admin" && formData.role !== "superadmin") && (!formData.tier_id || formData.tier_id === "" || formData.tier_id === "none")) {
      toast({
        title: "Error",
        description: "Debes seleccionar un tier para este tipo de usuario",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determinar tier_id según el rol
      let tierId = null;
      if (formData.role !== "admin" && formData.role !== "superadmin" && formData.tier_id && formData.tier_id !== "none") {
        tierId = parseInt(formData.tier_id);
      }

      // Determinar marca_id según la selección
      let marcaId = null;
      if (formData.marca_id && formData.marca_id !== "none") {
        marcaId = formData.marca_id;
      }

      // Usar función SQL para crear usuario
      const { data, error } = await supabase.rpc('create_user_with_role' as any, {
        user_email: formData.email,
        user_password: formData.password,
        user_role: formData.role,
        user_nombre: formData.nombre,
        user_tier_id: tierId,
        user_cliente_id: null,
        user_marca_id: marcaId,
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
        nombre: "",
        role: "cliente",
        tier_id: "none",
        marca_id: "none",
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

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "", // No pre-llenar contraseña por seguridad
      nombre: user.nombre || "",
      role: user.role,
      tier_id: user.tier_id?.toString() || "none",
      marca_id: user.marca_id?.toString() || "none",
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    console.log("🔄 Updating user:", editingUser.user_id);
    console.log("📝 Form data:", formData);

    // Validar campos requeridos
    if (!formData.nombre || formData.nombre.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      // Actualizar información del usuario en user_roles
      const updateData: any = {
        nombre: formData.nombre,
        role: formData.role,
      };

      // Manejar tier_id según el rol
      if (formData.role === "admin" || formData.role === "superadmin") {
        // Los administradores y superadministradores no tienen tier
        updateData.tier_id = null;
      } else if (formData.tier_id && formData.tier_id !== "none") {
        // Solo incluir tier_id si es diferente de "none" para otros roles
        // tier_id debe ser el número del tier, no el UUID
        const tierNumber = parseInt(formData.tier_id);
        updateData.tier_id = isNaN(tierNumber) ? null : tierNumber;
        console.log("🔍 Tier ID conversion:", formData.tier_id, "->", updateData.tier_id);
      } else {
        // Si es "none" o vacío, establecer como null
        updateData.tier_id = null;
      }

      // Manejar marca_id según la selección
      if (formData.marca_id && formData.marca_id !== "none") {
        updateData.marca_id = formData.marca_id;
      } else {
        updateData.marca_id = null;
      }

      console.log("📤 Update data:", updateData);
      console.log("🔍 Editing user ID:", editingUser.user_id);

      console.log("🔍 About to update with data:", updateData);
      console.log("🔍 User ID being updated:", editingUser.user_id);

      const { data: updateResult, error: roleError } = await supabase
        .from("user_roles")
        .update(updateData)
        .eq("user_id", editingUser.user_id)
        .select();

      if (roleError) {
        console.error("❌ Error updating user role:", roleError);
        throw roleError;
      }

      console.log("✅ User role updated successfully:", updateResult);
      
      // Verificar que los datos se guardaron correctamente
      if (!updateResult || updateResult.length === 0) {
        console.warn("⚠️ No se devolvió ningún resultado de la actualización");
      } else {
        console.log("✅ Datos actualizados en la BD:", updateResult[0]);
        
        // Verificar que los datos realmente se guardaron consultando la BD
        const { data: verifyData, error: verifyError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", editingUser.user_id)
          .single();
        
        if (verifyError) {
          console.error("❌ Error verifying update:", verifyError);
        } else {
          console.log("🔍 Verificación post-actualización:", verifyData);
        }
      }

      toast({
        title: "Usuario actualizado",
        description: "El usuario fue actualizado exitosamente",
      });

      // Reset form and reload
      setFormData({
        email: "",
        password: "",
        nombre: "",
        role: "cliente",
        tier_id: "none",
        marca_id: "none",
      });
      setShowEditDialog(false);
      setEditingUser(null);
      
      // Esperar un momento antes de recargar
      setTimeout(() => {
        loadUsers();
      }, 500);
    } catch (error: any) {
      console.error("❌ Error updating user:", error);
      toast({
        title: "Error",
        description: `Error al actualizar el usuario: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      // Usar función SQL para eliminar usuario
      const { data, error } = await supabase.rpc('delete_user' as any, {
        user_id_to_delete: userId
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }

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
        {role}
      </Badge>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra usuarios del sistema</p>
          </div>
          <Button onClick={() => {
            setFormData({
              email: "",
              password: "",
              nombre: "",
              role: "cliente",
              tier_id: "none",
              marca_id: "none",
            });
            setShowCreateForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="usuarios" className="space-y-6">
          

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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Asignación</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.nombre || "Sin nombre"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.tier_nombre ? (
                          <Badge variant="outline">{user.tier_nombre}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Sin tier</span>
                        )}
                      </TableCell>
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
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
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    autoComplete="name"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre completo del usuario"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select 
                    name="role"
                    value={formData.role} 
                    onValueChange={(value) => {
                      // Si se selecciona admin o superadmin, bloquear tier y establecer como "none"
                      const newFormData = { ...formData, role: value };
                      if (value === "admin" || value === "superadmin") {
                        newFormData.tier_id = "none";
                      }
                      setFormData(newFormData);
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier_id">Tier</Label>
                  <Select 
                    name="tier_id"
                    value={formData.tier_id} 
                    onValueChange={(value) => setFormData({ ...formData, tier_id: value })}
                    disabled={formData.role === "admin" || formData.role === "superadmin"}
                  >
                    <SelectTrigger id="tier_id">
                      <SelectValue placeholder="Seleccionar tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tier</SelectItem>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.numero.toString()}>
                          {tier.numero} - {tier.nombre} - {tier.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(formData.role === "admin" || formData.role === "superadmin") && (
                    <p className="text-xs text-muted-foreground">
                      Los administradores y superadministradores no requieren tier
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca_id">Marca</Label>
                  <Select 
                    name="marca_id"
                    value={formData.marca_id} 
                    onValueChange={(value) => setFormData({ ...formData, marca_id: value })}
                  >
                    <SelectTrigger id="marca_id">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin marca</SelectItem>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecciona la marca asignada para este usuario
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      email: "",
                      password: "",
                      nombre: "",
                      role: "cliente",
                      tier_id: "none",
                      marca_id: "none",
                    });
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Usuario</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </div>

      {/* Dialog para editar usuario */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="edit-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nueva Contraseña</Label>
                <Input
                  id="edit-password"
                  name="edit-password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para mantener la contraseña actual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  name="edit-nombre"
                  type="text"
                  autoComplete="name"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo del usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select 
                  name="edit-role"
                  value={formData.role} 
                  onValueChange={(value) => {
                    // Si se selecciona admin o superadmin, bloquear tier y establecer como "none"
                    const newFormData = { ...formData, role: value };
                    if (value === "admin" || value === "superadmin") {
                      newFormData.tier_id = "none";
                    }
                    setFormData(newFormData);
                  }}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tier_id">Tier</Label>
                <Select 
                  name="edit-tier_id"
                  value={formData.tier_id} 
                  onValueChange={(value) => setFormData({ ...formData, tier_id: value })}
                  disabled={formData.role === "admin" || formData.role === "superadmin"}
                >
                  <SelectTrigger id="edit-tier_id">
                    <SelectValue placeholder="Seleccionar tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin tier</SelectItem>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.numero.toString()}>
                        {tier.numero} - {tier.nombre} - {tier.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(formData.role === "admin" || formData.role === "superadmin") && (
                  <p className="text-xs text-muted-foreground">
                    Los administradores y superadministradores no requieren tier
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-marca_id">Marca</Label>
                <Select 
                  name="edit-marca_id"
                  value={formData.marca_id} 
                  onValueChange={(value) => setFormData({ ...formData, marca_id: value })}
                >
                  <SelectTrigger id="edit-marca_id">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin marca</SelectItem>
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona la marca asignada para este usuario
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Usuario</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
