'use client'

import Layout from '@/components/Layout'
import { Trophy, Calendar, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function MaintenancePage() {
  // Estado para almacenar el tiempo restante
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  
  // Calcular tiempo restante para el evento
  useEffect(() => {
    // Fecha del evento: 6 de junio de 2025 a las 19:00 horas (GMT-4, hora de Chile)
    const eventDate = new Date('2025-06-06T19:00:00-04:00')
    
    // Función para actualizar el contador
    const updateCounter = () => {
      const now = new Date()
      const difference = eventDate.getTime() - now.getTime()
      
      if (difference <= 0) {
        // El evento ya ha pasado
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      
      // Calcular días, horas, minutos y segundos
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      
      setTimeRemaining({ days, hours, minutes, seconds })
    }
    
    // Actualizar inmediatamente y luego cada segundo
    updateCounter()
    const interval = setInterval(updateCounter, 1000)
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval)
  }, [])
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-blue-500 to-purple-600 inline-block text-transparent bg-clip-text mb-6">
            ¡Votaciones Cerradas!
          </h1>
          
          <div className="flex justify-center mb-6">
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          </div>
          
          <div className="bg-gray-800 border-l-4 border-yellow-500 p-4 text-white shadow-lg rounded-lg mb-8 flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
            <div className="text-left">
              <p className="text-lg font-semibold mb-2">Estamos preparando todo para el evento</p>
              <p className="text-gray-300">
                Mientras confirmamos los equipos y finalizamos los preparativos para el Tarreo Gamer Otoño 2025, 
                las votaciones y algunas funciones de la plataforma estarán temporalmente deshabilitadas.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="w-14 h-14 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Preparando Competencias</h3>
            <p className="text-gray-300">
              Estamos organizando las mejores competencias basadas en vuestros votos.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Cuenta regresiva</h3>
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-purple-400">{timeRemaining.days}</div>
                <div className="text-xs text-gray-400">DÍAS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-purple-400">{timeRemaining.hours}</div>
                <div className="text-xs text-gray-400">HORAS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-purple-400">{timeRemaining.minutes}</div>
                <div className="text-xs text-gray-400">MIN</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-purple-400">{timeRemaining.seconds}</div>
                <div className="text-xs text-gray-400">SEG</div>
              </div>
            </div>
            <p className="text-gray-300 mt-3">
              ¡Prepárate para el gran evento!
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="w-14 h-14 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Confirmando Equipos</h3>
            <p className="text-gray-300">
              Estamos verificando todos los equipos y finalizando los detalles.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">¿Qué sigue ahora?</h2>
          <p className="text-gray-300 mb-6">
            Avisaremos en nuestro Discord oficial del Tarreo Gamer Otoño 2025 cuando la plataforma esté nuevamente activa con toda la información 
            del evento, horarios, y tu confirmación de inscripción.
          </p>
          

        </div>
      </div>
    </Layout>
  )
}
