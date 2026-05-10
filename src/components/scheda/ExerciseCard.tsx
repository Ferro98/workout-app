import { useState } from 'react'
import {
    IconChevronDown,
    IconTrendingUp,
    IconSparkles,
    IconMinus,
    IconMessageCircle,
} from '@tabler/icons-react'
import type { ProgramExercise } from '../../types'
import { DiffBadge } from './DiffBadge'

interface Props {
    exercise: ProgramExercise
    index: number
    showDiff: boolean
}

function paramsString(ex: ProgramExercise): string {
    const repsOrDur = ex.duration !== null ? `${ex.duration}s` : `${ex.reps} rip`
    return `${ex.sets} × ${repsOrDur} · RPE ${ex.rpe} · rec ${ex.restSeconds}s`
}

const diffIcons = {
    modified: <IconTrendingUp size={13} aria-hidden />,
    new: <IconSparkles size={13} aria-hidden />,
    removed: <IconMinus size={13} aria-hidden />,
    unchanged: <IconMinus size={13} aria-hidden />,
}

export function ExerciseCard({ exercise: ex, index, showDiff }: Props) {
    const [open, setOpen] = useState(false)

    const hasDiff = ex.diff !== 'unchanged'

    return (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-2">

            {/* Header — sempre visibile */}
            <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left
                   hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
            >
                {/* Numero */}
                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800
                         flex items-center justify-center text-[11px] font-medium
                         text-neutral-500 dark:text-neutral-400 shrink-0">
                    {index + 1}
                </span>

                {/* Nome + params */}
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {ex.name}
                    </p>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {paramsString(ex)}
                    </p>
                </div>

                {/* Badge diff: pallino compatto di default, pill se showDiff attivo */}
                {hasDiff && (
                    <span className="shrink-0">
                        <DiffBadge status={ex.diff} compact={!showDiff} />
                    </span>
                )}

                <IconChevronDown
                    size={16}
                    className={`text-neutral-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                />
            </button>

            {/* Body — espandibile */}
            {open && (
                <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-4">

                    {/* Grid parametri */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: ex.sets, label: 'serie' },
                            { val: ex.duration !== null ? `${ex.duration}s` : `${ex.reps} rip`, label: ex.duration !== null ? 'durata' : 'ripetizioni' },
                            { val: `RPE ${ex.rpe}`, label: 'intensità target' },
                            { val: `${ex.restSeconds}s`, label: 'recupero' },
                        ].map(p => (
                            <div key={p.label} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2">
                                <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                                    {p.val}
                                </p>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{p.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Diff — solo se showDiff e ci sono modifiche */}
                    {showDiff && (ex.diffItems.length > 0 || ex.diff === 'new') && (
                        <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                Modifiche vs scheda precedente
                            </p>
                            {ex.diff === 'new' ? (
                                <div className="flex items-center gap-3 py-1.5">
                                    <span className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-950/50
                                   flex items-center justify-center text-green-700 dark:text-green-300 shrink-0">
                                        {diffIcons.new}
                                    </span>
                                    <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
                                        Esercizio nuovo in questa scheda
                                    </p>
                                </div>
                            ) : (
                                ex.diffItems.map(d => (
                                    <div key={d.field} className="flex items-center gap-3 py-1.5
                       border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                        <span className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/50
                                     flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                                            {diffIcons.modified}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">{d.label}</p>
                                            <p className="text-[12px] text-neutral-400 mt-0.5">
                                                {d.prev}{' → '}
                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{d.curr}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Storico */}
                    {ex.history.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Storico</p>
                                {ex.lastWeight && (
                                    <span className="text-[11px] text-neutral-500">
                                        · ultimo peso: <span className="font-medium text-neutral-900 dark:text-neutral-100">{ex.lastWeight}</span>
                                    </span>
                                )}
                            </div>
                            {ex.history.map(h => (
                                <div key={h.date} className="flex justify-between py-1.5 text-[12px]
                     border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                    <span className="text-neutral-500">{h.date}</span>
                                    <span className="text-neutral-800 dark:text-neutral-200">{h.detail}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Nota coach sull'esercizio */}
                    {ex.notes && (
                        <div className="flex gap-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-lg px-3 py-2.5">
                            <IconMessageCircle
                                size={14}
                                className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5"
                                aria-hidden
                            />
                            <div>
                                <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300 mb-0.5">
                                    Nota coach
                                </p>
                                <p className="text-[13px] text-violet-800 dark:text-violet-200 leading-snug">
                                    {ex.notes}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    )
}