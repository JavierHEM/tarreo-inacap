'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout, { Card, Button } from '@/components/Layout'
import { useUser, supabase } from '@/lib/supabase'
import { User, Shield, Trophy, MessagesSquare, Upload, GamepadIcon } from 'lucide-react'
import { useAlert } from '@/components/Alert'
import Image from 'next/image'

// Define interface for student profile based on our updated schema
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

export default function ProfilePage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { alertProps, showAlert, hideAlert, AlertComponent } = useAlert()
  
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    career: '',
    preferred_games: [] as string[],
    main_role: '',
    game_rank: '',
    discord_username: '',
    bio: '',
  })
  
  // Role options for games
  const roleOptions = [
    { value: '', label: 'Selecciona un rol' },
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
  
  // Rank options
  const rankOptions = [
    { value: '', label: 'Selecciona un rango' },
    { value: 'Principiante', label: 'Principiante' },
    { value: 'Bronce', label: 'Bronce' },
    { value: 'Plata', label: 'Plata' },
    { value: 'Oro', label: 'Oro' },
    { value: 'Platino', label: 'Platino' },
    { value: 'Diamante', label: 'Diamante' },
    { value: 'Maestro', label: 'Maestro' },
    { value: 'Challenger', label: 'Challenger' },
    { value: 'Inmortal', label: 'Inmortal' },
    { value: 'Radiante', label: 'Radiante' },
    { value: 'Leyenda', label: 'Leyenda' },
    { value: 'Otro', label: 'Otro' },
  ]

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        fetchProfile()
        fetchGames()
      }
    }
  }, [user, loading, router])

  // Fetch student profile from Supabase
  const fetchProfile = async () => {
    try {
      // First check if user exists
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.id)

      if (error) {
        throw error
      }

      // Check if we got any data back
      if (data && data.length > 0) {
        setProfile(data[0])
        // Initialize form data with profile values
        setFormData({
          full_name: data[0].full_name || '',
          career: data[0].career || '',
          preferred_games: data[0].preferred_games || [],
          main_role: data[0].main_role || '',
          game_rank: data[0].game_rank || '',
          discord_username: data[0].discord_username || '',
          bio: data[0].bio || '',
        })
      } else {
        // No profile found, we could create a basic one or show a message
        console.log('No profile found for this user')
        // Create a basic profile with just the id, email from user object
        if (user) {
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: '',
            career: '',
            has_team: false,
            preferred_games: [],
            main_role: '',
            game_rank: '',
            discord_username: '',
            bio: '',
            profile_picture: null,
            created_at: new Date().toISOString()
          }
          setProfile(newProfile as StudentProfile)
          setFormData({
            full_name: '',
            career: '',
            preferred_games: [],
            main_role: '',
            game_rank: '',
            discord_username: '',
            bio: '',
          })
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message)
      showAlert(
        'error',
        'No se pudo cargar el perfil. Por favor, inténtalo de nuevo.'
      )
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Handle game selection changes
  const handleGameSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setFormData({ ...formData, preferred_games: selectedOptions })
  }

  // Save profile changes
  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          career: formData.career,
          preferred_games: formData.preferred_games,
          main_role: formData.main_role,
          game_rank: formData.game_rank,
          discord_username: formData.discord_username,
          bio: formData.bio,
        })
        .eq('id', user?.id)

      if (error) {
        throw error
      }

      // Update local profile state
      setProfile({
        ...profile!,
        full_name: formData.full_name,
        career: formData.career,
        preferred_games: formData.preferred_games,
        main_role: formData.main_role,
        game_rank: formData.game_rank,
        discord_username: formData.discord_username,
        bio: formData.bio,
      })

      setIsEditing(false)
      showAlert(
        'success',
        'Perfil actualizado correctamente'
      )
    } catch (error: any) {
      console.error('Error updating profile:', error.message)
      showAlert(
        'error',
        'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // En lugar de guardar en 'profiles', probaremos con el bucket predeterminado
    // que suele estar disponible en todas las instalaciones de Supabase
    const bucketName = 'avatars'
    const filePath = fileName

    setUploadingImage(true)

    try {
      // Primero verificamos los buckets disponibles
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.warn('No se pudieron listar los buckets:', bucketsError.message)
      }
      
      // Determinar qué bucket usar
      let targetBucket = 'avatars' // Default bucket que suele existir en Supabase
      
      if (buckets && buckets.length > 0) {
        // Usar el primer bucket disponible si existe alguno
        console.log('Buckets disponibles:', buckets.map(b => b.name).join(', '))
        targetBucket = buckets[0].name
      }
      
      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath)

      if (!data || !data.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen')
      }

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('students')
        .update({ profile_picture: data.publicUrl })
        .eq('id', user?.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProfile({
        ...profile!,
        profile_picture: data.publicUrl,
      })

      showAlert(
        'success',
        'Imagen de perfil actualizada correctamente'
      )
    } catch (error: any) {
      console.error('Error uploading image:', error.message)
      showAlert(
        'error',
        'No se pudo actualizar la imagen de perfil. Por favor, inténtalo de nuevo.'
      )
    } finally {
      setUploadingImage(false)
    }
  }

  // Get game name by ID
  const getGameNameById = (gameId: string) => {
    const game = games.find(g => g.id.toString() === gameId)
    return game ? game.name : gameId
  }

  return (
    <Layout>
      <AlertComponent />
      
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Editar Perfil
          </Button>
        )}
      </div>

      {profile ? (
        <>
          {/* Profile View/Edit Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile Picture & Basic Info */}
            <div className="col-span-1">
              <Card className="mb-6 overflow-hidden">
                <div className="relative h-48 w-full bg-gradient-to-r from-purple-800 to-indigo-800 flex items-center justify-center">
                  {profile.profile_picture ? (
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white">
                      <Image 
                        src={profile.profile_picture} 
                        alt={profile.full_name} 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gray-600 flex items-center justify-center border-4 border-white">
                      <User size={48} className="text-white" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute bottom-2 right-2">
                      <label htmlFor="profile-image" className="cursor-pointer">
                        <div className="bg-white text-purple-600 rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors">
                          <Upload size={16} />
                        </div>
                        <input 
                          type="file" 
                          id="profile-image" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-400 mb-1">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="career" className="block text-sm font-medium text-gray-400 mb-1">
                          Carrera
                        </label>
                        <input
                          type="text"
                          id="career"
                          name="career"
                          value={formData.career}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="discord_username" className="block text-sm font-medium text-gray-400 mb-1">
                          Usuario de Discord
                        </label>
                        <input
                          type="text"
                          id="discord_username"
                          name="discord_username"
                          value={formData.discord_username || ''}
                          onChange={handleInputChange}
                          placeholder="usuario#0000"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">{profile.full_name}</h2>
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          <span className="font-medium text-gray-400">Carrera:</span> {profile.career}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium text-gray-400">Email:</span> {profile.email}
                        </p>
                        {profile.discord_username && (
                          <p className="text-gray-300 flex items-center">
                            <span className="font-medium text-gray-400 mr-1">Discord:</span> 
                            <MessagesSquare size={14} className="mr-1 text-indigo-400" /> 
                            {profile.discord_username}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="preferred_games" className="block text-sm font-medium text-gray-400 mb-1">
                          Juegos Preferidos
                        </label>
                        <select
                          id="preferred_games"
                          name="preferred_games"
                          multiple
                          value={formData.preferred_games || []}
                          onChange={handleGameSelection}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          size={5}
                        >
                          {loadingGames ? (
                            <option disabled>Cargando juegos...</option>
                          ) : (
                            games.map(game => (
                              <option key={game.id} value={game.id.toString()}>
                                {game.name} ({game.category})
                              </option>
                            ))
                          )}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Mantén presionado Ctrl para seleccionar múltiples juegos</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="main_role" className="block text-sm font-medium text-gray-400 mb-1">
                            Rol Principal
                          </label>
                          <select
                            id="main_role"
                            name="main_role"
                            value={formData.main_role || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {roleOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="game_rank" className="block text-sm font-medium text-gray-400 mb-1">
                            Rango
                          </label>
                          <select
                            id="game_rank"
                            name="game_rank"
                            value={formData.game_rank || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {rankOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-1">
                          Biografía
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={formData.bio || ''}
                          onChange={handleInputChange}
                          placeholder="Cuéntanos sobre ti como jugador..."
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.preferred_games && profile.preferred_games.length > 0 ? (
                        <div>
                          <h3 className="text-md font-medium text-gray-300 mb-2">Juegos Preferidos</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferred_games.map(gameId => (
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
                        {profile.main_role && (
                          <div>
                            <h3 className="text-md font-medium text-gray-300 mb-1">Rol Principal</h3>
                            <p className="text-white flex items-center">
                              <Shield size={16} className="mr-2 text-blue-400" />
                              {profile.main_role}
                            </p>
                          </div>
                        )}

                        {profile.game_rank && (
                          <div>
                            <h3 className="text-md font-medium text-gray-300 mb-1">Rango</h3>
                            <p className="text-white flex items-center">
                              <Trophy size={16} className="mr-2 text-yellow-400" />
                              {profile.game_rank}
                            </p>
                          </div>
                        )}
                      </div>

                      {profile.bio ? (
                        <div>
                          <h3 className="text-md font-medium text-gray-300 mb-2">Sobre mí</h3>
                          <p className="text-gray-200 bg-gray-800 p-3 rounded-md">
                            {profile.bio}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No hay biografía configurada</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Edit Mode Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <Button 
                    onClick={() => {
                      setIsEditing(false)
                      // Reset form data to current profile
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || '',
                          career: profile.career || '',
                          preferred_games: profile.preferred_games || [],
                          main_role: profile.main_role || '',
                          game_rank: profile.game_rank || '',
                          discord_username: profile.discord_username || '',
                          bio: profile.bio || '',
                        })
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </Layout>
  )
}
