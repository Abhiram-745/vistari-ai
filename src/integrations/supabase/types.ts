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
      achievements: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          is_hidden: boolean | null
          name: string
          tier: string
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          is_hidden?: boolean | null
          name: string
          tier: string
          xp_reward: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name?: string
          tier?: string
          xp_reward?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          parent_event_id: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
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
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_active: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_active?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_active?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_pinned: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_pinned?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_pinned?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_resources: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          group_id: string
          id: string
          likes_count: number | null
          resource_type: string
          title: string
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          group_id: string
          id?: string
          likes_count?: number | null
          resource_type: string
          title: string
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          group_id?: string
          id?: string
          likes_count?: number | null
          resource_type?: string
          title?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_resources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
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
          level: number | null
          title: string | null
          total_xp: number | null
          updated_at: string | null
          xp_to_next_level: number | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          level?: number | null
          title?: string | null
          total_xp?: number | null
          updated_at?: string | null
          xp_to_next_level?: number | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          level?: number | null
          title?: string | null
          total_xp?: number | null
          updated_at?: string | null
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          average_focus_score: number | null
          created_at: string
          date: string
          id: string
          sessions_completed: number
          sessions_skipped: number
          subjects_studied: Json | null
          total_actual_minutes: number
          total_planned_minutes: number
          user_id: string
        }
        Insert: {
          average_focus_score?: number | null
          created_at?: string
          date: string
          id?: string
          sessions_completed?: number
          sessions_skipped?: number
          subjects_studied?: Json | null
          total_actual_minutes?: number
          total_planned_minutes?: number
          user_id: string
        }
        Update: {
          average_focus_score?: number | null
          created_at?: string
          date?: string
          id?: string
          sessions_completed?: number
          sessions_skipped?: number
          subjects_studied?: Json | null
          total_actual_minutes?: number
          total_planned_minutes?: number
          user_id?: string
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
      shared_timetables: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          is_public: boolean | null
          shared_by: string
          timetable_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_public?: boolean | null
          shared_by: string
          timetable_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          is_public?: boolean | null
          shared_by?: string
          timetable_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_timetables_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_timetables_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          join_code: string | null
          max_members: number | null
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          join_code?: string | null
          max_members?: number | null
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          join_code?: string | null
          max_members?: number | null
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      study_insights: {
        Row: {
          created_at: string
          id: string
          insights_data: Json
          timetable_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insights_data?: Json
          timetable_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insights_data?: Json
          timetable_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_insights_timetable_id_fkey"
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
      study_sessions: {
        Row: {
          actual_duration_minutes: number | null
          actual_end: string | null
          actual_start: string | null
          created_at: string
          focus_score: number | null
          id: string
          notes: string | null
          pause_time: number | null
          planned_duration_minutes: number
          planned_end: string
          planned_start: string
          session_type: string
          status: string
          subject: string
          timetable_id: string | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          focus_score?: number | null
          id?: string
          notes?: string | null
          pause_time?: number | null
          planned_duration_minutes: number
          planned_end: string
          planned_start: string
          session_type: string
          status?: string
          subject: string
          timetable_id?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          focus_score?: number | null
          id?: string
          notes?: string | null
          pause_time?: number | null
          planned_duration_minutes?: number
          planned_end?: string
          planned_start?: string
          session_type?: string
          status?: string
          subject?: string
          timetable_id?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
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
      topic_progress: {
        Row: {
          created_at: string
          id: string
          last_reviewed_at: string | null
          mastery_level: string
          next_review_date: string | null
          progress_percentage: number
          subject_id: string
          successful_sessions_count: number
          topic_id: string
          total_sessions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          mastery_level?: string
          next_review_date?: string | null
          progress_percentage?: number
          subject_id: string
          successful_sessions_count?: number
          topic_id: string
          total_sessions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          mastery_level?: string
          next_review_date?: string | null
          progress_percentage?: number
          subject_id?: string
          successful_sessions_count?: number
          topic_id?: string
          total_sessions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_reflections: {
        Row: {
          created_at: string
          id: string
          reflection_data: Json
          session_date: string
          session_index: number
          subject: string
          timetable_id: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reflection_data?: Json
          session_date: string
          session_index: number
          subject: string
          timetable_id: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reflection_data?: Json
          session_date?: string
          session_index?: number
          subject?: string
          timetable_id?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_reflections_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
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
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          is_new: boolean | null
          progress: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          is_new?: boolean | null
          progress?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          is_new?: boolean | null
          progress?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
