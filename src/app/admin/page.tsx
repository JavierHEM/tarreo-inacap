// app/admin/page.tsx
'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Settings, Users, Trophy, BarChart3, Download, CheckCircle, X, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalStudents: number
  totalRegistrations: number
  totalVotes: number
  topGames: Array<{ name: string; votes: number; category: string }>
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
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Verificar si el usuario es admin (simplificado - en producción usar roles)
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('@inacap.cl')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (!loading && user && !isAdmin) {
      router.push('/')
      return
    }

    if (user && isAdmin) {
      fetchStats()
      fetchRegistrations()
    }
  }, [user, loading, isAdmin])

  const fetchStats = async () => {
    try {
      // Total estudiantes
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Total inscripciones
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'cancelled')

      // Total votos
      const { count: voteCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })

      // Top juegos por votos
      const { data: topGames } = await supabase
        .from('games')
        .select('name, votes_count, category')
        .order('votes_count', { ascending: false })
        .limit(5)

      setStats({
        totalStudents: studentCount || 0,
        totalRegistrations: regCount || 0,
        totalVotes: voteCount || 0,
        topGames: topGames?.map(game => ({
          name: game.name,
          votes: game.votes_count,
          category: game.category
        })) || []
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
      const formattedData = (data || []).map(item => ({
        id: item.id,
        registration_type: item.registration_type,
        status: item.status,
        created_at: item.created_at,
        // Convertir el array student en un objeto único
        student: item.student && item.student[0] ? {
          full_name: item.student[0].full_name,
          email: item.student[0].email,
          career: item.student[0].career
        } : {
          full_name: 'No disponible',
          email: 'No disponible',
          career: 'No disponible'
        },
        // Convertir el array game en un objeto único
        game: item.game && item.game[0] ? {
          name: item.game[0].name,
          category: item.game[0].category
        } : {
          name: 'No disponible',
          category: 'No disponible'
        }
      }))
      
      setRegistrations(formattedData)
    } catch (error) {
      console.error('Error fetching registrations:', error)
    }
  }

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    setLoadingAction(registrationId)
    
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId)

      if (error) throw error
      
      await fetchRegistrations()
      await fetchStats()
    } catch (error) {
      console.error('Error updating registration:', error)
      alert('Error al actualizar la inscripción')
    } finally {
      setLoadingAction(null)
    }
  }

  const exportData = async (type: 'students' | 'registrations' | 'votes') => {
    try {
      let data, filename
      
      switch (type) {
        case 'students':
          const { data: students } = await supabase
            .from('students')
            .select('*')
          data = students
          filename = 'estudiantes.csv'
          break
          
        case 'registrations':
          const { data: regs } = await supabase
            .from('registrations')
            .select(`
              *,
              student:students(full_name, email, career),
              game:games(name, category)
            `)
          data = regs
          filename = 'inscripciones.csv'
          break
          
        case 'votes':
          const { data: votes } = await supabase
            .from('votes')
            .select(`
              *,
              student:students(full_name, email),
              game:games(name, category)
            `)
          data = votes
          filename = 'votaciones.csv'
          break
      }

      if (!data) return

      // Convertir a CSV básico
      const csv = convertToCSV(data)
      downloadCSV(csv, filename)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error al exportar datos')
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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

  if (!isAdmin) {
    return (
      <Layout>
        <Card className="text-center max-w-md mx-auto">
          <X className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-300">No tienes permisos para acceder al panel administrativo.</p>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Settings className="h-10 w-10 mr-3" />
            Panel Administrativo
          </h1>
          <p className="text-xl text-gray-300">
            Gestiona el evento Tarreo Gamer 2025
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'registrations', label: 'Inscripciones', icon: Users },
            { id: 'results', label: 'Resultados', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Estadísticas generales */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="text-center">
                <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">{stats.totalStudents}</h3>
                <p className="text-gray-300">Estudiantes</p>
              </Card>
              
              <Card className="text-center">
                <Trophy className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">{stats.totalRegistrations}</h3>
                <p className="text-gray-300">Inscripciones</p>
              </Card>
              
              <Card className="text-center">
                <BarChart3 className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">{stats.totalVotes}</h3>
                <p className="text-gray-300">Votos</p>
              </Card>

              <Card className="text-center">
                <Eye className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">
                  {stats.topGames.filter(g => g.category === 'pc').length}
                </h3>
                <p className="text-gray-300">Juegos PC</p>
              </Card>
            </div>

            {/* Top juegos */}
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">Juegos Más Votados</h3>
              <div className="space-y-3">
                {stats.topGames.map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{game.name}</p>
                        <p className="text-gray-400 text-sm capitalize">{game.category}</p>
                      </div>
                    </div>
                    <div className="text-white font-bold">{game.votes} votos</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Exportar datos */}
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">Exportar Datos</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Button onClick={() => exportData('students')} className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Estudiantes
                </Button>
                <Button onClick={() => exportData('registrations')} className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Inscripciones
                </Button>
                <Button onClick={() => exportData('votes')} className="flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Votaciones
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'registrations' && (
          <Card>
            <h3 className="text-xl font-bold text-white mb-6">Gestionar Inscripciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-white pb-3">Estudiante</th>
                    <th className="text-white pb-3">Juego</th>
                    <th className="text-white pb-3">Tipo</th>
                    <th className="text-white pb-3">Estado</th>
                    <th className="text-white pb-3">Fecha</th>
                    <th className="text-white pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(registration => (
                    <tr key={registration.id} className="border-b border-white/10">
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