// app/admin/page.tsx
'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Settings, Users, Trophy, BarChart3, Download, CheckCircle, X, Eye, Lock, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalStudents: number
  totalRegistrations: number
  totalVotes: number
  topGames: Array<{ name: string; votes: number; category: string }>
}

interface AppSettings {
  id: string
  key: string
  value: string
  description: string | null
  last_updated: string
  updated_by: string | null
}

interface Registration {
  id: string
  student: {
    full_name: string
    email: string
    career: string
  }
  game: {
    name: string
    category: string
  }
  registration_type: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings[]>([])
  const [votingEnabled, setVotingEnabled] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'voting' | 'results'>('overview')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(true)

  // Verificar autenticación y permisos
  useEffect(() => {
    const checkAuth = async () => {
      if (loading) {
        console.log('Usuario cargando...')
        return
      }

      if (!user) {
        console.log('No hay usuario, redirigiendo a /auth')
        router.push('/auth')
        return
      }

      console.log('Email del usuario:', user.email)
      
      // Verificación por email (verificar admin, inacap o inacapmail)
      if (user.email?.includes('admin') || 
          user.email?.includes('@inacap.cl') || 
          user.email?.includes('@inacapmail.cl')) {
        console.log('Acceso concedido por dominio de correo')
        setIsAdmin(true)
        setChecking(false)
        return
      }

      try {
        console.log('Verificando rol en base de datos...')
        // Verificar rol en base de datos
        const { data, error } = await supabase
          .from('students')
          .select('role')
          .eq('email', user.email)
          .single()

        if (error) {
          console.error('Error al verificar permisos:', error)
          setIsAdmin(false)
        } else {
          console.log('Rol del usuario:', data?.role)
          // Verificar si es admin o moderator
          const hasAdminRole = data?.role === 'admin' || data?.role === 'moderator'
          console.log('¿Tiene rol de admin?', hasAdminRole)
          setIsAdmin(hasAdminRole)
        }
      } catch (error) {
        console.error('Error:', error)
        setIsAdmin(false)
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [user, loading, router])

  // Cargar datos si es admin
  useEffect(() => {
    if (!checking && isAdmin) {
      fetchStats()
      fetchRegistrations()
      fetchAppSettings()
    } else if (!checking && !isAdmin && user) {
      router.push('/')
    }
  }, [checking, isAdmin, user, router])

  const fetchStats = async () => {
    try {
      // Obtener el total de estudiantes
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Obtener el total de inscripciones
      const { count: totalRegistrations } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })

      // Obtener el total de votos
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })

      // Obtener los juegos más votados
      const { data: topGamesData, error: topGamesError } = await supabase
        .from('votes')
        .select(`
          game_id,
          games(name, category)
        `)

      if (topGamesError) throw topGamesError

      // Contar votos por juego
      const gameVotes: Record<string, { name: string, votes: number, category: string }> = {}
      topGamesData?.forEach((vote: any) => {
        const gameId = vote.game_id
        const gameName = vote.games?.name || 'Desconocido'
        const gameCategory = vote.games?.category || 'Desconocido'

        if (gameVotes[gameId]) {
          gameVotes[gameId].votes++
        } else {
          gameVotes[gameId] = { name: gameName, votes: 1, category: gameCategory }
        }
      })

      // Ordenar por número de votos
      const topGames = Object.values(gameVotes).sort((a, b) => b.votes - a.votes).slice(0, 5)

      setStats({
        totalStudents: totalStudents || 0,
        totalRegistrations: totalRegistrations || 0,
        totalVotes: totalVotes || 0,
        topGames
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchAppSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')

      if (error) throw error

      setAppSettings(data || [])
      
      // Buscar configuración de votaciones
      const votingSetting = data?.find(setting => setting.key === 'voting_enabled')
      setVotingEnabled(votingSetting?.value === 'true')
    } catch (error) {
      console.error('Error fetching app settings:', error)
    }
  }

  const toggleVotingStatus = async () => {
    try {
      setSavingSettings(true)
      
      // Buscar si ya existe la configuración
      const votingSetting = appSettings.find(setting => setting.key === 'voting_enabled')
      
      if (votingSetting) {
        // Actualizar valor existente
        const { error } = await supabase
          .from('app_settings')
          .update({ 
            value: (!votingEnabled).toString(),
            last_updated: new Date().toISOString(),
            updated_by: user?.email
          })
          .eq('id', votingSetting.id)
          
        if (error) throw error
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('app_settings')
          .insert({
            key: 'voting_enabled',
            value: (!votingEnabled).toString(),
            description: 'Controla si las votaciones están habilitadas globalmente',
            last_updated: new Date().toISOString(),
            updated_by: user?.email
          })
          
        if (error) throw error
      }
      
      // Refrescar configuraciones
      fetchAppSettings()
      
      // Actualizar estado local
      setVotingEnabled(!votingEnabled)
    } catch (error) {
      console.error('Error toggling voting status:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          registration_type,
          status,
          created_at,
          student:students(full_name, email, career),
          game:games(name, category)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar los datos para que coincidan con la interfaz Registration
      if (data) {
        const formattedData: Registration[] = data.map((item: any) => ({
          id: item.id,
          registration_type: item.registration_type,
          status: item.status,
          created_at: item.created_at,
          // Extraer el primer elemento del array o usar un objeto vacío si no existe
          student: Array.isArray(item.student) && item.student[0] 
            ? {
                full_name: item.student[0].full_name,
                email: item.student[0].email,
                career: item.student[0].career
              }
            : { full_name: 'No disponible', email: 'No disponible', career: 'No disponible' },
          // Extraer el primer elemento del array o usar un objeto vacío si no existe
          game: Array.isArray(item.game) && item.game[0]
            ? {
                name: item.game[0].name,
                category: item.game[0].category
              }
            : { name: 'No disponible', category: 'No disponible' }
        }))
        
        setRegistrations(formattedData)
      } else {
        setRegistrations([])
      }
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      setLoadingAction(registrationId)

      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId)

      if (error) throw error

      // Actualizar lista de inscripciones
      setRegistrations(prevRegistrations =>
        prevRegistrations.map(reg =>
          reg.id === registrationId ? { ...reg, status: newStatus } : reg
        )
      )
    } catch (error) {
      console.error('Error updating registration:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const exportData = async (type: 'students' | 'registrations' | 'votes') => {
    try {
      setLoadingAction(type)
      let data = []

      if (type === 'students') {
        const { data: students, error } = await supabase
          .from('students')
          .select('*')

        if (error) throw error
        data = students
      } else if (type === 'registrations') {
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select(`
            id,
            registration_type,
            status,
            created_at,
            student:students(full_name, email, career),
            game:games(name, category)
          `)

        if (error) throw error
        data = registrations.map((reg: any) => ({
          id: reg.id,
          student_name: reg.student?.full_name,
          student_email: reg.student?.email,
          student_career: reg.student?.career,
          game_name: reg.game?.name,
          game_category: reg.game?.category,
          registration_type: reg.registration_type,
          status: reg.status,
          created_at: reg.created_at
        }))
      } else if (type === 'votes') {
        const { data: votes, error } = await supabase
          .from('votes')
          .select(`
            id,
            created_at,
            student:students(full_name, email),
            game:games(name, category)
          `)

        if (error) throw error
        data = votes.map((vote: any) => ({
          id: vote.id,
          student_name: vote.student?.full_name,
          student_email: vote.student?.email,
          game_name: vote.game?.name,
          game_category: vote.game?.category,
          created_at: vote.created_at
        }))
      }

      const csv = convertToCSV(data)
      downloadCSV(csv, `${type}-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error(`Error exporting ${type}:`, error)
    } finally {
      setLoadingAction(null)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row)
        .map(value => `"${value || ''}"`) // Handle null values and escape quotes
        .join(',')
    )

    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-32 bg-gray-700 rounded col-span-1"></div>
                  <div className="h-32 bg-gray-700 rounded col-span-1"></div>
                  <div className="h-32 bg-gray-700 rounded col-span-1"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <div className="flex space-x-3">
            <Button onClick={() => exportData('students')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Usuarios
            </Button>
            <Button onClick={() => exportData('registrations')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Inscripciones
            </Button>
            <Button onClick={() => exportData('votes')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Votos
            </Button>
          </div>
        </div>

        <div className="flex mb-6 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}
          >
            <BarChart3 className="h-5 w-5 inline-block mr-2" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`py-3 px-4 ${activeTab === 'registrations' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}
          >
            <Users className="h-5 w-5 inline-block mr-2" />
            Inscripciones
          </button>
          <button
            onClick={() => setActiveTab('voting')}
            className={`py-3 px-4 ${activeTab === 'voting' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}
          >
            <Settings className="h-5 w-5 inline-block mr-2" />
            Votaciones
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`py-3 px-4 ${activeTab === 'results' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}
          >
            <Trophy className="h-5 w-5 inline-block mr-2" />
            Resultados
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Indicadores principales */}
              <Card>
                <div className="flex flex-col items-center p-4">
                  <h3 className="text-xl font-bold text-white mb-3">Usuarios</h3>
                  <p className="text-4xl font-bold text-blue-500">{stats?.totalStudents || 0}</p>
                </div>
              </Card>
              <Card>
                <div className="flex flex-col items-center p-4">
                  <h3 className="text-xl font-bold text-white mb-3">Inscripciones</h3>
                  <p className="text-4xl font-bold text-green-500">{stats?.totalRegistrations || 0}</p>
                </div>
              </Card>
              <Card>
                <div className="flex flex-col items-center p-4">
                  <h3 className="text-xl font-bold text-white mb-3">Votos</h3>
                  <p className="text-4xl font-bold text-purple-500">{stats?.totalVotes || 0}</p>
                </div>
              </Card>
            </div>

            {/* Top juegos */}
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">Top Juegos Votados</h3>
              <div className="space-y-4">
                {stats?.topGames.map((game, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{game.name}</p>
                      <p className="text-gray-400 text-sm capitalize">{game.category}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500 font-bold">{game.votes}</span>
                      <span className="text-gray-400">votos</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'registrations' && (
          <Card>
            <h3 className="text-xl font-bold text-white mb-6">Gestionar Inscripciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="py-3">Estudiante</th>
                    <th className="py-3">Juego</th>
                    <th className="py-3">Tipo</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Fecha</th>
                    <th className="py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {registrations.map(registration => (
                    <tr key={registration.id}>
                      <td className="py-3">
                        <div>
                          <p className="text-white font-medium">{registration.student?.full_name}</p>
                          <p className="text-gray-400 text-sm">{registration.student?.email}</p>
                          <p className="text-gray-400 text-xs">{registration.student?.career}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="text-white">{registration.game?.name}</p>
                          <p className="text-gray-400 text-sm capitalize">{registration.game?.category}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-gray-300 capitalize">{registration.registration_type}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          registration.status === 'confirmed' 
                            ? 'bg-green-600 text-white' 
                            : registration.status === 'cancelled'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {registration.status === 'confirmed' ? 'Confirmado' : 
                           registration.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300 text-sm">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          {registration.status === 'pending' && (
                            <button
                              onClick={() => updateRegistrationStatus(registration.id, 'confirmed')}
                              disabled={loadingAction === registration.id}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                            >
                              {loadingAction === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              <span>Confirmar</span>
                            </button>
                          )}
                          {registration.status !== 'cancelled' && (
                            <button
                              onClick={() => updateRegistrationStatus(registration.id, 'cancelled')}
                              disabled={loadingAction === registration.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'voting' && (
          <Card>
            <h3 className="text-xl font-bold text-white mb-6">Gestión de Votaciones</h3>
            <div className="p-4 border border-gray-700 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-white">Estado de votaciones</h4>
                  <p className="text-gray-400 mt-1">
                    {votingEnabled 
                      ? 'Las votaciones están habilitadas. Los usuarios pueden votar por sus juegos favoritos.' 
                      : 'Las votaciones están deshabilitadas. Los usuarios no pueden votar en este momento.'}
                  </p>
                </div>
                <div>
                  <button
                    onClick={toggleVotingStatus}
                    disabled={savingSettings}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${votingEnabled 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {savingSettings ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : votingEnabled ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    <span>{votingEnabled ? 'Deshabilitar votaciones' : 'Habilitar votaciones'}</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Último cambio: {appSettings.find(s => s.key === 'voting_enabled')?.last_updated 
                    ? new Date(appSettings.find(s => s.key === 'voting_enabled')?.last_updated || '').toLocaleString() 
                    : 'No hay registros'}
                </p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-2">Importante</h4>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                <li>Al deshabilitar las votaciones, los usuarios no podrán emitir nuevos votos</li>
                <li>Los votos ya emitidos no se eliminarán</li>
                <li>Puede habilitar las votaciones nuevamente en cualquier momento</li>
                <li>El cambio es inmediato para todos los usuarios de la plataforma</li>
              </ul>
            </div>
          </Card>
        )}

        {activeTab === 'results' && (
          <Card>
            <h3 className="text-xl font-bold text-white mb-6">Resultados Finales</h3>
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-gray-300">
                Los resultados finales se mostrarán aquí después del evento.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
