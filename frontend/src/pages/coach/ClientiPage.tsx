import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconUserPlus, IconChevronRight, IconLoader2 } from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { clientService } from '../../api/clientService'
import type { Client } from '../../types'

export default function ClientiPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    // Caricamento dati dal Backend al mount della pagina
    useEffect(() => {
        async function fetchClients() {
            try {
                setLoading(true)
                setError(null)
                const data = await clientService.getCoachClients()
                setClients(data)
            } catch (err) {
                setError('Impossibile caricare la lista dei clienti.')
            } finally {
                setLoading(false)
            }
        }
        fetchClients()
    }, [])

    // Logica di filtraggio locale basata sulla ricerca
    const filtered = clients.filter(c =>
        c.fullName.toLowerCase().includes(search.toLowerCase())
    )
    const active = filtered.filter(c => c.isActive)
    const inactive = filtered.filter(c => !c.isActive)

    const formatDate = (d: string | null) => {
        if (!d) return 'Mai'
        const date = new Date(d)
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    }

    // Sotto-componente riga cliente (ottimizzato con type esplicito)
    function ClientRow({ c, last }: { c: Client; last: boolean }) {
        return (
            <button onClick={() => navigate(`/editor/${c.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left
                    hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors
                    ${!last ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-[13px] font-medium shrink-0"
                    style={{ background: c.colorBg ?? '#F3F4F6', color: c.colorText ?? '#1F2937' }}>
                    {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {c.fullName}
                    </p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">
                        {c.activeProgramName ?? 'Nessuna scheda'} · ultima sessione {formatDate(c.lastSessionDate)}
                    </p>
                </div>
                <IconChevronRight size={15} className="text-neutral-300 dark:text-neutral-600 shrink-0" aria-hidden />
            </button>
        )
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
            <TopBar
                title="Clienti"
                subtitle={loading ? 'Aggiornamento...' : `${clients.filter(c => c.isActive).length} attivi`}
                right={
                    <button onClick={() => { /* Prossimo step: Modal/Pagina registrazione nuovo utente */ }}
                        className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800
                       flex items-center justify-center text-neutral-500
                       hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                        aria-label="Nuovo cliente">
                        <IconUserPlus size={15} aria-hidden />
                    </button>
                }
            />

            {/* Barra di Ricerca */}
            <div className="px-4 pt-3 pb-2 bg-white dark:bg-neutral-900
                      border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                           text-neutral-400 pointer-events-none" aria-hidden />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Cerca cliente..."
                        disabled={loading || !!error}
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-neutral-200
                       dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950
                       text-[13px] text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-400 outline-none disabled:opacity-50" />
                </div>
            </div>

            {/* Contenitore Principale con stati di caricamento/errore */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-12 text-neutral-400 gap-2">
                        <IconLoader2 size={20} className="animate-spin text-neutral-500" />
                        <p className="text-xs">Sincronizzazione atleti...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 text-center text-[13px] text-red-500 dark:border-red-950/40 dark:bg-red-950/10">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Gruppo: Clienti Attivi */}
                        {active.length > 0 && (
                            <>
                                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                    Attivi ({active.length})
                                </p>
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-neutral-900">
                                    {active.map((c, i) => (
                                        <ClientRow key={c.id} c={c} last={i === active.length - 1} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Gruppo: Clienti Inattivi */}
                        {inactive.length > 0 && (
                            <>
                                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                    Inattivi ({inactive.length})
                                </p>
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 opacity-60">
                                    {inactive.map((c, i) => (
                                        <ClientRow key={c.id} c={c} last={i === inactive.length - 1} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Stato Vuoto */}
                        {filtered.length === 0 && (
                            <p className="text-center text-[13px] text-neutral-400 pt-12">
                                {search ? 'Nessun cliente corrisponde alla ricerca' : 'Nessun atleta assegnato.'}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}