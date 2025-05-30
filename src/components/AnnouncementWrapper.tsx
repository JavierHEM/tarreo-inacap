'use client'

import { useState, useEffect } from 'react'
import EventAnnouncement from './EventAnnouncement'

export default function AnnouncementWrapper() {
  // Este componente actúa como un wrapper cliente para el anuncio
  return (
    <EventAnnouncement />
  )
}
