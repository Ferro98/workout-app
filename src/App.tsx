import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import { TabBar } from './components/layout/TabBar'
import { WorkoutProvider } from './context/WorkoutContext'
import type { Role } from './types'

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

// In produzione: dal JWT nel AuthContext
const MOCK_ROLE: Role = 'client'

export default function App() {
  const role = MOCK_ROLE

  return (
    <BrowserRouter>
      <WorkoutProvider>

        <div className="flex flex-col h-dvh max-w-[430px] mx-auto bg-neutral-50 dark:bg-neutral-950">

          {/* AREA CONTENUTO SCORRIBILE */}
          <div className="flex-1 overflow-y-auto">

            {/* 🔥 SUSPENSE WRAPPER */}
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">
                  Caricamento...
                </div>
              }
            >
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

          {/* TABBAR SEMPRE VISIBILE */}
          <TabBar role={role} />

        </div>

      </WorkoutProvider>
    </BrowserRouter>
  )
}