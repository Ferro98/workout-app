import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TabBar } from './components/layout/TabBar'
import { SchedaPage } from './pages/client/SchedaPage'
import { WorkoutPage } from './pages/client/WorkoutPage'
import { WorkoutProvider } from './context/WorkoutContext'
import type { Role } from './types'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">
      {name} — da costruire
    </div>
  )
}

// In produzione: decodificato dal JWT nel AuthContext
const MOCK_ROLE: Role = 'client'

export default function App() {
  const role = MOCK_ROLE

  return (
    <BrowserRouter>
      <WorkoutProvider>
        <div className="flex flex-col h-dvh max-w-[430px] mx-auto
                        bg-neutral-50 dark:bg-neutral-950">
          <Routes>
            {role === 'client' && (
              <>
                <Route path="/scheda" element={<SchedaPage />} />
                <Route path="/workout" element={<WorkoutPage />} />
                <Route path="/storico" element={<Placeholder name="Storico" />} />
                <Route path="/esercizi" element={<Placeholder name="Esercizi" />} />
                <Route path="/profilo" element={<Placeholder name="Profilo" />} />
                <Route path="*" element={<Navigate to="/scheda" replace />} />
              </>
            )}
            {role === 'coach' && (
              <>
                <Route path="/clienti" element={<Placeholder name="Clienti" />} />
                <Route path="/editor" element={<Placeholder name="Editor schede" />} />
                <Route path="/esercizi" element={<Placeholder name="Esercizi" />} />
                <Route path="/profilo" element={<Placeholder name="Profilo coach" />} />
                <Route path="*" element={<Navigate to="/clienti" replace />} />
              </>
            )}
          </Routes>
          <TabBar role={role} />
        </div>
      </WorkoutProvider>
    </BrowserRouter>
  )
}