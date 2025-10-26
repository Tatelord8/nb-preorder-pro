import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function poblarBaseDeDatosDirecto() {
  console.log('🚀 Poblando base de datos directamente (bypassing RLS)...\n');

  try {
    // 1. Crear vendedores usando SQL directo
    console.log('👨‍💼 1. Creando vendedores...');
    const { data: vendedoresCreados, error: vendedoresError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          INSERT INTO public.vendedores (nombre, email) VALUES
          ('Silvio Lencina', 'silvio@newbalance.com'),
          ('María González', 'maria@newbalance.com'),
          ('Carlos Rodríguez', 'carlos@newbalance.com'),
          ('Ana Martínez', 'ana@newbalance.com')
          RETURNING *;
        `
      });

    if (vendedoresError) {
      console.error('❌ Error al crear vendedores:', vendedoresError);
      // Intentar método alternativo
      console.log('🔄 Intentando método alternativo...');
      
      // Crear vendedores uno por uno
      const vendedores = [
        { nombre: 'Silvio Lencina', email: 'silvio@newbalance.com' },
        { nombre: 'María González', email: 'maria@newbalance.com' },
        { nombre: 'Carlos Rodríguez', email: 'carlos@newbalance.com' },
        { nombre: 'Ana Martínez', email: 'ana@newbalance.com' }
      ];

      const vendedoresCreados = [];
      for (const vendedor of vendedores) {
        const { data, error } = await supabase
          .from('vendedores')
          .insert(vendedor)
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error al crear vendedor ${vendedor.nombre}:`, error);
        } else {
          vendedoresCreados.push(data);
          console.log(`✅ Vendedor creado: ${data.nombre} (ID: ${data.id})`);
        }
      }
    } else {
      console.log(`✅ ${vendedoresCreados.length} vendedores creados`);
    }

    // 2. Crear marcas
    console.log('\n🏷️ 2. Creando marcas...');
    const marcas = [
      { 
        nombre: 'Nike', 
        descripcion: 'Just Do It',
        activa: true,
        color_primario: '#000000',
        color_secundario: '#FFFFFF'
      },
      { 
        nombre: 'Adidas', 
        descripcion: 'Impossible is Nothing',
        activa: true,
        color_primario: '#000000',
        color_secundario: '#FFFFFF'
      },
      { 
        nombre: 'New Balance', 
        descripcion: 'Fearlessly Independent',
        activa: true,
        color_primario: '#000000',
        color_secundario: '#FFFFFF'
      }
    ];

    const marcasCreadas = [];
    for (const marca of marcas) {
      const { data, error } = await supabase
        .from('marcas')
        .insert(marca)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear marca ${marca.nombre}:`, error);
      } else {
        marcasCreadas.push(data);
        console.log(`✅ Marca creada: ${data.nombre} (ID: ${data.id})`);
      }
    }

    // 3. Crear clientes
    console.log('\n👥 3. Creando clientes...');
    const clientes = [
      { 
        nombre: 'Este shop', 
        tier: 'A',
        vendedor_id: vendedoresCreados[0].id,
        marca_id: marcasCreadas[0].id
      },
      { 
        nombre: 'Deportes Central', 
        tier: 'B',
        vendedor_id: vendedoresCreados[1].id,
        marca_id: marcasCreadas[1].id
      },
      { 
        nombre: 'Sport Max', 
        tier: 'C',
        vendedor_id: vendedoresCreados[2].id,
        marca_id: marcasCreadas[2].id
      },
      { 
        nombre: 'Athletic Store', 
        tier: 'D',
        vendedor_id: vendedoresCreados[3].id,
        marca_id: marcasCreadas[0].id
      }
    ];

    const clientesCreados = [];
    for (const cliente of clientes) {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear cliente ${cliente.nombre}:`, error);
      } else {
        clientesCreados.push(data);
        console.log(`✅ Cliente creado: ${data.nombre} (Tier: ${data.tier})`);
      }
    }

    // 4. Crear productos
    console.log('\n👟 4. Creando productos...');
    const productos = [
      // Nike
      { 
        sku: 'NK001', 
        nombre: 'Air Max 270', 
        precio_usd: 150.00,
        linea: 'Air Max',
        categoria: 'Running',
        genero: 'Hombre',
        tier: 'A',
        rubro: 'Calzados',
        marca_id: marcasCreadas[0].id,
        game_plan: false,
        xfd: '2025-02-15',
        fecha_despacho: '2025-03-01'
      },
      { 
        sku: 'NK002', 
        nombre: 'Air Force 1', 
        precio_usd: 90.00,
        linea: 'Air Force',
        categoria: 'Lifestyle',
        genero: 'Unisex',
        tier: 'B',
        rubro: 'Calzados',
        marca_id: marcasCreadas[0].id,
        game_plan: true,
        xfd: '2025-02-20',
        fecha_despacho: '2025-03-05'
      },
      // Adidas
      { 
        sku: 'AD001', 
        nombre: 'Ultraboost 22', 
        precio_usd: 180.00,
        linea: 'Ultraboost',
        categoria: 'Running',
        genero: 'Mujer',
        tier: 'A',
        rubro: 'Calzados',
        marca_id: marcasCreadas[1].id,
        game_plan: false,
        xfd: '2025-02-25',
        fecha_despacho: '2025-03-10'
      },
      { 
        sku: 'AD002', 
        nombre: 'Stan Smith', 
        precio_usd: 80.00,
        linea: 'Originals',
        categoria: 'Lifestyle',
        genero: 'Unisex',
        tier: 'C',
        rubro: 'Calzados',
        marca_id: marcasCreadas[1].id,
        game_plan: false,
        xfd: '2025-03-01',
        fecha_despacho: '2025-03-15'
      },
      // New Balance
      { 
        sku: 'NB001', 
        nombre: '990v5', 
        precio_usd: 185.00,
        linea: '990',
        categoria: 'Running',
        genero: 'Hombre',
        tier: 'A',
        rubro: 'Calzados',
        marca_id: marcasCreadas[2].id,
        game_plan: true,
        xfd: '2025-03-05',
        fecha_despacho: '2025-03-20'
      },
      { 
        sku: 'NB002', 
        nombre: '327', 
        precio_usd: 100.00,
        linea: '327',
        categoria: 'Lifestyle',
        genero: 'Unisex',
        tier: 'B',
        rubro: 'Calzados',
        marca_id: marcasCreadas[2].id,
        game_plan: false,
        xfd: '2025-03-10',
        fecha_despacho: '2025-03-25'
      }
    ];

    const productosCreados = [];
    for (const producto of productos) {
      const { data, error } = await supabase
        .from('productos')
        .insert(producto)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear producto ${producto.sku}:`, error);
      } else {
        productosCreados.push(data);
        console.log(`✅ Producto creado: ${data.sku} - ${data.nombre}`);
      }
    }

    // 5. Crear pedidos de ejemplo
    console.log('\n📦 5. Creando pedidos de ejemplo...');
    const pedidos = [
      {
        cliente_id: clientesCreados[0].id,
        vendedor_id: clientesCreados[0].vendedor_id,
        total_usd: 5472.00,
        estado: 'autorizado'
      },
      {
        cliente_id: clientesCreados[0].id,
        vendedor_id: clientesCreados[0].vendedor_id,
        total_usd: 2736.00,
        estado: 'autorizado'
      }
    ];

    const pedidosCreados = [];
    for (const pedido of pedidos) {
      const { data, error } = await supabase
        .from('pedidos')
        .insert(pedido)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear pedido:`, error);
      } else {
        pedidosCreados.push(data);
        console.log(`✅ Pedido creado: ${data.id.slice(-8)} - $${data.total_usd}`);
      }
    }

    // 6. Crear items de pedido
    console.log('\n📋 6. Creando items de pedido...');
    const itemsPedido = [
      // Pedido 1
      {
        pedido_id: pedidosCreados[0].id,
        producto_id: productosCreados[0].id,
        cantidad: 24,
        precio_unitario: productosCreados[0].precio_usd,
        subtotal_usd: 24 * productosCreados[0].precio_usd
      },
      {
        pedido_id: pedidosCreados[0].id,
        producto_id: productosCreados[1].id,
        cantidad: 24,
        precio_unitario: productosCreados[1].precio_usd,
        subtotal_usd: 24 * productosCreados[1].precio_usd
      },
      // Pedido 2
      {
        pedido_id: pedidosCreados[1].id,
        producto_id: productosCreados[2].id,
        cantidad: 24,
        precio_unitario: productosCreados[2].precio_usd,
        subtotal_usd: 24 * productosCreados[2].precio_usd
      }
    ];

    const itemsCreados = [];
    for (const item of itemsPedido) {
      const { data, error } = await supabase
        .from('items_pedido')
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear item de pedido:`, error);
      } else {
        itemsCreados.push(data);
        console.log(`✅ Item creado para pedido ${item.pedido_id.slice(-8)}`);
      }
    }

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${vendedoresCreados.length} vendedores`);
    console.log(`   - ${marcasCreadas.length} marcas`);
    console.log(`   - ${clientesCreados.length} clientes`);
    console.log(`   - ${productosCreados.length} productos`);
    console.log(`   - ${pedidosCreados.length} pedidos`);
    console.log(`   - ${itemsCreados.length} items de pedido`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

poblarBaseDeDatosDirecto();
