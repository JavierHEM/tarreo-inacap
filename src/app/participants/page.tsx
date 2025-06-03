'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { User, Shield, Trophy, MessagesSquare, Users, Search, GamepadIcon, ExternalLink } from 'lucide-react'
import { useAlert } from '@/components/Alert'
import Image from 'next/image'
import Link from 'next/link'

// Define interface for student profile
interface StudentProfile {
  id: string
  email: string
  full_name: string
  career: string
  has_team: boolean
  preferred_games: string[] | null
  main_role: string | null
  game_rank: string | null
  discord_username: string | null
  bio: string | null
  profile_picture: string | null
  created_at: string
}

interface Game {
  id: number
  name: string
  category: 'pc' | 'console' | 'board'
  max_team_size: number
  min_team_size: number
  votes_count: number
}

export default function ParticipantsPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { alertProps, showAlert, hideAlert, AlertComponent } = useAlert()
  
  const [participants, setParticipants] = useState<StudentProfile[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<StudentProfile[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)
  const [games, setGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<StudentProfile | null>(null)
  
  // Role options for filtering
  const roleOptions = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'Apoyo', label: 'Apoyo' },
    { value: 'Tanque', label: 'Tanque' },
    { value: 'DPS', label: 'DPS' },
    { value: 'Jungler', label: 'Jungler' },
    { value: 'Mid', label: 'Mid' },
    { value: 'Top', label: 'Top' },
    { value: 'Support', label: 'Support' },
    { value: 'ADC', label: 'ADC' },
    { value: 'Flex', label: 'Flex' },
    { value: 'Estratega', label: 'Estratega' },
    { value: 'Capitán', label: 'Capitán' },
    { value: 'Otro', label: 'Otro' },
  ]

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        fetchParticipants()
        fetchGames()
      }
    }
  }, [user, loading, router])

  // Fetch all participants
  const fetchParticipants = async () => {
    setLoadingParticipants(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name')

      if (error) {
        throw error
      }

      setParticipants(data || [])
      setFilteredParticipants(data || [])
    } catch (error: any) {
      console.error('Error fetching participants:', error.message)
      showAlert('error', 'No se pudieron cargar los participantes', 3000)
    } finally {
      setLoadingParticipants(false)
    }
  }

  // Fetch available games
  const fetchGames = async () => {
    setLoadingGames(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      setGames(data || [])
    } catch (error: any) {
      console.error('Error fetching games:', error.message)
    } finally {
      setLoadingGames(false)
    }
  }

  // Fetch specific participant profile
  const fetchParticipantProfile = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', participantId)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setViewingProfile(data[0])
      } else {
        console.error('No se encontró el perfil del participante')
        showAlert('error', 'No se encontró el perfil del participante', 3000)
      }
    } catch (error: any) {
      console.error('Error fetching participant profile:', error.message)
      showAlert('error', 'No se pudo cargar el perfil del participante', 3000)
    }
  }

  // Filter participants based on search and filters
  useEffect(() => {
    let results = [...participants]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(participant => 
        participant.full_name.toLowerCase().includes(query) ||
        participant.career.toLowerCase().includes(query) ||
        (participant.discord_username && participant.discord_username.toLowerCase().includes(query)) ||
        (participant.bio && participant.bio.toLowerCase().includes(query))
      )
    }
    
    // Apply game filter
    if (selectedGame !== 'all') {
      results = results.filter(participant => 
        participant.preferred_games && 
        participant.preferred_games.includes(selectedGame)
      )
    }
    
    // Apply role filter
    if (selectedRole !== 'all') {
      results = results.filter(participant => 
        participant.main_role === selectedRole
      )
    }
    
    setFilteredParticipants(results)
  }, [searchQuery, selectedGame, selectedRole, participants])

  // Get game name by ID
  const getGameNameById = (gameId: string) => {
    const game = games.find(g => g.id.toString() === gameId)
    return game ? game.name : gameId
  }

  // Handle participant selection
  const handleParticipantSelect = (participantId: string) => {
    setSelectedParticipant(participantId)
    fetchParticipantProfile(participantId)
  }

  // Close profile view
  const closeProfileView = () => {
    setSelectedParticipant(null)
    setViewingProfile(null)
  }

  return (
    <Layout>
      <AlertComponent />
      
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Users size={24} className="mr-2" />
          Participantes
        </h1>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar participantes..."
                  className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Game Filter */}
            <div>
              <select
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="all">Todos los juegos</option>
                {games.map(game => (
                  <option key={game.id} value={game.id.toString()}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Participants Listing */}
      {loadingParticipants ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : selectedParticipant && viewingProfile ? (
        // Participant Profile View
        <div className="mt-4">
          <Button 
            onClick={closeProfileView}
            className="mb-4 bg-gray-700 hover:bg-gray-600 text-white"
          >
            ← Volver a la lista
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile Picture & Basic Info */}
            <div className="col-span-1">
              <Card className="mb-6 overflow-hidden">
                <div className="relative h-48 w-full bg-gradient-to-r from-purple-800 to-indigo-800 flex items-center justify-center">
                  {viewingProfile.profile_picture ? (
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white">
                      <Image 
                        src={viewingProfile.profile_picture} 
                        alt={viewingProfile.full_name} 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gray-600 flex items-center justify-center border-4 border-white">
                      <User size={48} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{viewingProfile.full_name}</h2>
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      <span className="font-medium text-gray-400">Carrera:</span> {viewingProfile.career}
                    </p>
                    {viewingProfile.discord_username && (
                      <p className="text-gray-300 flex items-center">
                        <span className="font-medium text-gray-400 mr-1">Discord:</span> 
                        <MessagesSquare size={14} className="mr-1 text-indigo-400" /> 
                        {viewingProfile.discord_username}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Gaming Profile */}
            <div className="col-span-1 md:col-span-2">
              <Card className="mb-6">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <GamepadIcon size={20} className="mr-2 text-purple-500" /> 
                    Perfil de Jugador
                  </h2>

                  <div className="space-y-4">
                    {viewingProfile.preferred_games && viewingProfile.preferred_games.length > 0 ? (
                      <div>
                        <h3 className="text-md font-medium text-gray-300 mb-2">Juegos Preferidos</h3>
                        <div className="flex flex-wrap gap-2">
                          {viewingProfile.preferred_games.map(gameId => (
                            <span 
                              key={gameId} 
                              className="px-3 py-1 bg-purple-900/50 text-purple-200 text-sm rounded-full"
                            >
                              {getGameNameById(gameId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No hay juegos preferidos configurados</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProfile.main_role && (
                        <div>
                          <h3 className="text-md font-medium text-gray-300 mb-1">Rol Principal</h3>
                          <p className="text-white flex items-center">
                            <Shield size={16} className="mr-2 text-blue-400" />
                            {viewingProfile.main_role}
                          </p>
                        </div>
                      )}

                      {viewingProfile.game_rank && (
                        <div>
                          <h3 className="text-md font-medium text-gray-300 mb-1">Rango</h3>
                          <p className="text-white flex items-center">
                            <Trophy size={16} className="mr-2 text-yellow-400" />
                            {viewingProfile.game_rank}
                          </p>
                        </div>
                      )}
                    </div>

                    {viewingProfile.bio ? (
                      <div>
                        <h3 className="text-md font-medium text-gray-300 mb-2">Sobre mí</h3>
                        <p className="text-gray-200 bg-gray-800 p-3 rounded-md">
                          {viewingProfile.bio}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No hay biografía configurada</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // Participants List View
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map(participant => (
                <div key={participant.id} className="overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => handleParticipantSelect(participant.id)}>
                  <Card>
                  <div className="p-4 flex items-center space-x-4">
                    {participant.profile_picture ? (
                      <div className="relative h-16 w-16 rounded-full overflow-hidden">
                        <Image 
                          src={participant.profile_picture} 
                          alt={participant.full_name} 
                          fill 
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{participant.full_name}</h3>
                      <p className="text-sm text-gray-400">{participant.career}</p>
                      
                      {/* Game Tags */}
                      {participant.preferred_games && participant.preferred_games.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {participant.preferred_games.slice(0, 2).map(gameId => (
                            <span 
                              key={gameId} 
                              className="px-2 py-0.5 bg-purple-900/50 text-purple-200 text-xs rounded-full"
                            >
                              {getGameNameById(gameId)}
                            </span>
                          ))}
                          {participant.preferred_games.length > 2 && (
                            <span className="px-2 py-0.5 text-gray-400 text-xs">
                              +{participant.preferred_games.length - 2} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400">No se encontraron participantes con los filtros seleccionados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}