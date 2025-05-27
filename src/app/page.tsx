// app/page.tsx
'use client'
import Layout, { Card, Button } from '@/components/Layout'
import { Calendar, Clock, MapPin, Users, Trophy, Gamepad2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/lib/supabase'

export default function HomePage() {
  const { user } = useUser()

  const features = [
    {
      icon: Trophy,
      title: "Torneos Oficiales",
      description: "Los 3 juegos de PC más votados tendrán torneo oficial con premios"
    },
    {
      icon: Users,
      title: "Equipos y Individual",
      description: "Participa solo o forma equipos según la categoría del juego"
    },
    {
      icon: Gamepad2,
      title: "Múltiples Categorías",
      description: "PC, consolas y juegos de mesa para todos los gustos"
    }
  ]

  const schedule = [
    { time: "19:00 - 20:00", activity: "Apertura del Evento: Registro de participantes, bienvenida oficial, instrucciones generales y presentación de equipos participantes." },
    { time: "20:00 - 23:00", activity: "Torneos Principales - Fase 1: Inicio de los torneos de los 3 juegos PC más votados. Rondas clasificatorias en paralelo con emocionantes partidas en tiempo real." },
    { time: "23:00 - 23:30", activity: "Break 1: Pausa para descansar y recargar energías con sándwiches, bebidas y snacks. Momento perfecto para socializar entre participantes." },
    { time: "23:30 - 02:00", activity: "Torneos Mixtos: Torneos de consola (EA SPORTS FC 2025, Mortal Kombat 1) en paralelo con semifinales de juegos PC. Competencia intensa en múltiples frentes." },
    { time: "02:00 - 02:30", activity: "Break 2: Segundo descanso nocturno con más snacks y bebidas energéticas. Momento para relajarse antes de la recta final." },
    { time: "02:30 - 05:00", activity: "Torneos de Mesa y Semifinales PC: Torneos de juegos de mesa (Mitos y Leyendas, Pokémon TCG, UNO Insano!) mientras continúan las semifinales de los juegos PC." },
    { time: "05:00 - 06:30", activity: "Finales Épicas: Finales de todos los torneos principales. Los jugadores se enfrentarán en batallas definitivas por ser los últimos en pie." },
    { time: "06:30 - 08:00", activity: "Gran Final y Premiación: Reconocimiento a los ganadores de cada categoría, entrega de premios y despedida oficial del evento." }
  ]
  
  const parallelActivities = [
    "Mesas de ping-pong y taca-taca",
    "Karaoke gamer con soundtracks épicos",
    "Zona retro gaming con consolas clásicas",
    "Torneos express de UNO durante los breaks",
    "Premios sorpresa",
    "Gaming lounge con Wi-Fi libre"
  ]

  return (
    <Layout>
      <div className="px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            🎮 Tarreo Gamer
            <span className="block text-3xl md:text-5xl text-purple-400 mt-2">
              Otoño 2025
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            La jornada nocturna gamer más esperada de INACAP Osorno. 
            Compite, divierte y conecta con la comunidad estudiantil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {user ? (
              <>
                <Link href="/vote">
                  <Button className="text-lg px-8 py-3">
                    <Trophy className="h-5 w-5" />
                    Votar por Juegos
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" className="text-lg px-8 py-3">
                    <Users className="h-5 w-5" />
                    Inscribirse
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/auth">
                <Button className="text-lg px-8 py-3">
                  <Gamepad2 className="h-5 w-5" />
                  Únete al Tarreo
                </Button>
              </Link>
            )}
          </div>
          
          {/* Discord */}
          <div className="mb-8 text-center">
            <a 
              href="https://discord.gg/pAuP2dKq4h" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <MessageSquare className="h-5 w-5" />
              Únete a nuestro Discord
            </a>
            <p className="text-gray-400 mt-2 text-sm">Mantente informado y conectado con todos los participantes</p>
          </div>
        </div>

        {/* Información del evento */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Fecha</h3>
            <p className="text-gray-300">6 y 7 de junio de 2025</p>
            <p className="text-gray-400 text-sm">Otoño 2025</p>
          </Card>
          
          <Card className="text-center">
            <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Horario</h3>
            <p className="text-gray-300">19:00 - 08:00 hrs</p>
            <p className="text-gray-400 text-sm">Jornada nocturna completa</p>
          </Card>
          
          <Card className="text-center">
            <MapPin className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Lugar</h3>
            <p className="text-gray-300">Auditorio y Hall INACAP Osorno</p>
            <p className="text-gray-400 text-sm">Campus INACAP Osorno</p>
          </Card>
        </div>

        {/* Características */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            ¿Qué hace especial este evento?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:bg-white/15 transition-all duration-300">
                <feature.icon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Cronograma */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Cronograma del Evento
          </h2>
          <Card className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-4 p-4 rounded-lg bg-white/5">
                  <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold min-w-[110px] text-center">
                    {item.time}
                  </div>
                  <div className="text-white flex-1">{item.activity}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Actividades Paralelas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Actividades Paralelas
          </h2>
          <Card className="max-w-3xl mx-auto">
            <p className="text-gray-300 mb-6 text-center">
              Mientras esperas tu turno, podrás disfrutar de diversas actividades en las zonas especiales:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parallelActivities.map((activity, index) => (
                <div key={index} className="flex items-center p-3 rounded-lg bg-white/5">
                  <div className="bg-blue-600 text-white p-2 rounded-full mr-3">
                    <span className="block h-4 w-4"></span>
                  </div>
                  <div className="text-white">{activity}</div>
                </div>
              ))}
            </div>
            <p className="text-purple-400 mt-6 text-center font-bold">
              ¡Prepárate para una noche épica llena de competencia, diversión y camaradería gamer que durará hasta el amanecer!
            </p>
          </Card>
        </div>

        {/* Categorías de juegos */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Categorías de Competencia
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Gamepad2 className="h-6 w-6 mr-2 text-purple-400" />
                Juegos de Mesa
              </h3>
              <p className="text-gray-300 mb-4">
                Torneos de cartas y juegos tradicionales.
              </p>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Mitos y Leyendas</li>
                <li>• Pokémon TCG</li>
                <li>• Uno Insano!</li>
              </ul>
            </Card>
            
            <Card>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Gamepad2 className="h-6 w-6 mr-2 text-blue-400" />
                Juegos de PC
              </h3>
              <p className="text-gray-300 mb-4">
                Vota por tus favoritos. Los 3 más votados tendrán torneo oficial.
              </p>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Valorant</li>
                <li>• League of Legends</li>
                <li>• Rocket League</li>
                <li>• Y más...</li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Gamepad2 className="h-6 w-6 mr-2 text-green-400" />
                Juegos de Consola
              </h3>
              <p className="text-gray-300 mb-4">
                Competencias 1v1 en los clásicos de consola.
              </p>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• EA SPORTS FC 2025</li>
                <li>• Mortal Kombat 1</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        {!user && (
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Listo para la competencia?
              </h2>
              <p className="text-gray-300 mb-6">
                Únete con tu email de estudiante INACAP y forma parte de la comunidad gamer más grande de Osorno.
              </p>
              <Link href="/auth">
                <Button className="text-lg px-8 py-3">
                  <Users className="h-5 w-5" />
                  Crear Cuenta
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}