// app/vote/page.tsx
'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Trophy, Star, Gamepad2, Users, Clock, X, Info, Calendar, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/components/Alert'

interface Game {
  id: number
  name: string
  category: 'pc' | 'console' | 'board'
  max_team_size: number
  min_team_size: number
  votes_count: number
  is_active: boolean
}

interface Vote {
  id: string
  student_id: string
  game_id: number
}

export default function VotePage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [userVotes, setUserVotes] = useState<Vote[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [votingLoading, setVotingLoading] = useState<number | null>(null)
  const [studentRecord, setStudentRecord] = useState<{id: string} | null>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [votingEnabled, setVotingEnabled] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Sistema de alertas personalizadas
  const { alertProps, showAlert, hideAlert, AlertComponent } = useAlert()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      checkStudentRecord()
      fetchGames()
      fetchVotingSettings()
      setShowAnnouncement(true)
    }
  }, [user, loading])

  // Verificar si las votaciones están habilitadas globalmente
  const fetchVotingSettings = async () => {
    try {
      setLoadingSettings(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'voting_enabled')
        .single()

      if (error && error.code !== 'PGRST116') {
        // Error diferente a "no se encontraron resultados"
        throw error
      }

      // Si existe la configuración, verificar el valor
      if (data) {
        setVotingEnabled(data.value === 'true')
      } else {
        // Si no existe la configuración, las votaciones están habilitadas por defecto
        setVotingEnabled(true)
      }
    } catch (error) {
      console.error('Error fetching voting settings:', error)
      // Por defecto, permitir votaciones si hay un error
      setVotingEnabled(true)
    } finally {
      setLoadingSettings(false)
    }
  }

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoadingGames(false)
    }
  }

  // Verificar si el usuario tiene un registro en la tabla students
  const checkStudentRecord = async () => {
    if (!user) return
    
    try {
      // Buscar si el usuario ya tiene un registro en students
      const { data, error } = await supabase
        .from('students')
        .select('id, email')
        .eq('email', user.email)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 es el código para "no se encontraron resultados"
        throw error
      }
      
      if (data) {
        // Usuario ya registrado como estudiante
        setStudentRecord(data)
        fetchUserVotes(data.id)
      } else {
        // El usuario no está registrado como estudiante, lo registramos
        await registerAsStudent()
      }
    } catch (error) {
      console.error('Error al verificar el registro de estudiante:', error)
    }
  }
  
  // Registrar al usuario como estudiante si no existe
  const registerAsStudent = async () => {
    if (!user?.email) return
    
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          career: 'No especificada',
          has_team: false
        }])
        .select('id, email')
        .single()
      
      if (error) throw error
      
      if (data) {
        setStudentRecord(data)
        fetchUserVotes(data.id)
      }
    } catch (error) {
      console.error('Error al registrar como estudiante:', error)
    }
  }

  const fetchUserVotes = async (studentId?: string) => {
    if (!user) return
    
    const id = studentId || studentRecord?.id
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('student_id', id)

      if (error) throw error
      setUserVotes(data || [])
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const handleVote = async (gameId: number) => {
    // Verificar si las votaciones están habilitadas globalmente
    if (!votingEnabled) {
      showAlert('error', 'Votaciones deshabilitadas: Las votaciones han sido deshabilitadas temporalmente por el administrador.')
      return
    }
    
    if (!user || !studentRecord) {
      showAlert('warning', 'Necesitas registrarte como estudiante para votar')
      return
    }

    setVotingLoading(gameId)

    try {
      const hasVoted = userVotes.some(vote => vote.game_id === gameId)
      
      if (hasVoted) {
        // Remover voto
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('student_id', studentRecord.id)
          .eq('game_id', gameId)

        if (error) throw error
        
        setUserVotes(prev => prev.filter(vote => vote.game_id !== gameId))
        setGames(prev => prev.map(game => 
          game.id === gameId 
            ? { ...game, votes_count: game.votes_count - 1 }
            : game
        ))
      } else {
        // Verificar límite de votos para juegos PC
        const pcVotes = userVotes.filter(vote => {
          const game = games.find(g => g.id === vote.game_id)
          return game?.category === 'pc'
        })

        const targetGame = games.find(g => g.id === gameId)
        
        if (targetGame?.category === 'pc' && pcVotes.length >= 3) {
          showAlert('warning', 'Solo puedes votar por máximo 3 juegos de PC')
          return
        }

        // Agregar voto
        const { data, error } = await supabase
          .from('votes')
          .insert([{ student_id: studentRecord.id, game_id: gameId }])
          .select()

        if (error) throw error
        
        if (data && data[0]) {
          setUserVotes(prev => [...prev, data[0]])
          setGames(prev => prev.map(game => 
            game.id === gameId 
              ? { ...game, votes_count: game.votes_count + 1 }
              : game
          ))
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
      showAlert('error', 'Error al procesar tu voto. Inténtalo de nuevo.')
    } finally {
      setVotingLoading(null)
    }
  }

  const hasUserVoted = (gameId: number) => {
    return userVotes.some(vote => vote.game_id === gameId)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pc': return <Gamepad2 className="h-5 w-5" />
      case 'console': return <Gamepad2 className="h-5 w-5" />
      case 'board': return <Users className="h-5 w-5" />
      default: return <Gamepad2 className="h-5 w-5" />
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pc': return 'PC'
      case 'console': return 'Consola'
      case 'board': return 'Mesa y Cartas'
      default: return 'Desconocido'
    }
  }

  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.category]) {
      acc[game.category] = []
    }
    acc[game.category].push(game)
    return acc
  }, {} as Record<string, Game[]>)

  const pcVotesCount = userVotes.filter(vote => {
    const game = games.find(g => g.id === vote.game_id)
    return game?.category === 'pc'
  }).length

  if (loading || loadingGames) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </Layout>
    )
  }

  // Componente Modal para el anuncio
  const AnnouncementModal = () => {
    if (!showAnnouncement) return null
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-purple-900 rounded-t-xl px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Info className="h-5 w-5 mr-2 text-purple-300" />
              Anuncio Importante
            </h2>
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="text-white hover:text-purple-200 p-1 rounded-full hover:bg-white/10 transition-all"
              aria-label="Cerrar anuncio"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-6 py-5 text-white">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">
                🎮 Tarreo Gamer Otoño 2025 🎮
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="font-medium">
                ¡Atención, gamers! El evento Tarreo Gamer Otoño 2025 se encuentra actualmente en el proceso de votación de los juegos.
              </p>
              
              <div className="flex items-start space-x-3 bg-red-900/30 p-3 rounded-lg border border-red-600">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-300">Las votaciones se cerrarán este lunes 2 de junio</span>, así que ¡no pierdas la oportunidad de hacer valer tu opinión!
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Los 3 juegos más votados de la categoría PC pasarán directamente a formar parte del torneo oficial.</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>En cuanto a las categorías de consolas y juegos de mesa, los títulos ya están definidos y se mantienen tal como están.</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Una vez que se anuncien oficialmente los juegos seleccionados de PC, se abrirán las inscripciones para que los alumnos puedan registrarse en su juego preferido.</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Recuerda que los cupos son limitados.</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Los alumnos que ya estaban inscritos tienen su cupo asegurado para el juego que eligieron previamente.</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xl font-bold text-purple-300">
                  ¡Prepárense para una noche épica de juegos y competencia!
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 px-6 py-4 rounded-b-xl flex justify-end">
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <Layout>
      {/* Componente de alertas personalizadas */}
      <AlertComponent />
      
      {/* Anuncio pop-up */}
      <AnnouncementModal />
      
      <div className="px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🗳️ Votaciones
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Vota por tus juegos favoritos y ayuda a decidir los torneos oficiales
          </p>
          
          {/* Información importante */}
          <Card className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Reglas de Votación</h3>
            </div>
            <div className="text-gray-300 space-y-2">
              <p>• <strong>Juegos PC:</strong> Máximo 3 votos (los 3 más votados tendrán torneo oficial)</p>
              <p>• <strong>Consola y Mesa:</strong> Votos ilimitados</p>
              <p>• Puedes cambiar tus votos hasta que cierren las votaciones</p>
            </div>
            <div className="mt-4 p-3 bg-purple-600/20 rounded-lg">
              <p className="text-purple-300 font-medium">
                Votos PC utilizados: {pcVotesCount}/3
              </p>
            </div>
          </Card>
        </div>

        {/* Lista de juegos por categoría */}
        {Object.entries(groupedGames).map(([category, categoryGames]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              {getCategoryIcon(category)}
              <h2 className="text-2xl font-bold text-white">
                {getCategoryName(category)}
              </h2>
              {category === 'pc' && (
                <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Top 3 → Torneo Oficial
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryGames
                .sort((a, b) => b.votes_count - a.votes_count)
                .map((game, index) => (
                <Card 
                  key={game.id} 
                  className={`relative transition-all duration-300 hover:scale-105 ${
                    hasUserVoted(game.id) ? 'ring-2 ring-purple-500 bg-purple-500/20' : ''
                  }`}
                >
                  {/* Posición para juegos PC */}
                  {category === 'pc' && (
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      #{index + 1}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {game.min_team_size === game.max_team_size 
                              ? `${game.max_team_size} jugador${game.max_team_size > 1 ? 'es' : ''}`
                              : `${game.min_team_size}-${game.max_team_size} jugadores`
                            }
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <span className="text-white font-medium">{game.votes_count} votos</span>
                    </div>

                    <Button
                      onClick={() => handleVote(game.id)}
                      disabled={votingLoading === game.id || !votingEnabled || loadingSettings}
                      variant={hasUserVoted(game.id) ? 'danger' : !votingEnabled ? 'secondary' : 'primary'}
                      className="min-w-[100px]"
                    >
                      {votingLoading === game.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : !votingEnabled ? (
                        <>
                          <Lock className="h-4 w-4 mr-1" />
                          <span>Deshabilitado</span>
                        </>
                      ) : hasUserVoted(game.id) ? (
                        'Quitar voto'
                      ) : (
                        'Votar'
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Recordatorio o Aviso de votaciones deshabilitadas */}
        <Card className={`text-center max-w-2xl mx-auto ${!votingEnabled ? 'bg-red-900/30' : ''}`}>
          {votingEnabled ? (
            <>
              <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                ¡Las votaciones están abiertas!
              </h3>
              <p className="text-gray-300">
                Puedes cambiar tus votos en cualquier momento hasta que se cierren las votaciones.
                Los resultados finales determinarán qué juegos tendrán torneos oficiales.
              </p>
            </>
          ) : (
            <>
              <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Votaciones deshabilitadas
              </h3>
              <p className="text-gray-300">
                Las votaciones han sido temporalmente deshabilitadas por el administrador.
                Por favor, intenta más tarde o contacta a los organizadores para más información.
              </p>
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}