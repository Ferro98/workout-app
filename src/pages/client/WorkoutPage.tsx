import { useState, useEffect, useRef, useCallback } from 'react'
import {
    IconSquare, IconCheck, IconX,
    IconDeviceFloppy, IconPencil, IconTrash, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react'
import { TopBar } from '../../components/layout/TopBar'
import { useWorkout, type ExState } from '../../context/WorkoutContext'
import { CURRENT_PROGRAM } from '../../data/mock'
import type { ProgramExercise, WorkoutSetState } from '../../types'

// ─────────────────────────────────────────────
// RestBar
// ─────────────────────────────────────────────

function RestBar({ totalSeconds, onSkip }: { totalSeconds: number; onSkip: () => void }) {
    const [remaining, setRemaining] = useState(totalSeconds)
    const endTimeRef = useRef(Date.now() + totalSeconds * 1000)
    const rafRef = useRef<number | null>(null)
    const onSkipRef = useRef(onSkip)

    useEffect(() => { onSkipRef.current = onSkip }, [onSkip])

    useEffect(() => {
        // This effect runs when the component mounts or the key changes
        // Force a clean reset of timer state
        endTimeRef.current = Date.now() + totalSeconds * 1000
        setRemaining(totalSeconds)

        // Cancel any lingering animation frame
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, []) // Empty deps = runs on mount/remount (triggered by key change)

    useEffect(() => {
        function tick() {
            const ms = Math.max(0, endTimeRef.current - Date.now())
            const secs = Math.ceil(ms / 1000)
            setRemaining(secs)

            if (ms <= 0) {
                onSkipRef.current()
                rafRef.current = null
                return
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [totalSeconds]) // Only re-run if totalSeconds actually changes

    const pct = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100))

    return (
        <div className="border-t border-neutral-200 dark:border-neutral-800
                    bg-white dark:bg-neutral-950 px-4 pt-3 pb-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">Recupero</span>
                <div className="flex items-center gap-3">
                    <span className="text-[24px] font-medium tabular-nums
                           text-neutral-900 dark:text-neutral-100 leading-none">
                        {remaining}s
                    </span>
                    <button onClick={onSkip}
                        className="flex items-center gap-1 text-[12px] text-neutral-400
                       hover:text-neutral-600 dark:hover:text-neutral-300">
                        <IconX size={13} aria-hidden />salta
                    </button>
                </div>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${pct}%`, transition: 'width 0.25s linear' }} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// NoteField
// ─────────────────────────────────────────────

function NoteField({ value, placeholder, onSave }: {
    value: string; placeholder: string; onSave: (v: string) => void
}) {
    const [draft, setDraft] = useState(value)
    const [editing, setEditing] = useState(!value)
    const [saved, setSaved] = useState(!!value)

    useEffect(() => {
        setDraft(value); setSaved(!!value); setEditing(!value)
    }, [value])

    const handleSave = () => {
        if (!draft.trim()) return
        onSave(draft.trim()); setSaved(true); setEditing(false)
    }
    const handleDelete = () => {
        setDraft(''); onSave(''); setSaved(false); setEditing(false)
    }

    if (saved && !editing) {
        return (
            <div className="flex items-start gap-2 bg-neutral-50 dark:bg-neutral-900
                      rounded-lg px-3 py-2.5">
                <p className="flex-1 text-[13px] text-neutral-700 dark:text-neutral-300 leading-snug">
                    {draft}
                </p>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(true)}
                        className="p-1 text-neutral-400 hover:text-neutral-600" aria-label="Modifica">
                        <IconPencil size={13} aria-hidden />
                    </button>
                    <button onClick={handleDelete}
                        className="p-1 text-neutral-400 hover:text-red-500" aria-label="Elimina">
                        <IconTrash size={13} aria-hidden />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-1.5">
            <textarea value={draft} onChange={e => setDraft(e.target.value)}
                placeholder={placeholder} rows={2}
                className="w-full text-[13px] px-3 py-2 rounded-lg border
                   border-neutral-200 dark:border-neutral-700 bg-transparent
                   text-neutral-900 dark:text-neutral-100
                   placeholder:text-neutral-300 dark:placeholder:text-neutral-600 resize-none" />
            <div className="flex gap-2">
                <button onClick={handleSave} disabled={!draft.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                     bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
                     disabled:opacity-40">
                    <IconDeviceFloppy size={13} aria-hidden />Salva
                </button>
                {saved && (
                    <button onClick={() => setEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-[12px] text-neutral-400
                       border border-neutral-200 dark:border-neutral-800">
                        Annulla
                    </button>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// SetRow
// ─────────────────────────────────────────────

function SetRow({ setIndex, state, ex, onChange, onComplete }: {
    setIndex: number; state: WorkoutSetState; ex: ProgramExercise
    onChange: (f: keyof WorkoutSetState, v: string) => void; onComplete: () => void
}) {
    const hasWeight = ex.type === 'weight' || ex.type === 'timed_weight'
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
    const ts = ex.targetSets.find(t => t.setIndex === setIndex) ?? ex.targetSets.at(-1)
    const targetVal = isTimed ? (ts?.duration ?? ex.duration ?? '—') : (ts?.reps ?? ex.reps ?? '—')
    const targetUnit = isTimed ? 's' : ' rip'

    const inputCls = `text-center text-[14px] py-2 rounded-xl border
    border-neutral-200 dark:border-neutral-700 bg-transparent
    text-neutral-900 dark:text-neutral-100 disabled:opacity-40 font-medium
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
    [&::-webkit-inner-spin-button]:appearance-none`

    return (
        <div className={`rounded-xl border transition-all mb-2
                     ${state.completed
                ? 'border-green-200 dark:border-green-900/60 bg-green-50/50 dark:bg-green-950/20'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950'}`}>

            {/* Header serie: numero + target + tick */}
            <div className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center
                          text-[12px] font-medium shrink-0
                          ${state.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                    {state.completed ? <IconCheck size={13} aria-hidden /> : setIndex + 1}
                </span>

                {/* Target coach */}
                <div className="flex-1">
                    <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {targetVal}{targetUnit}
                    </span>
                    <span className="text-[12px] text-neutral-400 ml-2">
                        RPE {ts?.rpe ?? '?'}
                    </span>
                    {ts?.tempoPerRep && (
                        <span className="text-[11px] text-violet-500 ml-2">{ts.tempoPerRep}</span>
                    )}
                    {ts?.suggestedWeight && (
                        <span className="text-[11px] text-neutral-400 ml-2">~{ts.suggestedWeight}kg</span>
                    )}
                </div>

                <button onClick={onComplete}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95
                      ${state.completed
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'}`}>
                    {state.completed ? 'Fatto ✓' : 'Segna'}
                </button>
            </div>

            {/* Inputs effettivi — solo se non completata */}
            {!state.completed && (
                <div className="flex items-center gap-3 px-4 pb-3">
                    {hasWeight && (
                        <div className="flex-1">
                            <p className="text-[10px] text-neutral-400 mb-1 text-center">Peso (kg)</p>
                            <input type="number" inputMode="decimal" value={state.actualWeight}
                                onChange={e => onChange('actualWeight', e.target.value)}
                                placeholder="—" className={`w-full ${inputCls}`} />
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="text-[10px] text-neutral-400 mb-1 text-center">
                            {isTimed ? 'Durata (s)' : 'Ripetizioni'}
                        </p>
                        <input type="number" inputMode="numeric" value={state.actualReps}
                            onChange={e => onChange('actualReps', e.target.value)}
                            placeholder="—" className={`w-full ${inputCls}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-neutral-400 mb-1 text-center">RIR</p>
                        <input type="number" inputMode="numeric" value={state.actualRir}
                            onChange={e => onChange('actualRir', e.target.value)}
                            placeholder="—" className={`w-full ${inputCls}`} />
                    </div>
                </div>
            )}

            {/* Nota per-serie coach */}
            {ts?.note && (
                <p className="px-4 pb-2.5 text-[11px] text-violet-600 dark:text-violet-400 italic">
                    💬 {ts.note}
                </p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// ExerciseSlide — schermata singolo esercizio
// ─────────────────────────────────────────────

function ExerciseSlide({ ex, state, onSetChange, onSetComplete, onNoteChange }: {
    ex: ProgramExercise; state: ExState
    onSetChange: (si: number, f: keyof WorkoutSetState, v: string) => void
    onSetComplete: (si: number) => void; onNoteChange: (v: string) => void
}) {
    const completedCount = state.sets.filter(s => s.completed).length
    const allDone = completedCount === ex.sets

    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'
    const vals = ex.targetSets
        .map(ts => isTimed ? (ts.duration ?? ex.duration) : (ts.reps ?? ex.reps))
        .filter((v): v is number => v !== null && v !== undefined)
    const min = Math.min(...vals), max = Math.max(...vals)
    const unit = isTimed ? 's' : ' rip'
    const repsStr = min === max ? `${min}${unit}` : `${min}–${max}${unit}`

    return (
        <div className="flex flex-col h-full px-4 py-4 overflow-y-auto">

            {/* Header esercizio */}
            <div className="mb-4">
                <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[18px] font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
                        {ex.name}
                    </h2>
                    {allDone && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium
                             bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300
                             px-2.5 py-1 rounded-full">
                            <IconCheck size={11} aria-hidden />Completato
                        </span>
                    )}
                </div>
                <p className="text-[13px] text-neutral-400 mt-1">
                    {ex.sets} serie · {repsStr} · rec {ex.restSeconds}s
                </p>
                {/* Barra progresso serie */}
                <div className="flex gap-1.5 mt-3">
                    {state.sets.map((s, i) => (
                        <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors
                          ${s.completed
                                    ? 'bg-green-500'
                                    : 'bg-neutral-200 dark:bg-neutral-800'}`} />
                    ))}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                    {completedCount}/{ex.sets} serie completate
                </p>
            </div>

            {/* Nota coach sull'esercizio */}
            {ex.notes && (
                <div className="flex gap-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-[12px] text-violet-700 dark:text-violet-300 leading-snug">
                        💬 {ex.notes}
                    </p>
                </div>
            )}

            {/* Serie */}
            <div className="flex-1">
                {state.sets.map((s, si) => (
                    <SetRow key={si} setIndex={si} state={s} ex={ex}
                        onChange={(f, v) => onSetChange(si, f, v)}
                        onComplete={() => onSetComplete(si)} />
                ))}
            </div>

            {/* Nota esercizio */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Nota esercizio
                </p>
                <NoteField value={state.note} placeholder="Note per il coach..."
                    onSave={onNoteChange} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// DayPicker
// ─────────────────────────────────────────────

function DayPicker() {
    const { startDay } = useWorkout()
    const program = CURRENT_PROGRAM

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
                                <p className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                                    {day.name}
                                </p>
                                <p className="text-[12px] text-neutral-400 mt-0.5">{day.focus}</p>
                            </div>
                            <span className="text-[12px] text-neutral-400">
                                {day.exercises.length} esercizi
                            </span>
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

// ─────────────────────────────────────────────
// Carousel con swipe
// ─────────────────────────────────────────────

function ExerciseCarousel({
    exercises, exStates, currentIdx, onChangeIdx,
    onSetChange, onSetComplete, onNoteChange,
}: {
    exercises: ProgramExercise[]; exStates: ExState[]
    currentIdx: number; onChangeIdx: (i: number) => void
    onSetChange: (exIdx: number, si: number, f: keyof WorkoutSetState, v: string) => void
    onSetComplete: (exIdx: number, si: number) => void
    onNoteChange: (exIdx: number, v: string) => void
}) {
    // Swipe state
    const touchStartX = useRef<number | null>(null)
    const touchStartY = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [dragX, setDragX] = useState(0)
    const [dragging, setDragging] = useState(false)

    const goTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < exercises.length) onChangeIdx(idx)
    }, [exercises.length, onChangeIdx])

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        setDragging(true)
        setDragX(0)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return
        const dx = e.touches[0].clientX - touchStartX.current
        const dy = e.touches[0].clientY - touchStartY.current
        // Ignora scroll verticale
        if (Math.abs(dy) > Math.abs(dx)) return
        setDragX(dx)
    }

    const handleTouchEnd = () => {
        if (touchStartX.current === null) return
        const threshold = 60
        if (dragX < -threshold) goTo(currentIdx + 1)
        else if (dragX > threshold) goTo(currentIdx - 1)
        touchStartX.current = null
        touchStartY.current = null
        setDragX(0)
        setDragging(false)
    }

    const translateX = -currentIdx * 100 + (dragX / (containerRef.current?.offsetWidth ?? 390)) * 100

    return (
        <div className="flex-1 flex flex-col min-h-0">

            {/* Carousel viewport */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}>
                <div
                    className="flex h-full"
                    style={{
                        transform: `translateX(${translateX}%)`,
                        transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(.4,0,.2,1)',
                        willChange: 'transform',
                    }}>
                    {exercises.map((ex, i) => (
                        <div key={ex.id}
                            className="w-full shrink-0 h-full"
                            style={{ width: '100%' }}>
                            <ExerciseSlide
                                ex={ex}
                                state={exStates[i]}
                                onSetChange={(si, f, v) => onSetChange(i, si, f, v)}
                                onSetComplete={si => onSetComplete(i, si)}
                                onNoteChange={v => onNoteChange(i, v)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigazione: frecce + pallini */}
            <div className="flex items-center justify-between px-4 py-3
                      border-t border-neutral-100 dark:border-neutral-800
                      bg-white dark:bg-neutral-950 shrink-0">
                <button
                    onClick={() => goTo(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="w-9 h-9 rounded-full flex items-center justify-center
                     border border-neutral-200 dark:border-neutral-800
                     text-neutral-500 disabled:opacity-20 active:scale-95 transition-all"
                    aria-label="Esercizio precedente">
                    <IconChevronLeft size={16} aria-hidden />
                </button>

                {/* Pallini */}
                <div className="flex items-center gap-2">
                    {exercises.map((ex, i) => {
                        const done = exStates[i]?.sets.every(s => s.completed)
                        const active = i === currentIdx
                        return (
                            <button key={i} onClick={() => goTo(i)} aria-label={ex.name}
                                className={`rounded-full transition-all duration-200
                            ${active
                                        ? 'w-5 h-2.5 bg-neutral-900 dark:bg-neutral-100'
                                        : done
                                            ? 'w-2.5 h-2.5 bg-green-500'
                                            : 'w-2.5 h-2.5 bg-neutral-200 dark:bg-neutral-700'
                                    }`} />
                        )
                    })}
                </div>

                <button
                    onClick={() => goTo(currentIdx + 1)}
                    disabled={currentIdx === exercises.length - 1}
                    className="w-9 h-9 rounded-full flex items-center justify-center
                     border border-neutral-200 dark:border-neutral-800
                     text-neutral-500 disabled:opacity-20 active:scale-95 transition-all"
                    aria-label="Esercizio successivo">
                    <IconChevronRight size={16} aria-hidden />
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// WorkoutPage
// ─────────────────────────────────────────────

export default function WorkoutPage() {
    const {
        phase, selectedDay, exStates, elapsedSec,
        generalNote, restSeconds,
        finish, resetToPickDay, setRestSeconds, setGeneralNote,
        updateSet, completeSet, updateNote,
    } = useWorkout()

    const [currentIdx, setCurrentIdx] = useState(0)
    const [restKey, setRestKey] = useState(0)
    const handleSkipRest = useCallback(() => setRestSeconds(null), [setRestSeconds])
    const lastAdvancedIdx = useRef<number>(-1);

    useEffect(() => {
        if (restSeconds !== null) {
            setRestKey(k => k + 1)
        }
    }, [restSeconds])

    // Reset indice quando cambia il giorno
    useEffect(() => { setCurrentIdx(0) }, [selectedDay])

    // Avanza automaticamente all'esercizio successivo quando tutti le serie sono completate
    useEffect(() => {
        if (!selectedDay || !exStates.length) return
        const allDone = exStates[currentIdx]?.sets.every(s => s.completed)
        if (allDone && currentIdx !== lastAdvancedIdx.current && currentIdx < selectedDay.exercises.length - 1) {
            lastAdvancedIdx.current = currentIdx
            const t = setTimeout(() => setCurrentIdx(i => i + 1), 800)
            return () => clearTimeout(t)
        }

        if (currentIdx !== lastAdvancedIdx.current && !allDone) {
            // Allow re-advancing later if this exercise gets completed again
        }
    }, [exStates, currentIdx, selectedDay])

    // Reset the ref when day changes
    useEffect(() => {
        setCurrentIdx(0)
        lastAdvancedIdx.current = -1 // ← Reset tracking
    }, [selectedDay])

    const formatTime = (sec: number) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0')
        const s = String(sec % 60).padStart(2, '0')
        return `${m}:${s}`
    }

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
                        <p className="text-[16px] font-medium text-neutral-900 dark:text-neutral-100">
                            Allenamento completato
                        </p>
                        <p className="text-[13px] text-neutral-400 mt-1">
                            {formatTime(elapsedSec)} · {completedEx}/{selectedDay?.exercises.length} esercizi
                        </p>
                    </div>
                    <div className="w-full text-left bg-neutral-50 dark:bg-neutral-900
                          rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">
                            Dati sessione
                        </p>
                        {exStates.map((es, i) => {
                            const ex = selectedDay?.exercises[i]
                            if (!ex) return null
                            return (
                                <div key={i}>
                                    <p className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300">
                                        {ex.name}
                                    </p>
                                    {es.sets.map((s, si) => (
                                        <p key={si} className="text-[11px] text-neutral-500 pl-2">
                                            {si + 1}. {s.actualWeight ? `${s.actualWeight}kg × ` : ''}{s.actualReps}
                                            {s.actualRir ? ` · RIR ${s.actualRir}` : ''}
                                            {s.completed ? ' ✓' : ' —'}
                                        </p>
                                    ))}
                                    {es.note && (
                                        <p className="text-[11px] text-violet-600 dark:text-violet-400 pl-2 italic">
                                            {es.note}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className="w-full">
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2 text-left">
                            Nota sessione
                        </p>
                        <NoteField value={generalNote} placeholder="Note per il coach..."
                            onSave={setGeneralNote} />
                    </div>
                    <button onClick={resetToPickDay}
                        className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800
                       text-[13px] font-medium text-neutral-600 dark:text-neutral-400
                       active:scale-95 transition-transform">
                        Nuovo allenamento
                    </button>
                </div>
            </div>
        )
    }

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

            <ExerciseCarousel
                exercises={day.exercises}
                exStates={exStates}
                currentIdx={currentIdx}
                onChangeIdx={setCurrentIdx}
                onSetChange={(exIdx, si, f, v) => updateSet(exIdx, si, f, v)}
                onSetComplete={(exIdx, si) => completeSet(exIdx, si)}
                onNoteChange={(exIdx, v) => updateNote(exIdx, v)}
            />

            {restSeconds !== null && (
                <RestBar
                    key={restKey}
                    totalSeconds={restSeconds}
                    onSkip={handleSkipRest}
                />
            )}
        </div>
    )
}