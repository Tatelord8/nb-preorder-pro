/**
 * Hook para obtener el contador de pedidos pendientes
 * Solo para superadmin
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';

export function usePedidosPendientesCount() {
  return useQuery({
    queryKey: ['pedidos-pendientes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      if (error) {
        console.error('Error obteniendo contador de pedidos pendientes:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}




