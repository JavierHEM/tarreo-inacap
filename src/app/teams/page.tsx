'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Users, Trophy, Shield, User, Check, Clock, X, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/components/Alert'

interface Team {
  id: string
  name: string
  captain_id: string
  game_id: number
  category: string
  is_complete: boolean
  created_at: string
  game?: Game
  members?: Student[]
  captain?: Student
}

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

// Interfaz para las solicitudes de unión a equipos
interface TeamJoinRequest {
  id: string
  team_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  student?: Student
  team?: Team
}

export default function TeamsPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { alertProps, showAlert, hideAlert, AlertComponent } = useAlert()
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all') // 'all', 'pc', 'console', 'board'
  const [requestingTeam, setRequestingTeam] = useState<string | null>(null)
  const [studentRecord, setStudentRecord] = useState<{id: string, full_name: string} | null>(null)
  const [pendingRequests, setPendingRequests] = useState<TeamJoinRequest[]>([])
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [showingRequests, setShowingRequests] = useState(false)

  useEffect(() => {
    if (!loading) {
      fetchTeams()
      if (user) {
        checkStudentRecord()
      }
    }
  }, [loading, user])
  
  // Efecto para cargar solicitudes pendientes cuando se tenga el registro de estudiante
  useEffect(() => {
    if (studentRecord) {
      fetchJoinRequests()
    }
  }, [studentRecord])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      
      // Obtenemos todos los equipos con su juego asociado y los miembros
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          game:games(*),
          members:team_members(student:students(*))
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Procesamos los datos para un formato más fácil de usar
      const processedTeams = data.map((team: any) => {
        // Extraemos los miembros del equipo
        const members = team.members.map((m: any) => m.student)
        
        // Identificamos al capitán
        const captain = members.find((m: Student) => m.id === team.captain_id)
        
        return {
          ...team,
          members,
          captain,
          game: team.game
        }
      })
      
      setTeams(processedTeams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      showAlert('error', 'Error al cargar los equipos')
    } finally {
      setLoadingTeams(false)
    }
  }

  const getTeamStatus = (team: Team) => {
    // Verificamos si el equipo está completo basado en el número mínimo de jugadores
    const minPlayers = team.game?.min_team_size || 1
    const isComplete = team.is_complete || (team.members?.length || 0) >= minPlayers
    
    return isComplete ? 'complete' : 'incomplete'
  }

  // Verificar si el usuario está registrado como estudiante
  const checkStudentRecord = async () => {
    if (!user) return
    
    try {
      // Buscar si el usuario ya tiene un registro en students
      const { data, error } = await supabase
        .from('students')
        .select('id, email, full_name')
        .eq('email', user.email)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 es el código para "no se encontraron resultados"
        throw error
      }
      
      if (data) {
        // Usuario ya registrado como estudiante
        setStudentRecord(data)
      } else {
        // El usuario no está registrado como estudiante
        showAlert('info', 'Necesitas completar tu perfil de estudiante antes de unirte a un equipo')
      }
    } catch (error) {
      console.error('Error al verificar el registro de estudiante:', error)
    }
  }

  // Obtener solicitudes de unión pendientes
  const fetchJoinRequests = async () => {
    if (!studentRecord) return
    
    try {
      // Obtener solicitudes que el estudiante ha enviado
      const { data: mySentRequests, error: sentError } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('student_id', studentRecord.id)
        .eq('status', 'pending')
      
      if (sentError) throw sentError
      
      // Obtener solicitudes recibidas (para equipos donde es capitán)
      const { data: myTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('captain_id', studentRecord.id)
      
      if (teamsError) throw teamsError
      
      if (myTeams && myTeams.length > 0) {
        const teamIds = myTeams.map(t => t.id)
        
        const { data: receivedRequests, error: receivedError } = await supabase
          .from('team_join_requests')
          .select(`
            *,
            student:students(*),
            team:teams(*)
          `)
          .in('team_id', teamIds)
          .eq('status', 'pending')
        
        if (receivedError) throw receivedError
        
        setPendingRequests(receivedRequests || [])
      }
    } catch (error) {
      console.error('Error al obtener solicitudes:', error)
    }
  }
  
  // Función para solicitar unirse a un equipo
  const requestToJoinTeam = async (teamId: string) => {
    if (!user || !studentRecord) {
      showAlert('warning', 'Necesitas iniciar sesión y tener un perfil completo para solicitar unirte a un equipo')
      return
    }

    setRequestingTeam(teamId)

    try {
      // Verificar si el equipo existe
      const selectedTeam = teams.find(t => t.id === teamId)
      if (!selectedTeam) {
        throw new Error('Equipo no encontrado')
      }
      
      // Verificar si el equipo ya está completo
      if (selectedTeam.is_complete) {
        showAlert('warning', 'Este equipo ya está completo')
        return
      }
      
      // Verificar si ya es miembro de este equipo
      const isMember = selectedTeam.members?.some(m => m.id === studentRecord.id)
      if (isMember) {
        showAlert('info', 'Ya eres miembro de este equipo')
        return
      }
      
      // Verificar si ya tiene una solicitud pendiente para este equipo
      const { data: existingRequests, error: checkError } = await supabase
        .from('team_join_requests')
        .select('id, status')
        .eq('team_id', teamId)
        .eq('student_id', studentRecord.id)
      
      if (checkError) throw checkError
      
      if (existingRequests && existingRequests.length > 0) {
        const pendingRequest = existingRequests.find(r => r.status === 'pending')
        if (pendingRequest) {
          showAlert('info', 'Ya tienes una solicitud pendiente para este equipo')
          return
        }
      }
      
      // Crear la solicitud de unión
      const { error } = await supabase
        .from('team_join_requests')
        .insert([{
          team_id: teamId,
          student_id: studentRecord.id,
          status: 'pending'
        }])
      
      if (error) throw error
      
      showAlert('success', `Has enviado una solicitud para unirte al equipo ${selectedTeam.name}. El capitán debe aprobarla.`)
    } catch (error) {
      console.error('Error al solicitar unirse al equipo:', error)
      showAlert('error', 'Ha ocurrido un error al enviar tu solicitud')
    } finally {
      setRequestingTeam(null)
    }
  }
  
  // Función para aprobar una solicitud (sólo para capitanes)
  const approveJoinRequest = async (requestId: string) => {
    if (!user || !studentRecord) return
    
    setProcessingRequest(requestId)
    
    try {
      // Obtener la solicitud
      const { data: request, error: reqError } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('id', requestId)
        .single()
      
      if (reqError) throw reqError
      
      // Verificar que sea el capitán del equipo
      if (request.team.captain_id !== studentRecord.id) {
        showAlert('error', 'Solo el capitán puede aprobar solicitudes')
        return
      }
      
      // Actualizar el estado de la solicitud
      const { error: updateError } = await supabase
        .from('team_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
      
      if (updateError) throw updateError
      
      // Agregar al estudiante como miembro del equipo
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: request.team_id,
          student_id: request.student_id
        }])
      
      if (memberError) throw memberError
      
      // Actualizar el estado del equipo si ya está completo
      const { data: members, error: countError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', request.team_id)
      
      if (countError) throw countError
      
      if (members && members.length >= (request.team.game?.min_team_size || 1)) {
        await supabase
          .from('teams')
          .update({ is_complete: true })
          .eq('id', request.team_id)
      }
      
      showAlert('success', 'Solicitud aprobada. El estudiante ha sido agregado al equipo.')
      
      // Refrescar datos
      fetchTeams()
      fetchJoinRequests()
    } catch (error) {
      console.error('Error al aprobar solicitud:', error)
      showAlert('error', 'Ha ocurrido un error al aprobar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }
  
  // Función para rechazar una solicitud (sólo para capitanes)
  const rejectJoinRequest = async (requestId: string) => {
    if (!user || !studentRecord) return
    
    setProcessingRequest(requestId)
    
    try {
      // Obtener la solicitud
      const { data: request, error: reqError } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('id', requestId)
        .single()
      
      if (reqError) throw reqError
      
      // Verificar que sea el capitán del equipo
      if (request.team.captain_id !== studentRecord.id) {
        showAlert('error', 'Solo el capitán puede rechazar solicitudes')
        return
      }
      
      // Actualizar el estado de la solicitud
      const { error: updateError } = await supabase
        .from('team_join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
      
      if (updateError) throw updateError
      
      showAlert('info', 'Solicitud rechazada')
      
      // Refrescar datos
      fetchJoinRequests()
    } catch (error) {
      console.error('Error al rechazar solicitud:', error)
      showAlert('error', 'Ha ocurrido un error al rechazar la solicitud')
    } finally {
      setProcessingRequest(null)
    }
  }

  const getFilteredTeams = () => {
    if (activeFilter === 'all') return teams
    return teams.filter(team => team.game?.category === activeFilter)
  }

  const getTeamStatusColor = (isComplete: boolean) => {
    return isComplete ? 'bg-green-500 text-green-100' : 'bg-yellow-500 text-yellow-100'
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pc': return 'PC'
      case 'console': return 'Consola'
      case 'board': return 'Juegos de Mesa'
      default: return 'No especificado'
    }
  }

  // Función para determinar la clase CSS según el estado del equipo
  const getStatusClass = (isComplete: boolean) => {
    return isComplete 
      ? 'bg-green-600 text-white' 
      : 'bg-yellow-600 text-white'
  }

  // Función para determinar si un miembro es el capitán
  const isCaptain = (team: Team, member: Student) => {
    return team.captain_id === member.id
  }

  if (loadingTeams) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <AlertComponent />
      
      <div className="px-4 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🎮 Equipos
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Conoce los equipos que participarán en el Tarreo Gamer
          </p>
        </div>

        {/* Solicitudes pendientes para capitanes */}
        {pendingRequests.length > 0 && (
          <div className="mb-10 bg-blue-900/30 p-6 rounded-lg border border-blue-500/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Solicitudes pendientes ({pendingRequests.length})
              </h2>
              <Button 
                onClick={() => setShowingRequests(!showingRequests)} 
                className="px-4 py-2"
              >
                {showingRequests ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            
            {showingRequests && (
              <div className="space-y-4">
                {pendingRequests.map(request => (
                  <div key={request.id} className="bg-blue-950/50 p-4 rounded-lg border border-blue-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{request.student?.full_name}</p>
                      <p className="text-sm text-gray-300">Solicita unirse a: {request.team?.name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveJoinRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => rejectJoinRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filtros de categoría */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-3 text-lg font-medium ${activeFilter === 'all' ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            Todos
          </Button>
          <Button
            onClick={() => setActiveFilter('pc')}
            className={`px-6 py-3 text-lg font-medium ${activeFilter === 'pc' ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            PC
          </Button>
          <Button
            onClick={() => setActiveFilter('console')}
            className={`px-6 py-3 text-lg font-medium ${activeFilter === 'console' ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            Consola
          </Button>
          <Button
            onClick={() => setActiveFilter('board')}
            className={`px-6 py-3 text-lg font-medium ${activeFilter === 'board' ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            Juegos de Mesa
          </Button>
        </div>
        
        {/* Lista de equipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTeams().length > 0 ? (
            getFilteredTeams().map(team => (
              <Card key={team.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{team.name}</h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getTeamStatus(team) === 'complete' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {getTeamStatus(team) === 'complete' ? (
                        <span className="flex items-center">
                          <Check className="h-3 w-3 mr-1" /> 
                          Completo
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> 
                          Buscando jugadores
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 border-b border-white/10">
                  <div className="flex items-center mb-2">
                    <Trophy className="h-5 w-5 text-purple-400 mr-2" />
                    <span className="text-gray-300 font-medium">
                      {team.game?.name || 'Juego no especificado'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-gray-300">
                      Categoría: {getCategoryName(team.category)}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="text-white font-medium mb-3">Miembros ({team.members?.length || 0}/{team.game?.max_team_size || '?'})</h4>
                  <ul className="space-y-2">
                    {team.members?.map(member => (
                      <li key={member.id} className="flex items-center space-x-2 p-2 rounded bg-white/5">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">{member.full_name}</p>
                          <p className="text-xs text-gray-400">{member.career}</p>
                        </div>
                        {member.id === team.captain_id && (
                          <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full ml-auto">
                            Capitán
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Botón para solicitar unirse al equipo */}
                  {user && studentRecord && !team.is_complete && 
                   !team.members?.some(m => m.id === studentRecord.id) && 
                   team.captain_id !== studentRecord.id && (
                    <div className="mt-4">
                      <button 
                        onClick={() => requestToJoinTeam(team.id)}
                        disabled={requestingTeam === team.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center justify-center w-full disabled:opacity-50"
                      >
                        {requestingTeam === team.id ? 'Enviando solicitud...' : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Solicitar unirse
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <Shield className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No hay equipos para mostrar</h3>
              <p className="text-gray-400">
                {activeFilter === 'all' 
                  ? 'Aún no se han formado equipos para el evento'
                  : `No hay equipos registrados en la categoría ${getCategoryName(activeFilter)}`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
