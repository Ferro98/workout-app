import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { TabBar } from './components/layout/TabBar'
import { WorkoutProvider } from './context/WorkoutContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// 🔥 LAZY IMPORT PAGES
const SchedaPage = lazy(() => import('./pages/client/SchedaPage'))
const WorkoutPage = lazy(() => import('./pages/client/WorkoutPage'))
const ClientiPage = lazy(() => import('./pages/coach/ClientiPage'))
const EditorPage = lazy(() => import('./pages/coach/EditorPage'))
const EserciziPage = lazy(() => import('./pages/client/EserciziPage'))

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">
      {name} — da costruire
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">
      Caricamento...
    </div>
  )

  const role = user?.role

  return (
    <div className="flex flex-col h-dvh max-w-[430px] mx-auto bg-neutral-50 dark:bg-neutral-950">
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">Caricamento...</div>}>
          <Routes>
            {role === 'client' && (
              <>
                <Route path="/scheda" element={<SchedaPage />} />
                <Route path="/workout" element={<WorkoutPage />} />
                <Route path="/storico" element={<Placeholder name="Storico" />} />
                <Route path="/esercizi" element={<EserciziPage />} />
                <Route path="/profilo" element={<Placeholder name="Profilo" />} />
                <Route path="*" element={<Navigate to="/scheda" replace />} />
              </>
            )}
            {role === 'coach' && (
              <>
                <Route path="/clienti" element={<ClientiPage />} />
                <Route path="/editor/:clientId" element={<EditorPage />} />
                <Route path="/esercizi" element={<EserciziPage />} />
                <Route path="/profilo" element={<Placeholder name="Profilo coach" />} />
                <Route path="*" element={<Navigate to="/clienti" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </div>
      <TabBar role={role} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkoutProvider>
          <AppRoutes />
        </WorkoutProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}