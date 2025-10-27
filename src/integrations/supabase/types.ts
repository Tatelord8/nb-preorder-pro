export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          id: string
          marca_id: string
          nombre: string
          tier: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marca_id: string
          nombre: string
          tier?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marca_id?: string
          nombre?: string
          tier?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      curvas: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      items_pedido: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          pedido_id: string | null
          precio_unitario: number
          producto_id: string | null
          subtotal_usd: number
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          pedido_id?: string | null
          precio_unitario: number
          producto_id?: string | null
          subtotal_usd: number
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          pedido_id?: string | null
          precio_unitario?: number
          producto_id?: string | null
          subtotal_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_pedido_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          activa: boolean | null
          color_primario: string | null
          color_secundario: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          logo_url: string | null
          nombre: string
        }
        Insert: {
          activa?: boolean | null
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
        }
        Update: {
          activa?: boolean | null
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: string | null
          id: string
          total_usd: number
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          total_usd: number
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          total_usd?: number
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string | null
          created_at: string | null
          fecha_despacho: string | null
          game_plan: boolean | null
          genero: string | null
          id: string
          imagen_url: string | null
          linea: string | null
          marca_id: string | null
          nombre: string
          precio_usd: number
          rubro: string
          sku: string
          tier: string | null
          xfd: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          fecha_despacho?: string | null
          game_plan?: boolean | null
          genero?: string | null
          id?: string
          imagen_url?: string | null
          linea?: string | null
          marca_id?: string | null
          nombre: string
          precio_usd: number
          rubro: string
          sku: string
          tier?: string | null
          xfd?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          fecha_despacho?: string | null
          game_plan?: boolean | null
          genero?: string | null
          id?: string
          imagen_url?: string | null
          linea?: string | null
          marca_id?: string | null
          nombre?: string
          precio_usd?: number
          rubro?: string
          sku?: string
          tier?: string | null
          xfd?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          numero: number
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          numero: number
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          numero?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          marca_id: string | null
          nombre: string | null
          role: string
          tier: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          marca_id?: string | null
          nombre?: string | null
          role: string
          tier?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          marca_id?: string | null
          nombre?: string | null
          role?: string
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_user_email: { Args: { user_id: string }; Returns: Json }
      create_superadmin: { Args: { user_id: string }; Returns: undefined }
      create_user_with_role:
        | {
            Args: {
              user_cliente_id?: string
              user_email: string
              user_marca_id?: string
              user_nombre?: string
              user_password: string
              user_role: string
              user_tier_id?: number
            }
            Returns: {
              email: string
              nombre: string
              role: string
              success: boolean
              tier_id: number
              user_id: string
            }[]
          }
        | {
            Args: {
              cliente_id?: string
              marca_id?: string
              user_email: string
              user_password: string
              user_role: string
            }
            Returns: Json
          }
      delete_user: { Args: { user_id_to_delete: string }; Returns: Json }
      get_users_with_roles: {
        Args: never
        Returns: {
          cliente_id: string
          created_at: string
          email: string
          id: string
          marca_id: string
          nombre: string
          role: string
          tier_id: number
          tier_nombre: string
          user_id: string
        }[]
      }
      has_superadmin: { Args: never; Returns: boolean }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_client: { Args: { user_id?: string }; Returns: boolean }
      is_superadmin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const