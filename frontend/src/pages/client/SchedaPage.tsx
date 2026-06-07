// src/pages/client/SchedaPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { CoachNoteBanner } from '../../components/scheda/CoachNoteBanner'
import { ExerciseCard } from '../../components/scheda/ExerciseCard'
import { programService } from '../../api/programService'
import { useAuth } from '../../context/AuthContext'
import type { Program } from '../../types'

type Tab = 'scheda' | 'versioni'

export default function SchedaPage() {
    // 1. PRIMA DI TUTTO GLI HOOK (Sempre in cima!)
    const { user } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('scheda')
    const [showDiff, setShowDiff] = useState(false)
    const [program, setProgram] = useState<Program | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Inizializziamo a null perché al primo avvio non abbiamo ancora la scheda
    const [selectedDayId, setSelectedDayId] = useState<number | null>(null)

    useEffect(() => {
        async function loadProgram() {
            try {
                setLoading(true)
                setError(null)
                const data = await programService.getMyActiveProgram()
                setProgram(data)
            } catch (err: any) {
                setError(err.message || 'Impossibile caricare la scheda di allenamento.')
            } finally {
                setLoading(false)
            }
        }
        loadProgram()
    }, [])

    // 2. CONTROLLI DI STATO (Caricamento ed Errori)
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-[14px]">
                Caricamento scheda in corso...
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                <p className="text-neutral-500 dark:text-neutral-400 text-[14px] mb-2">
                    {error}
                </p>
                <span className="text-xs text-neutral-400">
                    Chiedi al tuo coach di attivare un programma per te.
                </span>
            </div>
        )
    }

    // Controllo di sicurezza per TypeScript: da qui in poi 'program' non è null
    if (!program || !program.days || program.days.length === 0) return null

    // 3. CALCOLO DELLE VARIABILI DERIVATE
    // Se selectedDayId è null, prendiamo di default l'ID del primo giorno disponibile
    const currentDayId = selectedDayId ?? program.days[0].id
    const selectedDay = program.days.find(d => d.id === currentDayId) ?? program.days[0]
    const hasAnyDiff = selectedDay.exercises.some(e => e.diff !== 'unchanged')

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title={program.name}
                subtitle={`${program.days.length} giorni`}
                right={
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium
                           bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300
                           px-2.5 py-1 rounded-full">
                        <IconCheck size={11} aria-hidden />
                        Attuale
                    </span>
                }
            />

            {/* Tab Scheda / Versioni */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4">
                {(['scheda', 'versioni'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 text-[13px] border-b-2 transition-colors
                        ${activeTab === tab
                                ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-medium'
                                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                            }`}
                    >
                        {tab === 'versioni' ? 'Versioni' : 'Scheda'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">

                {/* ---- TAB SCHEDA ---- */}
                {activeTab === 'scheda' && (
                    <div className="px-4 py-4 space-y-3">

                        {program.coachNote && (
                            <CoachNoteBanner note={program.coachNote} />
                        )}

                        {/* Selettore giorno */}
                        <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                Giorni
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {program.days.map(day => (
                                    <button
                                        key={day.id}
                                        onClick={() => setSelectedDayId(day.id)}
                                        className={`shrink-0 text-left rounded-xl border px-3 py-2.5 transition-colors
                                        ${currentDayId === day.id
                                                ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                                            }`}
                                    >
                                        <p className="text-[13px] font-medium">{day.name}</p>
                                        <p className={`text-[11px] mt-0.5 ${currentDayId === day.id ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                                            {day.focus}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDay.coachNote && (
                            <CoachNoteBanner note={selectedDay.coachNote} />
                        )}

                        {/* Azioni */}
                        <div className="flex gap-2 items-center">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                                bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
                                text-[13px] font-medium active:scale-[.98] transition-transform"
                                onClick={() => navigate('/workout')}
                            >
                                Avvia {selectedDay.name}
                            </button>

                            {hasAnyDiff && (
                                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border
                                  border-neutral-200 dark:border-neutral-800 cursor-pointer shrink-0">
                                    <span className="text-[12px] text-neutral-500 dark:text-neutral-400 select-none">
                                        Diff
                                    </span>
                                    <span
                                        role="switch"
                                        aria-checked={showDiff}
                                        onClick={() => setShowDiff(v => !v)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
                                        transition-colors duration-200 cursor-pointer
                                        ${showDiff ? 'bg-amber-500 dark:bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full
                                          bg-white shadow transform transition-transform duration-200
                                          ${showDiff ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Lista esercizi */}
                        <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                Esercizi · {selectedDay.focus}
                            </p>
                            {selectedDay.exercises.map((ex, i) => (
                                <ExerciseCard
                                    key={ex.id}
                                    exercise={ex}
                                    index={i}
                                    showDiff={showDiff}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ---- TAB VERSIONI ---- */}
                {activeTab === 'versioni' && (
                    <div className="px-4 py-4 space-y-4">
                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                            Confronto tra la versione attuale e quella precedente.
                        </p>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-green-50 dark:bg-green-950/40 rounded-xl p-3">
                                <p className="text-[11px] font-medium text-green-700 dark:text-green-400 mb-1">Attuale</p>
                                <p className="text-[13px] font-medium text-green-900 dark:text-green-200">{program.name} · v2</p>
                                <p className="text-[11px] text-green-700/70 dark:text-green-400/70 mt-0.5">Versione attiva</p>
                            </div>
                            <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3">
                                <p className="text-[11px] font-medium text-neutral-400 mb-1">Precedente</p>
                                <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{program.name} · v1</p>
                                <p className="text-[11px] text-neutral-400 mt-0.5">Storico modifiche</p>
                            </div>
                        </div>

                        {/* Esercizi Nuovi o Modificati */}
                        {program.days.map(day => {
                            const modified = day.exercises.filter(e => e.diff !== 'unchanged')
                            if (!modified.length) return null
                            return (
                                <div key={day.id} className="space-y-2">
                                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mt-2">
                                        {day.name} · {day.focus}
                                    </p>
                                    {modified.map(ex => (
                                        <div key={ex.id} className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full
                                                ${ex.diff === 'new'
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                                    }`}>
                                                    {ex.diff === 'new' ? '+ Nuovo' : '↑ Modificato'}
                                                </span>
                                                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{ex.name}</p>
                                            </div>
                                            {ex.diff === 'modified' && ex.diffItems && ex.diffItems.length > 0 && (
                                                <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-2.5 bg-neutral-50/50 dark:bg-neutral-950/30 grid grid-cols-1 gap-1">
                                                    {ex.diffItems.map(d => (
                                                        <p key={d.field} className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                                            {d.label}: <span className="line-through text-neutral-400">{d.prev}</span> → <span className="font-medium text-neutral-900 dark:text-neutral-100">{d.curr}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}

                        {/* Sezione Esercizi Invariati Raggruppati per Giorno */}
                        <div className="space-y-2 pt-2">
                            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                                Esercizi Invariati
                            </p>
                            {program.days.map(day => {
                                const unchanged = day.exercises.filter(e => e.diff === 'unchanged')
                                if (!unchanged.length) return null
                                return (
                                    <div key={day.id} className="space-y-1.5 pl-2 border-l border-neutral-200 dark:border-neutral-800">
                                        <span className="text-[10px] text-neutral-400 block font-medium">{day.name}</span>
                                        {unchanged.map(ex => (
                                            <div key={ex.id} className="flex items-center gap-2 opacity-60 py-1">
                                                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-md">
                                                    Invariato
                                                </span>
                                                <p className="text-[13px] text-neutral-700 dark:text-neutral-300">{ex.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}