import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WallCalendar from './WallCalendar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WallCalendar />
  </StrictMode>,
)
