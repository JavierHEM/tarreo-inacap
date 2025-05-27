export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: number
          name: string
          category: 'pc' | 'console' | 'board'
          max_team_size: number
          min_team_size: number
          is_active: boolean
          votes_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'id' | 'created_at' | 'votes_count'>
        Update: Partial<Database['public']['Tables']['games']['Insert']>
      }
      students: {
        Row: {
          id: string
          email: string
          full_name: string
          career: string
          has_team: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      teams: {
        Row: {
          id: string
          name: string
          captain_id: string
          game_id: number
          category: string
          is_complete: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      votes: {
        Row: {
          id: string
          student_id: string
          game_id: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['votes']['Insert']>
      }
      registrations: {
        Row: {
          id: string
          student_id: string
          game_id: number
          team_id: string | null
          category: string
          registration_type: 'individual' | 'team'
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['registrations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['registrations']['Insert']>
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
  }
}
