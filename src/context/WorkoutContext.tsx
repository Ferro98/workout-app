import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { ProgramDay, ProgramExercise, WorkoutSetState } from '../types'

export interface ExState {
    sets: WorkoutSetState[]
    note: string
}

function initExState(ex: ProgramExercise) {
    const isTimed = ex.type === 'timed' || ex.type === 'timed_weight'

    return {
        note: '',
        sets: Array.from({ length: ex.sets }, (_, setIndex) => {
            // Find specific target for this set index, or fallback to last defined target
            const target = ex.targetSets.find(t => t.setIndex === setIndex)
                ?? ex.targetSets.at(-1)
                ?? { rpe: 8 }

            // Determine default value: use per-set override if available, else exercise default
            const defaultValue = isTimed
                ? (target.duration ?? ex.duration)
                : (target.reps ?? ex.reps)

            return {
                completed: false,
                actualReps: defaultValue != null ? String(defaultValue) : '',
                actualWeight: ex.lastWeight ?? '',
                actualRir: '',
                note: '',
            }
        }),
    }
}

type Phase = 'pick' | 'active' | 'done'

interface WorkoutCtx {
    phase: Phase
    selectedDay: ProgramDay | null
    exStates: ExState[]
    elapsedSec: number
    generalNote: string
    restSeconds: number | null
    startDay: (day: ProgramDay) => void
    finish: () => void
    resetToPickDay: () => void
    setRestSeconds: (s: number | null) => void
    setGeneralNote: (s: string) => void
    updateSet: (exIdx: number, setIdx: number, field: keyof WorkoutSetState, val: string) => void
    completeSet: (exIdx: number, setIdx: number) => void
    updateNote: (exIdx: number, val: string) => void
}

const Ctx = createContext<WorkoutCtx | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const [phase, setPhase] = useState<Phase>('pick')
    const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null)
    const [exStates, setExStates] = useState<ExState[]>([])
    const [elapsedSec, setElapsedSec] = useState(0)
    const [generalNote, setGeneralNote] = useState('')
    const [restSeconds, setRestSeconds] = useState<number | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const selectedDayRef = useRef<ProgramDay | null>(null)
    useEffect(() => {
        selectedDayRef.current = selectedDay
    }, [selectedDay])

    const stopTimer = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }, [])

    useEffect(() => () => stopTimer(), [stopTimer])

    const startDay = useCallback((day: ProgramDay) => {
        setSelectedDay(day)
        setExStates(day.exercises.map(initExState))
        setElapsedSec(0)
        setGeneralNote('')
        setRestSeconds(null)
        setPhase('active')
        stopTimer()
        intervalRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000)
    }, [stopTimer])

    const finish = useCallback(() => {
        stopTimer()
        setPhase('done')
    }, [stopTimer])

    const resetToPickDay = useCallback(() => {
        stopTimer()
        setPhase('pick')
        setSelectedDay(null)
        setExStates([])
        setElapsedSec(0)
        setGeneralNote('')
        setRestSeconds(null)
    }, [stopTimer])

    const updateSet = useCallback((exIdx: number, setIdx: number, field: keyof WorkoutSetState, val: string) => {
        setExStates(prev => prev.map((es, i) => {
            if (i !== exIdx) return es
            return { ...es, sets: es.sets.map((s, si) => si === setIdx ? { ...s, [field]: val } : s) }
        }))
    }, [])

    const completeSet = useCallback((exIdx: number, setIdx: number) => {
        setExStates(prev => {
            const wasCompleted = prev[exIdx].sets[setIdx].completed
            const newState = prev.map((es, i) => {
                if (i !== exIdx) return es
                return {
                    ...es,
                    sets: es.sets.map((s, si) =>
                        si === setIdx ? { ...s, completed: !s.completed } : s
                    )
                }
            })

            // Only trigger rest when transitioning TO completed (not un-completing)
            if (!wasCompleted && selectedDayRef.current) {
                // Use setTimeout to ensure state flushes first
                setTimeout(() => {
                    const restTime = selectedDayRef.current?.exercises[exIdx]?.restSeconds ?? null
                    setRestSeconds(restTime)
                }, 0)
            }
            return newState
        })
    }, [])

    const updateNote = useCallback((exIdx: number, val: string) => {
        setExStates(prev => prev.map((es, i) => i !== exIdx ? es : { ...es, note: val }))
    }, [])

    return (
        <Ctx.Provider value={{
            phase, selectedDay, exStates, elapsedSec, generalNote, restSeconds,
            startDay, finish, resetToPickDay, setRestSeconds, setGeneralNote,
            updateSet, completeSet, updateNote,
        }}>
            {children}
        </Ctx.Provider>
    )
}

export function useWorkout() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useWorkout must be used inside WorkoutProvider')
    return ctx
}