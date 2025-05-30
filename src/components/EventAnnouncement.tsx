'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function EventAnnouncement() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar si el anuncio ya fue visto en esta sesión
    const hasSeenAnnouncement = sessionStorage.getItem('hasSeenAnnouncement')
    
    if (!hasSeenAnnouncement) {
      // Mostrar el anuncio después de 1 segundo
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const closeModal = () => {
    // Animar cierre
    const modal = document.getElementById('gameModal')
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-out forwards'
      
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        setIsVisible(false)
        // Guardar que el usuario ya vio el anuncio en esta sesión
        sessionStorage.setItem('hasSeenAnnouncement', 'true')
      }, 300)
    }
  }

  // Si no es visible, no renderizar nada
  if (!isVisible) return null

  return (
    <div 
      id="gameModal" 
      className="modal-overlay"
      onClick={(e) => {
        // Cerrar al hacer clic fuera del modal
        if (e.target === e.currentTarget) {
          closeModal()
        }
      }}
    >
      <div className="modal-container">
        {/* Elementos de fondo */}
        <div className="bg-elements">
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
          <div className="star"></div>
        </div>
        
        <button className="close-btn" onClick={closeModal}>
          <X size={24} />
        </button>
        
        <div className="header-section">
          <div className="inacap-logo">INACAP</div>
          
          {/* Gaming setup 3D */}
          <div className="gaming-setup">
            <div className="gamepad-3d"></div>
            <div className="keyboard-3d">
              <div className="keyboard-keys">
                {Array(24).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className={`key ${[2, 9, 20].includes(i) ? 'highlight' : ''}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Título */}
          <h1 className="main-title">
            <span className="title-tarreo">TARREO</span>
            <span className="title-gamer">GAMER</span>
          </h1>
          
          <div className="title-season">
            <span className="season-otono">OTOÑO</span>
            <span className="season-year">2025</span>
          </div>
        </div>
        
        <div className="content">
          <div className="alert-badge">🚨 Cupos Limitados</div>
          
          <h2 className="event-description">
            Prepárate para la jornada<br/>
            nocturna más intensa del año<br/>
            en INACAP Osorno
          </h2>
          
          <p className="event-location">
            Compite, disfruta y vive la experiencia gamer con tu comunidad
          </p>
          
          <div className="priority-message">
            <h3>👑 Prioridad para Equipos Completos</h3>
            <p>
              Los equipos conformados tienen <strong>acceso prioritario</strong> al evento. 
              Si ya tienes tu crew listo, ¡asegura sus lugares ahora mismo!
            </p>
          </div>
          
          {/* Mensaje de advertencia eliminado como solicitado */}
          
          <div className="cta-buttons">
            <a href="/games" className="btn-primary" onClick={closeModal}>
              🎮 ¡Asegurar Mi Lugar!
            </a>
            <a href="/teams" className="btn-secondary" onClick={closeModal}>
              👥 Formar Equipo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
