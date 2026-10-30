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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      atas: {
        Row: {
          ano: number
          criado_em: string
          data_reuniao: string | null
          decisoes: string
          id: string
          local: string
          mes: number
          pauta: string
          presentes: string
          presidente: string
          secretario: string
          texto_completo: string
        }
        Insert: {
          ano: number
          criado_em?: string
          data_reuniao?: string | null
          decisoes?: string
          id?: string
          local?: string
          mes: number
          pauta?: string
          presentes?: string
          presidente?: string
          secretario?: string
          texto_completo?: string
        }
        Update: {
          ano?: number
          criado_em?: string
          data_reuniao?: string | null
          decisoes?: string
          id?: string
          local?: string
          mes?: number
          pauta?: string
          presentes?: string
          presidente?: string
          secretario?: string
          texto_completo?: string
        }
        Relationships: []
      }
      avisos: {
        Row: {
          created_at: string
          id: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          texto?: string
        }
        Relationships: []
      }
      dizimos: {
        Row: {
          created_at: string
          data: string
          id: string
          nome: string
          obs: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          nome: string
          obs?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          nome?: string
          obs?: string
          valor?: number
        }
        Relationships: []
      }
      escalas: {
        Row: {
          confirmado: boolean
          created_at: string
          data: string
          funcao: string
          id: string
          membro_id: string
          tipo_culto: string
        }
        Insert: {
          confirmado?: boolean
          created_at?: string
          data: string
          funcao: string
          id?: string
          membro_id: string
          tipo_culto: string
        }
        Update: {
          confirmado?: boolean
          created_at?: string
          data?: string
          funcao?: string
          id?: string
          membro_id?: string
          tipo_culto?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string
          data: string
          descricao: string
          horario: string
          id: string
          local: string
          titulo: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string
          horario?: string
          id?: string
          local?: string
          titulo: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          horario?: string
          id?: string
          local?: string
          titulo?: string
        }
        Relationships: []
      }
      membros: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          endereco: string
          foto: string | null
          id: string
          ministerio: string
          nascimento: string | null
          nome: string
          observacao: string
          telefone: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          endereco?: string
          foto?: string | null
          id?: string
          ministerio?: string
          nascimento?: string | null
          nome: string
          observacao?: string
          telefone?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          endereco?: string
          foto?: string | null
          id?: string
          ministerio?: string
          nascimento?: string | null
          nome?: string
          observacao?: string
          telefone?: string
        }
        Relationships: []
      }
      ofertas: {
        Row: {
          created_at: string
          data: string
          id: string
          obs: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          obs?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          obs?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          telefone: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
          telefone?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "pastor" | "lider" | "membro"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pastor", "lider", "membro"],
    },
  },
} as const
