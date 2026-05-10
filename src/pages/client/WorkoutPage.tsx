import { useState, useEffect, useRef, useCallback } from 'react'
import { IconSquare, IconCheck, IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { useWorkout } from '../../context/WorkoutContext'
import { CURRENT_PROGRAM } from '../../data/mock'
import type { ProgramExercise, WorkoutSetState } from '../../types'
import type { ExState } from '../../context/WorkoutContext'

// ---------------------------------------------------------------------------
// Rest bar — banner in basso non invasivo
// ---------------------------------------------------------------------------

function RestBar({ totalSeconds, onSkip }: { totalSeconds: number; onSkip: () => void }) {
    if (!totalSeconds || totalSeconds <= 0) return null
    const [remaining, setRemaining] = useState(totalSeconds)
    const endTimeRef = useRef<number | null>(null)

    // Reset when new rest period starts
    useEffect(() => {
        setRemaining(totalSeconds)
        endTimeRef.current = Date.now() + totalSeconds * 1000
    }, [totalSeconds])

    // High-frequency update loop (100ms) for accurate countdown
    useEffect(() => {
        if (endTimeRef.current === null) return

        const interval = setInterval(() => {
            const now = Date.now()
            const remainingMs = Math.max(0, endTimeRef.current! - now)
            const remainingSec = Math.ceil(remainingMs / 1000)

            setRemaining(remainingSec)

            if (remainingMs <= 0) {
                clearInterval(interval)
                endTimeRef.current = null
                onSkip()
            }
        }, 100) // Update every 100ms for smooth display

        return () => clearInterval(interval)
    }, [onSkip]) // onSkip should be memoized in parent

    const pct = Math.max(0, (remaining / totalSeconds) * 100)

    return (
        <div className="border-t border-neutral-200 dark:border-neutral-800
                    bg-white dark:bg-neutral-950 px-4 pt-3 pb-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">Recupero</span>
                <div className="flex items-center gap-3">
                    <span className="text-[22px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                        {remaining}s
                    </span>
                    <button onClick={onSkip}
                        className="flex items-center gap-1 text-[12px] text-neutral-400
                       hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <IconX size={13} aria-hidden />salta
                    </button>
                </div>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-[width] duration-100 ease-linear"
                    style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Riga singola serie
// ---------------------------------------------------------------------------

function SetRow({ setIndex, state, ex, onChange, onComplete }: {
    setIndex: number; state: WorkoutSetState;
    ex: ProgramExercise; onChange: (f: keyof WorkoutSetState, v: string) => void; onComplete: () => void
}) {
    const hasWeight = ex.type === 'weight' || ex.type === 'timed_weight'
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
    const inputCls = `text-center text-[13px] py-1.5 rounded-lg border
    border-neutral-200 dark:border-neutral-700 bg-transparent
    text-neutral-900 dark:text-neutral-100 disabled:opacity-40
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
    [&::-webkit-inner-spin-button]:appearance-none`;
    const target = ex.targetSets.find(t => t.setIndex === setIndex)
        ?? ex.targetSets.at(-1)
        ?? { rpe: 8 }
    const targetValue = isTimed
        ? (target.duration ?? ex.duration)
        : (target.reps ?? ex.reps)
    const targetUnit = isTimed ? 's' : 'rip'

    return (
        <div className={`flex items-center gap-2 px-4 py-2.5
                     border-b border-neutral-100 dark:border-neutral-800 last:border-0
                     transition-opacity ${state.completed ? 'opacity-50' : ''}
                     overflow-x-auto flex-nowrap`}>
            <span className="w-4 text-[12px] text-neutral-400 shrink-0 text-center">{setIndex + 1}</span>

            {hasWeight && (
                <div className="flex items-center gap-1">
                    <input type="number" inputMode="decimal" value={state.actualWeight}
                        onChange={e => onChange('actualWeight', e.target.value)}
                        placeholder="—" disabled={state.completed} className={`w-12 ${inputCls}`} />
                    <span className="text-[11px] text-neutral-400">kg</span>
                </div>
            )}

            <div className="flex items-center gap-1">
                <input type="number" inputMode="numeric" value={state.actualReps}
                    onChange={e => onChange('actualReps', e.target.value)}
                    placeholder="—" disabled={state.completed} className={`w-10 ${inputCls}`} />
                <span className="text-[11px] text-neutral-400">{isTimed ? 's' : 'rip'}</span>
            </div>

            <span className="text-[11px] text-neutral-400 shrink-0 ml-1 min-w-0 truncate">
                {targetValue}{targetUnit} @ RPE {target.rpe}
            </span>

            <div className="flex items-center gap-1 ml-auto">
                <input type="number" inputMode="numeric" value={state.actualRir}
                    onChange={e => onChange('actualRir', e.target.value)}
                    placeholder="—" disabled={state.completed} className={`w-9 ${inputCls}`} />
                <span className="text-[11px] text-neutral-400">RIR</span>
            </div>

            <button onClick={onComplete}
                className={`w-7 h-7 rounded-full border flex items-center justify-center
                    shrink-0 ml-1 transition-all active:scale-90
                    ${state.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400'}`}
                aria-label={state.completed ? 'Completata' : 'Segna completata'}>
                <IconCheck size={13} aria-hidden className={state.completed ? '' : 'text-transparent'} />
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Card esercizio
// ---------------------------------------------------------------------------

function WorkoutExCard({ ex, index, state, isFirst, onSetChange, onSetComplete, onNoteChange }: {
    ex: ProgramExercise; index: number; state: ExState; isFirst: boolean
    onSetChange: (si: number, f: keyof WorkoutSetState, v: string) => void
    onSetComplete: (si: number) => void; onNoteChange: (v: string) => void
}) {
    const [open, setOpen] = useState(isFirst)
    const completedCount = state.sets.filter(s => s.completed).length
    const allDone = completedCount === ex.sets
    const hasWeight = ex.type === 'weight' || ex.type === 'timed_weight'
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
    const paramsStr = ex.duration !== null
        ? `${ex.sets} × ${ex.duration}s · rec ${ex.restSeconds}s`
        : `${ex.sets} × ${ex.reps} rip · rec ${ex.restSeconds}s`

    return (
        <div className={`border rounded-xl overflow-hidden mb-2 transition-colors
                     ${allDone ? 'border-green-200 dark:border-green-900/60'
                : 'border-neutral-200 dark:border-neutral-800'}`}>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left
                         hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                onClick={() => setOpen(v => !v)}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center
                          text-[11px] font-medium shrink-0 transition-colors
                          ${allDone ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                    {allDone ? <IconCheck size={12} aria-hidden /> : index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 truncate">{ex.name}</p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">{paramsStr}</p>
                </div>
                <span className="text-[12px] text-neutral-400 shrink-0 mr-1">{completedCount}/{ex.sets}</span>
                {open ? <IconChevronUp size={15} className="text-neutral-400 shrink-0" aria-hidden />
                    : <IconChevronDown size={15} className="text-neutral-400 shrink-0" aria-hidden />}
            </button>

            {open && (
                <div className="border-t border-neutral-100 dark:border-neutral-800">
                    {/* Header colonne */}
                    <div className="flex items-center gap-2 px-4 py-1.5">
                        <span className="w-4" />
                        {hasWeight && <span className="w-[4.5rem] text-center text-[10px] text-neutral-400">peso</span>}
                        <span className="w-[3.5rem] text-center text-[10px] text-neutral-400">{isTimed ? 'durata' : 'rip'}</span>
                        <span className="text-[10px] text-neutral-400 ml-1">obiettivo</span>
                        <span className="text-[10px] text-neutral-400 ml-auto mr-7">RIR</span>
                    </div>

                    {state.sets.map((s, si) => (
                        <SetRow key={si} setIndex={si} state={s}
                            ex={ex}
                            onChange={(f, v) => onSetChange(si, f, v)}
                            onComplete={() => onSetComplete(si)} />
                    ))}

                    <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                        <textarea value={state.note} onChange={e => onNoteChange(e.target.value)}
                            placeholder="Nota su questo esercizio (opzionale)..."
                            rows={state.note ? 3 : 1}
                            className="w-full text-[13px] px-3 py-2 rounded-lg border
                         border-neutral-200 dark:border-neutral-700 bg-transparent
                         text-neutral-900 dark:text-neutral-100
                         placeholder:text-neutral-300 dark:placeholder:text-neutral-600
                         resize-none transition-all" />
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Selezione giorno
// ---------------------------------------------------------------------------

function DayPicker() {
    const program = CURRENT_PROGRAM
    const { startDay } = useWorkout()
    return (
        <div className="flex flex-col h-full">
            <TopBar title={program.name} subtitle="Seleziona il giorno di oggi" />
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {program.days.map(day => (
                    <button key={day.id} onClick={() => startDay(day)}
                        className="w-full text-left border border-neutral-200 dark:border-neutral-800
                       rounded-xl px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900
                       active:scale-[.98] transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">{day.name}</p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">{day.focus}</p>
                            </div>
                            <span className="text-[12px] text-neutral-400">{day.exercises.length} esercizi</span>
                        </div>
                        {day.coachNote && (
                            <p className="text-[12px] text-violet-600 dark:text-violet-400 mt-2 leading-snug">
                                💬 {day.coachNote}
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Pagina principale
// ---------------------------------------------------------------------------

export function WorkoutPage() {
    const {
        phase, selectedDay, exStates, elapsedSec, generalNote, restSeconds,
        finish, resetToPickDay, setRestSeconds, setGeneralNote, updateSet, completeSet, updateNote,
    } = useWorkout()

    const formatTime = (sec: number) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0')
        const s = String(sec % 60).padStart(2, '0')
        return `${m}:${s}`
    }

    const handleSkipRest = useCallback(() => setRestSeconds(null), [setRestSeconds])

    if (phase === 'pick') return <DayPicker />

    if (phase === 'done') {
        const completedEx = exStates.filter(es => es.sets.every(s => s.completed)).length
        return (
            <div className="flex flex-col h-full">
                <TopBar title="Allenamento" subtitle={selectedDay?.name} />
                <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40
                          flex items-center justify-center">
                        <IconCheck size={28} className="text-green-600 dark:text-green-400" aria-hidden />
                    </div>
                    <div>
                        <p className="text-[16px] font-medium text-neutral-900 dark:text-neutral-100">Allenamento completato</p>
                        <p className="text-[13px] text-neutral-400 mt-1">
                            {formatTime(elapsedSec)} · {completedEx}/{selectedDay?.exercises.length} esercizi
                        </p>
                    </div>
                    <button onClick={resetToPickDay}
                        className="mt-2 px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800
                       text-[13px] font-medium text-neutral-600 dark:text-neutral-400
                       active:scale-95 transition-transform">
                        Nuovo allenamento
                    </button>
                </div>
            </div>
        )
    }

    // Phase: active
    const day = selectedDay!
    const completedExCount = exStates.filter(es => es.sets.every(s => s.completed)).length

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title={formatTime(elapsedSec)}
                subtitle={`${day.name} · ${completedExCount}/${day.exercises.length} esercizi`}
                right={
                    <button onClick={finish}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800
                       text-[12px] font-medium text-red-700 dark:text-red-400
                       active:scale-95 transition-transform">
                        <IconSquare size={12} aria-hidden />Fine
                    </button>
                }
            />

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {day.exercises.map((ex, i) => (
                    <WorkoutExCard key={ex.id} ex={ex} index={i} state={exStates[i]} isFirst={i === 0}
                        onSetChange={(si, f, v) => updateSet(i, si, f, v)}
                        onSetComplete={si => completeSet(i, si)}
                        onNoteChange={v => updateNote(i, v)} />
                ))}

                <div className="mt-2 mb-3">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">Nota sessione</p>
                    <textarea value={generalNote} onChange={e => setGeneralNote(e.target.value)}
                        placeholder="Come ti sei sentito? Note per il coach..."
                        rows={3}
                        className="w-full text-[13px] px-3 py-2.5 rounded-xl border
                       border-neutral-200 dark:border-neutral-700 bg-transparent
                       text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-300 dark:placeholder:text-neutral-600 resize-none" />
                </div>

                <button onClick={finish}
                    className="w-full py-3 rounded-xl bg-neutral-900 dark:bg-neutral-100
                     text-white dark:text-neutral-900 text-[13px] font-medium mb-2
                     active:scale-[.98] transition-transform">
                    Termina e salva
                </button>
            </div>

            {restSeconds !== null && (
                <RestBar totalSeconds={restSeconds} onSkip={handleSkipRest} />
            )}
        </div>
    )
}