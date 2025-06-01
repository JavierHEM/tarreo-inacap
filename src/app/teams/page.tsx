'use client'
import React from 'react'
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
  type CategoryType = 'all' | 'pc' | 'console' | 'board'
  const [activeFilter, setActiveFilter] = useState<CategoryType>('all')
  const [consolePlayers, setConsolePlayers] = useState<{[key: string]: Student[]}>({})
  const [loadingConsolePlayers, setLoadingConsolePlayers] = useState(false)
  const [showConsolePlayers, setShowConsolePlayers] = useState(false)
  const [boardPlayers, setBoardPlayers] = useState<{[key: string]: Student[]}>({})
  const [loadingBoardPlayers, setLoadingBoardPlayers] = useState(false)
  const [showBoardPlayers, setShowBoardPlayers] = useState(false)
  const [pcPlayers, setPcPlayers] = useState<{[key: string]: Student[]}>({})
  const [loadingPcPlayers, setLoadingPcPlayers] = useState(false)
  const [showPcPlayers, setShowPcPlayers] = useState(false)
  
  // Función para determinar si el filtro activo coincide con una categoría específica
  const isActiveFilter = (category: CategoryType): boolean => {
    return activeFilter === category
  }
  const [teamDetails, setTeamDetails] = useState<string | null>(null)
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
  
  // Efecto para cargar jugadores según la categoría seleccionada
  useEffect(() => {
    if (activeFilter === 'console') {
      fetchConsolePlayers()
    } else if (activeFilter === 'board') {
      fetchBoardPlayers()
    } else if (activeFilter === 'pc') {
      fetchPcPlayers()
    }
  }, [activeFilter])
  
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
  // Obtenemos la cantidad actual de miembros
  const currentMembers = team.members?.length || 0;
  
  // Obtenemos la capacidad máxima según el juego
  const maxCapacity = team.game?.max_team_size || 1;
  
  // Un equipo solo está completo cuando alcanza su capacidad máxima
  // Para Valorant, la capacidad máxima es siempre 5
  if (team.game?.name === 'Valorant') {
    return currentMembers >= 5 ? 'complete' : 'incomplete';
  }
  
  // Para otros juegos, verificamos si se ha alcanzado la capacidad máxima
  return currentMembers >= maxCapacity ? 'complete' : 'incomplete';
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
      // Primero actualizamos el estado local inmediatamente para mejor UX
      setPendingRequests(prevRequests => prevRequests.filter(req => req.id !== requestId))
      
      // Obtener la solicitud
      const { data: request, error: reqError } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          team:teams(*),
          student:students(*)
        `)
        .eq('id', requestId)
        .single()
      
      if (reqError) {
        // Si hay error, revertimos el cambio local
        console.error('Error al obtener solicitud:', reqError)
        showAlert('error', 'Ha ocurrido un error al aprobar la solicitud')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Verificar que sea el capitán del equipo
      if (request.team.captain_id !== studentRecord.id) {
        showAlert('error', 'Solo el capitán puede aprobar solicitudes')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Actualizar el estado de la solicitud
      const { error: updateError } = await supabase
        .from('team_join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
      
      if (updateError) {
        // Si hay error, revertimos el cambio local
        console.error('Error al actualizar solicitud:', updateError)
        showAlert('error', 'Ha ocurrido un error al aprobar la solicitud')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Agregar al estudiante como miembro del equipo
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: request.team_id,
          student_id: request.student_id
        }])
      
      if (memberError) {
        // Si hay error, revertimos el cambio local
        console.error('Error al agregar miembro:', memberError)
        showAlert('error', 'Ha ocurrido un error al agregar al estudiante al equipo')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Actualizar el estado del equipo si ya está completo
      const { data: members, error: countError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', request.team_id)
      
      if (countError) {
        console.error('Error al contar miembros:', countError)
        // No revertimos cambios aquí porque ya se aprobó correctamente
      } else if (members && members.length >= (request.team.game?.min_team_size || 1)) {
        await supabase
          .from('teams')
          .update({ is_complete: true })
          .eq('id', request.team_id)
      }
      
      showAlert('success', 'Solicitud aprobada. El estudiante ha sido agregado al equipo.')
      
      // Refrescar datos de equipos para ver el nuevo miembro
      fetchTeams()
      // No llamamos a fetchJoinRequests() aquí para evitar conflictos con el estado local
    } catch (error) {
      console.error('Error general al aprobar solicitud:', error)
      showAlert('error', 'Ha ocurrido un error al aprobar la solicitud')
      fetchJoinRequests() // Recargar estado original en caso de error
    } finally {
      setProcessingRequest(null)
    }
  }
  
  // Función para rechazar una solicitud (sólo para capitanes)
  const rejectJoinRequest = async (requestId: string) => {
    if (!user || !studentRecord) return
    
    setProcessingRequest(requestId)
    
    try {
      // Primero actualizamos el estado local inmediatamente para mejor UX
      setPendingRequests(prevRequests => prevRequests.filter(req => req.id !== requestId))
      
      // Obtener la solicitud
      const { data: request, error: reqError } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          team:teams(*),
          student:students(*)
        `)
        .eq('id', requestId)
        .single()
      
      if (reqError) {
        // Si hay error, revertimos el cambio local
        console.error('Error al obtener solicitud:', reqError)
        showAlert('error', 'Ha ocurrido un error al rechazar la solicitud')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Verificar que sea el capitán del equipo
      if (request.team.captain_id !== studentRecord.id) {
        showAlert('error', 'Solo el capitán puede rechazar solicitudes')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      // Eliminar la solicitud de la base de datos en lugar de solo marcarla como rechazada
      const { error: deleteError } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('id', requestId)
      
      if (deleteError) {
        // Si hay error, revertimos el cambio local
        console.error('Error al eliminar solicitud:', deleteError)
        showAlert('error', 'Ha ocurrido un error al rechazar la solicitud')
        fetchJoinRequests() // Recargar estado original
        return
      }
      
      showAlert('success', 'Jugador rechazado correctamente')
      
      // No llamamos a fetchJoinRequests() aquí para evitar conflictos con el estado local
    } catch (error) {
      console.error('Error general al rechazar solicitud:', error)
      showAlert('error', 'Ha ocurrido un error al rechazar la solicitud')
      fetchJoinRequests() // Recargar estado original en caso de error
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

  // Función para obtener todos los jugadores de juegos de consola
  const fetchConsolePlayers = async () => {
    try {
      setLoadingConsolePlayers(true)
      
      // Obtener todos los juegos de consola
      const { data: consoleGames, error: gamesError } = await supabase
        .from('games')
        .select('id, name')
        .eq('category', 'console')
      
      if (gamesError) throw gamesError
      
      // Para cada juego, obtener los estudiantes inscritos
      const playersMap: {[key: string]: Student[]} = {}
      
      for (const game of consoleGames) {
        // Obtener las inscripciones para este juego usando la tabla registrations
        const { data: registrations, error: registrationsError } = await supabase
          .from('registrations')
          .select('student_id')
          .eq('game_id', game.id)
          .eq('category', 'console')
        
        if (registrationsError) throw registrationsError
        
        if (registrations && registrations.length > 0) {
          // Obtener los detalles de los estudiantes usando los IDs
          const studentIds = registrations.map(reg => reg.student_id)
          
          const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds)
          
          if (studentsError) throw studentsError
          
          if (students && students.length > 0) {
            playersMap[game.name] = students
          }
        }
      }
      
      setConsolePlayers(playersMap)
      setShowConsolePlayers(true)
    } catch (error) {
      console.error('Error fetching console players:', error)
      showAlert('error', 'Error al cargar jugadores de consola')
    } finally {
      setLoadingConsolePlayers(false)
    }
  }
  
  // Función para obtener todos los jugadores de juegos de mesa
  const fetchBoardPlayers = async () => {
    try {
      setLoadingBoardPlayers(true)
      
      // Obtener todos los juegos de mesa
      const { data: boardGames, error: gamesError } = await supabase
        .from('games')
        .select('id, name')
        .eq('category', 'board')
      
      if (gamesError) throw gamesError
      
      // Para cada juego, obtener los estudiantes inscritos
      const playersMap: {[key: string]: Student[]} = {}
      
      for (const game of boardGames) {
        // Obtener las inscripciones para este juego usando la tabla registrations
        const { data: registrations, error: registrationsError } = await supabase
          .from('registrations')
          .select('student_id')
          .eq('game_id', game.id)
          .eq('category', 'board')
        
        if (registrationsError) throw registrationsError
        
        if (registrations && registrations.length > 0) {
          // Obtener los detalles de los estudiantes usando los IDs
          const studentIds = registrations.map(reg => reg.student_id)
          
          const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds)
          
          if (studentsError) throw studentsError
          
          if (students && students.length > 0) {
            playersMap[game.name] = students
          }
        }
      }
      
      setBoardPlayers(playersMap)
      setShowBoardPlayers(true)
    } catch (error) {
      console.error('Error fetching board game players:', error)
      showAlert('error', 'Error al cargar jugadores de juegos de mesa')
    } finally {
      setLoadingBoardPlayers(false)
    }
  }
  
  // Función para obtener todos los jugadores de juegos de PC
  const fetchPcPlayers = async () => {
    try {
      setLoadingPcPlayers(true)
      
      // Obtener todos los juegos de PC
      const { data: pcGames, error: gamesError } = await supabase
        .from('games')
        .select('id, name')
        .eq('category', 'pc')
      
      if (gamesError) throw gamesError
      
      // Para cada juego, obtener los estudiantes inscritos
      const playersMap: {[key: string]: Student[]} = {}
      
      for (const game of pcGames) {
        // Obtener las inscripciones para este juego usando la tabla registrations
        const { data: registrations, error: registrationsError } = await supabase
          .from('registrations')
          .select('student_id')
          .eq('game_id', game.id)
          .eq('category', 'pc')
        
        if (registrationsError) throw registrationsError
        
        if (registrations && registrations.length > 0) {
          // Obtener los detalles de los estudiantes usando los IDs
          const studentIds = registrations.map(reg => reg.student_id)
          
          const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds)
          
          if (studentsError) throw studentsError
          
          if (students && students.length > 0) {
            playersMap[game.name] = students
          }
        }
      }
      
      setPcPlayers(playersMap)
      setShowPcPlayers(true)
    } catch (error) {
      console.error('Error fetching PC game players:', error)
      showAlert('error', 'Error al cargar jugadores de juegos de PC')
    } finally {
      setLoadingPcPlayers(false)
    }
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
      
      {/* Header de la página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Equipos</h1>
          <p className="text-gray-400">Explora los equipos formados para el evento o únete a uno</p>
        </div>
        
        {/* Botones para ver solicitudes (solo para usuarios autenticados) */}
        {user && studentRecord && (
          <Button 
            onClick={() => setShowingRequests(!showingRequests)}
            className="mt-4 md:mt-0"
          >
            {showingRequests ? 'Volver a equipos' : 'Ver solicitudes'}
          </Button>
        )}
      </div>
      
      {/* Vista de solicitudes pendientes (si showingRequests es true) */}
      {showingRequests && user && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Solicitudes Pendientes</h2>
          
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {request.team?.name || 'Equipo desconocido'}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Juego: {request.team?.game?.name || 'No especificado'}
                      </p>
                      {request.team?.captain_id === studentRecord?.id && (
                        <p className="text-gray-300 text-sm">
                          Solicitud de: {request.student?.full_name || 'Usuario desconocido'}
                        </p>
                      )}
                      <p className="text-yellow-400 text-sm mt-1 flex items-center">
                        <Clock className="h-4 w-4 mr-1" /> Pendiente
                      </p>
                    </div>
                    
                    {/* Si el usuario es el capitán, mostrar botones para aprobar/rechazar */}
                    {request.team?.captain_id === studentRecord?.id && (
                      <div className="mt-4 md:mt-0 space-x-3 flex">
                        <button
                          onClick={() => approveJoinRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprobar
                        </button>
                        <button
                          onClick={() => rejectJoinRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay solicitudes pendientes</p>
            </div>
          )}
        </div>
      )}
      
      {/* Filtros de categoría */}
      {!showingRequests && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Button 
            onClick={() => setActiveFilter('all')}
            className={activeFilter === 'all' ? 'bg-indigo-600' : ''}
          >
            Todos
          </Button>
          <Button 
            onClick={() => {
              setActiveFilter('pc')
              fetchPcPlayers()
            }}
            className={activeFilter === 'pc' ? 'bg-indigo-600' : ''}
          >
            PC
          </Button>
          <Button 
            onClick={() => {
              setActiveFilter('console')
              fetchConsolePlayers()
            }}
            className={activeFilter === 'console' ? 'bg-indigo-600' : ''}
          >
            Consola
          </Button>
          <Button 
            onClick={() => {
              setActiveFilter('board')
              fetchBoardPlayers()
            }}
            className={activeFilter === 'board' ? 'bg-indigo-600' : ''}
          >
            Juegos de Mesa
          </Button>
        </div>
      )}
      
      {/* Sección de jugadores de consola */}
      {!showingRequests && activeFilter === 'console' && showConsolePlayers && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Jugadores inscritos en Juegos de Consola</h2>
          
          {loadingConsolePlayers ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : Object.keys(consolePlayers).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(consolePlayers).map(([gameName, players]) => (
                <div key={gameName} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-indigo-900 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">{gameName}</h3>
                    <span className="bg-indigo-600 text-white text-sm px-2 py-1 rounded-full">
                      Total: {players.length} jugadores
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {players.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {players.map((player) => (
                          <div key={player.id} className="bg-gray-800 p-3 rounded-lg flex items-center">
                            <User className="h-5 w-5 text-indigo-400 mr-3" />
                            <div>
                              <p className="text-white font-medium">{player.full_name}</p>
                              <p className="text-gray-400 text-sm">{player.career}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No hay jugadores inscritos en este juego</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay jugadores inscritos en juegos de consola</p>
            </div>
          )}
        </div>
      )}
      
      {/* Sección para mostrar equipos PC incompletos */}
      {!showingRequests && activeFilter === 'pc' && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Equipos de PC buscando jugadores</h2>
          
          {loadingTeams ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {teams
                .filter(team => team.category === 'pc' && getTeamStatus(team) === 'incomplete')
                .map(team => (
                  <div key={team.id} className="bg-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-purple-900 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <h3 className="text-lg font-medium text-white">{team.name}</h3>
                        <p className="text-purple-200 text-sm">{team.game?.name || 'No especificado'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-200 text-sm flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" /> 
                          {team.members?.length || 0}/{team.game?.max_team_size || '?'}
                        </span>
                        {user && studentRecord && !team.members?.some(m => m.id === studentRecord.id) && 
                        team.captain_id !== studentRecord.id && (
                          <button 
                            onClick={() => requestToJoinTeam(team.id)}
                            disabled={requestingTeam === team.id}
                            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {requestingTeam === team.id ? 'Enviando solicitud...' : 'Unirse al equipo'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-semibold text-white mb-2">Integrantes actuales:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.members && team.members.length > 0 ? (
                          team.members.map(member => (
                            <div key={member.id} className="flex items-center bg-gray-800 p-2 rounded">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-200">{member.full_name}</span>
                              {isCaptain(team, member) && (
                                <span className="ml-2 text-xs bg-purple-700 text-white px-1 py-0.5 rounded">Capitán</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">No hay miembros registrados</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {teams.filter(team => team.category === 'pc' && getTeamStatus(team) === 'incomplete').length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No hay equipos de PC buscando jugadores</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Sección de jugadores de PC */}
      {!showingRequests && activeFilter === 'pc' && showPcPlayers && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Jugadores inscritos en Juegos de PC</h2>
          
          {loadingPcPlayers ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : Object.keys(pcPlayers).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(pcPlayers).map(([gameName, players]) => (
                <div key={gameName} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-purple-900 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">{gameName}</h3>
                    <span className="bg-purple-700 text-white text-sm px-2 py-1 rounded-full">
                      Total: {players.length} jugadores
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {players.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {players.map((player) => (
                          <div key={player.id} className="bg-gray-800 p-3 rounded-lg flex items-center">
                            <User className="h-5 w-5 text-purple-400 mr-3" />
                            <div>
                              <p className="text-white font-medium">{player.full_name}</p>
                              <p className="text-gray-400 text-sm">{player.career}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No hay jugadores inscritos en este juego</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay jugadores inscritos en juegos de PC</p>
            </div>
          )}
        </div>
      )}
      
      {/* Sección de jugadores de juegos de mesa */}
      {!showingRequests && activeFilter === 'board' && showBoardPlayers && (
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Jugadores inscritos en Juegos de Mesa</h2>
          
          {loadingBoardPlayers ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : Object.keys(boardPlayers).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(boardPlayers).map(([gameName, players]) => (
                <div key={gameName} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-green-900 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">{gameName}</h3>
                    <span className="bg-green-700 text-white text-sm px-2 py-1 rounded-full">
                      Total: {players.length} jugadores
                    </span>
                  </div>
                  
                  <div className="p-4">
                    {players.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {players.map((player) => (
                          <div key={player.id} className="bg-gray-800 p-3 rounded-lg flex items-center">
                            <User className="h-5 w-5 text-green-400 mr-3" />
                            <div>
                              <p className="text-white font-medium">{player.full_name}</p>
                              <p className="text-gray-400 text-sm">{player.career}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No hay jugadores inscritos en este juego</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No hay jugadores inscritos en juegos de mesa</p>
            </div>
          )}
        </div>
      )}
      
      {/* Vista unificada de tabla para todas las categorías */}
      {!showingRequests && (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full bg-gray-900">
            <thead className="bg-indigo-900 bg-opacity-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre del Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Juego</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Miembros</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Capitán</th>
                <th className="px-4 py-3 text-xs font-medium text-white uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {getFilteredTeams().length > 0 ? (
                getFilteredTeams().map(team => (
                  <React.Fragment key={team.id}>
                    <tr className={`${teamDetails === team.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{team.name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{team.game?.name || 'No especificado'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTeamStatus(team) === 'complete' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                          {getTeamStatus(team) === 'complete' ? 'Completo' : 'Buscando jugadores'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {team.members?.length || 0}/{team.game?.max_team_size || '?'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{team.captain?.full_name || 'No especificado'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex space-x-3 justify-end">
                          {user && studentRecord && getTeamStatus(team) !== 'complete' && 
                           !team.members?.some(m => m.id === studentRecord.id) && 
                           team.captain_id !== studentRecord.id && (
                            <button 
                              onClick={() => requestToJoinTeam(team.id)}
                              disabled={requestingTeam === team.id}
                              className={`px-3 py-1.5 text-white text-xs rounded disabled:opacity-50 flex items-center ${team.category === 'pc' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                              {requestingTeam === team.id ? 'Enviando...' : 'Unirse'}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => setTeamDetails(teamDetails === team.id ? null : team.id)}
                            className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                          >
                            {teamDetails === team.id ? 'Ocultar detalles' : 'Ver detalles'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Panel de detalles del equipo como fila expandible */}
                    {teamDetails === team.id && (
                      <tr className="bg-gray-800 border-b border-gray-700">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-left">
                            <h4 className="font-semibold text-white mb-2">Integrantes del equipo:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {team.members && team.members.length > 0 ? (
                                team.members.map((member) => (
                                  <div key={member.id} className="flex items-center bg-gray-700 bg-opacity-50 p-2 rounded">
                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-gray-200">{member.full_name}</span>
                                    {isCaptain(team, member) && (
                                      <span className="ml-2 text-xs bg-purple-700 text-white px-1 py-0.5 rounded">Capitán</span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400">No hay miembros registrados</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Shield className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">
                      {isActiveFilter('all')
                        ? 'Aún no se han formado equipos para el evento'
                        : `No hay equipos registrados en la categoría ${isActiveFilter('pc') ? 'PC' : isActiveFilter('console') ? 'Consola' : 'Juegos de Mesa'}`
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
