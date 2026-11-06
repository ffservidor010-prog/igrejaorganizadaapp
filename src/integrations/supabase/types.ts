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
          igreja_id: string
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
          igreja_id?: string
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
          igreja_id?: string
          local?: string
          mes?: number
          pauta?: string
          presentes?: string
          presidente?: string
          secretario?: string
          texto_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          created_at: string
          id: string
          igreja_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          igreja_id?: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          igreja_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      cultos: {
        Row: {
          created_at: string
          data_unica: string | null
          dia_semana: number | null
          horario: string
          id: string
          igreja_id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_unica?: string | null
          dia_semana?: number | null
          horario?: string
          id?: string
          igreja_id?: string
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_unica?: string | null
          dia_semana?: number | null
          horario?: string
          id?: string
          igreja_id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      dizimos: {
        Row: {
          created_at: string
          data: string
          id: string
          igreja_id: string
          membro_id: string | null
          nome: string
          obs: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          igreja_id?: string
          membro_id?: string | null
          nome: string
          obs?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          membro_id?: string | null
          nome?: string
          obs?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "dizimos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dizimos_membro_igreja"
            columns: ["membro_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
      duvidas: {
        Row: {
          created_at: string
          id: string
          igreja_id: string
          nome: string
          pergunta: string
          respondido_em: string | null
          resposta: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          igreja_id?: string
          nome?: string
          pergunta: string
          respondido_em?: string | null
          resposta?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          igreja_id?: string
          nome?: string
          pergunta?: string
          respondido_em?: string | null
          resposta?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duvidas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          confirmado: boolean
          created_at: string
          culto_id: string | null
          data: string
          funcao: string
          id: string
          igreja_id: string
          membro_id: string
          setor_id: string | null
          tipo_culto: string
        }
        Insert: {
          confirmado?: boolean
          created_at?: string
          culto_id?: string | null
          data: string
          funcao: string
          id?: string
          igreja_id?: string
          membro_id: string
          setor_id?: string | null
          tipo_culto: string
        }
        Update: {
          confirmado?: boolean
          created_at?: string
          culto_id?: string | null
          data?: string
          funcao?: string
          id?: string
          igreja_id?: string
          membro_id?: string
          setor_id?: string | null
          tipo_culto?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_culto_igreja"
            columns: ["culto_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "cultos"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "escalas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_setor_igreja"
            columns: ["setor_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string
          culto_id: string | null
          data: string
          descricao: string
          horario: string
          id: string
          igreja_id: string
          local: string
          titulo: string
        }
        Insert: {
          created_at?: string
          culto_id?: string | null
          data: string
          descricao?: string
          horario?: string
          id?: string
          igreja_id?: string
          local?: string
          titulo: string
        }
        Update: {
          created_at?: string
          culto_id?: string | null
          data?: string
          descricao?: string
          horario?: string
          id?: string
          igreja_id?: string
          local?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_culto_igreja"
            columns: ["culto_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "cultos"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "eventos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria: {
        Row: {
          caminho: string | null
          created_at: string
          data: string
          id: string
          igreja_id: string
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          caminho?: string | null
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          tipo?: string
          titulo?: string
          url: string
        }
        Update: {
          caminho?: string | null
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeria_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      igrejas: {
        Row: {
          codigo_convite: string
          created_at: string
          criado_por: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo_convite?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo_convite?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      membros: {
        Row: {
          ativo: boolean
          batismo_aguas: string | null
          batismo_espirito: string | null
          cargo: string
          cpf: string
          created_at: string
          data_membro: string | null
          email: string
          endereco: string
          foto: string | null
          id: string
          igreja_id: string
          ministerio: string
          nascimento: string | null
          nome: string
          observacao: string
          telefone: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          batismo_aguas?: string | null
          batismo_espirito?: string | null
          cargo?: string
          cpf?: string
          created_at?: string
          data_membro?: string | null
          email?: string
          endereco?: string
          foto?: string | null
          id?: string
          igreja_id?: string
          ministerio?: string
          nascimento?: string | null
          nome: string
          observacao?: string
          telefone?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          batismo_aguas?: string | null
          batismo_espirito?: string | null
          cargo?: string
          cpf?: string
          created_at?: string
          data_membro?: string | null
          email?: string
          endereco?: string
          foto?: string | null
          id?: string
          igreja_id?: string
          ministerio?: string
          nascimento?: string | null
          nome?: string
          observacao?: string
          telefone?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas: {
        Row: {
          created_at: string
          data: string
          id: string
          igreja_id: string
          obs: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          igreja_id?: string
          obs?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          obs?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_oracao: {
        Row: {
          created_at: string
          data: string
          id: string
          igreja_id: string
          nome: string
          orado_em: string | null
          pedido: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          nome: string
          orado_em?: string | null
          pedido?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          nome?: string
          orado_em?: string | null
          pedido?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_oracao_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          igreja_id: string | null
          nome: string
          telefone: string
        }
        Insert: {
          created_at?: string
          id: string
          igreja_id?: string | null
          nome?: string
          telefone?: string
        }
        Update: {
          created_at?: string
          id?: string
          igreja_id?: string | null
          nome?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string
          id: string
          igreja_id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          igreja_id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          igreja_id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
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
      visitantes: {
        Row: {
          convidado_por: string
          created_at: string
          data_visita: string
          id: string
          igreja_id: string
          membro_id: string | null
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          convidado_por?: string
          created_at?: string
          data_visita?: string
          id?: string
          igreja_id?: string
          membro_id?: string | null
          nome: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          convidado_por?: string
          created_at?: string
          data_visita?: string
          id?: string
          igreja_id?: string
          membro_id?: string | null
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitantes_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitantes_membro_igreja"
            columns: ["membro_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_minha_foto: { Args: { _foto: string }; Returns: undefined }
      converter_visitante: { Args: { _visitante_id: string }; Returns: string }
      criar_igreja: { Args: { _nome: string }; Returns: string }
      definir_papel: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      entrar_igreja: { Args: { _codigo: string }; Returns: string }
      gerar_codigo_convite: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_igreja_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      meu_membro: { Args: never; Returns: string }
      minha_igreja: { Args: never; Returns: string }
      validar_membro: {
        Args: { _id: string; _igreja: string }
        Returns: {
          ativo: boolean
          cpf: string
          foto: string
          igreja: string
          nome: string
        }[]
      }
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
