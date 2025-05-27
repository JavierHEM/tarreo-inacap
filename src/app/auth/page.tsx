'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { supabase, useUser } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Mail, Lock, User, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const { user } = useUser()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        setMessage('¡Inicio de sesión exitoso!')
        router.push('/')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        setMessage('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
      }
    } catch (error: any) {
      setMessage(error.message || 'Ha ocurrido un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-96 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-8">
            <User className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-gray-300">
              {isLogin 
                ? 'Accede a tu cuenta para participar' 
                : 'Únete al Tarreo Gamer 2025'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Estudiantil
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="tu.email@inacapmail.cl"
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 6 caracteres'}
                  minLength={isLogin ? 1 : 6}
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('exitoso') || message.includes('creada')
                  ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                  : 'bg-red-600/20 text-red-300 border border-red-600/30'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
                setEmail('')
                setPassword('')
              }}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              {isLogin 
                ? '¿No tienes cuenta? Crear una nueva'
                : '¿Ya tienes cuenta? Iniciar sesión'
              }
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center">
              Al crear una cuenta, aceptas participar en el evento bajo las normas de INACAP Osorno.
              Solo estudiantes activos pueden participar.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
