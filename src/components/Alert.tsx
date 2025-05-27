'use client'
import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

type AlertType = 'success' | 'error' | 'info' | 'warning'

interface AlertProps {
  type: AlertType
  message: string
  duration?: number
  onClose?: () => void
  show: boolean
}

export const Alert = ({ type, message, duration = 3000, onClose, show }: AlertProps) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(show)
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }
  
  if (!isVisible) return null
  
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type]
  
  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle
  }[type]

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${bgColor} text-white rounded-lg shadow-lg p-4 max-w-md flex items-start`}>
        <Icon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">{message}</div>
        <button 
          onClick={handleClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Hook para gestionar alertas
export const useAlert = () => {
  const [alertProps, setAlertProps] = useState<Omit<AlertProps, 'show'> & { show: boolean }>({
    type: 'info',
    message: '',
    show: false
  })

  const showAlert = (type: AlertType, message: string, duration = 3000) => {
    setAlertProps({
      type,
      message,
      duration,
      show: true
    })
  }

  const hideAlert = () => {
    setAlertProps(prev => ({ ...prev, show: false }))
  }

  // Definimos AlertComponent como un componente funcional, no como un JSX literal
  const AlertComponent = () => {
    return <Alert {...alertProps} onClose={hideAlert} />
  }

  return {
    alertProps,
    showAlert,
    hideAlert,
    AlertComponent
  }
}
