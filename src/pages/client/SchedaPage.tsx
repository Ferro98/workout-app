import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheck } from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { CoachNoteBanner } from '../../components/scheda/CoachNoteBanner'
import { ExerciseCard } from '../../components/scheda/ExerciseCard'
import { CURRENT_PROGRAM } from '../../data/mock'

type Tab = 'scheda' | 'versioni'

export function SchedaPage() {
    const [activeTab, setActiveTab] = useState<Tab>('scheda')
    const [showDiff, setShowDiff] = useState(false)
    const [selectedDayId, setSelectedDayId] = useState<number>(CURRENT_PROGRAM.days[0].id)
    const program = CURRENT_PROGRAM
    const navigate = useNavigate()

    const selectedDay = program.days.find(d => d.id === selectedDayId) ?? program.days[0]
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
            <div className="flex border-b border-neutral-200 dark:border-neutral-800
                      bg-white dark:bg-neutral-950 px-4">
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

                        {/* Nota generale scheda */}
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
                      ${selectedDayId === day.id
                                                ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                                            }`}
                                    >
                                        <p className="text-[13px] font-medium">{day.name}</p>
                                        <p className={`text-[11px] mt-0.5 ${selectedDayId === day.id ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                                            {day.focus}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nota del coach sul giorno */}
                        {selectedDay.coachNote && (
                            <CoachNoteBanner note={selectedDay.coachNote} />
                        )}

                        {/* Azioni */}
                        <div className="flex gap-2 items-center">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                           bg-neutral-900 dark:bg-neutral-100
                           text-white dark:text-neutral-900
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
                                ${showDiff
                                                ? 'bg-amber-500 dark:bg-amber-400'
                                                : 'bg-neutral-200 dark:bg-neutral-700'
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full
                                      bg-white shadow transform transition-transform duration-200
                                      ${showDiff ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Lista esercizi del giorno selezionato */}
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
                    <div className="px-4 py-4 space-y-3">
                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                            Confronto tra la versione attuale e quella precedente.
                        </p>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-green-50 dark:bg-green-950/40 rounded-xl p-3">
                                <p className="text-[11px] font-medium text-green-700 dark:text-green-400 mb-1">Attuale</p>
                                <p className="text-[13px] font-medium text-green-900 dark:text-green-200">{program.name} · v2</p>
                                <p className="text-[11px] text-green-700/70 dark:text-green-400/70 mt-0.5">Dal 3 mag 2025</p>
                            </div>
                            <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl p-3">
                                <p className="text-[11px] font-medium text-neutral-400 mb-1">Precedente</p>
                                <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{program.name} · v1</p>
                                <p className="text-[11px] text-neutral-400 mt-0.5">Dal 10 mar 2025</p>
                            </div>
                        </div>

                        {program.days.map(day => {
                            const modified = day.exercises.filter(e => e.diff !== 'unchanged')
                            if (!modified.length) return null
                            return (
                                <div key={day.id}>
                                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                        {day.name} · {day.focus}
                                    </p>
                                    {modified.map(ex => (
                                        <div key={ex.id} className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-2">
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full
                          ${ex.diff === 'new'
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                                    }`}>
                                                    {ex.diff === 'new' ? '+ Nuovo' : '↑ Modificato'}
                                                </span>
                                                <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{ex.name}</p>
                                            </div>
                                            {ex.diff === 'modified' && ex.diffItems.length > 0 && (
                                                <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
                                                    {ex.diffItems.map(d => (
                                                        <p key={d.field} className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                                            {d.label}: <span className="line-through">{d.prev}</span> → <span className="font-medium text-neutral-900 dark:text-neutral-100">{d.curr}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}

                        {/* Invariati */}
                        {program.days.map(day => (
                            day.exercises.filter(e => e.diff === 'unchanged').map(ex => (
                                <div key={ex.id}
                                    className="border border-neutral-100 dark:border-neutral-800/50 rounded-xl
                             px-4 py-3 flex items-center gap-3 opacity-50">
                                    <span className="text-[11px] font-medium bg-neutral-100 dark:bg-neutral-900
                                   text-neutral-500 px-2 py-0.5 rounded-full">
                                        Invariato
                                    </span>
                                    <p className="text-[13px] text-neutral-700 dark:text-neutral-300">{ex.name}</p>
                                </div>
                            ))
                        ))}
                    </div>
                )}

            </div>
        </div>
    )
}