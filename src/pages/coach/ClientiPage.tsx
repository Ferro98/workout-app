import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconUserPlus, IconChevronRight } from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { CLIENTS } from '../../data/mock'

export default function ClientiPage() {
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    const filtered = CLIENTS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )
    const active = filtered.filter(c => c.isActive)
    const inactive = filtered.filter(c => !c.isActive)

    const formatDate = (d: string | null) => {
        if (!d) return 'Mai'
        const date = new Date(d)
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    }

    function ClientRow({ c, last }: { c: typeof CLIENTS[0]; last: boolean }) {
        return (
            <button onClick={() => navigate(`/editor/${c.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left
                    hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors
                    ${!last ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-[13px] font-medium shrink-0"
                    style={{ background: c.colorBg, color: c.colorText }}>
                    {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {c.name}
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
        <div className="flex flex-col h-full">
            <TopBar
                title="Clienti"
                subtitle={`${CLIENTS.filter(c => c.isActive).length} attivi`}
                right={
                    <button onClick={() => {/* TODO: nuovo cliente */ }}
                        className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800
                       flex items-center justify-center text-neutral-500
                       hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                        aria-label="Nuovo cliente">
                        <IconUserPlus size={15} aria-hidden />
                    </button>
                }
            />

            {/* Search */}
            <div className="px-4 pt-3 pb-2 bg-white dark:bg-neutral-950
                      border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                           text-neutral-400 pointer-events-none" aria-hidden />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Cerca cliente..."
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-neutral-200
                       dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900
                       text-[13px] text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-400 outline-none" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {active.length > 0 && (
                    <>
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                            Attivi
                        </p>
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-4">
                            {active.map((c, i) => <ClientRow key={c.id} c={c} last={i === active.length - 1} />)}
                        </div>
                    </>
                )}
                {inactive.length > 0 && (
                    <>
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                            Inattivi
                        </p>
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden opacity-60">
                            {inactive.map((c, i) => <ClientRow key={c.id} c={c} last={i === inactive.length - 1} />)}
                        </div>
                    </>
                )}
                {filtered.length === 0 && (
                    <p className="text-center text-[13px] text-neutral-400 pt-12">Nessun cliente trovato</p>
                )}
            </div>
        </div>
    )
}