/**
 * Servicio de Reportes
 * Encapsula toda la lógica de generación de reportes y exportación
 */

import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { ProductosService, type Producto } from './productos.service';
import { PedidosService, type PedidoConDetalles } from './pedidos.service';

export interface ReporteCarrito {
  userId: string;
  clienteNombre?: string;
  vendedorNombre?: string;
  tier?: string;
  productos: Array<{
    sku: string;
    nombre: string;
    cantidad: number;
    precio_usd: number;
    subtotal: number;
    rubro: string;
    genero: string;
  }>;
  totalProductos: number;
  totalUnidades: number;
  totalUSD: number;
  fechaActualizacion: string;
}

export interface ReporteData {
  general: {
    totalCarritos: number;
    totalProductos: number;
    totalUnidades: number;
    totalUSD: number;
  };
  porCliente: Record<string, {
    nombre: string;
    carritos: number;
    productos: number;
    unidades: number;
    totalUSD: number;
  }>;
  porVendedor: Record<string, {
    nombre: string;
    carritos: number;
    productos: number;
    unidades: number;
    totalUSD: number;
  }>;
  porRubro: Record<string, {
    productos: number;
    unidades: number;
    totalUSD: number;
  }>;
}

export interface CarritoEncontrado {
  userId: string;
  items: any[];
  clienteInfo?: any;
  lastUpdated: string;
}

export interface PedidoFinalizado {
  id: string;
  cliente_id: string;
  vendedor_id: string | null;
  total_usd: number;
  estado: string;
  created_at: string;
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
    cantidad: number;
    precio_unitario: number;
    subtotal_usd: number;
    tallesCantidades?: Record<string, number>;
    productos?: {
      sku: string;
      nombre: string;
      rubro: string;
      xfd?: string | Date;
      fecha_despacho?: string | Date;
    };
  }>;
}

