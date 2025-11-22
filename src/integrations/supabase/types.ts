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
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      homeworks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string
          duration: number | null
          id: string
          subject: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date: string
          duration?: number | null
          id?: string
          subject: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string
          duration?: number | null
          id?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_resources: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          session_id: string
          timetable_id: string
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          session_id: string
          timetable_id: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string
          timetable_id?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_resources_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      study_preferences: {
        Row: {
          break_duration: number | null
          created_at: string | null
          daily_study_hours: number | null
          day_time_slots: Json | null
          id: string
          preferred_end_time: string | null
          preferred_start_time: string | null
          session_duration: number | null
          study_days: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_duration?: number | null
          created_at?: string | null
          daily_study_hours?: number | null
          day_time_slots?: Json | null
          id?: string
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          session_duration?: number | null
          study_days?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_duration?: number | null
          created_at?: string | null
          daily_study_hours?: number | null
          day_time_slots?: Json | null
          id?: string
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          session_duration?: number | null
          study_days?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string
          date: string
          id: string
          minutes_studied: number
          sessions_completed: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          minutes_studied?: number
          sessions_completed?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          minutes_studied?: number
          sessions_completed?: number
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          exam_board: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_board?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_board?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      test_dates: {
        Row: {
          created_at: string | null
          id: string
          subject_id: string
          test_date: string
          test_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subject_id: string
          test_date: string
          test_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subject_id?: string
          test_date?: string
          test_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_dates_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string
          preferences: Json | null
          schedule: Json
          start_date: string
          subjects: Json | null
          test_dates: Json | null
          topics: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          preferences?: Json | null
          schedule: Json
          start_date: string
          subjects?: Json | null
          test_dates?: Json | null
          topics?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          preferences?: Json | null
          schedule?: Json
          start_date?: string
          subjects?: Json | null
          test_dates?: Json | null
          topics?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals: {
        Row: {
          created_at: string
          current_hours: number
          id: string
          target_hours: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          current_hours?: number
          id?: string
          target_hours: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          current_hours?: number
          id?: string
          target_hours?: number
          updated_at?: string
          user_id?: string
          week_start?: string
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
