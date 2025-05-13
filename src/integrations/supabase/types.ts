export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aqi_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          pollutant: string | null
          region: string | null
          threshold: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          pollutant?: string | null
          region?: string | null
          threshold?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pollutant?: string | null
          region?: string | null
          threshold?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aqi_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          pollutant: string | null
          region: string
          uploaded_by: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          pollutant?: string | null
          region: string
          uploaded_by?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          pollutant?: string | null
          region?: string
          uploaded_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "datasets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string | null
          dataset_id: string | null
          file_path: string
          id: string
          model_type: string
          trained_by: string | null
        }
        Insert: {
          created_at?: string | null
          dataset_id?: string | null
          file_path: string
          id?: string
          model_type: string
          trained_by?: string | null
        }
        Update: {
          created_at?: string | null
          dataset_id?: string | null
          file_path?: string
          id?: string
          model_type?: string
          trained_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_trained_by_fkey"
            columns: ["trained_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string | null
          date_range: string
          forecast_json: Json
          id: string
          model_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_range: string
          forecast_json: Json
          id?: string
          model_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_range?: string
          forecast_json?: Json
          id?: string
          model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          has_asthma: boolean | null
          has_heart_disease: boolean | null
          is_smoker: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          has_asthma?: boolean | null
          has_heart_disease?: boolean | null
          is_smoker?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          has_asthma?: boolean | null
          has_heart_disease?: boolean | null
          is_smoker?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string | null
          id: string
          prediction_id: string | null
          suggestion: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prediction_id?: string | null
          suggestion: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prediction_id?: string | null
          suggestion?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          health_profile: Json | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          health_profile?: Json | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          health_profile?: Json | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