export interface ReporteStats {
  totalPedidos: number;
  totalSKUs: number;
  totalCantidad: number;
  totalValorizado: number;
  porCliente: Record<string, {
    nombre: string;
    totalPedidos: number;
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
  porVendedor: Record<string, {
    nombre: string;
    totalPedidos: number;
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
  porRubro: Record<string, {
    totalSKUs: number;
    totalCantidad: number;
    totalValorizado: number;
  }>;
}

export interface CarritoStats {
  calzados: {
    skusCount: number;
    cantidadTotal: number;
  };
  prendas: {
    skusCount: number;
    cantidadTotal: number;
  };
}

/**
 * Servicio para manejar generación de reportes
 */
export class ReportsService {
  /**
   * Obtiene todos los carritos desde Supabase
   */
  static async getAllCarritos(): Promise<any[]> {
    try {
      const { data: carritosData, error } = await supabase
        .from("carritos_pendientes")
        .select(`
          id,
          user_id,
          cliente_id,
          items,
          total_items,
          total_unidades,
          created_at,
          clientes(nombre, tier, vendedor_id),
          vendedores(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo carritos:', error);
        return [];
      }

      return carritosData || [];
    } catch (error) {
      console.error('Error en getAllCarritos:', error);
      return [];
    }
  }

  /**
   * Procesa carritos y genera datos de reporte
   */
  static async generateCarritosReport(
    carritos: CartInfo[],
    productosData?: Record<string, Producto>
  ): Promise<ReporteCarrito[]> {
    // Si no se proporcionan productos, obtenerlos
    let productos = productosData;
    if (!productos) {
      const productIds = [...new Set(
        carritos.flatMap(c => c.items.map(item => item.productoId))
      )];

      if (productIds.length > 0) {
        const productosArray = await ProductosService.getByIds(productIds);
        productos = {};
        productosArray.forEach(p => {
          productos![p.id] = p;
        });
      } else {
        productos = {};
      }
    }

    const reportes: ReporteCarrito[] = [];

    for (const carrito of carritos) {
      let totalUnidades = 0;
      let totalUSD = 0;

      const productosReporte = carrito.items.map(item => {
        const producto = productos![item.productoId];
        if (!producto) {
          return null;
        }

        const cantidadPorTalle = Object.values(item.talles).reduce(
          (sum: number, qty) => sum + (qty as number),
          0
        );
        const cantidad = cantidadPorTalle * item.cantidadCurvas;
        const subtotal = cantidad * producto.precio_usd;

        totalUnidades += cantidad;
        totalUSD += subtotal;

        return {
          sku: producto.sku,
          nombre: producto.nombre,
          cantidad,
          precio_usd: producto.precio_usd,
          subtotal,
          rubro: producto.rubro,
          genero: producto.genero,
        };
      }).filter(Boolean) as any[];

      reportes.push({
        userId: carrito.userId,
        productos: productosReporte,
        totalProductos: carrito.items.length,
        totalUnidades,
        totalUSD,
        fechaActualizacion: carrito.lastUpdated,
      });
    }

    return reportes;
  }

  /**
   * Calcula estadísticas agregadas de carritos
   */
  static async calculateCarritosStats(
    reportes: ReporteCarrito[]
  ): Promise<ReporteData> {
    const data: ReporteData = {
      general: {
        totalCarritos: reportes.length,
        totalProductos: 0,
        totalUnidades: 0,
        totalUSD: 0,
      },
      porCliente: {},
      porVendedor: {},
      porRubro: {},
    };

    for (const reporte of reportes) {
      // Estadísticas generales
      data.general.totalProductos += reporte.totalProductos;
      data.general.totalUnidades += reporte.totalUnidades;
      data.general.totalUSD += reporte.totalUSD;

      // Por cliente
      const clienteNombre = reporte.clienteNombre || 'Sin asignar';
      if (!data.porCliente[clienteNombre]) {
        data.porCliente[clienteNombre] = {
          nombre: clienteNombre,
          carritos: 0,
          productos: 0,
          unidades: 0,
          totalUSD: 0,
        };
      }
      data.porCliente[clienteNombre].carritos++;
      data.porCliente[clienteNombre].productos += reporte.totalProductos;
      data.porCliente[clienteNombre].unidades += reporte.totalUnidades;
      data.porCliente[clienteNombre].totalUSD += reporte.totalUSD;

      // Por vendedor
      const vendedorNombre = reporte.vendedorNombre || 'Sin asignar';
      if (!data.porVendedor[vendedorNombre]) {
        data.porVendedor[vendedorNombre] = {
          nombre: vendedorNombre,
          carritos: 0,
          productos: 0,
          unidades: 0,
          totalUSD: 0,
        };
      }
      data.porVendedor[vendedorNombre].carritos++;
      data.porVendedor[vendedorNombre].productos += reporte.totalProductos;
      data.porVendedor[vendedorNombre].unidades += reporte.totalUnidades;
      data.porVendedor[vendedorNombre].totalUSD += reporte.totalUSD;

      // Por rubro
      for (const producto of reporte.productos) {
        if (!data.porRubro[producto.rubro]) {
          data.porRubro[producto.rubro] = {
            productos: 0,
            unidades: 0,
            totalUSD: 0,
          };
        }
        data.porRubro[producto.rubro].productos++;
        data.porRubro[producto.rubro].unidades += producto.cantidad;
        data.porRubro[producto.rubro].totalUSD += producto.subtotal;
      }
    }

    return data;
  }

  /**
   * Exporta carritos a Excel
   */
  static exportCarritosToExcel(
    reportes: ReporteCarrito[],
    filename: string = 'carritos_pendientes.xlsx'
  ): void {
    const excelData: any[] = [];

    for (const reporte of reportes) {
      for (const producto of reporte.productos) {
        excelData.push({
          'Cliente': reporte.clienteNombre || 'Sin asignar',
          'Vendedor': reporte.vendedorNombre || 'Sin asignar',
          'Tier': reporte.tier || '-',
          'SKU': producto.sku,
          'Producto': producto.nombre,
          'Género': producto.genero,
          'Rubro': producto.rubro,
          'Cantidad': producto.cantidad,
          'Precio Unitario USD': producto.precio_usd,
          'Subtotal USD': producto.subtotal,
        });
      }

      // Fila de total por carrito
      excelData.push({
        'Cliente': '',
        'Vendedor': '',
        'Tier': '',
        'SKU': '',
        'Producto': `TOTAL CARRITO`,
        'Género': '',
        'Rubro': '',
        'Cantidad': reporte.totalUnidades,
        'Precio Unitario USD': '',
        'Subtotal USD': reporte.totalUSD,
      });

      // Fila vacía para separar carritos
      excelData.push({});
    }

    // Total general
    const totalUnidades = reportes.reduce((sum, r) => sum + r.totalUnidades, 0);
    const totalUSD = reportes.reduce((sum, r) => sum + r.totalUSD, 0);

    excelData.push({
      'Cliente': '',
      'Vendedor': '',
      'Tier': '',
      'SKU': '',
      'Producto': 'TOTAL GENERAL',
      'Género': '',
      'Rubro': '',
      'Cantidad': totalUnidades,
      'Precio Unitario USD': '',
      'Subtotal USD': totalUSD,
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carritos');

    XLSX.writeFile(wb, filename);
  }

  /**
   * Exporta pedidos a Excel
   */
  static async exportPedidosToExcel(
    pedidos: PedidoConDetalles[],
    productos: Record<string, Producto>,
    filename: string = 'pedidos.xlsx'
  ): Promise<void> {
    const excelData: any[] = [];

    for (const pedido of pedidos) {
      const clienteNombre = pedido.clientes?.nombre || 'Sin cliente';
      const vendedorNombre = pedido.vendedores?.nombre || 'Sin vendedor';

      if (pedido.pedidos_detalles && pedido.pedidos_detalles.length > 0) {
        for (const detalle of pedido.pedidos_detalles) {
          const producto = productos[detalle.producto_id];

          if (producto) {
            // Agregar fila por cada talle
            Object.entries(detalle.talles_cantidades).forEach(([talle, cantidad]) => {
              // Las cantidades en talles_cantidades ya están multiplicadas por cantidad_curvas
              const totalCantidad = cantidad as number;

              excelData.push({
                'Pedido ID': pedido.id.substring(0, 8),
                'Cliente': clienteNombre,
                'Vendedor': vendedorNombre,
                'Tier': pedido.clientes?.tier || '-',
                'SKU': producto.sku,
                'Producto': producto.nombre,
                'Género': producto.genero,
                'Rubro': producto.rubro,
                'Talle': talle,
                'Cantidad': totalCantidad,
                'Precio Unitario USD': producto.precio_usd,
                'Subtotal USD': totalCantidad * producto.precio_usd,
                'Estado': pedido.estado || 'pendiente',
                'Fecha': new Date(pedido.created_at).toLocaleDateString(),
              });
            });
          }
        }

        // Fila de total por pedido
        excelData.push({
          'Pedido ID': '',
          'Cliente': '',
          'Vendedor': '',
          'Tier': '',
          'SKU': '',
          'Producto': `TOTAL PEDIDO`,
          'Género': '',
          'Rubro': '',
          'Talle': '',
          'Cantidad': '',
          'Precio Unitario USD': '',
          'Subtotal USD': pedido.total_usd,
          'Estado': '',
          'Fecha': '',
        });

        // Fila vacía
        excelData.push({});
      }
    }

    // Total general
    const totalUSD = pedidos.reduce((sum, p) => sum + p.total_usd, 0);

    excelData.push({
      'Pedido ID': '',
      'Cliente': '',
      'Vendedor': '',
      'Tier': '',
      'SKU': '',
      'Producto': 'TOTAL GENERAL',
      'Género': '',
      'Rubro': '',
      'Talle': '',
      'Cantidad': '',
      'Precio Unitario USD': '',
      'Subtotal USD': totalUSD,
      'Estado': '',
      'Fecha': '',
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');

    XLSX.writeFile(wb, filename);
  }

  /**
   * Genera reporte consolidado por rubro
   */
  static generateRubroReport(reportes: ReporteCarrito[]): Record<string, {
    totalUnidades: number;
    totalUSD: number;
    productos: Set<string>;
  }> {
    const rubroStats: Record<string, {
      totalUnidades: number;
      totalUSD: number;
      productos: Set<string>;
    }> = {};

    for (const reporte of reportes) {
      for (const producto of reporte.productos) {
        if (!rubroStats[producto.rubro]) {
          rubroStats[producto.rubro] = {
            totalUnidades: 0,
            totalUSD: 0,
            productos: new Set(),
          };
        }

        rubroStats[producto.rubro].totalUnidades += producto.cantidad;
        rubroStats[producto.rubro].totalUSD += producto.subtotal;
        rubroStats[producto.rubro].productos.add(producto.sku);
      }
    }

    return rubroStats;
  }

  /**
   * Genera reporte de ventas por período
   */
  static async generateSalesReport(
    fechaDesde: string,
    fechaHasta: string
  ): Promise<{
    pedidos: PedidoConDetalles[];
    totalVentas: number;
    totalPedidos: number;
    promedioVenta: number;
  }> {
    const pedidos = await PedidosService.getAllWithDetails({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    });

    const totalVentas = pedidos.reduce((sum, p) => sum + p.total_usd, 0);
    const totalPedidos = pedidos.length;
    const promedioVenta = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    return {
      pedidos,
      totalVentas,
      totalPedidos,
      promedioVenta,
    };
  }

  /**
   * Genera reporte estadístico de pedidos finalizados
   */
  static generarReportePedidos(pedidos: PedidoFinalizado[]): ReporteStats {
    const reporte: ReporteStats = {
      totalPedidos: pedidos.length,
      totalSKUs: 0,
      totalCantidad: 0,
      totalValorizado: 0,
      porCliente: {},
      porVendedor: {},
      porRubro: {},
    };

    pedidos.forEach((pedido) => {
      reporte.totalValorizado += pedido.total_usd;

      if (pedido.items_pedido) {
        const uniqueSKUs = new Set<string>();
        const rubroSKUsInPedido = new Map<string, Set<string>>();

        pedido.items_pedido.forEach((item) => {
          if (item.productos) {
            uniqueSKUs.add(item.productos.sku);
            reporte.totalCantidad += item.cantidad;

            const rubro = item.productos.rubro;
            if (rubro) {
              if (!rubroSKUsInPedido.has(rubro)) {
                rubroSKUsInPedido.set(rubro, new Set<string>());
              }
              rubroSKUsInPedido.get(rubro)!.add(item.productos.sku);
            }
          }
        });

        reporte.totalSKUs += uniqueSKUs.size;

        rubroSKUsInPedido.forEach((skus, rubro) => {
          if (!reporte.porRubro[rubro]) {
            reporte.porRubro[rubro] = {
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          reporte.porRubro[rubro].totalSKUs += skus.size;
        });

        pedido.items_pedido.forEach((item) => {
          if (item.productos) {
            if (pedido.clientes) {
              const clienteKey = pedido.cliente_id;
              if (!reporte.porCliente[clienteKey]) {
                reporte.porCliente[clienteKey] = {
                  nombre: pedido.clientes.nombre,
                  totalPedidos: 0,
                  totalSKUs: 0,
                  totalCantidad: 0,
                  totalValorizado: 0,
                };
              }
              if (reporte.porCliente[clienteKey].totalSKUs === 0) {
                const clienteSKUs = new Set<string>();
                pedido.items_pedido?.forEach(i => i.productos && clienteSKUs.add(i.productos.sku));
                reporte.porCliente[clienteKey].totalSKUs = clienteSKUs.size;
              }
              reporte.porCliente[clienteKey].totalCantidad += item.cantidad;
            }

            if (pedido.vendedores && pedido.vendedor_id) {
              const vendedorKey = pedido.vendedor_id;
              if (!reporte.porVendedor[vendedorKey]) {
                reporte.porVendedor[vendedorKey] = {
                  nombre: pedido.vendedores.nombre,
                  totalPedidos: 0,
                  totalSKUs: 0,
                  totalCantidad: 0,
                  totalValorizado: 0,
                };
              }
              if (reporte.porVendedor[vendedorKey].totalSKUs === 0) {
                const vendedorSKUs = new Set<string>();
                pedido.items_pedido?.forEach(i => i.productos && vendedorSKUs.add(i.productos.sku));
                reporte.porVendedor[vendedorKey].totalSKUs = vendedorSKUs.size;
              }
              reporte.porVendedor[vendedorKey].totalCantidad += item.cantidad;
            }

            const rubro = item.productos.rubro;
            if (rubro) {
              reporte.porRubro[rubro].totalCantidad += item.cantidad;
              reporte.porRubro[rubro].totalValorizado += item.subtotal_usd;
            }
          }
        });
      }

      if (pedido.clientes) {
        const clienteKey = pedido.cliente_id;
        if (reporte.porCliente[clienteKey]) {
          reporte.porCliente[clienteKey].totalPedidos++;
          reporte.porCliente[clienteKey].totalValorizado += pedido.total_usd;
        }
      }

      if (pedido.vendedores && pedido.vendedor_id) {
        const vendedorKey = pedido.vendedor_id;
        if (reporte.porVendedor[vendedorKey]) {
          reporte.porVendedor[vendedorKey].totalPedidos++;
          reporte.porVendedor[vendedorKey].totalValorizado += pedido.total_usd;
        }
      }
    });

    return reporte;
  }

  /**
   * Genera reporte estadístico de carritos
   */
  static generarReporteCarritos(carritos: PedidoFinalizado[]): ReporteStats {
    const reporte: ReporteStats = {
      totalPedidos: carritos.length,
      totalSKUs: 0,
      totalCantidad: 0,
      totalValorizado: 0,
      porCliente: {},
      porVendedor: {},
      porRubro: {},
    };

    const allUniqueSKUs = new Set<string>();

    carritos.forEach((carrito) => {
      reporte.totalValorizado += carrito.total_usd;

      if (carrito.items_pedido && carrito.items_pedido.length > 0) {
        const carritoSKUs = new Set<string>();
        let carritoCantidad = 0;

        carrito.items_pedido.forEach((item) => {
          const producto = (item as any).productos || (item as any).producto;

          if (producto && producto.sku) {
            carritoSKUs.add(producto.sku);
            allUniqueSKUs.add(producto.sku);
            carritoCantidad += item.cantidad;
          }
        });

        reporte.totalCantidad += carritoCantidad;

        if (carrito.clientes) {
          const clienteKey = carrito.cliente_id;
          if (!reporte.porCliente[clienteKey]) {
            reporte.porCliente[clienteKey] = {
              nombre: carrito.clientes.nombre,
              totalPedidos: 0,
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          reporte.porCliente[clienteKey].totalPedidos++;
          reporte.porCliente[clienteKey].totalValorizado += carrito.total_usd;
          reporte.porCliente[clienteKey].totalSKUs += carritoSKUs.size;
          reporte.porCliente[clienteKey].totalCantidad += carritoCantidad;
        }

        if (carrito.vendedores && carrito.vendedor_id) {
          const vendedorKey = carrito.vendedor_id;
          if (!reporte.porVendedor[vendedorKey]) {
            reporte.porVendedor[vendedorKey] = {
              nombre: carrito.vendedores.nombre,
              totalPedidos: 0,
              totalSKUs: 0,
              totalCantidad: 0,
              totalValorizado: 0,
            };
          }
          reporte.porVendedor[vendedorKey].totalPedidos++;
          reporte.porVendedor[vendedorKey].totalValorizado += carrito.total_usd;
          reporte.porVendedor[vendedorKey].totalSKUs += carritoSKUs.size;
          reporte.porVendedor[vendedorKey].totalCantidad += carritoCantidad;
        }

        const rubroSKUsMap = new Map<string, Set<string>>();
        carrito.items_pedido?.forEach((i: any) => {
          const prod = i.productos || i.producto;
          if (prod && prod.rubro && prod.sku) {
            if (!rubroSKUsMap.has(prod.rubro)) {
              rubroSKUsMap.set(prod.rubro, new Set<string>());
            }
            rubroSKUsMap.get(prod.rubro)!.add(prod.sku);
          }
        });

        carrito.items_pedido.forEach((item) => {
          const producto = (item as any).productos || (item as any).producto;
          const rubro = producto?.rubro;

          if (rubro) {
            if (!reporte.porRubro[rubro]) {
              reporte.porRubro[rubro] = {
                totalSKUs: 0,
                totalCantidad: 0,
                totalValorizado: 0,
              };
            }
            if (rubroSKUsMap.has(rubro)) {
              reporte.porRubro[rubro].totalSKUs += rubroSKUsMap.get(rubro)!.size;
              rubroSKUsMap.delete(rubro);
            }
            reporte.porRubro[rubro].totalCantidad += item.cantidad;

            const subtotal = (item as any).subtotal_usd || ((item as any).precio_unitario * item.cantidad);
            reporte.porRubro[rubro].totalValorizado += subtotal || 0;
          }
        });
      }
    });

    reporte.totalSKUs = allUniqueSKUs.size;

    return reporte;
  }

  /**
   * Calcula estadísticas por rubro de un pedido/carrito
   */
  static calcularEstadisticasPorRubro(pedido: PedidoFinalizado): CarritoStats {
    const calzados = {
      skus: new Set<string>(),
      cantidadTotal: 0
    };
    const prendas = {
      skus: new Set<string>(),
      cantidadTotal: 0
    };

    if (pedido.items_pedido && pedido.items_pedido.length > 0) {
      pedido.items_pedido.forEach((item) => {
        const producto = (item as any).productos || (item as any).producto;
        const rubro = producto?.rubro;

        if (rubro && producto?.sku) {
          if (rubro.toLowerCase() === 'calzados') {
            calzados.skus.add(producto.sku);
            calzados.cantidadTotal += item.cantidad;
          } else if (rubro.toLowerCase() === 'prendas') {
            prendas.skus.add(producto.sku);
            prendas.cantidadTotal += item.cantidad;
          }
        }
      });
    }

    return {
      calzados: {
        skusCount: calzados.skus.size,
        cantidadTotal: calzados.cantidadTotal
      },
      prendas: {
        skusCount: prendas.skus.size,
        cantidadTotal: prendas.cantidadTotal
      }
    };
  }

  /**
   * Exporta pedidos o carritos a Excel con información detallada
   */
  static async exportarPedidosCarritosExcel(
    pedidos: PedidoFinalizado[],
    tipo: 'finalizados' | 'carritos',
    filename?: string
  ): Promise<void> {
    const tipoNombre = tipo === 'finalizados' ? 'Pedidos_Finalizados' : 'Carritos_Sin_Confirmar';
    const datosExcel: any[] = [];

    for (const pedido of pedidos) {
      const cliente = pedido.clientes?.nombre || 'N/A';
      const vendedor = pedido.vendedores?.nombre || 'N/A';

      if (pedido.items_pedido && pedido.items_pedido.length > 0) {
        for (const item of pedido.items_pedido) {
          const sku = item.productos?.sku || 'N/A';
          const rubro = item.productos?.rubro || 'N/A';
          const precio = item.precio_unitario || 0;

          let xfd = '';
          let fechaDespacho = '';

          if (item.productos) {
            const producto = item.productos;

            if (producto.xfd) {
              if (producto.xfd instanceof Date) {
                xfd = producto.xfd.toLocaleDateString('es-ES');
              } else if (typeof producto.xfd === 'string') {
                try {
                  xfd = new Date(producto.xfd).toLocaleDateString('es-ES');
                } catch (e) {
                  xfd = producto.xfd;
                }
              }
            }

            if (producto.fecha_despacho) {
              if (producto.fecha_despacho instanceof Date) {
                fechaDespacho = producto.fecha_despacho.toLocaleDateString('es-ES');
              } else if (typeof producto.fecha_despacho === 'string') {
                try {
                  fechaDespacho = new Date(producto.fecha_despacho).toLocaleDateString('es-ES');
                } catch (e) {
                  fechaDespacho = producto.fecha_despacho;
                }
              }
            }
          }

          if (tipo === 'carritos') {
            // Obtener datos del carrito desde Supabase
            const { data: carritoData } = await supabase
              .from("carritos_pendientes")
              .select("items")
              .eq("cliente_id", pedido.cliente_id)
              .single();

            if (carritoData && carritoData.items) {
              const items = carritoData.items;
              const cartItem = items.find((i: any) => i.productoId === item.producto_id);

              if (cartItem && cartItem.talles) {
                Object.entries(cartItem.talles).forEach(([talla, cantidad]) => {
                  if (Number(cantidad) > 0) {
                    const cantidadNum = Number(cantidad);
                    const subtotal = precio * cantidadNum;
                    datosExcel.push({
                      'SKU': sku,
                      'Rubro': rubro,
                      'Talla': talla,
                      'Cantidad por talla': cantidadNum,
                      'Precio por SKU': precio,
                      'Subtotal': subtotal,
                      'Vendedor': vendedor,
                      'Cliente': cliente,
                      'XFD': xfd,
                      'Fecha de Despacho': fechaDespacho
                    });
                  }
                });
              } else {
                const cantidadTotal = item.cantidad || 0;
                const subtotal = precio * cantidadTotal;
                datosExcel.push({
                  'SKU': sku,
                  'Rubro': rubro,
                  'Talla': 'Todas',
                  'Cantidad por talla': cantidadTotal,
                  'Precio por SKU': precio,
                  'Subtotal': subtotal,
                  'Vendedor': vendedor,
                  'Cliente': cliente,
                  'XFD': xfd,
                  'Fecha de Despacho': fechaDespacho
                });
              }
            }
          } else {
            // Para pedidos finalizados, usar talles_cantidades si está disponible
            console.log('🔍 Debug exportación - Item:', {
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              tallesCantidades: item.tallesCantidades,
              tieneTalles: !!item.tallesCantidades,
              keysTalles: item.tallesCantidades ? Object.keys(item.tallesCantidades) : 'N/A'
            });
            
            if (item.tallesCantidades && Object.keys(item.tallesCantidades).length > 0) {
              console.log('✅ Usando tallesCantidades para exportación');
              Object.entries(item.tallesCantidades).forEach(([talla, cantidad]) => {
                if (Number(cantidad) > 0) {
                  const cantidadNum = Number(cantidad);
                  const subtotal = precio * cantidadNum;
                  console.log(`📊 Agregando fila: Talla ${talla}, Cantidad ${cantidadNum}`);
                  datosExcel.push({
                    'SKU': sku,
                    'Rubro': rubro,
                    'Talla': talla,
                    'Cantidad por talla': cantidadNum,
                    'Precio por SKU': precio,
                    'Subtotal': subtotal,
                    'Vendedor': vendedor,
                    'Cliente': cliente,
                    'XFD': xfd,
                    'Fecha de Despacho': fechaDespacho
                  });
                }
              });
            } else {
              console.log('❌ Usando fallback - sin talles_cantidades');
              // Fallback al comportamiento anterior si no hay talles_cantidades
              const cantidadTotal = item.cantidad || 0;
              const subtotal = precio * cantidadTotal;
              datosExcel.push({
                'SKU': sku,
                'Rubro': rubro,
                'Talla': 'Todas',
                'Cantidad por talla': cantidadTotal,
                'Precio por SKU': precio,
                'Subtotal': subtotal,
                'Vendedor': vendedor,
                'Cliente': cliente,
                'XFD': xfd,
                'Fecha de Despacho': fechaDespacho
              });
            }
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, tipoNombre);

    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = filename || `${tipoNombre}_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }
}
