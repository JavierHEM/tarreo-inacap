'use client'
import Layout, { Card } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, Users, Gamepad2, UserCheck, UsersRound, User, UserPlus, CheckCircle2 } from 'lucide-react'

interface GameResult {
  id: number
  name: string
  category: string
  votes_count: number
  is_official: boolean
}

interface RegistrationStats {
  game_name: string
  category: string
  total_registrations: number
  confirmed_registrations: number
}

interface EventStats {
  total_voters: number
  total_registered_users: number
  individual_players: number
  team_players: number
  complete_teams: number
}

export default function ResultsPage() {
  const { user, loading } = useUser()
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats[]>([])
  const [eventStats, setEventStats] = useState<EventStats>({
    total_voters: 0,
    total_registered_users: 0,
    individual_players: 0,
    team_players: 0,
    complete_teams: 0
  })
  const [loadingResults, setLoadingResults] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      // Obtener resultados de votación
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('votes_count', { ascending: false })

      if (gamesError) throw gamesError

      // Marcar los 3 juegos PC más votados como oficiales
      const gamesWithOfficial = games?.map((game, index) => ({
        ...game,
        is_official: game.category === 'pc' && index < 3
      })) || []

      setGameResults(gamesWithOfficial)

      // 1. Cantidad de usuarios que han votado (votos únicos por estudiante)
      const { count: votersCount, error: votersError } = await supabase
        .from('votes')
        .select('student_id', { count: 'exact', head: true })
      
      if (votersError) throw votersError

      // 2. Cantidad de usuarios registrados en juegos
      const { count: registeredUsersCount, error: regUsersError } = await supabase
        .from('registrations')
        .select('student_id', { count: 'exact', head: true })
      
      if (regUsersError) throw regUsersError

      // 3 & 4. Usuarios jugando individual y en equipo
      const { data: registrationTypes, error: regTypesError } = await supabase
        .from('registrations')
        .select('student_id, registration_type')
      
      if (regTypesError) throw regTypesError

      const individualPlayers = new Set()
      const teamPlayers = new Set()
      
      registrationTypes?.forEach(reg => {
        if (reg.registration_type === 'individual') {
          individualPlayers.add(reg.student_id)
        } else if (reg.registration_type === 'team') {
          teamPlayers.add(reg.student_id)
        }
      })

      // 5. Equipos completos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('is_complete', true)
      
      if (teamsError) throw teamsError

      // Establecer estadísticas del evento
      setEventStats({
        total_voters: votersCount || 0,
        total_registered_users: registeredUsersCount || 0,
        individual_players: individualPlayers.size,
        team_players: teamPlayers.size,
        complete_teams: teamsData?.length || 0
      })

      // Obtener estadísticas de inscripciones por juego
      const { data: regStats, error: regError } = await supabase
        .from('registrations')
        .select(`
          game_id,
          status,
          game:games(name, category)
        `)

      if (regError) throw regError

      // Procesar estadísticas de inscripciones por juego
      const registrationStatistics: RegistrationStats[] = []
      
      // Aquí procesaríamos los datos para obtener las estadísticas detalladas por juego
      // Este es un ejemplo simplificado
      
      setRegistrationStats(registrationStatistics)
      
    } catch (error) {
      console.error('Error al cargar resultados:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <Layout>
      <div className="px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Resultados e Indicadores del Tarreo
        </h1>
        
        {loadingResults ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* Dashboard con Indicadores */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">Indicadores Principales</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* Indicador: Usuarios que han votado */}
                <Card className="bg-gradient-to-br from-purple-900/60 to-purple-600/60">
                  <div className="flex flex-col items-center py-3 text-center">
                    <UserCheck className="h-8 w-8 text-purple-300 mb-2" />
                    <span className="text-2xl font-bold text-white">{eventStats.total_voters}</span>
                    <span className="text-xs text-gray-300">Usuarios votantes</span>
                  </div>
                </Card>
                
                {/* Indicador: Usuarios inscritos */}
                <Card className="bg-gradient-to-br from-indigo-900/60 to-indigo-600/60">
                  <div className="flex flex-col items-center py-3 text-center">
                    <UserPlus className="h-8 w-8 text-indigo-300 mb-2" />
                    <span className="text-2xl font-bold text-white">{eventStats.total_registered_users}</span>
                    <span className="text-xs text-gray-300">Usuarios inscritos</span>
                  </div>
                </Card>
                
                {/* Indicador: Jugadores individuales */}
                <Card className="bg-gradient-to-br from-blue-900/60 to-blue-600/60">
                  <div className="flex flex-col items-center py-3 text-center">
                    <User className="h-8 w-8 text-blue-300 mb-2" />
                    <span className="text-2xl font-bold text-white">{eventStats.individual_players}</span>
                    <span className="text-xs text-gray-300">Jugadores individuales</span>
                  </div>
                </Card>
                
                {/* Indicador: Jugadores en equipo */}
                <Card className="bg-gradient-to-br from-cyan-900/60 to-cyan-600/60">
                  <div className="flex flex-col items-center py-3 text-center">
                    <UsersRound className="h-8 w-8 text-cyan-300 mb-2" />
                    <span className="text-2xl font-bold text-white">{eventStats.team_players}</span>
                    <span className="text-xs text-gray-300">Jugadores en equipo</span>
                  </div>
                </Card>
                
                {/* Indicador: Equipos completos */}
                <Card className="bg-gradient-to-br from-green-900/60 to-green-600/60">
                  <div className="flex flex-col items-center py-3 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-300 mb-2" />
                    <span className="text-2xl font-bold text-white">{eventStats.complete_teams}</span>
                    <span className="text-xs text-gray-300">Equipos completos</span>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Resultados de votación */}
            <h2 className="text-2xl font-bold text-white mb-4">Resultados de Votación</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameResults.map((game) => (
                <Card key={game.id} className={`${
                  game.is_official ? 'border-purple-500 border-2' : ''
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{game.name}</h3>
                    {game.is_official && (
                      <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        Oficial
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-lg text-purple-300 mb-2">
                    <Star className="h-5 w-5 mr-2" />
                    <span>{game.votes_count} votos</span>
                  </div>
                  
                  <div className="text-gray-300 text-sm">
                    Categoría: {game.category === 'pc' ? 'PC' : 
                      game.category === 'console' ? 'Consola' : 'Juego de Mesa'}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
