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
  vendedor?: {
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

interface Vendedor {
  id: string;
  nombre: string;
  email?: string;
}

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
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
    vendedor_id: "none",
  });

  useEffect(() => {
    checkAuth();
    loadUsers();
    loadMarcas();
    loadTiers();
    loadVendedores();
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
        vendedor_id: "none",
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
          let vendedorInfo = null;

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

                     // Buscar cliente usando el user_id del usuario
           const { data: clienteData, error: clienteError } = await supabase
             .from("clientes")
             .select("nombre, tier, vendedor_id")
             .eq("id", user.user_id)
             .maybeSingle();
           
           if (clienteError) {
             console.error("Error fetching cliente:", clienteError);
           }
           
           if (clienteData) {
             clienteInfo = clienteData;

             // Si hay vendedor_id, obtener la información del vendedor
             if (clienteData.vendedor_id) {
               const { data: vendedor, error: vendedorError } = await supabase
                 .from("vendedores")
                 .select("nombre")
                 .eq("id", clienteData.vendedor_id)
                 .maybeSingle();
               
               if (vendedorError) {
                 console.error("Error fetching vendedor:", vendedorError);
               }
               
               if (vendedor) {
                 vendedorInfo = vendedor;
               }
             }
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
            marcas: marcaInfo,
            vendedor: vendedorInfo
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

  const loadVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from("vendedores" as any)
        .select("*")
        .order("nombre");

      if (error) {
        console.error("Error loading vendedores:", error);
        setVendedores([]);
        return;
      }

      setVendedores((data as any) || []);
    } catch (error) {
      console.error("Error loading vendedores:", error);
      setVendedores([]);
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
      // Paso 0: Normalizar email a minúsculas para comparación consistente
      const normalizedEmail = formData.email.toLowerCase().trim();
      
      // Guardar la sesión del superadmin antes de crear el usuario
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('No hay sesión activa');
      }
      console.log('🔐 Sesión guardada:', currentSession.user.email);
      const superadminAccessToken = currentSession.access_token;
      const superadminRefreshToken = currentSession.refresh_token;
      
      // Paso 1: Crear usuario en auth.users usando signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists') || signUpError.message?.includes('duplicate')) {
          throw new Error(`El email ${normalizedEmail} ya está registrado. Verifica la tabla de usuarios.`);
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('✅ Usuario creado en auth.users:', signUpData.user.id);

      // Restaurar la sesión del superadmin INMEDIATAMENTE después de crear el usuario
      console.log('🔄 Restaurando sesión del superadmin...');
      if (superadminAccessToken && superadminRefreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: superadminAccessToken,
          refresh_token: superadminRefreshToken,
        });
        if (sessionError) {
          console.error('❌ Error al restaurar sesión:', sessionError);
          throw new Error('Error al restaurar sesión de superadmin');
        }
        console.log('✅ Sesión restaurada correctamente:', sessionData.session?.user.email);
        
        // Verificar que la sesión se haya restaurado correctamente
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        console.log('🔍 Sesión verificada:', verifySession?.user.email);
        
        if (!verifySession) {
          throw new Error('No se pudo verificar la sesión restaurada');
        }
      }

      // Paso 2: Determinar tier según el rol
      let tierValue: string | null = null;
      if (formData.role !== "admin" && formData.role !== "superadmin" && formData.tier_id && formData.tier_id !== "none") {
        tierValue = formData.tier_id;
      }

      // Paso 3: Determinar marca_id según la selección
      let marcaId = null;
      if (formData.marca_id && formData.marca_id !== "none") {
        marcaId = formData.marca_id;
      }

      // Paso 4: Crear registro en public.usuarios y user_roles usando la función SQL
      console.log('📝 Creando usuario completo con función SQL...');
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_user_complete' as any, {
          p_user_id: signUpData.user.id,
          p_email: normalizedEmail,
          p_nombre: formData.nombre,
          p_role: formData.role,
          p_tier: tierValue,
          p_marca_id: marcaId
        });

      if (functionError) {
        console.error("❌ Error creating user with function:", functionError);
        throw new Error(functionError.message || 'No se pudo crear el usuario');
      }

      const result = functionResult as any;
      if (result && !result.success) {
        console.error("❌ Function returned error:", result.error);
        throw new Error(result.error || 'No se pudo crear el usuario');
      }

      console.log('✅ Usuario creado exitosamente con función SQL');

      // Paso 5: Si el rol es cliente, crear el cliente en la tabla clientes con el vendedor
      if (formData.role === "cliente" && formData.vendedor_id && formData.vendedor_id !== "none") {
        console.log('📝 Creando cliente con vendedor asignado...');
        
        // Determinar el tier del cliente (usar tierValue directamente)
        let tierValue = null;
        if (formData.tier_id && formData.tier_id !== "none") {
          tierValue = formData.tier_id;
        }

        const { error: clienteError } = await supabase
          .from("clientes")
          .insert({
            id: signUpData.user.id,
            nombre: formData.nombre,
            tier: tierValue,
            vendedor_id: formData.vendedor_id,
            marca_id: marcaId
          });

        if (clienteError) {
          console.error("❌ Error creating cliente:", clienteError);
          // No lanzar error aquí, solo registrar el error
        } else {
          console.log('✅ Cliente creado exitosamente con vendedor asignado');
          
          // Actualizar user_roles con el cliente_id
          const { error: updateRoleError } = await supabase
            .from("user_roles")
            .update({ cliente_id: signUpData.user.id })
            .eq("user_id", signUpData.user.id);

          if (updateRoleError) {
            console.error("❌ Error updating user_roles with cliente_id:", updateRoleError);
          } else {
            console.log('✅ user_roles actualizado con cliente_id');
          }
        }
      }

      // Paso 6: Si el rol es cliente pero no tiene vendedor asignado, crear cliente básico
      if (formData.role === "cliente" && (!formData.vendedor_id || formData.vendedor_id === "none")) {
        console.log('📝 Creando cliente sin vendedor asignado...');
        
        // Determinar el tier del cliente
        let tierValue = null;
        if (formData.tier_id && formData.tier_id !== "none") {
          tierValue = formData.tier_id;
        }

        const { error: clienteError } = await supabase
          .from("clientes")
          .insert({
            id: signUpData.user.id,
            nombre: formData.nombre,
            tier: tierValue,
            vendedor_id: null,
            marca_id: marcaId
          });

        if (clienteError) {
          console.error("❌ Error creating cliente:", clienteError);
          // No lanzar error aquí, solo registrar el error
        } else {
          console.log('✅ Cliente creado exitosamente sin vendedor asignado');
          
          // Actualizar user_roles con el cliente_id
          const { error: updateRoleError } = await supabase
            .from("user_roles")
            .update({ cliente_id: signUpData.user.id })
            .eq("user_id", signUpData.user.id);

          if (updateRoleError) {
            console.error("❌ Error updating user_roles with cliente_id:", updateRoleError);
          } else {
            console.log('✅ user_roles actualizado con cliente_id');
          }
        }
      }

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
        vendedor_id: "none",
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || 'No se pudo crear el usuario',
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (user: User) => {
    setEditingUser(user);
    
    // Cargar el vendedor asignado del cliente
    let vendedorId = "none";
    if (user.role === "cliente") {
      const { data: cliente } = await supabase
        .from("clientes")
        .select("vendedor_id")
        .eq("id", user.user_id)
        .maybeSingle();
      
      if (cliente && cliente.vendedor_id) {
        vendedorId = cliente.vendedor_id;
      }
    }
    
    setFormData({
      email: user.email,
      password: "", // No pre-llenar contraseña por seguridad
      nombre: user.nombre || "",
      role: user.role,
      tier_id: user.tier_id?.toString() || "none",
      marca_id: user.marca_id?.toString() || "none",
      vendedor_id: vendedorId,
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

      // Manejar tier según el rol
      if (formData.role === "admin" || formData.role === "superadmin") {
        // Los administradores y superadministradores no tienen tier
        updateData.tier = null;
      } else if (formData.tier_id && formData.tier_id !== "none") {
        // Solo incluir tier si es diferente de "none" para otros roles
        // tier debe ser el número del tier como string, no el UUID
        const tierNumber = parseInt(formData.tier_id);
        updateData.tier = isNaN(tierNumber) ? null : tierNumber.toString();
        console.log("🔍 Tier conversion:", formData.tier_id, "->", updateData.tier);
      } else {
        // Si es "none" o vacío, establecer como null
        updateData.tier = null;
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

      // Si el rol es cliente, actualizar/crear el cliente en la tabla clientes
      let clienteCreateError: any = null;
      if (formData.role === "cliente") {
        console.log('📝 Actualizando/creando cliente...');
        
        // Determinar el tier del cliente (usar tier directamente)
        let tierValue = null;
        if (updateData.tier !== null && updateData.tier !== undefined) {
          tierValue = updateData.tier;
        }

        // Determinar vendedor_id
        let vendedorIdValue = null;
        if (formData.vendedor_id && formData.vendedor_id !== "none") {
          vendedorIdValue = formData.vendedor_id;
        }

        // Verificar si el cliente ya existe en la tabla clientes
        const { data: clienteExistente } = await supabase
          .from("clientes")
          .select("id")
          .eq("id", editingUser.user_id)
          .maybeSingle();

        if (clienteExistente) {
          // Actualizar el cliente existente
          const { error: clienteUpdateError } = await supabase
            .from("clientes")
            .update({
              nombre: formData.nombre,
              tier: tierValue,
              vendedor_id: vendedorIdValue,
              marca_id: updateData.marca_id
            })
            .eq("id", editingUser.user_id);

          if (clienteUpdateError) {
            console.error("❌ Error updating cliente:", clienteUpdateError);
            clienteCreateError = clienteUpdateError;
          } else {
            console.log('✅ Cliente actualizado exitosamente');
          }
        } else {
           // Crear el cliente si no existe
           // Verificar que marca_id esté presente antes de crear el cliente
           if (!updateData.marca_id) {
             console.error("❌ Error: marca_id es requerido para crear cliente");
             toast({
               title: "Error",
               description: "Debe seleccionar una marca para el cliente",
               variant: "destructive",
             });
             return;
           }
           
           const { error: clienteCreateError } = await supabase
             .from("clientes")
             .insert({
               id: editingUser.user_id,
               nombre: formData.nombre,
               tier: tierValue,
               vendedor_id: vendedorIdValue,
               marca_id: updateData.marca_id
             });

           if (clienteCreateError) {
             console.error("❌ Error creating cliente:", clienteCreateError);
             toast({
               title: "Error",
               description: `Error al crear el cliente: ${clienteCreateError.message}`,
               variant: "destructive",
             });
             return;
           } else {
             console.log('✅ Cliente creado exitosamente');
           }
         }
      }

             // Solo mostrar el toast de éxito si no hubo errores
       // Si ya se mostró un toast de error, no mostrar el de éxito
       if (!clienteCreateError) {
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
           vendedor_id: "none",
         });
         setShowEditDialog(false);
         setEditingUser(null);
         
         // Esperar un momento antes de recargar
         setTimeout(() => {
           loadUsers();
         }, 500);
       }
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
              vendedor_id: "none",
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
                    <TableHead>Vendedor</TableHead>
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
                        {user.role === "cliente" && user.vendedor ? (
                          <div className="font-medium">{user.vendedor.nombre}</div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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

                {formData.role === "cliente" && (
                  <div className="space-y-2">
                    <Label htmlFor="vendedor_id">Vendedor</Label>
                    <Select 
                      name="vendedor_id"
                      value={formData.vendedor_id} 
                      onValueChange={(value) => setFormData({ ...formData, vendedor_id: value })}
                    >
                      <SelectTrigger id="vendedor_id">
                        <SelectValue placeholder="Seleccionar vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin vendedor</SelectItem>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor.id} value={vendedor.id}>
                            {vendedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecciona el vendedor asignado para este cliente
                    </p>
                  </div>
                )}

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
                      vendedor_id: "none",
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
                    // Si se selecciona admin o superadmin, bloquear tier y vendedor y establecer como "none"
                    const newFormData = { ...formData, role: value };
                    if (value === "admin" || value === "superadmin") {
                      newFormData.tier_id = "none";
                      newFormData.vendedor_id = "none";
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

              {formData.role === "cliente" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-vendedor_id">Vendedor</Label>
                  <Select 
                    name="edit-vendedor_id"
                    value={formData.vendedor_id} 
                    onValueChange={(value) => setFormData({ ...formData, vendedor_id: value })}
                  >
                    <SelectTrigger id="edit-vendedor_id">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin vendedor</SelectItem>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecciona el vendedor asignado para este cliente
                  </p>
                </div>
              )}

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
