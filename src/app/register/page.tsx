// app/register/page.tsx
'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { UserPlus, Users, Gamepad2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/components/Alert'

interface Game {
  id: number
  name: string
  category: 'pc' | 'console' | 'board'
  max_team_size: number
  min_team_size: number
  votes_count: number
}

interface Student {
  id: string
  email: string
  full_name: string
  career: string
  has_team: boolean
}

interface Registration {
  id: string
  student_id: string
  game_id: number
  team_id: string | null
  category: string
  registration_type: 'individual' | 'team'
  status: 'pending' | 'confirmed' | 'cancelled'
  game?: Game
}

export default function RegisterPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { alertProps, showAlert, hideAlert, AlertComponent } = useAlert()
  const [student, setStudent] = useState<Student | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('pc')
  const [selectedGame, setSelectedGame] = useState<number | null>(null)
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('individual')
  const [teamName, setTeamName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Datos del estudiante
  const [formData, setFormData] = useState({
    full_name: '',
    career: '',
    has_team: false
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user) {
      fetchStudent()
      fetchGames()
      fetchRegistrations()
    }
  }, [user, loading])

  const fetchStudent = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .single()

      if (data) {
        setStudent(data)
        setFormData({
          full_name: data.full_name,
          career: data.career,
          has_team: data.has_team
        })
      } else if (error?.code === 'PGRST116') {
        // Estudiante no existe, mostrar formulario
        setShowForm(true)
      }
    } catch (error) {
      console.error('Error fetching student:', error)
    }
  }

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('votes_count', { ascending: false })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    }
  }

  const fetchRegistrations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          game:games(*)
        `)
        .eq('student_id', user.id)

      if (error) throw error
      setRegistrations(data || [])
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          email: user.email!,
          full_name: formData.full_name,
          career: formData.career,
          has_team: formData.has_team
        }])
        .select()
        .single()

      if (error) throw error
      
      setStudent(data)
      setShowForm(false)
    } catch (error) {
      console.error('Error creating student:', error)
      showAlert('error', 'Error al guardar tus datos. Inténtalo de nuevo.')
    }
  }

  const handleRegistration = async () => {
    if (!user || !student || !selectedGame) return

    setIsRegistering(true)

    try {
      const game = games.find(g => g.id === selectedGame)
      if (!game) throw new Error('Juego no encontrado')

      // Verificar si ya está inscrito en este juego
      const existingRegistration = registrations.find(reg => 
        reg.game_id === selectedGame && reg.status !== 'cancelled'
      )

      if (existingRegistration) {
        showAlert('info', 'Ya estás inscrito en este juego')
        return
      }

      let teamId = null

      // Si es registro por equipo, crear el equipo
      if (registrationType === 'team' && game.max_team_size > 1) {
        if (!teamName.trim()) {
          showAlert('warning', 'Debes ingresar un nombre para el equipo')
          return
        }

        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert([{
            name: teamName,
            captain_id: student.id,
            game_id: selectedGame,
            category: selectedCategory,
            is_complete: game.min_team_size === 1
          }])
          .select()
          .single()

        if (teamError) throw teamError
        teamId = teamData.id

        // Agregar al capitán como miembro del equipo
        await supabase
          .from('team_members')
          .insert([{
            team_id: teamId,
            student_id: student.id
          }])
      }

      // Crear la inscripción
      const { error: regError } = await supabase
        .from('registrations')
        .insert([{
          student_id: student.id,
          game_id: selectedGame,
          team_id: teamId,
          category: selectedCategory,
          registration_type: registrationType,
          status: 'pending'
        }])

      if (regError) throw regError

      // Actualizar estado local
      await fetchRegistrations()
      
      // Reset form
      setSelectedGame(null)
      setTeamName('')
      setRegistrationType('individual')

      showAlert('success', '¡Inscripción exitosa!')
    } catch (error) {
      console.error('Error registering:', error)
      showAlert('error', 'Error al procesar la inscripción. Inténtalo de nuevo.')
    } finally {
      setIsRegistering(false)
    }
  }

  const cancelRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId)

      if (error) throw error
      
      await fetchRegistrations()
      showAlert('info', 'Inscripción cancelada exitosamente')
    } catch (error) {
      console.error('Error cancelling registration:', error)
      showAlert('error', 'Error al cancelar la inscripción')
    }
  }

  const getGamesByCategory = (category: string) => {
    return games.filter(game => game.category === category)
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pc': return 'Juegos de PC'
      case 'console': return 'Juegos de Consola'
      case 'board': return 'Juegos de Mesa'
      default: return 'Desconocido'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Componente de alertas personalizadas */}
      <AlertComponent />
      <div className="px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            📝 Inscripción
          </h1>
          <p className="text-xl text-gray-300">
            Inscríbete en los torneos de tus juegos favoritos
          </p>
        </div>

        {/* Formulario de datos del estudiante */}
        {showForm && (
          <Card className="max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <UserPlus className="h-6 w-6 mr-2" />
              Completa tu Perfil
            </h2>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Carrera *
                </label>
                <input
                  type="text"
                  required
                  value={formData.career}
                  onChange={(e) => setFormData(prev => ({ ...prev, career: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Ingeniería en Informática"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has_team"
                  checked={formData.has_team}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_team: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="has_team" className="text-white text-sm">
                  Tengo experiencia formando equipos
                </label>
              </div>

              <Button type="submit" className="w-full">
                Guardar Datos
              </Button>
            </form>
          </Card>
        )}

        {/* Inscripciones actuales */}
        {student && registrations.length > 0 && (
          <Card className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-400" />
              Mis Inscripciones
            </h2>
            <div className="space-y-4">
              {registrations
                .filter(reg => reg.status !== 'cancelled')
                .map(registration => (
                <div key={registration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{registration.game?.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{getCategoryName(registration.category)}</span>
                      <span className="capitalize">{registration.registration_type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        registration.status === 'confirmed' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {registration.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => cancelRegistration(registration.id)}
                    variant="danger"
                    className="text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Formulario de inscripción */}
        {student && (
          <Card className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Gamepad2 className="h-6 w-6 mr-2" />
              Nueva Inscripción
            </h2>

            {/* Selector de categoría */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-3">
                Categoría
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['pc', 'console', 'board'].map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedGame(null)
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategory === category
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-purple-300'
                    }`}
                  >
                    {getCategoryName(category)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de juego */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-3">
                Juego
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {getGamesByCategory(selectedCategory).map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedGame === game.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{game.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {game.min_team_size === game.max_team_size 
                            ? `${game.max_team_size} jugador${game.max_team_size > 1 ? 'es' : ''}`
                            : `${game.min_team_size}-${game.max_team_size} jugadores`
                          }
                        </p>
                      </div>
                      {selectedCategory === 'pc' && (
                        <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                          {game.votes_count} votos
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de inscripción */}
            {selectedGame && (
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-3">
                  Tipo de Inscripción
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRegistrationType('individual')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      registrationType === 'individual'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-purple-300'
                    }`}
                  >
                    <UserPlus className="h-5 w-5 mx-auto mb-2" />
                    Individual
                  </button>
                  <button
                    onClick={() => setRegistrationType('team')}
                    disabled={games.find(g => g.id === selectedGame)?.max_team_size === 1}
                    className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      registrationType === 'team'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-purple-300'
                    }`}
                  >
                    <Users className="h-5 w-5 mx-auto mb-2" />
                    Equipo
                  </button>
                </div>
              </div>
            )}

            {/* Nombre del equipo */}
            {selectedGame && registrationType === 'team' && games.find(g => g.id === selectedGame)?.max_team_size! > 1 && (
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ingresa el nombre de tu equipo"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Serás el capitán del equipo. Otros jugadores podrán unirse después.
                </p>
              </div>
            )}

            {/* Información del juego seleccionado */}
            {selectedGame && (
              <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
                {(() => {
                  const game = games.find(g => g.id === selectedGame)!
                  return (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                        <h3 className="text-white font-medium">Información del Juego</h3>
                      </div>
                      <div className="space-y-2 text-gray-300 text-sm">
                        <p>• <strong>Juego:</strong> {game.name}</p>
                        <p>• <strong>Jugadores:</strong> {
                          game.min_team_size === game.max_team_size 
                            ? `${game.max_team_size} jugador${game.max_team_size > 1 ? 'es' : ''}`
                            : `${game.min_team_size}-${game.max_team_size} jugadores`
                        }</p>
                        <p>• <strong>Tipo:</strong> {registrationType === 'individual' ? 'Individual' : 'Equipo'}</p>
                        {registrationType === 'team' && game.max_team_size > 1 && (
                          <p>• <strong>Equipo:</strong> {teamName || 'Sin nombre'}</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </Card>
            )}

            {/* Botón de inscripción */}
            <Button
              onClick={handleRegistration}
              disabled={!selectedGame || isRegistering || (registrationType === 'team' && games.find(g => g.id === selectedGame)?.max_team_size! > 1 && !teamName.trim())}
              className="w-full text-lg py-3"
            >
              {isRegistering ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Inscribirse'
              )}
            </Button>
          </Card>
        )}

        {/* Información adicional */}
        <Card className="max-w-2xl mx-auto mt-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
            Información Importante
          </h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>• Las inscripciones están sujetas a confirmación por parte de la organización</p>
            <p>• Para juegos en equipo, todos los miembros deben estar inscritos antes del evento</p>
            <p>• Los horarios específicos de cada torneo se anunciarán después del cierre de inscripciones</p>
            <p>• Puedes cancelar tu inscripción hasta 24 horas antes del evento</p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}