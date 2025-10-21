import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Tag, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Activity,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  totalMarcas: number;
  totalProductos: number;
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosAutorizados: number;
  ingresosTotales: number;
  usuariosActivos: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMarcas: 0,
    totalProductos: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosAutorizados: 0,
    ingresosTotales: 0,
    usuariosActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadStats();
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

  const loadStats = async () => {
    try {
      // Load all stats in parallel
      const [
        usersResult,
        marcasResult,
        productosResult,
        pedidosResult,
        pedidosPendientesResult,
        pedidosAutorizadosResult,
        ingresosResult,
        usuariosActivosResult
      ] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact" }),
        supabase.from("marcas").select("id", { count: "exact" }),
        supabase.from("productos").select("id", { count: "exact" }),
        supabase.from("pedidos").select("id", { count: "exact" }),
        supabase.from("pedidos").select("id", { count: "exact" }).eq("estado", "pendiente"),
        supabase.from("pedidos").select("id", { count: "exact" }).eq("estado", "autorizado"),
        supabase.from("pedidos").select("total_usd").eq("estado", "autorizado"),
        supabase.from("user_roles").select("id", { count: "exact" }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const ingresosTotales = ingresosResult.data?.reduce((sum, pedido) => sum + (pedido.total_usd || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalMarcas: marcasResult.count || 0,
        totalProductos: productosResult.count || 0,
        totalPedidos: pedidosResult.count || 0,
        pedidosPendientes: pedidosPendientesResult.count || 0,
        pedidosAutorizados: pedidosAutorizadosResult.count || 0,
        ingresosTotales,
        usuariosActivos: usuariosActivosResult.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Marcas Activas",
      value: stats.totalMarcas,
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Productos",
      value: stats.totalProductos,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pedidos Totales",
      value: stats.totalPedidos,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pedidos Pendientes",
      value: stats.pedidosPendientes,
      icon: UserX,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Pedidos Autorizados",
      value: stats.pedidosAutorizados,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Ingresos Totales",
      value: `$${stats.ingresosTotales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Usuarios Activos (30d)",
      value: stats.usuariosActivos,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Ejecutivo</h1>
            <p className="text-muted-foreground">Vista general del sistema</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate("/users")}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Gestionar Usuarios</p>
                    <p className="text-sm text-muted-foreground">Crear y administrar usuarios del sistema</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate("/marcas")}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Gestionar Marcas</p>
                    <p className="text-sm text-muted-foreground">Administrar marcas del sistema</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedidos Pendientes</span>
                <span className="font-medium text-yellow-600">{stats.pedidosPendientes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedidos Autorizados</span>
                <span className="font-medium text-green-600">{stats.pedidosAutorizados}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuarios Activos</span>
                <span className="font-medium text-blue-600">{stats.usuariosActivos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ingresos del Mes</span>
                <span className="font-medium text-emerald-600">${stats.ingresosTotales.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
