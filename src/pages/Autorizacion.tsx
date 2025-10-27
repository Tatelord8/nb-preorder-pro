/**
 * Página de Autorización de Pedidos
 * Permite al superadmin aprobar, rechazar o editar pedidos pendientes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateEstadoPedido } from '@/hooks/usePedidos';
import { ConfirmacionAutorizacion } from '@/components/autorizacion/ConfirmacionAutorizacion';
import { 
  CheckCircle, 
  XCircle, 
  Edit, 
  Clock, 
  User, 
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PedidoPendiente {
  id: string;
  cliente_id: string;
  vendedor_id: string | null;
  total_usd: number;
  estado: string;
  created_at: string;
  clientes: {
    nombre: string;
    tier: string;
  };
  vendedores: {
    nombre: string;
  } | null;
  items_pedido: Array<{
    id: string;
    cantidad: number;
    subtotal_usd: number;
    productos: {
      sku: string;
      nombre: string;
      rubro: string;
    };
  }>;
}

const Autorizacion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    isOpen: boolean;
    tipo: 'aprobar' | 'rechazar';
    pedidoId: string;
    pedidoInfo: {
      cliente: string;
      total: number;
      fecha: string;
    };
  }>({
    isOpen: false,
    tipo: 'aprobar',
    pedidoId: '',
    pedidoInfo: {
      cliente: '',
      total: 0,
      fecha: ''
    }
  });

  const updateEstadoMutation = useUpdateEstadoPedido();

  useEffect(() => {
    checkAuth();
    loadPedidosPendientes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Verificar que sea superadmin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "superadmin")
      .single();

    if (!userRole) {
      toast({
        title: "Acceso denegado",
        description: "Solo los superadministradores pueden acceder a esta sección",
        variant: "destructive",
      });
      navigate("/catalog");
      return;
    }
  };

  const loadPedidosPendientes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando pedidos pendientes...');

      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          cliente_id,
          vendedor_id,
          total_usd,
          estado,
          created_at,
          clientes!inner(nombre, tier),
          vendedores(nombre),
          items_pedido(
            id,
            cantidad,
            subtotal_usd,
            productos!inner(sku, nombre, rubro)
          )
        `)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando pedidos pendientes:', error);
        setError('Error cargando pedidos pendientes');
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos pendientes",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Pedidos pendientes cargados:', pedidos?.length || 0);
      setPedidosPendientes(pedidos || []);

    } catch (error) {
      console.error('Error procesando pedidos pendientes:', error);
      setError('Error al procesar los pedidos pendientes');
      toast({
        title: "Error",
        description: "Error al procesar los pedidos pendientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarPedido = (pedido: PedidoPendiente) => {
    setModalConfirmacion({
      isOpen: true,
      tipo: 'aprobar',
      pedidoId: pedido.id,
      pedidoInfo: {
        cliente: pedido.clientes.nombre,
        total: pedido.total_usd,
        fecha: new Date(pedido.created_at).toLocaleDateString('es-ES')
      }
    });
  };

  const handleRechazarPedido = (pedido: PedidoPendiente) => {
    setModalConfirmacion({
      isOpen: true,
      tipo: 'rechazar',
      pedidoId: pedido.id,
      pedidoInfo: {
        cliente: pedido.clientes.nombre,
        total: pedido.total_usd,
        fecha: new Date(pedido.created_at).toLocaleDateString('es-ES')
      }
    });
  };

  const handleConfirmarAccion = async () => {
    try {
      setProcesando(modalConfirmacion.pedidoId);
      
      await updateEstadoMutation.mutateAsync({
        id: modalConfirmacion.pedidoId,
        estado: modalConfirmacion.tipo === 'aprobar' ? 'autorizado' : 'rechazado'
      });

      toast({
        title: modalConfirmacion.tipo === 'aprobar' ? "Pedido aprobado" : "Pedido rechazado",
        description: modalConfirmacion.tipo === 'aprobar' 
          ? "El pedido ha sido aprobado exitosamente"
          : "El pedido ha sido rechazado",
      });

      // Cerrar modal y recargar la lista
      setModalConfirmacion(prev => ({ ...prev, isOpen: false }));
      await loadPedidosPendientes();

    } catch (error) {
      console.error('Error procesando pedido:', error);
      toast({
        title: "Error",
        description: `No se pudo ${modalConfirmacion.tipo === 'aprobar' ? 'aprobar' : 'rechazar'} el pedido`,
        variant: "destructive",
      });
    } finally {
      setProcesando(null);
    }
  };

  const handleCerrarModal = () => {
    setModalConfirmacion(prev => ({ ...prev, isOpen: false }));
  };

  const handleEditarPedido = (pedidoId: string) => {
    // Por ahora solo navegar a la página de pedidos
    // En el futuro se podría implementar un modal de edición
    navigate(`/pedidos?pedido=${pedidoId}`);
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'secondary';
      case 'autorizado':
        return 'default';
      case 'rechazado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'A':
        return 'default';
      case 'B':
        return 'secondary';
      case 'C':
        return 'outline';
      case 'D':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Cargando pedidos pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Autorización de Pedidos</h1>
            <p className="text-muted-foreground">Revisa y autoriza los pedidos pendientes del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadPedidosPendientes}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Mostrar error si existe */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de pedidos pendientes */}
        {pedidosPendientes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay pedidos pendientes</h3>
              <p className="text-muted-foreground">Todos los pedidos han sido procesados</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidosPendientes.map((pedido) => (
              <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {pedido.clientes.nombre}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Pedido #{pedido.id.slice(-8)} • {new Date(pedido.created_at).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTierBadgeVariant(pedido.clientes.tier)}>
                        Tier {pedido.clientes.tier}
                      </Badge>
                      <Badge variant={getEstadoBadgeVariant(pedido.estado)}>
                        <Clock className="h-3 w-3 mr-1" />
                        {pedido.estado}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Información del pedido */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Fecha:</span>
                        <span>{new Date(pedido.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Vendedor:</span>
                        <span>{pedido.vendedores?.nombre || 'Sin asignar'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Total:</span>
                        <span className="font-semibold text-lg">${pedido.total_usd.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Detalles de productos */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Productos ({pedido.items_pedido.length})</span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {pedido.items_pedido.map((item) => (
                          <div key={item.id} className="text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>{item.productos.sku}</span>
                              <span>{item.cantidad} unidades</span>
                            </div>
                            <div className="text-xs">{item.productos.nombre}</div>
                            <div className="text-xs font-medium">${item.subtotal_usd.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Acciones</div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleAprobarPedido(pedido)}
                          disabled={procesando === pedido.id}
                          size="sm"
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {procesando === pedido.id ? 'Procesando...' : 'Aprobar'}
                        </Button>
                        
                        <Button
                          onClick={() => handleRechazarPedido(pedido)}
                          disabled={procesando === pedido.id}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {procesando === pedido.id ? 'Procesando...' : 'Rechazar'}
                        </Button>
                        
                        <Button
                          onClick={() => handleEditarPedido(pedido.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmacionAutorizacion
        isOpen={modalConfirmacion.isOpen}
        onClose={handleCerrarModal}
        onConfirm={handleConfirmarAccion}
        tipo={modalConfirmacion.tipo}
        pedidoInfo={modalConfirmacion.pedidoInfo}
        loading={procesando === modalConfirmacion.pedidoId}
      />
    </div>
  );
};

export default Autorizacion;
