import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function poblarBaseDeDatosConSuperadmin() {
  console.log('🚀 Poblando base de datos con datos de ejemplo usando superadmin...\n');

  try {
    // 1. Crear un usuario superadmin temporal
    console.log('👑 1. Creando usuario superadmin temporal...');
    
    const email = 'superadmin@newbalance.local';
    const password = 'superadmin123';
    
    // Crear usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('❌ Error al crear usuario:', signUpError);
      return;
    }

    if (!signUpData.user) {
      console.error('❌ No se pudo crear el usuario');
      return;
    }

    console.log(`✅ Usuario creado: ${email} (ID: ${signUpData.user.id})`);

    // Crear superadmin usando la función
    const { data: superadminData, error: superadminError } = await supabase
      .rpc('create_superadmin', { user_id: signUpData.user.id });

    if (superadminError) {
      console.error('❌ Error al crear superadmin:', superadminError);
      return;
    }

    console.log('✅ Superadmin creado exitosamente');

    // 2. Crear vendedores
    console.log('\n👨‍💼 2. Creando vendedores...');
    const vendedores = [
      { nombre: 'Silvio Lencina', email: 'silvio@newbalance.com' },
      { nombre: 'María González', email: 'maria@newbalance.com' },
      { nombre: 'Carlos Rodríguez', email: 'carlos@newbalance.com' },
      { nombre: 'Ana Martínez', email: 'ana@newbalance.com' }
    ];

    const { data: vendedoresCreados, error: vendedoresError } = await supabase
      .from('vendedores')
      .insert(vendedores)
      .select();

    if (vendedoresError) {
      console.error('❌ Error al crear vendedores:', vendedoresError);
      return;
    }

    console.log(`✅ ${vendedoresCreados.length} vendedores creados:`);
    vendedoresCreados.forEach((v, index) => {
      console.log(`   ${index + 1}. ${v.nombre} (ID: ${v.id})`);
    });

    // 3. Crear marcas
    console.log('\n🏷️ 3. Creando marcas...');
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

    const { data: marcasCreadas, error: marcasError } = await supabase
      .from('marcas')
      .insert(marcas)
      .select();

    if (marcasError) {
      console.error('❌ Error al crear marcas:', marcasError);
      return;
    }

    console.log(`✅ ${marcasCreadas.length} marcas creadas:`);
    marcasCreadas.forEach((m, index) => {
      console.log(`   ${index + 1}. ${m.nombre} (ID: ${m.id})`);
    });

    // 4. Crear clientes
    console.log('\n👥 4. Creando clientes...');
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

    const { data: clientesCreados, error: clientesError } = await supabase
      .from('clientes')
      .insert(clientes)
      .select();

    if (clientesError) {
      console.error('❌ Error al crear clientes:', clientesError);
      return;
    }

    console.log(`✅ ${clientesCreados.length} clientes creados:`);
    clientesCreados.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.nombre} (Tier: ${c.tier}, Vendedor: ${c.vendedor_id})`);
    });

    // 5. Crear productos
    console.log('\n👟 5. Creando productos...');
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

    const { data: productosCreados, error: productosError } = await supabase
      .from('productos')
      .insert(productos)
      .select();

    if (productosError) {
      console.error('❌ Error al crear productos:', productosError);
      return;
    }

    console.log(`✅ ${productosCreados.length} productos creados:`);
    productosCreados.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.sku} - ${p.nombre} ($${p.precio_usd})`);
    });

    // 6. Crear pedidos de ejemplo
    console.log('\n📦 6. Creando pedidos de ejemplo...');
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

    const { data: pedidosCreados, error: pedidosError } = await supabase
      .from('pedidos')
      .insert(pedidos)
      .select();

    if (pedidosError) {
      console.error('❌ Error al crear pedidos:', pedidosError);
      return;
    }

    console.log(`✅ ${pedidosCreados.length} pedidos creados:`);
    pedidosCreados.forEach((p, index) => {
      console.log(`   ${index + 1}. Pedido ${p.id.slice(-8)} - $${p.total_usd} (${p.estado})`);
    });

    // 7. Crear items de pedido
    console.log('\n📋 7. Creando items de pedido...');
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

    const { data: itemsCreados, error: itemsError } = await supabase
      .from('items_pedido')
      .insert(itemsPedido)
      .select();

    if (itemsError) {
      console.error('❌ Error al crear items de pedido:', itemsError);
      return;
    }

    console.log(`✅ ${itemsCreados.length} items de pedido creados`);

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${vendedoresCreados.length} vendedores`);
    console.log(`   - ${marcasCreadas.length} marcas`);
    console.log(`   - ${clientesCreados.length} clientes`);
    console.log(`   - ${productosCreados.length} productos`);
    console.log(`   - ${pedidosCreados.length} pedidos`);
    console.log(`   - ${itemsCreados.length} items de pedido`);
    
    console.log('\n🔑 Credenciales del superadmin:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

poblarBaseDeDatosConSuperadmin();
