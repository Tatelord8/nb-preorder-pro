import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePedidosWithDetails } from '@/hooks/usePedidos';
import { useCarritos } from '@/hooks/useCarritos';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ChevronLeft, Users, Layers, Search, X } from 'lucide-react';

interface ProductoColeccion {
  producto_id: string;
  sku: string;
  nombre: string;
  rubro: string;
  precio_usd: number;
  imagen_url?: string | null;
  marca_id?: string | null;
  clientes: Array<{ nombre: string; unidades: number }>;
  totalUnidades: number;
  totalClientes: number;
}

export default function GestionColeccion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState<string>('all');

  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas', 'activas'],
    queryFn: async () => {
      const { data } = await supabase.from('marcas').select('id, nombre').eq('activa', true).order('nombre');
      return data || [];
    },
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'superadmin')
        .single();
      if (!role) {
        toast({ title: 'Acceso denegado', variant: 'destructive' });
        navigate('/catalog');
      }
    })();
  }, []);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.all });
  }, []);

  const { data: pedidos = [], isLoading: loadingPedidos } = usePedidosWithDetails();
  const { data: carritos = [], isLoading: loadingCarritos } = useCarritos();

  const coleccion = useMemo(() => {
    const mapa = new Map<string, {
      producto_id: string;
      sku: string;
      nombre: string;
      rubro: string;
      precio_usd: number;
      imagen_url?: string | null;
      marca_id?: string | null;
      clientesMap: Map<string, number>;
      totalUnidades: number;
    }>();

    const addItem = (pid: string, info: any, precio: number, clienteNombre: string, unidades: number) => {
      if (!pid || !info || unidades <= 0) return;
      if (!mapa.has(pid)) {
        mapa.set(pid, {
          producto_id: pid,
          sku: info.sku || '',
          nombre: info.nombre || '',
          rubro: info.rubro || 'Sin rubro',
          precio_usd: precio,
          imagen_url: info.imagen_url ?? null,
          marca_id: info.marca_id ?? null,
          clientesMap: new Map(),
          totalUnidades: 0,
        });
      }
      const entry = mapa.get(pid)!;
      entry.clientesMap.set(clienteNombre, (entry.clientesMap.get(clienteNombre) || 0) + unidades);
      entry.totalUnidades += unidades;
    };

    (pedidos as any[]).forEach((pedido) => {
      const clienteNombre = pedido.clientes?.nombre || 'Sin nombre';
      (pedido.items_pedido || []).forEach((item: any) => {
        if (!item.productos) return;
        const unidades = Object.values(item.talles_cantidades || {})
          .reduce((a: number, b: any) => a + Number(b), 0);
        addItem(item.producto_id, item.productos, item.precio_unitario || item.productos.precio_usd || 0, clienteNombre, unidades);
      });
    });

    (carritos as any[]).forEach((carrito) => {
      const clienteNombre = carrito.clientes?.nombre || 'Sin nombre';
      (carrito.items_pedido || []).forEach((item: any) => {
        if (!item.productos) return;
        addItem(item.producto_id, item.productos, item.precio_unitario || item.productos.precio_usd || 0, clienteNombre, item.cantidad || 0);
      });
    });

    const productos: ProductoColeccion[] = Array.from(mapa.values()).map(p => ({
      producto_id: p.producto_id,
      sku: p.sku,
      nombre: p.nombre,
      rubro: p.rubro,
      precio_usd: p.precio_usd,
      imagen_url: p.imagen_url,
      marca_id: p.marca_id,
      clientes: Array.from(p.clientesMap.entries())
        .map(([nombre, unidades]) => ({ nombre, unidades }))
        .sort((a, b) => b.unidades - a.unidades),
      totalUnidades: p.totalUnidades,
      totalClientes: p.clientesMap.size,
    }));

    const porRubro = new Map<string, ProductoColeccion[]>();
    productos.forEach(p => {
      if (!porRubro.has(p.rubro)) porRubro.set(p.rubro, []);
      porRubro.get(p.rubro)!.push(p);
    });
    porRubro.forEach(prods => prods.sort((a, b) => b.totalUnidades - a.totalUnidades));

    return porRubro;
  }, [pedidos, carritos]);

  const coleccionFiltrada = useMemo(() => {
    if (filtroMarca === 'all') return coleccion;
    const resultado = new Map<string, ProductoColeccion[]>();
    coleccion.forEach((prods, rubro) => {
      const filtrados = prods.filter(p => p.marca_id === filtroMarca);
      if (filtrados.length > 0) resultado.set(rubro, filtrados);
    });
    return resultado;
  }, [coleccion, filtroMarca]);

  const rubros = Array.from(coleccionFiltrada.keys()).sort();

  const productosDelRubro = useMemo(() => {
    const base = rubroSeleccionado ? (coleccionFiltrada.get(rubroSeleccionado) || []) : [];
    if (!busqueda.trim()) return base;
    const q = busqueda.toLowerCase();
    return base.filter(p =>
      p.sku.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    );
  }, [rubroSeleccionado, coleccionFiltrada, busqueda]);

  const handleSeleccionarRubro = (rubro: string) => {
    setRubroSeleccionado(rubro);
    setBusqueda('');
  };

  const handleVolverRubros = () => {
    setRubroSeleccionado(null);
    setBusqueda('');
  };

  const handleFiltroMarca = (value: string) => {
    setFiltroMarca(value);
    setRubroSeleccionado(null);
    setBusqueda('');
  };

  const isLoading = loadingPedidos || loadingCarritos;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Cargando colección...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {rubroSeleccionado && (
              <Button variant="ghost" size="icon" onClick={handleVolverRubros}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <Layers className="h-8 w-8" />
                Gestión de Colección
              </h1>
              <p className="text-muted-foreground">
                {rubroSeleccionado
                  ? `${rubroSeleccionado} — ${productosDelRubro.length} producto${productosDelRubro.length !== 1 ? 's' : ''} seleccionados`
                  : 'Productos seleccionados por clientes, agrupados por rubro'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Select value={filtroMarca} onValueChange={handleFiltroMarca}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todas las marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {(marcas as any[]).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rubroSeleccionado && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por SKU o nombre..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="pl-9 pr-9"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!rubroSeleccionado ? (
          /* Vista de rubros */
          rubros.length === 0 ? (
            <div className="text-center py-24">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Sin selecciones todavía</h3>
              <p className="text-muted-foreground">No hay productos seleccionados en carritos ni pedidos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rubros.map(rubro => {
                const prods = coleccionFiltrada.get(rubro)!;
                const totalUnidades = prods.reduce((a, p) => a + p.totalUnidades, 0);
                const totalClientes = new Set(prods.flatMap(p => p.clientes.map(c => c.nombre))).size;
                return (
                  <Card
                    key={rubro}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSeleccionarRubro(rubro)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold mb-4">{rubro}</h2>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span><span className="font-semibold">{prods.length}</span> SKUs únicos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-muted-foreground" />
                              <span><span className="font-semibold">{totalUnidades}</span> unidades totales</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span><span className="font-semibold">{totalClientes}</span> clientes</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-5xl font-black text-muted-foreground/20 select-none">
                          {prods.length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* Vista de productos del rubro */
          productosDelRubro.length === 0 ? (
            busqueda.trim() ? (
              <div className="text-center py-24">
                <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Sin resultados para <strong>"{busqueda}"</strong>.
                </p>
                <Button variant="link" onClick={() => setBusqueda('')}>Limpiar búsqueda</Button>
              </div>
            ) : (
              <div className="text-center py-24">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No hay productos seleccionados en este rubro.</p>
              </div>
            )
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productosDelRubro.map((producto) => (
              <Card key={producto.producto_id} className="overflow-hidden flex flex-col">
                {/* Imagen */}
                <div className="aspect-square bg-muted relative">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2">
                    {producto.totalUnidades} uds.
                  </Badge>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  {/* Info del producto */}
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{producto.sku}</p>
                    <p className="font-semibold text-sm leading-snug mt-0.5">{producto.nombre}</p>
                    <p className="text-lg font-bold mt-1">${producto.precio_usd.toFixed(2)}</p>
                  </div>

                  {/* Clientes */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {producto.totalClientes} cliente{producto.totalClientes !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {producto.clientes.map((c, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground truncate">{c.nombre}</span>
                          <Badge variant="outline" className="shrink-0 text-xs px-1.5 py-0">
                            {c.unidades}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )
        )}
      </div>
    </div>
  );
}
