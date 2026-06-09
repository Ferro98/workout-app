// src/pages/coach/EditorPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    IconArrowLeft, IconPlus, IconEdit, IconHistory,
    IconCopy, IconChevronRight,
} from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { SchemaEditor } from './SchemaEditor'
import { programService, mapProgramToCreatePayload } from '../../api/programService'
import type { Program } from '../../types'

type View = 'overview' | 'edit' | 'new-version' | 'new-program'

export default function EditorPage() {
    const { clientId } = useParams<{ clientId: string }>()
    const navigate = useNavigate()

    // Stati per gestire i programmi reali separati localmente
    const [clientName, setClientName] = useState<string>('Gestione Atleta')
    const [currentProgram, setCurrentProgram] = useState<Program | null>(null)
    const [pastPrograms, setPastPrograms] = useState<Program[]>([])

    const [view, setView] = useState<View>('overview')
    const [workingProgram, setWorkingProgram] = useState<Program | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            if (!clientId) return
            try {
                setLoading(true)
                setError(null)

                // 1. Facciamo l'unica GET reale esposta dal tuo backend per il coach
                const allPrograms = await programService.getClientPrograms(Number(clientId))

                // 2. Separiamo la scheda attiva da quelle archiviate direttamente qui
                const active = allPrograms.find(p => p.isActive) || null
                const history = allPrograms.filter(p => !p.isActive)

                setCurrentProgram(active)
                setPastPrograms(history)

                if (active) {
                    setClientName(`Cliente #${active.clientId}`)
                }
            } catch (err) {
                setError('Errore durante il recupero delle schede dal server.')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [clientId])

    const handleSave = async (savedProgram: Program) => {
        if (!clientId) return
        try {
            setLoading(true)

            // CASO 1: Nuova scheda (Da zero o da Copia) -> POST /{client_id}/program
            if (view === 'edit' && savedProgram.id > 2000000000) {
                const payload = mapProgramToCreatePayload(savedProgram)
                await programService.createClientProgram(Number(clientId), payload)
            }
            // CASO 2: Nuova versione incrementale -> POST /{program_id}/new-version
            else if (view === 'new-version' && currentProgram) {
                const payload = mapProgramToCreatePayload(savedProgram)
                await programService.createNewVersion(currentProgram.id, payload)
            }
            // CASO 3: Modifica diretta -> PATCH /{program_id}
            else {
                await programService.updateProgramDirect(savedProgram.id, savedProgram)
            }

            setView('overview')
            window.location.reload() // Ricarica per allineare i dati aggiornati dal DB
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Si è verificato un errore durante il salvataggio.')
        } finally {
            setLoading(false)
        }
    }

    if (loading && view === 'overview') {
        return <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">Sincronizzazione schede...</div>
    }

    if (error && view === 'overview') {
        return <div className="flex-1 flex items-center justify-center text-xs text-red-500 p-4">{error}</div>
    }

    // ── VIEW: Overview principale ───────────────────────
    if (view === 'overview') {
        return (
            <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
                <TopBar
                    title={clientName}
                    subtitle="Gestione schede allenamento"
                    right={
                        <button onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                            <IconArrowLeft size={15} aria-hidden />
                            Clienti
                        </button>
                    }
                />

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Blocco Scheda Attiva */}
                    <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">
                            Scheda in corso
                        </p>
                        {currentProgram ? (
                            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                                            {currentProgram.name}
                                        </p>
                                        <p className="text-[12px] text-neutral-400 mt-0.5">
                                            {currentProgram.days.length} split settimanali · impostata il {new Date(currentProgram.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">
                                        Attiva
                                    </span>
                                </div>

                                {currentProgram.days.map((day) => (
                                    <div key={day.id} className="px-4 py-2.5 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                                        <div>
                                            <span className="text-[13px] text-neutral-700 dark:text-neutral-300 font-medium">{day.name}</span>
                                            <span className="text-[12px] text-neutral-400 ml-2">{day.focus}</span>
                                        </div>
                                        <span className="text-[11px] text-neutral-400">{day.exercises.length} esercizi</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-5 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl text-center text-xs text-neutral-400 bg-white dark:bg-neutral-900">
                                Nessun piano attivo al momento per questo atleta.
                            </div>
                        )}
                    </div>

                    {/* Menu delle Azioni del Coach */}
                    <div className="space-y-2">
                        {currentProgram && (
                            <>
                                <button
                                    onClick={() => { setWorkingProgram(currentProgram); setView('edit') }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors bg-white dark:bg-neutral-900 text-left">
                                    <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                                        <IconEdit size={16} className="text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Modifica rapida (PATCH)</p>
                                        <p className="text-[12px] text-neutral-400 mt-0.5">Aggiorna le note o i dettagli strutturali del blocco corrente</p>
                                    </div>
                                    <IconChevronRight size={15} className="text-neutral-300 shrink-0" />
                                </button>

                                <button
                                    onClick={() => { setWorkingProgram(currentProgram); setView('new-version') }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors bg-white dark:bg-neutral-900 text-left">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                                        <IconCopy size={16} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Crea nuova versione</p>
                                        <p className="text-[12px] text-neutral-400 mt-0.5">Genera una nuova versione per calcolare i progressivi storici (Diff)</p>
                                    </div>
                                    <IconChevronRight size={15} className="text-neutral-300 shrink-0" />
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => setView('new-program')}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left bg-transparent">
                            <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                                <IconPlus size={16} className="text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Nuovo piano d'allenamento</p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">Inizia un blocco da zero o copia i dati da una programmazione passata</p>
                            </div>
                            <IconChevronRight size={15} className="text-neutral-300 shrink-0" />
                        </button>
                    </div>

                    {/* Storico Schede Passate */}
                    {pastPrograms.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">Schede archiviate</p>
                            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 opacity-75">
                                {pastPrograms.map((p, i) => (
                                    <div key={p.id} className={`px-4 py-3 flex items-center justify-between ${i < pastPrograms.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
                                        <div>
                                            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">{p.name}</p>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">Creata il {new Date(p.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <IconHistory size={14} className="text-neutral-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── VIEW: Scelta Base Partenza ──────────────────────
    if (view === 'new-program') {
        return (
            <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
                <TopBar
                    title="Configura scheda"
                    subtitle={clientName}
                    right={
                        <button onClick={() => setView('overview')} className="flex items-center gap-1.5 text-[13px] text-neutral-500">
                            <IconArrowLeft size={15} aria-hidden />Indietro
                        </button>
                    }
                />
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    <button
                        onClick={() => {
                            const blank: Program = {
                                id: Date.now(), // Trigger id fittizio > 2 miliardi per intercettare il salvataggio
                                name: 'Nuovo Blocco Allenamento',
                                clientId: Number(clientId),
                                createdAt: new Date().toISOString().slice(0, 10),
                                isActive: false,
                                coachNote: null,
                                days: [
                                    {
                                        id: Date.now() + 1,
                                        dayIndex: 0,
                                        name: 'Giorno A',
                                        focus: 'Spinta / Trazione',
                                        coachNote: null,
                                        exercises: []
                                    }
                                ]
                            }
                            setWorkingProgram(blank)
                            setView('edit')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-left bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                            <IconPlus size={16} className="text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                            <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Crea da zero</p>
                            <p className="text-[12px] text-neutral-400 mt-0.5">Genera una struttura vuota da compilare manualmente</p>
                        </div>
                    </button>

                    {/* Clona da una qualsiasi delle schede caricate (attiva o passata) */}
                    {[...(currentProgram ? [currentProgram] : []), ...pastPrograms].map(p => (
                        <button key={p.id}
                            onClick={() => {
                                const copy: Program = {
                                    ...p,
                                    id: Date.now(), // Override id fittizio per attivare la POST su handleSave
                                    name: `${p.name} (copia)`,
                                    isActive: false,
                                    createdAt: new Date().toISOString().slice(0, 10),
                                }
                                setWorkingProgram(copy)
                                setView('edit')
                            }}
                            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-left bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                                <IconCopy size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Copia da: {p.name}</p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                    Duplica i {p.days.length} split e gli esercizi per modificarli liberamente
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (!workingProgram) return null

    return (
        <SchemaEditor
            program={workingProgram}
            mode={view === 'new-version' ? 'new-version' : 'direct'}
            clientName={clientName}
            onBack={() => setView('overview')}
            onSave={handleSave}
        />
    )
}