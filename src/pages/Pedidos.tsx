import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Package, Calendar, DollarSign, Eye, Trash2 } from 'lucide-react';

interface Pedido {
  id: string;
  cliente_id: string;
  vendedor_id: string | null;
  total_usd: number;
  estado: string;
  created_at: string;
  updated_at: string;
  clientes?: {
    nombre: string;
    tier: string;
  };
  vendedores?: {
    nombre: string;
  };
  items_pedido?: Array<{
    id: string;
    producto_id: string;
    cantidad_curvas: number;
    talles_cantidades: Record<string, number>;
    subtotal_usd: number;
    productos?: {
      sku: string;
      nombre: string;
      precio_usd: number;
    };
  }>;
}

const Pedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Obtener el rol del usuario
      const { data: userRoleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(userRoleData?.role || null);

      // Cargar pedidos según el rol del usuario
      let query = supabase
        .from("pedidos")
        .select(`
          *,
          clientes(nombre, tier),
          vendedores(nombre),
          items_pedido(
            *,
            productos(sku, nombre, precio_usd)
          )
        `)
        .order('created_at', { ascending: false });

      // Si es cliente, solo cargar sus pedidos (RLS se encarga del filtrado)
      // Si es admin/superadmin, cargar todos los pedidos
      
      const { data, error } = await query;

      if (error) {
        console.error("Error loading pedidos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos",
          variant: "destructive",
        });
        return;
      }

      setPedidos(data || []);
    } catch (error) {
      console.error("Error loading pedidos:", error);
      toast({
        title: "Error",
        description: "Error al cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePedido = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", pedidoId);

      if (error) throw error;

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente",
      });

      loadPedidos();
    } catch (error) {
      console.error("Error deleting pedido:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive",
      });
    }
  };



  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'autorizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">
          {userRole === 'cliente' ? 'Mis Pedidos' : 'Gestión de Pedidos'}
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'cliente' 
            ? 'Aquí puedes ver y gestionar tus pedidos realizados.'
            : 'Aquí puedes gestionar todos los pedidos del sistema.'
          }
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {pedidos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay pedidos</h3>
            <p className="text-muted-foreground mb-4">
              {userRole === 'cliente' 
                ? 'No has realizado ningún pedido aún.'
                : 'No hay pedidos en el sistema.'
              }
            </p>
            {userRole === 'cliente' && (
              <Button onClick={() => navigate('/catalog')}>
                Ir al Catálogo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {pedidos.map((pedido) => (
              <Card key={pedido.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Pedido #{pedido.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(pedido.created_at)}
                        </span>
                        {pedido.clientes && (
                          <span>Cliente: {pedido.clientes.nombre}</span>
                        )}
                        {pedido.vendedores && (
                          <span>Vendedor: {pedido.vendedores.nombre}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getEstadoColor(pedido.estado)}>
                        {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1 text-lg font-semibold">
                        <DollarSign className="h-5 w-5" />
                        {pedido.total_usd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pedido.items_pedido && pedido.items_pedido.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Items del pedido:</h4>
                      {pedido.items_pedido.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{item.productos?.nombre}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({item.productos?.sku})
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              {item.cantidad_curvas} curva(s) × ${item.productos?.precio_usd}
                            </div>
                            <div className="font-medium">
                              ${item.subtotal_usd.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                                         {userRole === 'cliente' && (
                       <Button 
                         variant="destructive" 
                         size="sm"
                         onClick={() => handleDeletePedido(pedido.id)}
                       >
                         <Trash2 className="h-4 w-4 mr-1" />
                         Eliminar
                       </Button>
                     )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pedidos;
