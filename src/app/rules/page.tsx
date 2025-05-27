'use client'
import Layout, { Card } from '@/components/Layout'
import { Book, Shield, User, AlertTriangle, Gamepad2, List } from 'lucide-react'
import { useState } from 'react'

// Tipos de juegos con sus reglas específicas
const gameRules = [
  {
    id: 'general',
    name: 'Reglamento General',
    icon: Shield,
    content: `
## **Normas Generales**

- **Respeto a las reglas:** Todos los participantes deben cumplir estrictamente las reglas del torneo y respetar las decisiones de los organizadores.
- **Prohibido el consumo de alcohol y sustancias ilícitas:** Está prohibido el consumo de bebidas alcohólicas y cualquier tipo de sustancias ilícitas durante el evento, tanto dentro como fuera del área del torneo.
- **Cuidado del equipo:** Los participantes deberán usar el equipo y las instalaciones de manera responsable. Cualquier daño ocasionado al equipo será responsabilidad del participante o equipo involucrado.
- **Cumplimiento de horarios:** Los participantes deben presentarse puntualmente en el lugar del torneo y en sus respectivas partidas según los horarios establecidos. Los retrasos podrían llevar a la descalificación automática.

## **Normas de Convivencia y Comportamiento**

- **Respeto entre los participantes:** No se tolerarán actitudes hostiles, insultos o comportamientos agresivos hacia otros participantes, organizadores o espectadores. Cualquier comportamiento antideportivo será sancionado.
- **Respeto al espacio asignado:** Los participantes deben respetar las áreas designadas para el torneo y mantener el orden en el espacio asignado. No se permite invadir zonas no autorizadas.

## **Reglas del Juego**

- **Cumplimiento de las reglas de cada juego:** Cada videojuego tendrá reglas específicas que los participantes deberán seguir rigurosamente. Estas reglas estarán disponibles antes del inicio del torneo.
- **Prohibido el uso de trucos o hacks:** Cualquier participante que sea sorprendido usando software de terceros, hacks o exploits será descalificado inmediatamente.
- **Desconexiones y problemas técnicos:** En caso de desconexiones o problemas técnicos, el organizador determinará si se repite la partida o si se otorga una victoria por default.

## **Normas de Seguridad**

- **Control de acceso:** Solo los participantes registrados, organizadores y público autorizado podrán estar dentro de las áreas designadas para el torneo.
- **Emergencias:** En caso de emergencia (incendio, evacuación, etc.), los participantes deberán seguir las indicaciones del personal de seguridad.

## **Sanciones**

- **Descalificación:** Cualquier incumplimiento de las normas del reglamento podrá resultar en la descalificación del participante, expulsión del evento y la notificación a las autoridades académicas y disciplinarias.

## **Aceptación del Reglamento**

- **Consentimiento:** La participación en el torneo implica la aceptación total de este reglamento. Cualquier situación no contemplada será resuelta por los organizadores, cuyas decisiones serán inapelables.
    `
  },
  {
    id: 'pc-games',
    name: 'Juegos de PC',
    icon: Gamepad2,
    content: `
## **Reglas para Torneos de PC**

### **Configuración**

- **Hardware:** Cada participante usará los equipos proporcionados por la organización, con configuraciones iguales para todos los competidores.
- **Periféricos:** Los participantes pueden traer sus propios periféricos (teclado, mouse, auriculares) siempre que sean compatibles con los equipos y estén libres de software no autorizado.
- **Configuraciones de juego:** Los jugadores tendrán 5 minutos antes de sus partidas para configurar sus periféricos y ajustar la configuración del juego según sus preferencias.

### **Formato de Competencia**

- **Sistema de eliminación:** Los torneos seguirán un sistema de eliminación doble o formato de grupos según la cantidad de participantes.
- **Mapas y modos:** Los mapas y modos de juego serán anunciados antes del inicio del torneo y serán los mismos para todas las rondas.
- **Partidas:** Las partidas iniciales serán al mejor de 1, las semifinales al mejor de 3, y la final al mejor de 5.

### **Durante la Partida**

- **Pausas:** Solo se permiten pausas en caso de problemas técnicos verificables. El abuso de pausas resultará en sanciones.
- **Comunicación:** La comunicación entre jugadores durante las partidas debe ser únicamente relacionada al juego en curso.
- **Observadores:** Solo los organizadores y casters oficiales pueden observar las partidas en curso.

### **Desconexiones**

- **Desconexiones involuntarias:** Si un jugador se desconecta involuntariamente, la partida se pausará por un máximo de 10 minutos.
- **Reconexión:** Si el jugador no puede reconectarse en ese tiempo, se determinará el resultado según el estado de la partida o se reprogramará según lo decidan los organizadores.
    `
  },
  {
    id: 'console-games',
    name: 'Juegos de Consola',
    icon: Gamepad2,
    content: `
## **Reglas para Torneos de Consola**

### **Equipamiento**

- **Consolas:** Se utilizarán consolas PlayStation 5 y Xbox Series X proporcionadas por la organización.
- **Mandos:** La organización proporcionará mandos oficiales. Los participantes pueden usar sus propios mandos siempre que sean compatibles y estén aprobados por la organización.
- **Adaptadores:** No se permiten adaptadores para teclado y ratón a menos que el juego los soporte nativamente.

### **Formato de Competencia**

- **Brackets:** Los torneos seguirán un formato de eliminación simple o doble según el número de participantes.
- **Clasificatorias:** En caso de tener muchos participantes, se realizarán rondas clasificatorias antes del torneo principal.
- **Reglas específicas:** Cada juego de consola tendrá reglas específicas adicionales que se anunciarán antes del torneo.

### **EA SPORTS FC 2025**

- **Duración de partidos:** Dos tiempos de 6 minutos cada uno.
- **Equipos:** Se pueden usar clubes o selecciones nacionales, sin restricciones.
- **Configuración:** Nivel de dificultad Clase Mundial, clima aleatorio, estadio aleatorio.
- **Desempate:** En caso de empate, se jugarán tiempos extra y penales según las reglas del juego.

### **Mortal Kombat 1**

- **Formato:** Al mejor de 3 rondas por combate.
- **Selección de personajes:** La selección de personajes es libre, pero debe mantenerse el mismo personaje durante todo el set de combate.
- **Counter-pick:** El perdedor de un combate puede cambiar de personaje para el siguiente, el ganador debe mantener su personaje.
- **Modos especiales:** No se permiten modos especiales o variaciones que no estén disponibles para todos los jugadores.
    `
  },
  {
    id: 'board-games',
    name: 'Juegos de Mesa',
    icon: User,
    content: `
## **Reglas para Torneos de Juegos de Mesa**

### **General**

- **Estado de los juegos:** Todos los juegos deben estar en buen estado y completos. La organización verificará esto antes del inicio de cada torneo.
- **Árbitros:** Habrá árbitros especializados en cada juego para resolver dudas y conflictos.
- **Tiempo:** Cada partida tendrá un tiempo máximo establecido. Si se llega al límite, se determinarán ganadores según los puntos acumulados hasta ese momento.

### **Mitos y Leyendas**

- **Formato:** Sistema suizo de 5 rondas, seguido de top 8 en eliminación directa.
- **Mazos:** Los participantes deben traer sus propios mazos, que serán revisados antes del torneo para asegurar que cumplen con las reglas oficiales.
- **Tiempo por ronda:** 40 minutos máximo por ronda.
- **Restricciones:** Se juega con las últimas reglas oficiales y la lista de cartas prohibidas/restringidas actualizada.

### **Pokémon TCG**

- **Formato:** Estándar oficial de Pokémon TCG.
- **Mazos:** 60 cartas exactas, cumpliendo todas las restricciones oficiales.
- **Duración:** 30 minutos por ronda, más 3 turnos adicionales al finalizar el tiempo.
- **Material:** Cada jugador debe traer sus propias monedas, dados, contadores de daño y condiciones especiales.

### **UNO Insano**

- **Reglas especiales:** Se juega con las reglas oficiales más reglas especiales del torneo que se anunciarán al inicio.
- **Penalizaciones:** Olvidar decir "UNO" cuando corresponde resulta en tomar 2 cartas adicionales.
- **Formato:** Mesas de 4-5 jugadores, los mejores de cada mesa avanzan a la siguiente ronda.
- **Final:** La mesa final se jugará al mejor de 3 partidas.
    `
  },
  {
    id: 'brackets',
    name: 'Sistema de Brackets',
    icon: List,
    content: `
## **Sistema de Brackets y Enfrentamientos**

### **Generación de Brackets**

- **Seedeo:** Los brackets serán generados de forma aleatoria, excepto para jugadores o equipos que hayan participado en eventos anteriores, quienes recibirán una posición de siembra basada en su rendimiento previo.
- **Equilibrio:** Se procurará que los equipos o jugadores de una misma carrera no se enfrenten en las primeras rondas.
- **Publicación:** Los brackets serán publicados 24 horas antes del inicio del torneo y estarán disponibles tanto físicamente en el evento como en la plataforma digital.

### **Tipos de Formato**

- **Eliminación Doble:** Formato principal para torneos de PC y consolas. Los participantes tienen dos oportunidades antes de ser eliminados.
- **Round Robin:** Para grupos pequeños (menos de 8 participantes), donde todos juegan contra todos.
- **Suizo:** Para torneos de juegos de mesa con muchos participantes, donde se juegan rondas con rivales de puntuación similar.

### **Avance y Desempates**

- **Puntuación:** Victoria = 3 puntos, Empate = 1 punto, Derrota = 0 puntos.
- **Desempates:** En caso de empate en puntos, se considerarán criterios secundarios como:
  1. Resultado directo entre empatados
  2. Diferencia de puntos/goles/victorias
  3. Mayor número de puntos/goles/victorias a favor
  4. Menor número de puntos/goles/derrotas en contra
  5. Sorteo (último recurso)

### **Confirmación de Resultados**

- **Reportes:** Los resultados deben ser reportados inmediatamente después de cada partida al árbitro o mesa de control.
- **Firmas:** Ambos participantes deben firmar la hoja de resultados para confirmar el marcador final.
- **Reclamaciones:** Cualquier reclamación sobre el resultado debe hacerse antes de firmar la hoja y nunca después de 10 minutos de finalizada la partida.

### **Reprogramaciones**

- **Ausencias:** Si un participante no se presenta en los 15 minutos posteriores a la hora programada, perderá por defecto.
- **Reprogramación:** Solo se reprogramarán partidas por causas de fuerza mayor y con la aprobación de los organizadores.
    `
  }
]

