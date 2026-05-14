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
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
    const vals = ex.targetSets
        .map(ts => isTimed ? (ts.duration ?? ex.duration) : (ts.reps ?? ex.reps))
        .filter((v): v is number => v !== null && v !== undefined)
    const unit = isTimed ? 's' : ' rip'
    const min = Math.min(...vals), max = Math.max(...vals)
    const repsStr = min === max ? `${min}${unit}` : `${min}–${max}${unit}`
    const rpeVals = ex.targetSets.map(ts => ts.rpe)
    const minRpe = Math.min(...rpeVals), maxRpe = Math.max(...rpeVals)
    const rpeStr = minRpe === maxRpe ? `RPE ${minRpe}` : `RPE ${minRpe}–${maxRpe}`
    return `${ex.sets} × ${repsStr} · ${rpeStr} · rec ${ex.restSeconds}s`
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
                    <div className="space-y-1 mb-2">
                        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                            Serie
                        </p>
                        {ex.targetSets.map((ts, i) => {
                            const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
                            const val = isTimed ? (ts.duration ?? ex.duration) : (ts.reps ?? ex.reps)
                            const unit = isTimed ? 's' : ' rip'
                            return (
                                <div key={i} className="flex items-center gap-2 py-1.5 border-b
                               border-neutral-100 dark:border-neutral-800 last:border-0">
                                    <span className="w-5 text-[11px] text-neutral-400 shrink-0">{i + 1}</span>
                                    <span className="text-[13px] text-neutral-900 dark:text-neutral-100 w-16">
                                        {val}{unit}
                                    </span>
                                    <span className="text-[12px] text-neutral-500">RPE {ts.rpe}</span>
                                    {ts.tempoPerRep && (
                                        <span className="text-[11px] text-violet-500 ml-1">{ts.tempoPerRep}</span>
                                    )}
                                    {ts.suggestedWeight && (
                                        <span className="text-[11px] text-neutral-400 ml-auto">{ts.suggestedWeight} kg</span>
                                    )}
                                    {ts.note && (
                                        <span className="text-[11px] text-violet-500 ml-auto italic">💬 {ts.note}</span>
                                    )}
                                </div>
                            )
                        })}
                        <div className="flex gap-2 pt-1">
                            <span className="text-[11px] text-neutral-400">Recupero: {ex.restSeconds}s</span>
                        </div>
                    </div>

                    {/* Diff — solo se showDiff e ci sono modifiche */}
                    {showDiff && (ex.setDiffs.length > 0 || ex.diff === 'new') && (
                        <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                                Modifiche vs scheda precedente
                            </p>
                            {ex.diff === 'new' ? (
                                <div className="flex items-center gap-3 py-1.5">
                                    <span className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-950/50
                         flex items-center justify-center text-green-700 shrink-0">
                                        <IconSparkles size={13} aria-hidden />
                                    </span>
                                    <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
                                        Esercizio nuovo
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Diff top-level (es. numero serie) */}
                                    {ex.diffItems.map(d => (
                                        <div key={d.field} className="flex items-center gap-3 py-1.5
               border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                            <span className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/50
                             flex items-center justify-center text-amber-700 shrink-0">
                                                <IconTrendingUp size={13} aria-hidden />
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-[13px] text-neutral-600 dark:text-neutral-400">{d.label}</p>
                                                <p className="text-[12px] text-neutral-400 mt-0.5">
                                                    {d.prev} → <span className="font-medium text-neutral-900 dark:text-neutral-100">{d.curr}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Diff per-serie */}
                                    {ex.setDiffs.filter(sd => sd.status !== 'modified' || sd.changes.length > 0).map(sd => (
                                        <div key={sd.setIndex} className="flex items-start gap-3 py-1.5
               border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-medium
              ${sd.status === 'added'
                                                    ? 'bg-green-50 dark:bg-green-950/50 text-green-700'
                                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700'}`}>
                                                {sd.setIndex + 1}
                                            </span>
                                            <div className="flex-1">
                                                {sd.status === 'added' ? (
                                                    <p className="text-[13px] text-neutral-600 dark:text-neutral-400">Serie aggiunta</p>
                                                ) : (
                                                    sd.changes.map(c => (
                                                        <p key={c.field} className="text-[12px] text-neutral-500">
                                                            {c.label}: <span>{c.prev}</span>
                                                            {' → '}
                                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">{c.curr}</span>
                                                        </p>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
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