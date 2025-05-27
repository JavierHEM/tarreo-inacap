'use client'
import Layout, { Card } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, Users, Gamepad2 } from 'lucide-react'

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

export default function ResultsPage() {
  const { user, loading } = useUser()
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [registrationStats, setRegistrationStats] = useState<RegistrationStats[]>([])
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

      // Obtener estadísticas de inscripciones
      const { data: regStats, error: regError } = await supabase
        .from('registrations')
        .select(`
          game_id,
          status,
          game:games(name, category)
        `)

      if (regError) throw regError

      // Procesar estadísticas de inscripciones
      const registrationStatistics: RegistrationStats[] = []
      
      // Aquí procesaríamos los datos para obtener las estadísticas
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
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Resultados de Votación
        </h1>
        
        {loadingResults ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  )
}