export default function RulesPage() {
  const [activeRule, setActiveRule] = useState('general')

  const selectedRule = gameRules.find(rule => rule.id === activeRule) || gameRules[0]
  
  return (
    <Layout>
      <div className="px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            📜 Reglamento
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Normas oficiales del Tarreo Gamer Otoño 2025
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {gameRules.map(rule => (
              <button
                key={rule.id}
                onClick={() => setActiveRule(rule.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeRule === rule.id
                    ? 'bg-purple-700 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <rule.icon className="h-4 w-4" />
                  <span>{rule.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del reglamento */}
        <Card className="max-w-4xl mx-auto mb-16 prose prose-invert prose-headings:text-purple-400">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <selectedRule.icon className="h-8 w-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold text-white m-0">{selectedRule.name}</h2>
            </div>
            
            <div className="markdown-content" 
              dangerouslySetInnerHTML={{ 
                __html: require('marked').parse(selectedRule.content) 
              }}
            />
          </div>
        </Card>
        
        {/* Nota importante */}
        <div className="max-w-4xl mx-auto mb-8 bg-yellow-600/20 rounded-lg p-6 border border-yellow-600/30">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Nota Importante</h3>
              <p className="text-gray-300">
                Este reglamento está sujeto a cambios y actualizaciones. La versión final será confirmada el día del evento. 
                Cualquier modificación será comunicada a todos los participantes.
              </p>
              <p className="text-gray-300 mt-2">
                La inscripción y participación en el evento implica la aceptación completa de estas normas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
