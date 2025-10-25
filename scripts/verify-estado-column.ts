import { supabase } from '../src/integrations/supabase/client';

async function verifyEstadoColumn() {
  console.log('🔍 Verificando si la columna "estado" existe en la tabla pedidos...\n');

  try {
    // Intentar hacer una query que incluya el campo estado
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, estado')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('estado')) {
        console.log('❌ La columna "estado" NO existe en la tabla pedidos');
        console.log('\n📝 Error:', error.message);
        console.log('\n✅ Solución: Ejecuta la siguiente SQL en Supabase:');
        console.log('\n' + '='.repeat(70));
        console.log(`
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' 
CHECK (estado IN ('pendiente', 'autorizado', 'rechazado'));

UPDATE public.pedidos 
SET estado = 'pendiente' 
WHERE estado IS NULL;
        `);
        console.log('='.repeat(70));
        return;
      }
      throw error;
    }

    // Si llegamos aquí, la columna existe
    console.log('✅ La columna "estado" SÍ existe en la tabla pedidos');
    console.log('\n📊 Datos de ejemplo:');
    console.log(JSON.stringify(data, null, 2));

    // Contar pedidos por estado
    const { data: pedidosCount, error: countError } = await supabase
      .from('pedidos')
      .select('estado', { count: 'exact' });

    if (!countError && pedidosCount) {
      const grouped = pedidosCount.reduce((acc: any, pedido: any) => {
        const estado = pedido.estado || 'null';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📈 Distribución de pedidos por estado:');
      Object.entries(grouped).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count} pedidos`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error al verificar:', error.message);
  }
}

verifyEstadoColumn();
