// Database types for Supabase - matches schema.sql

export type TodoPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'health' | 'fitness' | 'work' | 'finance' | 'personal' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'skipped';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          priority: TodoPriority;
          due_at: string | null;
          scheduled_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          priority?: TodoPriority;
          due_at?: string | null;
          scheduled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          notes?: string | null;
          priority?: TodoPriority;
          due_at?: string | null;
          scheduled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          emoji?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedule_tasks: {
        Row: {
          id: string;
          schedule_id: string;
          title: string;
          time: string;
          duration: number | null;
          category: TaskCategory | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          title: string;
          time: string;
          duration?: number | null;
          category?: TaskCategory | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          title?: string;
          time?: string;
          duration?: number | null;
          category?: TaskCategory | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_progress: {
        Row: {
          id: string;
          user_id: string;
          schedule_id: string;
          task_id: string;
          date: string;
          status: TaskStatus;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          schedule_id: string;
          task_id: string;
          date: string;
          status?: TaskStatus;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          schedule_id?: string;
          task_id?: string;
          date?: string;
          status?: TaskStatus;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      todo_priority: TodoPriority;
      task_category: TaskCategory;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DbTodo = Database['public']['Tables']['todos']['Row'];
export type DbSchedule = Database['public']['Tables']['schedules']['Row'];
export type DbScheduleTask = Database['public']['Tables']['schedule_tasks']['Row'];
export type DbDailyProgress = Database['public']['Tables']['daily_progress']['Row'];
