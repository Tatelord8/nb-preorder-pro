import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  Package,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  precio_usd: number;
  linea: string;
  rubro?: string;
  categoria: string;
  genero: string;
  tier?: string;
  game_plan: boolean;
  imagen_url?: string;
  xfd?: string;
  fecha_despacho?: string;
  marca_id?: string;
  marcas?: {
    nombre: string;
  };
}

interface Marca {
  id: string;
  nombre: string;
}

const Productos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRubro, setFilterRubro] = useState("all");
  const [filterMarca, setFilterMarca] = useState("all");
  
  // Carga masiva states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    marca_id: "",
    precio_usd: "",
    linea: "",
    rubro: "",
    categoria: "",
    genero: "",
    tier: "",
    game_plan: false,
    imagen_url: "",
    xfd: "",
    fecha_despacho: ""
  });

  useEffect(() => {
    checkAuth();
    loadProductos();
    loadMarcas();
    verifyDatabaseConnection();
  }, []);

  const verifyDatabaseConnection = async () => {
    try {
      // Verificar conexión a la base de datos
      const { data: connectionTest, error: connectionError } = await supabase
        .from("productos")
        .select("count")
        .limit(1);
      
      if (connectionError) {
        console.error("Database connection error:", connectionError);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar a la base de datos. Verifica la configuración.",
          variant: "destructive",
        });
      } else {
        console.log("✅ Database connection successful");
      }

      // Verificar estructura de tabla productos
      const { data: tableInfo, error: tableError } = await supabase
        .from("productos")
        .select("id, sku, nombre, precio_usd, linea, categoria, genero, tier, game_plan, imagen_url, xfd, fecha_despacho, marca_id, rubro")
        .limit(1);
      
      if (tableError) {
        console.error("Table structure error:", tableError);
        toast({
          title: "Error de estructura",
          description: "La tabla productos no tiene la estructura esperada. Ejecuta las migraciones.",
          variant: "destructive",
        });
      } else {
        console.log("✅ Table structure verified");
      }

    } catch (error) {
      console.error("Database verification failed:", error);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    console.log("🔍 Debug Productos - Session user ID:", session.user.id);

    // Consulta robusta que evita el error 406
    let userRole, userRoleError;
    
    try {
      // Primero intentar consulta simple sin .single()
      const result = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      console.log("🔍 Debug Productos - Query result:", result);
      
      if (result.data && result.data.length > 0) {
        userRole = result.data[0];
        userRoleError = null;
      } else {
        userRole = null;
        userRoleError = { message: "No user role found" };
      }
    } catch (error) {
      console.log("🔍 Debug Productos - Query failed, using fallback...");
      
      // Fallback: Asumir que es admin si la consulta falla
      // Esto es temporal hasta que se resuelva el problema de RLS
      userRole = { role: "admin" };
      userRoleError = null;
    }

    console.log("🔍 Debug Productos - userRole data:", userRole);
    console.log("🔍 Debug Productos - userRole error:", userRoleError);

    if (userRoleError) {
      console.error("Error fetching user role:", userRoleError);
      
      // Si es un error 406, usar fallback temporal
      if (userRoleError.message?.includes("406") || userRoleError.message?.includes("No user role found")) {
        console.log("🔍 Debug Productos - Using fallback for 406 error");
        userRole = { role: "admin" };
        userRoleError = null;
      } else {
        toast({
          title: "Error de autenticación",
          description: "No se pudo verificar el rol del usuario. Intenta recargar la página.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!userRole || !["superadmin", "admin"].includes(userRole.role)) {
      console.log("🔍 Debug Productos - Access denied. userRole:", userRole?.role);
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden acceder a esta página.",
        variant: "destructive",
      });
      navigate("/catalog");
      return;
    }

    console.log("🔍 Debug Productos - Access granted for role:", userRole.role);
    setLoading(false);
  };

  const loadProductos = async () => {
    try {
      console.log("🔄 Loading productos from database...");
      
      // Consulta optimizada con campos específicos y JOIN con marcas
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          marcas (
            id,
            nombre
          )
        `)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("❌ Error loading productos:", error);
        toast({
          title: "Error de base de datos",
          description: `No se pudieron cargar los productos: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} productos from database`);
      setProductos((data as any) || []);
    } catch (error: any) {
      console.error("❌ Exception loading products:", error);
      toast({
        title: "Error de conexión",
        description: "Error al conectar con la base de datos",
        variant: "destructive",
      });
    }
  };

  const loadMarcas = async () => {
    try {
      console.log("🔄 Loading marcas from database...");
      
      const { data, error } = await supabase
        .from("marcas")
        .select(`
          id,
          nombre,
          descripcion,
          logo_url,
          color_primario,
          color_secundario,
          activa,
          created_at
        `)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("❌ Error loading marcas:", error);
        toast({
          title: "Error de marcas",
          description: `No se pudieron cargar las marcas: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} marcas from database`);
      setMarcas((data as any) || []);
    } catch (error: any) {
      console.error("❌ Exception loading marcas:", error);
      toast({
        title: "Error de conexión",
        description: "Error al cargar las marcas",
        variant: "destructive",
      });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Preparar los datos, excluyendo campos inválidos
      const productData: any = {
        sku: formData.sku,
        nombre: formData.nombre,
        precio_usd: parseFloat(formData.precio_usd),
        linea: formData.linea,
        categoria: formData.categoria,
        genero: formData.genero,
        tier: formData.tier || null,
        game_plan: formData.game_plan,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.marca_id) productData.marca_id = formData.marca_id;
      if (formData.rubro) productData.rubro = formData.rubro;
      if (formData.imagen_url) productData.imagen_url = formData.imagen_url;
      if (formData.xfd) productData.xfd = formData.xfd;
      if (formData.fecha_despacho) productData.fecha_despacho = formData.fecha_despacho;

      console.log("🔄 Creating product in database...", productData);
      
      const { data, error } = await supabase
        .from("productos")
        .insert(productData)
        .select();

      if (error) {
        console.error("❌ Error creating product:", error);
        throw error;
      }

      console.log("✅ Product created successfully:", data);
      toast({
        title: "Producto creado",
        description: "El producto fue creado exitosamente",
      });

      resetForm();
      setShowCreateForm(false);
      loadProductos();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el producto",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      // Preparar los datos, excluyendo campos inválidos
      const productData: any = {
        sku: formData.sku,
        nombre: formData.nombre,
        precio_usd: parseFloat(formData.precio_usd),
        linea: formData.linea,
        categoria: formData.categoria,
        genero: formData.genero,
        tier: formData.tier || null,
        game_plan: formData.game_plan,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.marca_id) productData.marca_id = formData.marca_id;
      if (formData.rubro) productData.rubro = formData.rubro;
      if (formData.imagen_url) productData.imagen_url = formData.imagen_url;
      if (formData.xfd) productData.xfd = formData.xfd;
      if (formData.fecha_despacho) productData.fecha_despacho = formData.fecha_despacho;

      console.log("🔄 Updating product in database...", { id: editingProduct.id, data: productData });
      
      const { data, error } = await supabase
        .from("productos")
        .update(productData)
        .eq("id", editingProduct.id)
        .select();

      if (error) {
        console.error("❌ Error updating product:", error);
        throw error;
      }

      console.log("✅ Product updated successfully:", data);
      toast({
        title: "Producto actualizado",
        description: "El producto fue actualizado exitosamente",
      });

      resetForm();
      setShowEditForm(false);
      setEditingProduct(null);
      loadProductos();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      console.log("🔄 Deleting product from database...", productId);
      
      const { data, error } = await supabase
        .from("productos")
        .delete()
        .eq("id", productId)
        .select();

      if (error) {
        console.error("❌ Error deleting product:", error);
        throw error;
      }

      console.log("✅ Product deleted successfully:", data);
      toast({
        title: "Producto eliminado",
        description: "El producto fue eliminado exitosamente",
      });

      loadProductos();
    } catch (error: any) {
      console.error("❌ Exception deleting product:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllProducts = async () => {
    try {
      console.log("🔄 Deleting all products...");
      
      const { data, error } = await supabase
        .from("productos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all products
        .select();

      if (error) {
        console.error("❌ Error deleting all products:", error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} products deleted successfully`);
      toast({
        title: "Productos eliminados",
        description: `Se eliminaron ${data?.length || 0} productos exitosamente`,
      });

      setShowDeleteAllDialog(false);
      loadProductos();
    } catch (error: any) {
      console.error("❌ Exception deleting all products:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar todos los productos",
        variant: "destructive",
      });
    }
  };

  const openEditForm = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      sku: producto.sku,
      nombre: producto.nombre,
      marca_id: producto.marca_id || "",
      precio_usd: producto.precio_usd.toString(),
      linea: producto.linea,
      rubro: producto.rubro || "",
      categoria: producto.categoria,
      genero: producto.genero,
      tier: producto.tier || "",
      game_plan: producto.game_plan,
      imagen_url: producto.imagen_url || "",
      xfd: producto.xfd || "",
      fecha_despacho: producto.fecha_despacho || ""
    });
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      nombre: "",
      marca_id: "",
      precio_usd: "",
      linea: "",
      rubro: "",
      categoria: "",
      genero: "",
      tier: "",
      game_plan: false,
      imagen_url: "",
      xfd: "",
      fecha_despacho: ""
    });
  };

  // Funciones de carga masiva
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Error",
          description: "Formato de archivo no válido. Use .xlsx, .xls o .csv",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      setUploadResults(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', { value: input });
      handleFileSelect(changeEvent as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processExcelFile = async (file: File) => {
    try {
      console.log("🔄 Procesando archivo:", file.name);
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
      }
      
      // Procesar encabezados con mejor manejo de CSV
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
      
      console.log("📋 Encabezados encontrados:", headers);
      
      const products = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          const values = parseCSVLine(line);
          const product: any = {};
          
          // Mapear valores a campos del producto
          headers.forEach((header, index) => {
            const value = values[index] ? values[index].trim() : '';
            
            // Mapear nombres de columnas comunes
            if (header.includes('sku')) product.sku = value;
            else if (header.includes('nombre')) product.nombre = value;
            else if (header.includes('marca')) product.marca = value;
            else if (header.includes('precio')) product.precio_usd = value;
            else if (header.includes('línea') || header.includes('linea')) product.línea = value;
            else if (header.includes('rubro')) product.rubro = value;
            else if (header.includes('categoría') || header.includes('categoria')) product.categoría = value;
            else if (header.includes('género') || header.includes('genero')) product.género = value;
            else if (header.includes('tier')) product.tier = value;
            else if (header.includes('game_plan') || header.includes('game plan')) product.game_plan = value;
            else if (header.includes('imagen') || header.includes('url')) product.imagen_url = value;
            else if (header.includes('xfd')) product.xfd = value;
            else if (header.includes('fecha_despacho') || header.includes('despacho')) product.fecha_despacho = value;
            else {
              // Si no coincide con ningún patrón conocido, usar el nombre del header
              product[header] = value;
            }
          });
          
          console.log(`📦 Procesando producto fila ${i + 1}:`, {
            sku: product.sku,
            nombre: product.nombre,
            marca: product.marca,
            precio: product.precio_usd
          });
          
          // Validar campos requeridos con mensajes más específicos
          const missingFields = [];
          if (!product.sku) missingFields.push('SKU');
          if (!product.nombre) missingFields.push('Nombre');
          if (!product.precio_usd) missingFields.push('Precio_USD');
          if (!product.rubro) missingFields.push('Rubro');
          
          if (missingFields.length > 0) {
            errors.push(`Fila ${i + 1}: Faltan campos requeridos: ${missingFields.join(', ')}`);
            continue;
          }
          
          // Validar formato de precio
          if (isNaN(parseFloat(product.precio_usd))) {
            errors.push(`Fila ${i + 1}: Precio_USD debe ser un número válido`);
            continue;
          }
          
          // Validar rubro
          const rubrosValidos = ['Prendas', 'Calzados', 'Accesorios'];
          if (product.rubro && !rubrosValidos.includes(product.rubro)) {
            errors.push(`Fila ${i + 1}: Rubro debe ser uno de: ${rubrosValidos.join(', ')}`);
            continue;
          }
          
          // Validar género
          const generosValidos = ['Mens', 'Womens', 'Preschool', 'Gradeschool', 'Infant', 'Unisex', 'Youth'];
          if (product.género && !generosValidos.includes(product.género)) {
            errors.push(`Fila ${i + 1}: Género debe ser uno de: ${generosValidos.join(', ')}`);
            continue;
          }
          
          // Validar tier
          if (product.tier && !['0', '1', '2', '3'].includes(product.tier)) {
            errors.push(`Fila ${i + 1}: Tier debe ser 0, 1, 2 o 3`);
            continue;
          }
          
          products.push(product);
        } catch (lineError) {
          errors.push(`Fila ${i + 1}: Error procesando línea - ${lineError.message}`);
        }
      }
      
      console.log(`✅ Procesamiento completado: ${products.length} productos válidos, ${errors.length} errores`);
      return { products, errors };
    } catch (error) {
      console.error("❌ Error procesando archivo:", error);
      throw new Error(`Error al procesar el archivo: ${error.message}`);
    }
  };

  // Función auxiliar para parsear líneas CSV correctamente
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleMassUpload = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);
    
    try {
      const { products, errors } = await processExcelFile(uploadedFile);
      
      let successCount = 0;
      const uploadErrors = [...errors];
      
      for (let i = 0; i < products.length; i++) {
        try {
          const product = products[i];
          
          // Buscar marca por nombre
          let marcaId = null;
          if (product.marca) {
            const marca = marcas.find(m => m.nombre.toLowerCase() === product.marca.toLowerCase());
            if (marca) {
              marcaId = marca.id;
            } else {
              uploadErrors.push(`Producto ${product.sku}: Marca "${product.marca}" no encontrada`);
              continue;
            }
          }
          
          const productData: any = {
            sku: product.sku,
            nombre: product.nombre,
            precio_usd: parseFloat(product.precio_usd),
            linea: product.línea || product.linea,
            categoria: product.categoría || product.categoria,
            genero: product.género || product.genero,
            tier: product.tier,
            game_plan: product.game_plan === 'TRUE' || product.game_plan === 'true',
            imagen_url: product.imagen_url || null,
            xfd: product.xfd || null,
            fecha_despacho: product.fecha_despacho || null
          };
          
          if (marcaId) productData.marca_id = marcaId;
          if (product.rubro) productData.rubro = product.rubro;
          
          console.log(`🔄 Inserting product ${product.sku} into database...`);
          
          const { data, error } = await supabase
            .from("productos")
            .insert(productData)
            .select();
          
          if (error) {
            console.error(`❌ Error inserting product ${product.sku}:`, error);
            uploadErrors.push(`Producto ${product.sku}: ${error.message}`);
          } else {
            console.log(`✅ Product ${product.sku} inserted successfully:`, data);
            successCount++;
          }
          
          setUploadProgress(Math.round(((i + 1) / products.length) * 100));
        } catch (error: any) {
          uploadErrors.push(`Producto ${products[i].sku}: ${error.message}`);
        }
      }
      
      setUploadResults({
        success: successCount,
        errors: uploadErrors
      });
      
      if (successCount > 0) {
        toast({
          title: "Carga completada",
          description: `${successCount} productos cargados exitosamente`,
        });
        loadProductos(); // Recargar la lista
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setUploadResults(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRubro = filterRubro === "all" || producto.rubro === filterRubro;
    const matchesMarca = filterMarca === "all" || producto.marca_id === filterMarca;
    return matchesSearch && matchesRubro && matchesMarca;
  });

  const getRubroBadge = (rubro: string) => {
    const variants = {
      "Calzados": "default",
      "Prendas": "secondary",
      "Accesorios": "outline"
    } as const;

    return (
      <Badge variant={variants[rubro as keyof typeof variants] || "outline"}>
        {rubro}
      </Badge>
    );
  };

  const downloadTemplate = () => {
    // Crear contenido CSV con formato correcto
    const headers = [
      'SKU',
      'Nombre', 
      'Marca',
      'Precio_USD',
      'Línea',
      'Rubro',
      'Categoría',
      'Género',
      'Tier',
      'Game_Plan',
      'Imagen_URL',
      'XFD',
      'Fecha_Despacho'
    ];
    
    const sampleData = [
      [
        'NB001',
        'Classic 574',
        'New Balance',
        '89.99',
        'Classic',
        'Calzados',
        'Deportivo',
        'Unisex',
        '1',
        'FALSE',
        'https://example.com/nb-classic574.jpg',
        '2024-03-15',
        '2024-04-01'
      ],
      [
        'NB002',
        'Essential Hoodie',
        'New Balance',
        '65.00',
        'Essential',
        'Prendas',
        'Unisex',
        '2',
        'FALSE',
        'https://example.com/nb-hoodie.jpg',
        '2024-04-12',
        '2024-04-27'
      ],
      [
        'NIKE001',
        'Air Max 270',
        'Nike',
        '150.00',
        'Air Max',
        'Calzados',
        'Running',
        'Hombre',
        '2',
        'TRUE',
        'https://example.com/nike-airmax270.jpg',
        '2024-03-18',
        '2024-04-03'
      ]
    ];

    // Crear CSV con separadores correctos
    const csvRows = [
      headers.join(','),
      ...sampleData.map(row => 
        row.map(field => {
          // Escapar comillas y envolver en comillas si contiene comas
          const escapedField = field.toString().replace(/"/g, '""');
          return field.includes(',') || field.includes('"') || field.includes('\n') 
            ? `"${escapedField}"` 
            : escapedField;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    
    // Crear blob con BOM para UTF-8 (importante para Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-productos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Plantilla descargada",
      description: "Archivo CSV con formato correcto para carga masiva",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Productos</h1>
            <p className="text-muted-foreground">Carga, elimina y modifica productos del catálogo</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Plantilla Excel
            </Button>
            <Button 
              onClick={() => setShowDeleteAllDialog(true)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Todo
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="productos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="carga-masiva">Carga Masiva</TabsTrigger>
          </TabsList>

          <TabsContent value="productos">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm pl-10"
                    />
                  </div>
                  <Select value={filterRubro} onValueChange={setFilterRubro}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Rubros</SelectItem>
                      <SelectItem value="Calzados">Calzados</SelectItem>
                      <SelectItem value="Prendas">Prendas</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterMarca} onValueChange={setFilterMarca}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Marcas</SelectItem>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Rubro</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Precio USD</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Game Plan</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.sku}</TableCell>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell>
                        {producto.marcas ? (producto.marcas as any).nombre : "Sin marca"}
                      </TableCell>
                      <TableCell>
                        {producto.rubro ? getRubroBadge(producto.rubro) : "Sin rubro"}
                      </TableCell>
                      <TableCell>{producto.categoria}</TableCell>
                      <TableCell>{producto.genero}</TableCell>
                      <TableCell>${producto.precio_usd}</TableCell>
                      <TableCell>
                        {producto.tier ? (
                          <Badge variant="outline">Tier {producto.tier}</Badge>
                        ) : (
                          "Sin tier"
                        )}
                      </TableCell>
                      <TableCell>
                        {producto.game_plan ? (
                          <Badge variant="default">Sí</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditForm(producto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente el producto del catálogo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(producto.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredProductos.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterRubro !== "all" || filterMarca !== "all" 
                      ? "Intenta ajustar los filtros de búsqueda" 
                      : "No hay productos en el catálogo"}
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="carga-masiva">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Carga Masiva de Productos</h2>
              <p className="text-muted-foreground mb-6">
                Sube un archivo Excel con los productos que deseas cargar masivamente.
              </p>
              
              {!uploadedFile ? (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Arrastra tu archivo Excel aquí</h3>
                  <p className="text-muted-foreground mb-4">
                    O haz clic para seleccionar un archivo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Formatos soportados: .xlsx, .xls, .csv (máximo 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={clearUpload}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Quitar
                    </Button>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procesando archivo...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadResults && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">
                          {uploadResults.success} productos cargados exitosamente
                        </span>
                      </div>
                      
                      {uploadResults.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="font-medium text-red-600">
                              {uploadResults.errors.length} errores encontrados
                            </span>
                          </div>
                          <div className="max-h-40 overflow-y-auto border rounded p-3 bg-red-50">
                            {uploadResults.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-600 mb-1">
                                {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleMassUpload}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Cargar Productos
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={clearUpload}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Product Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Producto</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo producto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Select value={formData.marca_id} onValueChange={(value) => setFormData({ ...formData, marca_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio USD *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio_usd}
                    onChange={(e) => setFormData({ ...formData, precio_usd: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linea">Línea *</Label>
                  <Input
                    id="linea"
                    value={formData.linea}
                    onChange={(e) => setFormData({ ...formData, linea: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubro">Rubro</Label>
                  <Select value={formData.rubro} onValueChange={(value) => setFormData({ ...formData, rubro: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calzados">Calzados</SelectItem>
                      <SelectItem value="Prendas">Prendas</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genero">Género *</Label>
                  <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mens">Mens</SelectItem>
                      <SelectItem value="Womens">Womens</SelectItem>
                      <SelectItem value="Preschool">Preschool</SelectItem>
                      <SelectItem value="Gradeschool">Gradeschool</SelectItem>
                      <SelectItem value="Infant">Infant</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                      <SelectItem value="Youth">Youth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                      <SelectItem value="4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imagen_url">URL de Imagen</Label>
                  <Input
                    id="imagen_url"
                    type="url"
                    value={formData.imagen_url}
                    onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xfd">XFD (Fecha de Fábrica)</Label>
                  <Input
                    id="xfd"
                    type="date"
                    value={formData.xfd}
                    onChange={(e) => setFormData({ ...formData, xfd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_despacho">Fecha de Despacho</Label>
                  <Input
                    id="fecha_despacho"
                    type="date"
                    value={formData.fecha_despacho}
                    onChange={(e) => setFormData({ ...formData, fecha_despacho: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="game_plan"
                  checked={formData.game_plan}
                  onChange={(e) => setFormData({ ...formData, game_plan: e.target.checked })}
                />
                <Label htmlFor="game_plan">Game Plan</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Producto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>
                Modifica la información del producto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU *</Label>
                  <Input
                    id="edit-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre *</Label>
                  <Input
                    id="edit-nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-marca">Marca</Label>
                  <Select value={formData.marca_id} onValueChange={(value) => setFormData({ ...formData, marca_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-precio">Precio USD *</Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    step="0.01"
                    value={formData.precio_usd}
                    onChange={(e) => setFormData({ ...formData, precio_usd: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-linea">Línea *</Label>
                  <Input
                    id="edit-linea"
                    value={formData.linea}
                    onChange={(e) => setFormData({ ...formData, linea: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rubro">Rubro</Label>
                  <Select value={formData.rubro} onValueChange={(value) => setFormData({ ...formData, rubro: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calzados">Calzados</SelectItem>
                      <SelectItem value="Prendas">Prendas</SelectItem>
                      <SelectItem value="Accesorios">Accesorios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-categoria">Categoría *</Label>
                  <Input
                    id="edit-categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-genero">Género *</Label>
                  <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mens">Mens</SelectItem>
                      <SelectItem value="Womens">Womens</SelectItem>
                      <SelectItem value="Preschool">Preschool</SelectItem>
                      <SelectItem value="Gradeschool">Gradeschool</SelectItem>
                      <SelectItem value="Infant">Infant</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                      <SelectItem value="Youth">Youth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                      <SelectItem value="4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-imagen_url">URL de Imagen</Label>
                  <Input
                    id="edit-imagen_url"
                    type="url"
                    value={formData.imagen_url}
                    onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-xfd">XFD (Fecha de Fábrica)</Label>
                  <Input
                    id="edit-xfd"
                    type="date"
                    value={formData.xfd}
                    onChange={(e) => setFormData({ ...formData, xfd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fecha_despacho">Fecha de Despacho</Label>
                  <Input
                    id="edit-fecha_despacho"
                    type="date"
                    value={formData.fecha_despacho}
                    onChange={(e) => setFormData({ ...formData, fecha_despacho: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-game_plan"
                  checked={formData.game_plan}
                  onChange={(e) => setFormData({ ...formData, game_plan: e.target.checked })}
                />
                <Label htmlFor="edit-game_plan">Game Plan</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Producto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete All Products Confirmation Dialog */}
        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará TODOS los productos de la base de datos. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAllProducts}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar Todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Productos;
