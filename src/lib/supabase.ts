// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Definición de tipos para la base de datos
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
      },
      team_join_requests: {
        Row: {
          id: string
          team_id: string
          student_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['team_join_requests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['team_join_requests']['Insert']>
      },
      looking_for_team: {
        Row: {
          id: string
          student_id: string
          game_id: number
          player_role: string | null
          player_rank: string | null
          availability: string | null
          message: string | null
          category: string
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['looking_for_team']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['looking_for_team']['Insert']>
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

// Verificamos que las variables de entorno estén definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local')
}

// Creamos un cliente con configuraciones diferentes para servidor/cliente
const isBrowser = typeof window !== 'undefined';

// Creamos el cliente con tipado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser, // Solo persistir en el navegador
    autoRefreshToken: true,
    detectSessionInUrl: isBrowser // Solo detectar en el navegador
  }
})

// Este comentario reemplaza la definición duplicada que ha sido movida arriba

// Hook personalizado para manejar la sesión
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }
        
        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Error al obtener la sesión:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return { user, session, loading, signOut }
}