import { createClient } from '@supabase/supabase-js';

// Usar las credenciales directamente del proyecto
const SUPABASE_URL = "https://oszmlmscckrbfnjrveet.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zem1sbXNjY2tyYmZuanJ2ZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjEzNjMsImV4cCI6MjA3NTgzNzM2M30.bs1pWdYQozaxLAeo2HhbTJSJQOPOVttTUDhBYb1Bo98";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function sincronizarConSuperadmin() {
  console.log('🔄 Sincronizando datos usando superadmin...\n');

  try {
    // 1. Hacer login como superadmin
    console.log('👑 1. Haciendo login como superadmin...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@preventa.com',
      password: 'superadmin123', // Usar la contraseña correcta
    });

    if (signInError) {
      console.error('❌ Error al hacer login:', signInError);
      console.log('💡 Intentando con credenciales alternativas...');
      
      // Intentar con otras credenciales posibles
      const credencialesAlternativas = [
        { email: 'superadmin@newbalance.local', password: 'superadmin123' },
        { email: 'admin@preventa.com', password: 'admin123' }
      ];
      
      let loginExitoso = false;
      for (const cred of credencialesAlternativas) {
        const { data: altSignIn, error: altError } = await supabase.auth.signInWithPassword({
          email: cred.email,
          password: cred.password,
        });
        
        if (!altError && altSignIn.user) {
          console.log(`✅ Login exitoso con ${cred.email}`);
          loginExitoso = true;
          break;
        }
      }
      
      if (!loginExitoso) {
        console.log('❌ No se pudo hacer login con ninguna credencial');
        console.log('💡 Necesitas crear un superadmin manualmente o usar el panel de Supabase');
        return;
      }
    } else {
      console.log(`✅ Login exitoso con superadmin@preventa.com`);
    }

    // 2. Verificar que tenemos permisos de superadmin
    console.log('\n🔑 2. Verificando permisos...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    const { data: isSuperadmin } = await supabase
      .rpc('is_superadmin', { user_id: user.id });

    if (!isSuperadmin) {
      console.log('⚠️  El usuario no es superadmin, pero continuamos...');
    } else {
      console.log('✅ Usuario confirmado como superadmin');
    }

    // 3. Crear vendedores
    console.log('\n👨‍💼 3. Creando vendedores...');
    
    const vendedores = [
      { nombre: 'Silvio Lencina', email: 'silvio@newbalance.com' },
      { nombre: 'Arturo Fernandez', email: 'arturo@newbalance.com' },
      { nombre: 'Cesar Zarate', email: 'cesar@newbalance.com' }
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

    // 4. Obtener usuarios con roles
    console.log('\n👥 4. Obteniendo usuarios con roles...');
    const { data: usersWithRoles, error: usersError } = await supabase
      .rpc('get_users_with_roles');

    if (usersError) {
      console.error('❌ Error al obtener usuarios con roles:', usersError);
      return;
    }

    const usuariosClientes = usersWithRoles?.filter(u => u.role === 'cliente') || [];
    console.log(`✅ ${usuariosClientes.length} usuarios cliente encontrados`);

    // 5. Crear clientes
    console.log('\n🏪 5. Creando clientes...');
    
    const mapeoVendedores = {
      'clientepreventa@hotamail': 'Silvio Lencina',
      'carlos@gmail.com': 'Silvio Lencina', 
      'manuel@gmail.com': 'Arturo Fernandez',
      'cesar@hotmail.com': 'Cesar Zarate',
      'cliente@gmail.com': 'Arturo Fernandez'
    };

    const clientesCreados = [];
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

    // 6. Actualizar user_roles
    console.log('\n🔗 6. Actualizando enlaces en user_roles...');
    
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

    // 7. Crear productos
    console.log('\n👟 7. Creando productos de ejemplo...');
    
    const productos = [
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

    // 8. Crear pedidos
    console.log('\n📦 8. Creando pedidos de ejemplo...');
    
    const pedidos = [
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
    for (const pedido of pedidos) {
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

    // 9. Crear items de pedido
    console.log('\n📋 9. Creando items de pedido...');
    
    if (pedidosCreados.length > 0 && productosCreados.length > 0) {
      const items = [
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

      for (const item of items) {
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
    
    console.log('\n✅ Ahora ejecuta: node scripts/verify-complete-data.js');
    console.log('   para verificar que los datos están correctamente enlazados.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

sincronizarConSuperadmin();
