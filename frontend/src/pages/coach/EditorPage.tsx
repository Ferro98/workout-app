import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    IconArrowLeft, IconPlus, IconEdit, IconHistory,
    IconCopy, IconAlertCircle, IconChevronRight,
} from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { CLIENTS, CURRENT_PROGRAM, WORKOUT_HISTORY } from '../../data/mock'
import type { Program } from '../../types'
import { SchemaEditor } from './SchemaEditor'

type View = 'overview' | 'edit' | 'new-version' | 'new-program'

// Schede storiche mock (in produzione vengono dall'API)
const PAST_PROGRAMS: Program[] = [
    {
        ...CURRENT_PROGRAM,
        id: 0,
        name: 'Scheda Settimana 0',
        isActive: false,
        createdAt: '2025-04-26',
    },
]

export default function EditorPage() {
    const { clientId } = useParams()
    const navigate = useNavigate()
    const [view, setView] = useState<View>('overview')
    const [editMode, setEditMode] = useState<'direct' | 'version'>('direct')
    const [workingProgram, setWorkingProgram] = useState<Program>(CURRENT_PROGRAM)

    const client = CLIENTS.find(c => c.id === Number(clientId)) ?? CLIENTS[0]

    // ── Overview ──────────────────────────────────
    if (view === 'overview') {
        return (
            <div className="flex flex-col h-full">
                <TopBar
                    title={client.name}
                    subtitle="Gestione schede"
                    right={
                        <button onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-[13px] text-neutral-500
                         hover:text-neutral-700 dark:hover:text-neutral-300">
                            <IconArrowLeft size={15} aria-hidden />
                            Clienti
                        </button>
                    }
                />

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                    {/* Scheda attiva */}
                    <div>
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                            Scheda attiva
                        </p>
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                        {CURRENT_PROGRAM.name}
                                    </p>
                                    <p className="text-[12px] text-neutral-400 mt-0.5">
                                        {CURRENT_PROGRAM.days.length} giorni · dal {new Date(CURRENT_PROGRAM.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className="text-[11px] font-medium bg-green-100 dark:bg-green-900/40
                                 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">
                                    Attiva
                                </span>
                            </div>

                            {/* Giorni preview */}
                            {CURRENT_PROGRAM.days.map((day, i) => (
                                <div key={day.id}
                                    className={`px-4 py-2.5 flex items-center justify-between
                              border-t border-neutral-100 dark:border-neutral-800`}>
                                    <div>
                                        <span className="text-[13px] text-neutral-700 dark:text-neutral-300 font-medium">
                                            {day.name}
                                        </span>
                                        <span className="text-[12px] text-neutral-400 ml-2">{day.focus}</span>
                                    </div>
                                    <span className="text-[11px] text-neutral-400">
                                        {day.exercises.length} esercizi
                                    </span>
                                </div>
                            ))}

                            {/* Note dal cliente recenti */}
                            {WORKOUT_HISTORY.length > 0 && (
                                <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
                                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                        Note recenti cliente
                                    </p>
                                    {WORKOUT_HISTORY.filter(s => s.generalNote).slice(0, 2).map(s => (
                                        <div key={s.id} className="mb-2 last:mb-0">
                                            <p className="text-[11px] text-neutral-400">{s.dayName} · {new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
                                            <p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5 italic">
                                                "{s.generalNote}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Azioni principali */}
                    <div className="space-y-2">
                        {/* Modifica diretta */}
                        <button
                            onClick={() => { setEditMode('direct'); setWorkingProgram(CURRENT_PROGRAM); setView('edit') }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border
                         border-neutral-200 dark:border-neutral-800
                         hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800
                              flex items-center justify-center shrink-0">
                                <IconEdit size={16} className="text-neutral-600 dark:text-neutral-400" aria-hidden />
                            </div>
                            <div className="flex-1">
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                    Modifica diretta
                                </p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                    Correggi un errore — nessuna nuova versione creata
                                </p>
                            </div>
                            <IconChevronRight size={15} className="text-neutral-300 shrink-0" aria-hidden />
                        </button>

                        {/* Nuova versione */}
                        <button
                            onClick={() => { setEditMode('version'); setWorkingProgram(CURRENT_PROGRAM); setView('new-version') }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border
                         border-neutral-200 dark:border-neutral-800
                         hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40
                              flex items-center justify-center shrink-0">
                                <IconCopy size={16} className="text-blue-600 dark:text-blue-400" aria-hidden />
                            </div>
                            <div className="flex-1">
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                    Nuova versione
                                </p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                    Settimana successiva — preserva storico e genera diff
                                </p>
                            </div>
                            <IconChevronRight size={15} className="text-neutral-300 shrink-0" aria-hidden />
                        </button>

                        {/* Nuova scheda da zero */}
                        <button
                            onClick={() => setView('new-program')}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border
                         border-neutral-200 dark:border-neutral-800 border-dashed
                         hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800
                              flex items-center justify-center shrink-0">
                                <IconPlus size={16} className="text-neutral-600 dark:text-neutral-400" aria-hidden />
                            </div>
                            <div className="flex-1">
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                    Nuova scheda
                                </p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                    Parte da zero o copia una esistente
                                </p>
                            </div>
                            <IconChevronRight size={15} className="text-neutral-300 shrink-0" aria-hidden />
                        </button>
                    </div>

                    {/* Storico versioni */}
                    {PAST_PROGRAMS.length > 0 && (
                        <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                Storico schede
                            </p>
                            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden opacity-70">
                                {PAST_PROGRAMS.map((p, i) => (
                                    <div key={p.id}
                                        className={`px-4 py-3 flex items-center justify-between
                                ${i < PAST_PROGRAMS.length - 1
                                                ? 'border-b border-neutral-100 dark:border-neutral-800'
                                                : ''}`}>
                                        <div>
                                            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                                                {p.name}
                                            </p>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                                Dal {new Date(p.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <IconHistory size={14} className="text-neutral-300" aria-hidden />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── Nuova scheda (scegli base) ────────────────
    if (view === 'new-program') {
        return (
            <div className="flex flex-col h-full">
                <TopBar
                    title="Nuova scheda"
                    subtitle={client.name}
                    right={
                        <button onClick={() => setView('overview')}
                            className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                            <IconArrowLeft size={15} aria-hidden />Indietro
                        </button>
                    }
                />
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
                        Da cosa vuoi partire?
                    </p>

                    <button
                        onClick={() => {
                            const blank: Program = {
                                id: Date.now(), name: 'Nuova scheda', clientId: client.id,
                                createdAt: new Date().toISOString().slice(0, 10),
                                isActive: false, coachNote: null, days: [],
                            }
                            setWorkingProgram(blank)
                            setEditMode('direct')
                            setView('edit')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border
                       border-neutral-200 dark:border-neutral-800 text-left
                       hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800
                            flex items-center justify-center shrink-0">
                            <IconPlus size={16} className="text-neutral-600 dark:text-neutral-400" aria-hidden />
                        </div>
                        <div>
                            <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                Da zero
                            </p>
                            <p className="text-[12px] text-neutral-400 mt-0.5">Scheda vuota</p>
                        </div>
                    </button>

                    {[CURRENT_PROGRAM, ...PAST_PROGRAMS].map(p => (
                        <button key={p.id}
                            onClick={() => {
                                const copy: Program = {
                                    ...p, id: Date.now(),
                                    name: `${p.name} (copia)`,
                                    isActive: false,
                                    createdAt: new Date().toISOString().slice(0, 10),
                                }
                                setWorkingProgram(copy)
                                setEditMode('direct')
                                setView('edit')
                            }}
                            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border
                         border-neutral-200 dark:border-neutral-800 text-left
                         hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40
                              flex items-center justify-center shrink-0">
                                <IconCopy size={16} className="text-blue-600 dark:text-blue-400" aria-hidden />
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                    Copia da: {p.name}
                                </p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                    {p.days.length} giorni · {p.days.reduce((acc, d) => acc + d.exercises.length, 0)} esercizi totali
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // ── Editor (modifica diretta o nuova versione) ─
    return (
        <SchemaEditor
            program={workingProgram}
            mode={editMode === 'version' ? 'new-version' : 'direct'}
            clientName={client.name}
            onBack={() => setView('overview')}
            onSave={(saved) => {
                // In produzione: PATCH /programs/{id} o POST /programs/{id}/new-version
                console.log('Saved:', saved)
                setView('overview')
            }}
        />
    )
}