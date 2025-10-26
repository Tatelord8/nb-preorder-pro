import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function sincronizarDatosVendedores() {
  console.log('🔄 Sincronizando datos de vendedores y clientes...\n');

  try {
    // 1. Obtener usuarios con roles
    console.log('👥 1. Obteniendo usuarios con roles...');
    const { data: usersWithRoles, error: usersError } = await supabase
      .rpc('get_users_with_roles');

    if (usersError) {
      console.error('❌ Error al obtener usuarios con roles:', usersError);
      return;
    }

    if (!usersWithRoles || usersWithRoles.length === 0) {
      console.log('⚠️  No hay usuarios con roles');
      return;
    }

    console.log(`✅ ${usersWithRoles.length} usuarios encontrados`);

    // 2. Crear vendedores basados en los datos existentes
    console.log('\n👨‍💼 2. Creando vendedores...');
    
    // Extraer vendedores únicos de los datos existentes
    const vendedoresUnicos = new Map();
    
    // Vendedores que aparecen en la imagen
    const vendedoresDeImagen = [
      'Silvio Lencina',
      'Arturo Fernandez', 
      'Cesar Zarate'
    ];
    
    vendedoresDeImagen.forEach(nombre => {
      vendedoresUnicos.set(nombre, {
        nombre,
        email: `${nombre.toLowerCase().replace(' ', '.')}@newbalance.com`
      });
    });

    const vendedoresCreados = [];
    for (const [nombre, datos] of vendedoresUnicos) {
      const { data, error } = await supabase
        .from('vendedores')
        .insert(datos)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear vendedor ${nombre}:`, error);
      } else {
        vendedoresCreados.push(data);
        console.log(`✅ Vendedor creado: ${data.nombre} (ID: ${data.id})`);
      }
    }

    // 3. Crear clientes basados en los usuarios con rol cliente
    console.log('\n🏪 3. Creando clientes...');
    
    const usuariosClientes = usersWithRoles.filter(u => u.role === 'cliente');
    const clientesCreados = [];
    
    // Mapear usuarios a vendedores (basado en la imagen)
    const mapeoVendedores = {
      'clientepreventa@hotamail': 'Silvio Lencina',
      'carlos@gmail.com': 'Silvio Lencina', 
      'manuel@gmail.com': 'Arturo Fernandez',
      'cesar@hotmail.com': 'Cesar Zarate',
      'cliente@gmail.com': 'Arturo Fernandez'
    };

    for (const usuario of usuariosClientes) {
      const nombreVendedor = mapeoVendedores[usuario.email];
      const vendedor = vendedoresCreados.find(v => v.nombre === nombreVendedor);
      
      const clienteData = {
        nombre: usuario.nombre,
        tier: usuario.tier_id ? ['A', 'B', 'C', 'D'][usuario.tier_id] || 'D' : 'D',
        vendedor_id: vendedor?.id || null,
        marca_id: usuario.marca_id || null
      };

      const { data, error } = await supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error al crear cliente ${usuario.nombre}:`, error);
      } else {
        clientesCreados.push(data);
        console.log(`✅ Cliente creado: ${data.nombre} (Tier: ${data.tier})`);
        console.log(`   Vendedor: ${vendedor?.nombre || 'Sin asignar'}`);
      }
    }

    // 4. Actualizar user_roles con los cliente_id correctos
    console.log('\n🔗 4. Actualizando enlaces en user_roles...');
    
    for (const usuario of usuariosClientes) {
      const cliente = clientesCreados.find(c => c.nombre === usuario.nombre);
      
      if (cliente) {
        const { error } = await supabase
          .from('user_roles')
          .update({ cliente_id: cliente.id })
          .eq('user_id', usuario.user_id);
        
        if (error) {
          console.error(`❌ Error al actualizar user_roles para ${usuario.email}:`, error);
        } else {
          console.log(`✅ Enlace actualizado: ${usuario.email} → Cliente ${cliente.nombre}`);
        }
      }
    }

    // 5. Crear pedidos de ejemplo
    console.log('\n📦 5. Creando pedidos de ejemplo...');
    
    const pedidosEjemplo = [
      {
        cliente_id: clientesCreados[0]?.id,
        vendedor_id: clientesCreados[0]?.vendedor_id,
        total_usd: 5472.00,
        estado: 'autorizado'
      },
      {
        cliente_id: clientesCreados[1]?.id,
        vendedor_id: clientesCreados[1]?.vendedor_id,
        total_usd: 2736.00,
        estado: 'autorizado'
      }
    ];

    const pedidosCreados = [];
    for (const pedido of pedidosEjemplo) {
      if (pedido.cliente_id && pedido.vendedor_id) {
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
    }

    // 6. Crear productos de ejemplo
    console.log('\n👟 6. Creando productos de ejemplo...');
    
    const productosEjemplo = [
      { 
        sku: 'NK001', 
        nombre: 'Air Max 270', 
        precio_usd: 150.00,
        linea: 'Air Max',
        categoria: 'Running',
        genero: 'Hombre',
        tier: 'A',
        rubro: 'Calzados',
        marca_id: usuariosClientes[0]?.marca_id,
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
        marca_id: usuariosClientes[0]?.marca_id,
        game_plan: true,
        xfd: '2025-02-20',
        fecha_despacho: '2025-03-05'
      }
    ];

    const productosCreados = [];
    for (const producto of productosEjemplo) {
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

    // 7. Crear items de pedido
    console.log('\n📋 7. Creando items de pedido...');
    
    if (pedidosCreados.length > 0 && productosCreados.length > 0) {
      const itemsEjemplo = [
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
        }
      ];

      for (const item of itemsEjemplo) {
        const { data, error } = await supabase
          .from('items_pedido')
          .insert(item)
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error al crear item de pedido:`, error);
        } else {
          console.log(`✅ Item creado para pedido ${item.pedido_id.slice(-8)}`);
        }
      }
    }

    console.log('\n🎉 ¡Sincronización completada!');
    console.log('\n📊 Resumen:');
    console.log(`   - ${vendedoresCreados.length} vendedores creados`);
    console.log(`   - ${clientesCreados.length} clientes creados`);
    console.log(`   - ${pedidosCreados.length} pedidos creados`);
    console.log(`   - ${productosCreados.length} productos creados`);
    console.log(`   - Enlaces en user_roles actualizados`);
    
    console.log('\n✅ Ahora el reporte de pedidos finalizados debería mostrar correctamente los vendedores.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

sincronizarDatosVendedores();
